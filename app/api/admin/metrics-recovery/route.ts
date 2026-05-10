// API admin — agrega métricas de WhatsApp recovery pra dashboard /metricas.
//
// GET /api/admin/metrics-recovery
//
// Retorna:
//  - Funil hoje / 7d / 30d (leads, enviados, cancelados, erros)
//  - Taxa de conversão de recovery (recebeu mensagem → comprou em 7d)
//  - Estado atual da fila (aguardando, stuck, com erro)
//  - Erros Z-API recentes
//  - Casos genuinamente travados
//  - Breakdown dos skips
//
// Auth: admin only.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Email do dono — única conta autorizada (mesmo lock do /miembros/metricas)
const OWNER_EMAIL = "admin@SEU_DOMINIO.com"

type FunnelWindow = {
  leads: number
  queued: number
  sent: number
  canceled_bought: number
  errors: number
  waiting: number
}

async function buildFunnel(
  admin: ReturnType<typeof getSupabaseAdmin>,
  hoursAgo: number,
): Promise<FunnelWindow> {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

  const [leads, all] = await Promise.all([
    admin
      .from("abandoned_checkout")
      .select("id", { count: "exact", head: true })
      .gte("created_at", cutoff),
    admin
      .from("whatsapp_pending")
      .select("id, sent_at, canceled_at, error_message, send_after")
      .eq("event_type", "abandoned")
      .gte("created_at", cutoff),
  ])

  const rows = all.data || []
  const now = Date.now()

  return {
    leads: leads.count || 0,
    queued: rows.length,
    sent: rows.filter((r) => r.sent_at && !r.error_message).length,
    canceled_bought: rows.filter((r) => r.canceled_at).length,
    errors: rows.filter((r) => r.error_message).length,
    waiting: rows.filter(
      (r) => !r.sent_at && !r.canceled_at && !r.error_message && new Date(r.send_after).getTime() > now,
    ).length,
  }
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // Lock estrito: só o email do dono — mesmo padrão da page /miembros/metricas
  const userEmail = (user.email || "").toLowerCase().trim()
  if (userEmail !== OWNER_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const admin = getSupabaseAdmin()

  // Funis em 3 janelas
  const [today, last7d, last30d] = await Promise.all([
    buildFunnel(admin, 24),
    buildFunnel(admin, 24 * 7),
    buildFunnel(admin, 24 * 30),
  ])

  // Taxa de conversão de recovery (últimos 30 dias)
  const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: sentMessages } = await admin
    .from("whatsapp_pending")
    .select("email, sent_at")
    .eq("event_type", "abandoned")
    .not("sent_at", "is", null)
    .is("error_message", null)
    .gte("sent_at", cutoff30d)

  const uniqueEmails = new Set((sentMessages || []).map((m) => (m.email || "").toLowerCase()).filter(Boolean))

  // Otimização: 1 query agregada em vez de N queries
  let boughtAfter = 0
  if (uniqueEmails.size > 0) {
    const emails = Array.from(uniqueEmails)
    // Pega TODAS sales paid recentes desses emails
    const { data: sales } = await admin
      .from("stripe_sales")
      .select("customer_email, created_at")
      .eq("status", "paid")
      .gte("created_at", cutoff30d)
      .in("customer_email", emails)

    // Constrói map email → primeiro sent_at
    const sentByEmail = new Map<string, number>()
    for (const m of sentMessages || []) {
      if (!m.email || !m.sent_at) continue
      const key = m.email.toLowerCase()
      const ts = new Date(m.sent_at).getTime()
      if (!sentByEmail.has(key) || sentByEmail.get(key)! > ts) {
        sentByEmail.set(key, ts)
      }
    }

    // Pra cada email único enviado, checa se tem sale no intervalo [sent_at, sent_at+7d]
    const boughtSet = new Set<string>()
    for (const sale of sales || []) {
      const email = (sale.customer_email || "").toLowerCase()
      const sentTs = sentByEmail.get(email)
      if (!sentTs) continue
      const saleTs = new Date(sale.created_at).getTime()
      if (saleTs >= sentTs && saleTs <= sentTs + 7 * 24 * 60 * 60 * 1000) {
        boughtSet.add(email)
      }
    }
    boughtAfter = boughtSet.size
  }

  const conversionPct = uniqueEmails.size > 0
    ? Math.round((boughtAfter / uniqueEmails.size) * 10000) / 100
    : 0

  // Estado atual da fila
  const [waitingNow, stuckNow, errorNow] = await Promise.all([
    admin
      .from("whatsapp_pending")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "abandoned")
      .is("sent_at", null)
      .is("canceled_at", null)
      .is("error_message", null)
      .gt("send_after", new Date().toISOString()),
    admin
      .from("whatsapp_pending")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "abandoned")
      .is("sent_at", null)
      .is("canceled_at", null)
      .is("error_message", null)
      .lt("send_after", new Date(Date.now() - 5 * 60 * 1000).toISOString()), // 5min de tolerância
    admin
      .from("whatsapp_pending")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "abandoned")
      .not("error_message", "is", null)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // Erros recentes (últimas 24h)
  const { data: recentErrors } = await admin
    .from("whatsapp_pending")
    .select("id, email, phone, error_message, send_after, created_at")
    .eq("event_type", "abandoned")
    .not("error_message", "is", null)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(20)

  // Stuck (genuinamente)
  const { data: stuckRows } = await admin
    .from("whatsapp_pending")
    .select("id, email, phone, send_after, created_at")
    .eq("event_type", "abandoned")
    .is("sent_at", null)
    .is("canceled_at", null)
    .is("error_message", null)
    .lt("send_after", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .order("send_after", { ascending: true })
    .limit(20)

  // Skip reasons (últimos 7 dias)
  const { data: skipLogs } = await admin
    .from("whatsapp_logs")
    .select("details")
    .eq("event_type", "abandoned")
    .eq("status", "skipped")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(5000)

  const skipReasons: Record<string, number> = {}
  for (const log of skipLogs || []) {
    const details = (log.details || {}) as { reason?: string; source?: string }
    // Só conta skips que vieram do /api/lead (fonte real)
    if (details.source !== "lead") continue
    const reason = details.reason || "(sem motivo)"
    skipReasons[reason] = (skipReasons[reason] || 0) + 1
  }

  return NextResponse.json({
    funnel: { today, last7d, last30d },
    recovery_conversion_30d: {
      received: uniqueEmails.size,
      bought: boughtAfter,
      conversion_pct: conversionPct,
    },
    queue_state: {
      waiting_delay: waitingNow.count || 0,
      genuinely_stuck: stuckNow.count || 0,
      with_error_7d: errorNow.count || 0,
    },
    recent_errors: recentErrors || [],
    stuck_rows: stuckRows || [],
    skip_reasons_lead_7d: Object.entries(skipReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    generated_at: new Date().toISOString(),
  })
}
