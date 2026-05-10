// API debug — retorna estado real das sales do user logado vs PIs no Stripe.
// Usado pra diagnosticar discrepancias entre Stripe Dashboard e banco.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const userEmail = user.email.toLowerCase().trim()

  // 1. TODAS sales do user (por user_id E por email)
  const { data: salesByUserId } = await admin
    .from("stripe_sales")
    .select("id, sale_type, plan, status, user_id, customer_email, items, amount_total, currency, created_at, stripe_payment_intent_id, stripe_customer_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30)

  const { data: salesByEmail } = await admin
    .from("stripe_sales")
    .select("id, sale_type, plan, status, user_id, customer_email, items, amount_total, currency, created_at, stripe_payment_intent_id, stripe_customer_id")
    .ilike("customer_email", userEmail)
    .order("created_at", { ascending: false })
    .limit(30)

  // 2. Pega stripe_customer_id mais recente
  const allSales = [...(salesByUserId || []), ...(salesByEmail || [])]
  const stripeCustomerId = allSales.find((s) => s.stripe_customer_id)?.stripe_customer_id || null

  // 3. PIs do Stripe pra esse customer
  let stripePis: Array<{
    id: string
    status: string
    amount: number
    currency: string
    created: string
    description: string | null
    sale_type: string | null
    upsells: string | null
    upgrade_to_lifetime: string | null
    in_db: boolean
  }> = []

  if (stripeCustomerId) {
    try {
      const stripe = getStripe()
      const pis = await stripe.paymentIntents.list({
        customer: stripeCustomerId,
        limit: 50,
      })

      const dbPiIds = new Set(allSales.map((s) => s.stripe_payment_intent_id).filter(Boolean))

      stripePis = pis.data.map((pi) => ({
        id: pi.id,
        status: pi.status,
        amount: pi.amount,
        currency: pi.currency,
        created: new Date(pi.created * 1000).toISOString(),
        description: pi.description,
        sale_type: pi.metadata?.sale_type || null,
        upsells: pi.metadata?.upsells || null,
        upgrade_to_lifetime: pi.metadata?.upgrade_to_lifetime || null,
        in_db: dbPiIds.has(pi.id),
      }))
    } catch (e) {
      console.error("[debug-sales] stripe error:", e instanceof Error ? e.message : e)
    }
  }

  // 4. Pega revoked_products do user (pode estar bloqueando override)
  const { data: revoked } = await admin
    .from("revoked_products")
    .select("product_key, reason, revoked_at, customer_email")
    .ilike("customer_email", userEmail)

  // 5. Simula o que owned-products retornaria — lista produtos que DEVERIAM aparecer
  const PRODUCT_KEYS = new Set(["creativos", "andromeda", "analytics", "revisao", "minivsl", "bonus-ganchos"])
  const revokedSet = new Set((revoked || []).map((r) => r.product_key))
  const expectedProducts = new Set<string>()
  let expectedFront = false
  for (const sale of salesByUserId || []) {
    const items = (sale.items as Array<{ key?: string }> | null) || []
    for (const it of items) {
      if (!it?.key) continue
      const cleanKey = it.key.replace(/__downsell$/, "")
      if (cleanKey === "front") {
        if (!revokedSet.has("front")) expectedFront = true
        continue
      }
      if (revokedSet.has(cleanKey)) continue
      if (PRODUCT_KEYS.has(cleanKey)) expectedProducts.add(cleanKey)
    }
  }

  return NextResponse.json({
    auth_user_id: user.id,
    auth_user_email: user.email,
    stripe_customer_id: stripeCustomerId,
    sales_by_user_id_count: salesByUserId?.length || 0,
    sales_by_email_count: salesByEmail?.length || 0,
    revoked_products: revoked || [],
    expected_products_unlocked: Array.from(expectedProducts).sort(),
    expected_front: expectedFront,
    sales_by_user_id_first_5: (salesByUserId || []).slice(0, 5),
    sales_by_email_only: (salesByEmail || []).filter(
      (s) => !(salesByUserId || []).some((u) => u.id === s.id),
    ),
    stripe_pis_succeeded_count: stripePis.filter((p) => p.status === "succeeded").length,
    stripe_pis_succeeded_in_db: stripePis.filter((p) => p.status === "succeeded" && p.in_db).length,
    stripe_pis_succeeded_NOT_in_db: stripePis.filter((p) => p.status === "succeeded" && !p.in_db),
  })
}
