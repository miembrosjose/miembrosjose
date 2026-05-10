// API admin — backfill one-time pra arrumar compras 1-click off-session
// que ficaram sem user_id e/ou plan='lifetime' depois do bug de webhook.
//
// POST /api/admin/backfill-1click
//   Body opcional: { email?: string }  // pra forçar lifetime em user específico
//
// Roda 2 etapas:
//   1. UPDATE stripe_sales SET user_id = ... pras vendas sale_type='upsell' que
//      ficaram com user_id NULL — match via customer_email → auth.users.email
//   2. (Se body.email passado) UPDATE plan='lifetime' nas sales front desse user
//      — pra cobrir caso do upgrade vitalicio que nao foi aplicado
//
// Auth: só admins.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { email?: string } = {}
  try { body = await req.json() } catch { /* body opcional */ }

  const admin = getSupabaseAdmin()
  const result = {
    upsells_linked: 0,
    upsells_already_linked: 0,
    upsells_no_user: 0,
    sample_linked: [] as Array<{ id: string; customer_email: string | null; user_id: string }>,
    sample_no_user: [] as Array<{ id: string; customer_email: string | null }>,
    front_lifetime_updated: 0,
    front_sales_for_user: [] as Array<{ id: string; plan: string | null; expires_at: string | null }>,
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Backfill user_id em upsells/standalone sem user_id
  // ─────────────────────────────────────────────────────────────
  // Pega TODAS as sales upsell/standalone com user_id NULL e tenta linkar via email
  const { data: orphanSales, error: orphanErr } = await admin
    .from("stripe_sales")
    .select("id, customer_email")
    .in("sale_type", ["upsell", "standalone"])
    .is("user_id", null)
    .eq("status", "paid")
    .not("customer_email", "is", null)

  if (orphanErr) {
    return NextResponse.json({ error: "query_orphan_sales", message: orphanErr.message }, { status: 500 })
  }

  // Pra cada sale órfã, busca user na auth.users com mesmo email e atualiza
  for (const sale of orphanSales || []) {
    const email = (sale.customer_email || "").toLowerCase().trim()
    if (!email) {
      result.upsells_no_user++
      continue
    }

    const { data: authUserData } = await admin.auth.admin.listUsers()
    const matchedUser = authUserData?.users?.find(
      (u) => (u.email || "").toLowerCase().trim() === email,
    )

    if (!matchedUser) {
      result.upsells_no_user++
      if (result.sample_no_user.length < 5) {
        result.sample_no_user.push({ id: sale.id, customer_email: sale.customer_email })
      }
      continue
    }

    const { error: updateErr } = await admin
      .from("stripe_sales")
      .update({ user_id: matchedUser.id })
      .eq("id", sale.id)

    if (updateErr) {
      console.error(`[backfill-1click] update fail sale ${sale.id}:`, updateErr.message)
      continue
    }

    result.upsells_linked++
    if (result.sample_linked.length < 5) {
      result.sample_linked.push({
        id: sale.id,
        customer_email: sale.customer_email,
        user_id: matchedUser.id,
      })
    }
  }

  // Conta quantos upsells já tinham user_id (informativo)
  const { count: alreadyLinked } = await admin
    .from("stripe_sales")
    .select("id", { count: "exact", head: true })
    .in("sale_type", ["upsell", "standalone"])
    .not("user_id", "is", null)
    .eq("status", "paid")

  result.upsells_already_linked = alreadyLinked || 0

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Se body.email passado, força lifetime nas sales front desse user
  // ─────────────────────────────────────────────────────────────
  const targetEmail = (body.email || "").toLowerCase().trim()
  if (targetEmail) {
    const { data: authUsersList } = await admin.auth.admin.listUsers()
    const targetUser = authUsersList?.users?.find(
      (u) => (u.email || "").toLowerCase().trim() === targetEmail,
    )

    if (!targetUser) {
      return NextResponse.json({
        ...result,
        warning: `User com email ${targetEmail} não encontrado em auth.users`,
      })
    }

    // Lista todas sales front desse user antes do update
    const { data: frontSales } = await admin
      .from("stripe_sales")
      .select("id, plan, expires_at, items")
      .eq("user_id", targetUser.id)
      .eq("status", "paid")

    const frontSaleIds = (frontSales || [])
      .filter((s) => {
        const items = (s.items as Array<{ key?: string }> | null) || []
        return items.some((it) => (it?.key || "").replace(/__downsell$/, "") === "front")
      })
      .map((s) => s.id)

    result.front_sales_for_user = (frontSales || [])
      .filter((s) => frontSaleIds.includes(s.id))
      .map((s) => ({ id: s.id, plan: s.plan, expires_at: s.expires_at }))

    if (frontSaleIds.length > 0) {
      const { data: updated, error: updateFrontErr } = await admin
        .from("stripe_sales")
        .update({ plan: "lifetime", expires_at: null })
        .in("id", frontSaleIds)
        .select("id")

      if (updateFrontErr) {
        return NextResponse.json({
          ...result,
          error: "update_front_lifetime",
          message: updateFrontErr.message,
        }, { status: 500 })
      }

      result.front_lifetime_updated = updated?.length || 0
    }
  }

  return NextResponse.json(result)
}
