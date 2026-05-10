// API self-service — user logado claima suas próprias compras 1-click que
// ficaram sem user_id e/ou sem plan='lifetime' por causa do bug do webhook.
//
// POST /api/profile/claim-purchases
//   Body: {} (vazio)
//
// Auth: cookie Supabase (qualquer user logado, NÃO requer admin).
//
// Lógica:
//   1. Backfill user_id em sales sale_type='upsell'/'standalone' com user_id=NULL
//      e customer_email = user.email (linka compras do PRÓPRIO user)
//   2. Verifica no Stripe se o customer do user tem PaymentIntent succeeded com
//      metadata.upgrade_to_lifetime=true → se sim, força plan=lifetime nas sales
//      front desse user (cobre o caso do upgrade pago mas não aplicado)
//
// Não opera em vendas de OUTROS users — usa user.id e user.email do auth.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/server"

export const dynamic = "force-dynamic"

export async function POST() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const userEmail = user.email.toLowerCase().trim()
  const userId = user.id

  const result = {
    upsells_linked: 0,
    sample_linked: [] as Array<{ id: string; items: unknown }>,
    upgrade_lifetime_applied: false,
    upgrade_pi_found: null as string | null,
    front_sales_updated: 0,
    front_sales_state: [] as Array<{ id: string; plan: string | null; expires_at: string | null }>,
    revocations_cleared: [] as string[],
  }

  // ─────────────────────────────────────────────────────────
  // STEP 1: Linka upsells/standalone do PRÓPRIO user via email
  // ─────────────────────────────────────────────────────────
  const { data: orphans } = await admin
    .from("stripe_sales")
    .select("id, items, customer_email")
    .in("sale_type", ["upsell", "standalone"])
    .is("user_id", null)
    .eq("status", "paid")
    .ilike("customer_email", userEmail)

  if (orphans && orphans.length > 0) {
    const ids = orphans.map((s) => s.id)
    const { data: updated, error: updErr } = await admin
      .from("stripe_sales")
      .update({ user_id: userId })
      .in("id", ids)
      .select("id, items")

    if (updErr) {
      return NextResponse.json({ error: "update_orphans", message: updErr.message }, { status: 500 })
    }

    result.upsells_linked = updated?.length || 0
    result.sample_linked = (updated || []).slice(0, 5).map((s) => ({ id: s.id, items: s.items }))
  }

  // ─────────────────────────────────────────────────────────
  // STEP 2: Verifica no Stripe se user pagou upgrade vitalicio
  // ─────────────────────────────────────────────────────────
  // Pega stripe_customer_id mais recente do user
  const { data: salesWithCustomer } = await admin
    .from("stripe_sales")
    .select("stripe_customer_id")
    .or(`user_id.eq.${userId},customer_email.ilike.${userEmail}`)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)

  const stripeCustomerId = salesWithCustomer?.[0]?.stripe_customer_id || null

  if (stripeCustomerId) {
    try {
      const stripe = getStripe()
      // Lista PIs recentes do customer (últimos 100)
      const pis = await stripe.paymentIntents.list({
        customer: stripeCustomerId,
        limit: 100,
      })

      // Acha algum PI com metadata.upgrade_to_lifetime=true E succeeded
      const upgradePi = pis.data.find(
        (pi) =>
          pi.status === "succeeded" &&
          pi.metadata?.upgrade_to_lifetime === "true",
      )

      if (upgradePi) {
        result.upgrade_pi_found = upgradePi.id

        // Atualiza TODAS sales front desse user (linkadas por user_id OU email) pra lifetime
        const { data: allUserSales } = await admin
          .from("stripe_sales")
          .select("id, plan, expires_at, items")
          .or(`user_id.eq.${userId},customer_email.ilike.${userEmail}`)
          .eq("status", "paid")

        const frontSaleIds = (allUserSales || [])
          .filter((s) => {
            const items = (s.items as Array<{ key?: string }> | null) || []
            return items.some((it) => (it?.key || "").replace(/__downsell$/, "") === "front")
          })
          .map((s) => s.id)

        result.front_sales_state = (allUserSales || [])
          .filter((s) => frontSaleIds.includes(s.id))
          .map((s) => ({ id: s.id, plan: s.plan, expires_at: s.expires_at }))

        if (frontSaleIds.length > 0) {
          const { data: updatedFronts, error: updFrontErr } = await admin
            .from("stripe_sales")
            .update({ plan: "lifetime", expires_at: null, user_id: userId })
            .in("id", frontSaleIds)
            .select("id")

          if (updFrontErr) {
            return NextResponse.json({
              ...result,
              error: "update_lifetime",
              message: updFrontErr.message,
            }, { status: 500 })
          }

          result.front_sales_updated = updatedFronts?.length || 0
          result.upgrade_lifetime_applied = true
        }
      }
    } catch (e) {
      console.error("[claim-purchases] stripe check failed:", e instanceof Error ? e.message : e)
    }
  }

  // ─────────────────────────────────────────────────────────
  // STEP 3: Limpa revoked_products onde o user tem sale paid mais nova
  // ─────────────────────────────────────────────────────────
  // Cenário: cliente pagou produto, deu refund (revogou), pagou DE NOVO. Sale
  // nova é mais recente que a revocation → produto deve voltar a estar liberado.
  // Self-service: deleta revocation pra produtos que tem sale paid mais nova.
  const { data: revoked } = await admin
    .from("revoked_products")
    .select("id, product_key, revoked_at")
    .ilike("customer_email", userEmail)

  if (revoked && revoked.length > 0) {
    // Lista todas sales paid do user com items
    const { data: paidSales } = await admin
      .from("stripe_sales")
      .select("id, items, created_at")
      .or(`user_id.eq.${userId},customer_email.ilike.${userEmail}`)
      .eq("status", "paid")

    for (const rev of revoked) {
      const revokedAt = new Date(rev.revoked_at).getTime()
      // Acha sale paid com esse product_key criada DEPOIS da revocation
      const newerSale = (paidSales || []).find((s) => {
        const items = (s.items as Array<{ key?: string }> | null) || []
        const hasProduct = items.some(
          (it) => (it?.key || "").replace(/__downsell$/, "") === rev.product_key,
        )
        const saleAt = new Date(s.created_at).getTime()
        return hasProduct && saleAt > revokedAt
      })

      if (newerSale) {
        const { error: delErr } = await admin
          .from("revoked_products")
          .delete()
          .eq("id", rev.id)

        if (!delErr) {
          result.revocations_cleared.push(rev.product_key)
        }
      }
    }
  }

  return NextResponse.json(result)
}
