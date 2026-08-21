// POST /api/meditations/[id]/unlock
// Compra 1-clic on_session de una meditación premium con la tarjeta guardada.
//
// El frontend solo envía el id (en la URL). El precio se lee SIEMPRE desde
// Supabase en el servidor. Flujo:
//   auth → membresía → cargar meditación (DB) → premium+comprable →
//   ¿ya comprada? (already_owned) → customer + PaymentMethod guardado →
//   PaymentIntent(on_session, confirm) → succeeded ⇒ entitlement + unlocked ·
//   requires_action ⇒ client_secret (3DS) · sin tarjeta ⇒ needs_payment_method.
//
// Protección doble cobro: chequeo de entitlement previo + idempotencyKey de
// Stripe por (usuario, meditación) + unique(user_id, meditation_id) en DB.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe/server"
import { getServerMeditation } from "@/lib/meditations"
import { getMembership, hasPremiumEntitlement } from "@/lib/membership"
import {
  resolveInAccountCustomerId,
  resolveReusablePayment,
  registerMeditationEntitlement,
} from "@/lib/meditation-purchase"

export const dynamic = "force-dynamic"

const CARD_FALLBACK_CODES = new Set([
  "card_declined", "expired_card", "incorrect_number", "incorrect_cvc",
  "invalid_expiry_month", "invalid_expiry_year", "card_not_supported",
  "authentication_required", "payment_intent_authentication_failure",
  "invalid_payment_method", "processing_error",
])

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const membership = await getMembership(supabase)
  if (!membership.authenticated || !user) {
    return NextResponse.json({ status: "unauthenticated" }, { status: 401 })
  }
  if (!membership.active) {
    return NextResponse.json({ status: "membership_required" }, { status: 403 })
  }

  const med = await getServerMeditation(id)
  if (!med) return NextResponse.json({ status: "not_found" }, { status: 404 })
  if (med.accessType !== "premium") {
    return NextResponse.json({ status: "not_premium" }, { status: 400 })
  }
  if (!med.isPurchasable) {
    return NextResponse.json({ status: "not_purchasable" }, { status: 400 })
  }
  if (!(med.priceCents > 0)) {
    return NextResponse.json({ status: "invalid_price" }, { status: 400 })
  }

  const userId = membership.userId!

  // Ya comprada → no cobrar de nuevo.
  if (await hasPremiumEntitlement(supabase, userId, id)) {
    return NextResponse.json({ status: "already_owned" })
  }

  const stripe = getStripe()

  // Customer VÁLIDO en la cuenta Stripe de este Worker (nunca lanza).
  const customerId = await resolveInAccountCustomerId(stripe, userId, user.email ?? null)
  if (!customerId) {
    // Sin customer reutilizable en esta cuenta → tarjeta por Payment Element.
    console.warn(`[meditations/unlock] diag=no_in_account_customer user=${userId}`)
    return NextResponse.json({ status: "needs_payment_method", reason: "no_in_account_customer" })
  }

  const pm = await resolveReusablePayment(stripe, customerId)
  if (pm.status !== "ok") {
    // Customer existe pero sin método reutilizable → Payment Element.
    console.warn(`[meditations/unlock] diag=no_payment_method user=${userId}`)
    return NextResponse.json({ status: "needs_payment_method", reason: "no_payment_method" })
  }

  try {
    const pi = await stripe.paymentIntents.create(
      {
        amount: med.priceCents,
        currency: med.currency,
        customer: customerId,
        payment_method: pm.paymentMethodId,
        // Config IDÉNTICA al flujo probado /api/buy-product: cobro directo de la
        // tarjeta guardada. off_session evita el requisito de return_url (no hay
        // redirección posible). Si la tarjeta exige 3DS, Stripe lanza
        // 'authentication_required' → el catch devuelve needs_payment_method →
        // el usuario completa la autenticación en el Payment Element.
        off_session: true,
        confirm: true,
        description: `Meditación premium: ${med.title}`,
        metadata: {
          type: "premium_meditation",
          user_id: userId,
          meditation_id: med.id,
        },
      },
      { idempotencyKey: `medunlock_${userId}_${med.id}` },
    )

    if (pi.status === "succeeded") {
      await registerMeditationEntitlement({
        userId,
        meditationId: med.id,
        paymentIntentId: pi.id,
        amountCents: pi.amount,
        currency: pi.currency,
      })
      return NextResponse.json({ status: "unlocked" })
    }

    if (pi.status === "requires_action" && pi.client_secret) {
      return NextResponse.json({
        status: "requires_action",
        client_secret: pi.client_secret,
        payment_intent_id: pi.id,
      })
    }

    return NextResponse.json({ status: "payment_failed" }, { status: 400 })
  } catch (e) {
    const err = e as { code?: string; message?: string }
    // Tarjeta rechazada / requiere otra → el frontend abre el Payment Element.
    if (err.code && CARD_FALLBACK_CODES.has(err.code)) {
      return NextResponse.json({ status: "needs_payment_method", reason: err.code })
    }
    console.error("[meditations/unlock]", err.code, err.message)
    return NextResponse.json({ status: "payment_failed", message: err.message }, { status: 500 })
  }
}
