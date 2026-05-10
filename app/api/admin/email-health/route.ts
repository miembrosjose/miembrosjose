// GET /api/admin/email-health
//
// Dashboard de saúde de envio de emails pós-compra.
//
// Retorna 3 listas:
//   1. orphans — vendas (stripe_sales status='paid' E sale_type='front'/etc)
//      criadas há >5min sem nenhum email_send_log success do tipo invite/account_exists
//      → cliente comprou e não recebeu email. Admin pode retentar com 1 click.
//   2. failures — últimos 50 logs com status='failed'/'error'
//   3. stats — totais de 7d/24h/1h pra dashboard

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const admin = getSupabaseAdmin()
  const now = new Date()
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // ── ORPHANS: vendas front sem email success ──────────────────────────
  // Pega vendas dos últimos 7 dias com sale_type front* E status paid
  const { data: recentSales } = await admin
    .from("stripe_sales")
    .select("stripe_payment_intent_id, customer_email, customer_name, sale_type, amount_total, currency, created_at")
    .in("sale_type", ["front", "front_installment", "hotmart"])
    .eq("status", "paid")
    .gte("created_at", sevenDaysAgo)
    .lt("created_at", fiveMinAgo)
    .order("created_at", { ascending: false })
    .limit(500)

  const sales = recentSales || []

  // Cliente é considerado JÁ ATENDIDO se qualquer uma dessas 3 fontes confirma:
  //   1. email_send_log.status='success' (sistema novo, ativo desde 07/05/2026)
  //   2. account_invites.email_sent_at preenchido (sistema antigo já registrava)
  //   3. auth.users existe com esse email (cliente criou conta = prova definitiva)
  // Vira "órfão" só quando TODAS 3 fontes falham — vendas antigas que receberam
  // email na época somem da lista via fontes 2 e 3 (especialmente cliente já logou).
  const emails = Array.from(new Set(sales.map((s) => (s.customer_email || "").toLowerCase()).filter(Boolean)))
  const deliveredEmails = new Set<string>()

  if (emails.length > 0) {
    const [{ data: logs }, { data: invites }] = await Promise.all([
      admin
        .from("email_send_log")
        .select("email")
        .in("email", emails)
        .in("email_type", ["invite", "account_exists"])
        .eq("status", "success"),
      admin
        .from("account_invites")
        .select("email")
        .in("email", emails)
        .not("email_sent_at", "is", null),
    ])

    for (const l of logs || []) deliveredEmails.add((l as { email: string }).email.toLowerCase())
    for (const i of invites || []) deliveredEmails.add((i as { email: string }).email.toLowerCase())

    // Fonte 3: auth.users existe → cliente já criou conta (prova definitiva
    // que recebeu o invite e usou).
    try {
      const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const allEmails = new Set(emails)
      for (const u of listed?.users || []) {
        const ue = (u.email || "").toLowerCase()
        if (ue && allEmails.has(ue)) deliveredEmails.add(ue)
      }
    } catch {
      // ignora — fontes 1 e 2 ainda cobrem
    }
  }

  // Orphan = venda sem nenhuma das 3 fontes confirmando entrega
  const orphans = sales
    .filter((s) => {
      const email = (s.customer_email || "").toLowerCase()
      return email && !deliveredEmails.has(email)
    })
    .map((s) => ({
      stripe_payment_intent_id: s.stripe_payment_intent_id,
      email: s.customer_email,
      customer_name: s.customer_name,
      sale_type: s.sale_type,
      amount_total: s.amount_total,
      currency: s.currency,
      created_at: s.created_at,
      hours_ago: Math.round((now.getTime() - new Date(s.created_at).getTime()) / 3600000),
    }))

  // ── FAILURES: últimas falhas pra debug ────────────────────────────────
  const { data: failures } = await admin
    .from("email_send_log")
    .select("id, email, email_type, source, source_ref, status, error_message, attempt, created_at")
    .in("status", ["failed", "error"])
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(50)

  // ── STATS ─────────────────────────────────────────────────────────────
  const [{ count: total7d }, { count: success7d }, { count: failed7d }, { count: total24h }, { count: failed24h }, { count: success1h }] = await Promise.all([
    admin.from("email_send_log").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    admin.from("email_send_log").select("id", { count: "exact", head: true }).eq("status", "success").gte("created_at", sevenDaysAgo),
    admin.from("email_send_log").select("id", { count: "exact", head: true }).in("status", ["failed", "error"]).gte("created_at", sevenDaysAgo),
    admin.from("email_send_log").select("id", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    admin.from("email_send_log").select("id", { count: "exact", head: true }).in("status", ["failed", "error"]).gte("created_at", oneDayAgo),
    admin.from("email_send_log").select("id", { count: "exact", head: true }).eq("status", "success").gte("created_at", oneHourAgo),
  ])

  return NextResponse.json({
    orphans: {
      count: orphans.length,
      list: orphans.slice(0, 100),
    },
    failures: failures || [],
    stats: {
      total_7d: total7d || 0,
      success_7d: success7d || 0,
      failed_7d: failed7d || 0,
      total_24h: total24h || 0,
      failed_24h: failed24h || 0,
      success_1h: success1h || 0,
      success_rate_7d: total7d ? Math.round(((success7d || 0) / total7d) * 100) : null,
    },
  })
}
