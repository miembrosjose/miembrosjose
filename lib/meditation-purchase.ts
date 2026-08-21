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

/** Enmascara un id para logs (no expone el id completo). */
function maskId(id: string | null | undefined): string {
  return id ? `${id.slice(0, 8)}…` : "(none)"
}

/**
 * Devuelve un stripe_customer_id VÁLIDO en la cuenta Stripe de ESTE Worker, o null.
 * Nunca lanza. Diagnóstico seguro por consola (sin exponer nada al frontend):
 *   - Si el customer sincronizado no existe en esta cuenta (p. ej. pertenece a
 *     otra cuenta/entorno Stripe) → log `diag=customer_not_in_account`.
 * Como respaldo, busca por email un customer creado en compras previas (Payment
 * Element) DENTRO de esta cuenta, para permitir 1-click en el futuro.
 */
export async function resolveInAccountCustomerId(
  stripe: Stripe,
  userId: string,
  email: string | null,
): Promise<string | null> {
  const candidate = await getMemberStripeCustomerId(userId, email)
  if (candidate) {
    try {
      const c = await stripe.customers.retrieve(candidate)
      if (!(c as Stripe.DeletedCustomer).deleted) return candidate
      console.warn(`[meditation-purchase] diag=customer_deleted cust=${maskId(candidate)}`)
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === "resource_missing") {
        // El customer NO existe en la cuenta Stripe de este Worker.
        console.warn(`[meditation-purchase] diag=customer_not_in_account cust=${maskId(candidate)}`)
      } else {
        console.error(`[meditation-purchase] customer_retrieve_error code=${code || "unknown"}`)
      }
    }
  }
  // Respaldo: customer creado en esta cuenta en una compra anterior (por email).
  if (email) {
    try {
      const list = await stripe.customers.list({ email: email.trim().toLowerCase(), limit: 1 })
      if (list.data[0]?.id) return list.data[0].id
    } catch {
      /* ignora — devolveremos null y se creará uno nuevo en create-pi */
    }
  }
  return null
}

export type PmResolution =
  | { status: "ok"; paymentMethodId: string }
  | { status: "no_payment_method" }

/**
 * Resuelve un PaymentMethod reutilizable de un customer VÁLIDO. Nunca lanza.
 * `no_payment_method` = el customer existe pero no tiene tarjeta reutilizable.
 */
export async function resolveReusablePayment(
  stripe: Stripe,
  customerId: string,
): Promise<PmResolution> {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if ((customer as Stripe.DeletedCustomer).deleted) return { status: "no_payment_method" }
    const c = customer as Stripe.Customer
    let pm = (c.invoice_settings?.default_payment_method as string | null) || null
    if (!pm) {
      const pms = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 })
      pm = pms.data[0]?.id ?? null
    }
    return pm ? { status: "ok", paymentMethodId: pm } : { status: "no_payment_method" }
  } catch {
    // Cualquier fallo → respaldo seguro (Payment Element), nunca 500.
    return { status: "no_payment_method" }
  }
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
