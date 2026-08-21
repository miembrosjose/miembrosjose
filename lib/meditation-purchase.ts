// Helpers de compra de meditaciones premium (server-only).
// Reutiliza el mismo origen de stripe_customer_id que el resto de la plataforma.

import type Stripe from "stripe"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

/** stripe_customer_id de un miembro: member_subscriptions (por email) → stripe_sales. */
export async function getMemberStripeCustomerId(
  userId: string,
  email: string | null,
): Promise<string | null> {
  const admin = getSupabaseAdmin()

  if (email) {
    const { data: sub } = await admin
      .from("member_subscriptions")
      .select("stripe_customer_id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle()
    const id = (sub as { stripe_customer_id?: string | null } | null)?.stripe_customer_id
    if (id) return id
  }

  const { data: sales } = await admin
    .from("stripe_sales")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(5)
  const sale = (sales || []).find(
    (s) => (s as { stripe_customer_id?: string | null }).stripe_customer_id,
  ) as { stripe_customer_id?: string | null } | undefined
  return sale?.stripe_customer_id ?? null
}

/** PaymentMethod reutilizable del Customer: default_payment_method → primer card. */
export async function getReusablePaymentMethod(
  stripe: Stripe,
  customerId: string,
): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if ((customer as Stripe.DeletedCustomer).deleted) return null
  const c = customer as Stripe.Customer
  let pm = (c.invoice_settings?.default_payment_method as string | null) || null
  if (!pm) {
    const pms = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 })
    pm = pms.data[0]?.id ?? null
  }
  return pm
}

/**
 * Registra (idempotente) el entitlement de compra. Usado por el endpoint de
 * confirmación inmediata Y por el webhook (reconciliación). El unique
 * (user_id, meditation_id) + ignoreDuplicates evita compras duplicadas.
 */
export async function registerMeditationEntitlement(args: {
  userId: string
  meditationId: string
  paymentIntentId: string
  amountCents: number | null
  currency: string | null
}): Promise<void> {
  const admin = getSupabaseAdmin()
  await admin.from("meditation_purchases").upsert(
    {
      user_id: args.userId,
      meditation_id: args.meditationId,
      stripe_payment_intent_id: args.paymentIntentId,
      amount_cents: args.amountCents,
      currency: (args.currency || "usd").toLowerCase(),
      status: "paid",
      purchased_at: new Date().toISOString(),
    },
    { onConflict: "user_id,meditation_id", ignoreDuplicates: true },
  )
}
