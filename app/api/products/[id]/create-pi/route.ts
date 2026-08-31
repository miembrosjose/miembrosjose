// POST /api/products/[id]/create-pi
// Fallback con Payment Element cuando el usuario no tiene tarjeta reutilizable.
// Crea un PaymentIntent con setup_future_usage:'off_session' para dejar la
// tarjeta guardada para futuros 1-clic. El precio SIEMPRE se lee del servidor.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/server"
import { getMembership } from "@/lib/membership"
import {
  getServerProduct,
  hasProductAccess,
  resolveInAccountCustomerId,
} from "@/lib/product-purchase"

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

  const product = await getServerProduct(id)
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 })
  if (!product.isPurchasable) {
    return NextResponse.json({ error: "not_purchasable" }, { status: 400 })
  }

  const userId = user.id
  if (await hasProductAccess(userId, product.id)) {
    return NextResponse.json({ error: "already_owned" }, { status: 409 })
  }

  const stripe = getStripe()

  let customerId = await resolveInAccountCustomerId(stripe, userId, user.email ?? null)
  if (!customerId) {
    const created = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: userId },
    })
    customerId = created.id
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
      amount: product.priceCents,
      currency: product.currency,
      customer: customerId,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      setup_future_usage: "off_session",
      receipt_email: user.email ?? undefined,
      description: `Producto: ${product.name}`,
      metadata: {
        type: "product_purchase",
        user_id: userId,
        product_id: product.id,
      },
    })
    return NextResponse.json({
      client_secret: pi.client_secret,
      payment_intent_id: pi.id,
      amount: product.priceCents,
      currency: product.currency,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "stripe_error"
    console.error("[products/create-pi]", msg)
    return NextResponse.json({ error: "stripe_error", message: msg }, { status: 500 })
  }
}
