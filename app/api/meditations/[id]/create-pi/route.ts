// POST /api/meditations/[id]/create-pi
// Fallback con Payment Element (Stripe.js) cuando el usuario no tiene una tarjeta
// reutilizable. Crea un PaymentIntent deferred con setup_future_usage:'off_session'
// para que la tarjeta quede guardada para futuros 1-clic.
//
// El precio SIEMPRE se lee desde Supabase (se ignora cualquier amount del cliente).
// StripeInlinePayment envía { currency, amount } solo para montar el formulario.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/server"
import { getServerMeditation } from "@/lib/meditations"
import { getMembership, hasPremiumEntitlement } from "@/lib/membership"
import { getMemberStripeCustomerId } from "@/lib/meditation-purchase"

export const dynamic = "force-dynamic"

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const membership = await getMembership(supabase)
  if (!membership.authenticated || !user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  if (!membership.active) {
    return NextResponse.json({ error: "membership_required" }, { status: 403 })
  }

  const med = await getServerMeditation(id)
  if (!med || med.accessType !== "premium") {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }
  if (!med.isPurchasable || !(med.priceCents > 0)) {
    return NextResponse.json({ error: "not_purchasable" }, { status: 400 })
  }

  const userId = membership.userId!
  if (await hasPremiumEntitlement(supabase, userId, id)) {
    return NextResponse.json({ error: "already_owned" }, { status: 409 })
  }

  const stripe = getStripe()

  // Customer existente o nuevo (para poder guardar la tarjeta).
  let customerId = await getMemberStripeCustomerId(userId, user.email ?? null)
  if (!customerId) {
    const created = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: userId },
    })
    customerId = created.id
    // Persistir en member_subscriptions SOLO si estaba vacío (no pisa datos).
    if (user.email) {
      try {
        const admin = getSupabaseAdmin()
        await admin
          .from("member_subscriptions")
          .update({ stripe_customer_id: customerId })
          .eq("email", user.email.trim().toLowerCase())
          .is("stripe_customer_id", null)
      } catch { /* no bloquea la compra */ }
    }
  }

  try {
    const pi = await stripe.paymentIntents.create({
      amount: med.priceCents, // precio real desde Supabase
      currency: med.currency,
      customer: customerId,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      setup_future_usage: "off_session",
      receipt_email: user.email ?? undefined,
      description: `Meditación premium: ${med.title}`,
      metadata: {
        type: "premium_meditation",
        user_id: userId,
        meditation_id: med.id,
      },
    })
    return NextResponse.json({
      client_secret: pi.client_secret,
      payment_intent_id: pi.id,
      amount: med.priceCents,
      currency: med.currency,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "stripe_error"
    console.error("[meditations/create-pi]", msg)
    return NextResponse.json({ error: "stripe_error", message: msg }, { status: 500 })
  }
}
