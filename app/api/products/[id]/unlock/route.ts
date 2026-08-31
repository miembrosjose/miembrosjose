// POST /api/products/[id]/unlock
// Compra 1-clic on_session de un producto de la Tienda con la tarjeta guardada.
// Mismo flujo probado en meditaciones/unlock: el precio se lee SIEMPRE del
// servidor (Supabase). auth → membresía → producto comprable → ¿ya comprado? →
// customer + PaymentMethod guardado → PaymentIntent(off_session, confirm) →
// succeeded ⇒ acceso registrado · requires_action ⇒ client_secret (3DS) ·
// sin tarjeta ⇒ needs_payment_method.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe/server"
import { getMembership } from "@/lib/membership"
import {
  getServerProduct,
  hasProductAccess,
  registerProductEntitlement,
  resolveInAccountCustomerId,
  resolveReusablePayment,
} from "@/lib/product-purchase"

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

  const product = await getServerProduct(id)
  if (!product) return NextResponse.json({ status: "not_found" }, { status: 404 })
  if (!product.isPurchasable) {
    return NextResponse.json({ status: "not_purchasable" }, { status: 400 })
  }

  const userId = user.id

  // Ya comprado → no cobrar de nuevo.
  if (await hasProductAccess(userId, product.id)) {
    return NextResponse.json({ status: "already_owned" })
  }

  const stripe = getStripe()

  const customerId = await resolveInAccountCustomerId(stripe, userId, user.email ?? null)
  if (!customerId) {
    return NextResponse.json({ status: "needs_payment_method", reason: "no_in_account_customer" })
  }

  const pm = await resolveReusablePayment(stripe, customerId)
  if (pm.status !== "ok") {
    return NextResponse.json({ status: "needs_payment_method", reason: "no_payment_method" })
  }

  try {
    const pi = await stripe.paymentIntents.create({
      amount: product.priceCents,
      currency: product.currency,
      customer: customerId,
      payment_method: pm.paymentMethodId,
      off_session: true,
      confirm: true,
      description: `Producto: ${product.name}`,
      metadata: {
        type: "product_purchase",
        user_id: userId,
        product_id: product.id,
      },
    })

    if (pi.status === "succeeded") {
      await registerProductEntitlement({ userId, productId: product.id, paymentIntentId: pi.id })
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
    if (err.code && CARD_FALLBACK_CODES.has(err.code)) {
      return NextResponse.json({ status: "needs_payment_method", reason: err.code })
    }
    console.error("[products/unlock]", err.code, err.message)
    return NextResponse.json({ status: "payment_failed", message: err.message }, { status: 500 })
  }
}
