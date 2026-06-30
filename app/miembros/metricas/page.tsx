// Dashboard de métricas de WhatsApp Recovery — owner-only.
// Acesso: https://miembros.SEU_DOMINIO.com/miembros/metricas
//
// Restrito ao email do dono da conta (OWNER_EMAIL). Mesmo outros users com
// is_admin=true nao acessam — métricas de funil/conversao sao sensiveis e
// ficam isoladas pro owner.

import { redirect } from "next/navigation"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Email do dono — única conta que pode acessar /miembros/metricas
const OWNER_EMAIL = "admin@SEU_DOMINIO.com"

type FunnelWindow = {
  leads: number
  queued: number
  sent: number
  canceled_bought: number
  errors: number
  waiting: number
}

type Metrics = {
  funnel: { today: FunnelWindow; last7d: FunnelWindow; last30d: FunnelWindow }
  recovery_conversion_30d: { received: number; bought: number; conversion_pct: number }
  queue_state: { waiting_delay: number; genuinely_stuck: number; with_error_7d: number }
  recent_errors: Array<{ id: number; email: string | null; phone: string | null; error_message: string; created_at: string }>
  stuck_rows: Array<{ id: number; email: string | null; phone: string | null; send_after: string; created_at: string }>
  skip_reasons_lead_7d: Array<{ reason: string; count: number }>
  generated_at: string
}

async function buildFunnel(
  admin: ReturnType<typeof getSupabaseAdmin>,
  hoursAgo: number,
): Promise<FunnelWindow> {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
  const [leads, all] = await Promise.all([
    admin.from("abandoned_checkout").select("id", { count: "exact", head: true }).gte("created_at", cutoff),
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
    waiting: rows.filter((r) => !r.sent_at && !r.canceled_at && !r.error_message && new Date(r.send_after).getTime() > now).length,
  }
}

async function loadMetrics(): Promise<Metrics> {
  const admin = getSupabaseAdmin()
  const [today, last7d, last30d] = await Promise.all([
    buildFunnel(admin, 24),
    buildFunnel(admin, 24 * 7),
    buildFunnel(admin, 24 * 30),
  ])

  const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: sentMessages } = await admin
    .from("whatsapp_pending")
    .select("email, sent_at")
    .eq("event_type", "abandoned")
    .not("sent_at", "is", null)
    .is("error_message", null)
    .gte("sent_at", cutoff30d)

  const uniqueEmails = new Set((sentMessages || []).map((m) => (m.email || "").toLowerCase()).filter(Boolean))
  let boughtAfter = 0
  if (uniqueEmails.size > 0) {
    const { data: sales } = await admin
      .from("stripe_sales")
      .select("customer_email, created_at")
      .eq("status", "paid")
      .gte("created_at", cutoff30d)
      .in("customer_email", Array.from(uniqueEmails))

    const sentByEmail = new Map<string, number>()
    for (const m of sentMessages || []) {
      if (!m.email || !m.sent_at) continue
      const key = m.email.toLowerCase()
      const ts = new Date(m.sent_at).getTime()
      if (!sentByEmail.has(key) || sentByEmail.get(key)! > ts) sentByEmail.set(key, ts)
    }
    const boughtSet = new Set<string>()
    for (const sale of sales || []) {
      const email = (sale.customer_email || "").toLowerCase()
      const sentTs = sentByEmail.get(email)
      if (!sentTs) continue
      const saleTs = new Date(sale.created_at).getTime()
      if (saleTs >= sentTs && saleTs <= sentTs + 7 * 24 * 60 * 60 * 1000) boughtSet.add(email)
    }
    boughtAfter = boughtSet.size
  }
  const conversionPct = uniqueEmails.size > 0 ? Math.round((boughtAfter / uniqueEmails.size) * 10000) / 100 : 0

  const [waitingNow, stuckNow, errorNow] = await Promise.all([
    admin.from("whatsapp_pending").select("id", { count: "exact", head: true }).eq("event_type", "abandoned").is("sent_at", null).is("canceled_at", null).is("error_message", null).gt("send_after", new Date().toISOString()),
    admin.from("whatsapp_pending").select("id", { count: "exact", head: true }).eq("event_type", "abandoned").is("sent_at", null).is("canceled_at", null).is("error_message", null).lt("send_after", new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    admin.from("whatsapp_pending").select("id", { count: "exact", head: true }).eq("event_type", "abandoned").not("error_message", "is", null).gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const { data: recentErrors } = await admin
    .from("whatsapp_pending")
    .select("id, email, phone, error_message, created_at, send_after")
    .eq("event_type", "abandoned")
    .not("error_message", "is", null)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: stuckRows } = await admin
    .from("whatsapp_pending")
    .select("id, email, phone, send_after, created_at")
    .eq("event_type", "abandoned")
    .is("sent_at", null)
    .is("canceled_at", null)
    .is("error_message", null)
    .lt("send_after", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .order("send_after", { ascending: true })
    .limit(10)

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
    if (details.source !== "lead") continue
    const reason = details.reason || "(sem motivo)"
    skipReasons[reason] = (skipReasons[reason] || 0) + 1
  }

  return {
    funnel: { today, last7d, last30d },
    recovery_conversion_30d: { received: uniqueEmails.size, bought: boughtAfter, conversion_pct: conversionPct },
    queue_state: { waiting_delay: waitingNow.count || 0, genuinely_stuck: stuckNow.count || 0, with_error_7d: errorNow.count || 0 },
    recent_errors: (recentErrors || []) as Metrics["recent_errors"],
    stuck_rows: (stuckRows || []) as Metrics["stuck_rows"],
    skip_reasons_lead_7d: Object.entries(skipReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    generated_at: new Date().toISOString(),
  }
}

export default async function MetricasPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Lock estrito: só o email do dono. Não basta is_admin — métricas só pra owner.
  const userEmail = (user.email || "").toLowerCase().trim()
  if (userEmail !== OWNER_EMAIL.toLowerCase()) {
    redirect("/miembros")
  }

  const m = await loadMetrics()

  return (
    <div style={{ minHeight: "100vh", background: "#000000", color: "#F3F6FA", padding: "2rem 1.5rem", fontFamily: "var(--font-body)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: "2rem", borderBottom: "1px solid rgba(109,74,155,0.3)", paddingBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "#6D4A9B", margin: 0 }}>
            Dashboard · Admin
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 700, margin: "0.5rem 0 0", letterSpacing: "-0.01em" }}>
            Métricas de WhatsApp Recovery
          </h1>
          <p style={{ fontSize: "0.75rem", color: "#a0a0b0", margin: "0.5rem 0 0", fontFamily: "var(--font-mono)" }}>
            Atualizado em {new Date(m.generated_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          </p>
        </header>

        {/* Conversão de recovery — destaque grande */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={sectionTitle}>Conversão de Recovery (30 dias)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <Metric label="Receberam mensagem" value={m.recovery_conversion_30d.received} />
            <Metric label="Compraram após recovery" value={m.recovery_conversion_30d.bought} />
            <Metric
              label="Taxa de conversão"
              value={`${m.recovery_conversion_30d.conversion_pct}%`}
              accent={m.recovery_conversion_30d.conversion_pct >= 5 ? "#4ade80" : "#fbbf24"}
              hint={m.recovery_conversion_30d.conversion_pct >= 5 ? "Acima da média (>5%)" : "Abaixo da média"}
            />
          </div>
        </section>

        {/* Estado atual da fila */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={sectionTitle}>Estado Atual da Fila</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <Metric label="Aguardando delay" value={m.queue_state.waiting_delay} hint="Vão sair em ≤30min" />
            <Metric
              label="Genuinamente travadas"
              value={m.queue_state.genuinely_stuck}
              accent={m.queue_state.genuinely_stuck > 0 ? "#dc2626" : "#4ade80"}
              hint={m.queue_state.genuinely_stuck > 0 ? "Cron pode estar travado" : "Tudo OK"}
            />
            <Metric label="Com erro (7d)" value={m.queue_state.with_error_7d} accent={m.queue_state.with_error_7d > 5 ? "#fbbf24" : "#a0a0b0"} hint="Erros recentes na fila" />
          </div>
        </section>

        {/* Funil em 3 janelas */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={sectionTitle}>Funil de Recuperação</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Janela</th>
                  <th style={thStyle}>Leads (form)</th>
                  <th style={thStyle}>Enfileirados</th>
                  <th style={thStyle}>Enviados</th>
                  <th style={thStyle}>Cancelados (compraram)</th>
                  <th style={thStyle}>Erros</th>
                  <th style={thStyle}>Aguardando</th>
                </tr>
              </thead>
              <tbody>
                <FunnelRow label="Hoje" w={m.funnel.today} />
                <FunnelRow label="Últimos 7 dias" w={m.funnel.last7d} />
                <FunnelRow label="Últimos 30 dias" w={m.funnel.last30d} />
              </tbody>
            </table>
          </div>
        </section>

        {/* Stuck rows */}
        {m.stuck_rows.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ ...sectionTitle, color: "#dc2626" }}>🚨 Genuinamente Travadas</h2>
            <p style={{ fontSize: "0.85rem", color: "#a0a0b0", marginBottom: "1rem" }}>
              Delay já passou mas o cron não enviou. Pode indicar cron travado.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Telefone</th>
                    <th style={thStyle}>Send after</th>
                    <th style={thStyle}>Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {m.stuck_rows.map((r) => (
                    <tr key={r.id}>
                      <td style={tdStyle}>{r.email || "—"}</td>
                      <td style={tdStyle}>{r.phone}</td>
                      <td style={tdStyle}>{new Date(r.send_after).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
                      <td style={tdStyle}>{new Date(r.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Erros recentes */}
        {m.recent_errors.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={sectionTitle}>Erros Recentes (24h)</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Telefone</th>
                    <th style={thStyle}>Erro</th>
                    <th style={thStyle}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {m.recent_errors.map((r) => (
                    <tr key={r.id}>
                      <td style={tdStyle}>{r.email || "—"}</td>
                      <td style={tdStyle}>{r.phone}</td>
                      <td style={{ ...tdStyle, color: "#fca5a5", maxWidth: 350, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.error_message}>
                        {r.error_message}
                      </td>
                      <td style={tdStyle}>{new Date(r.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Skip reasons (lead) */}
        {m.skip_reasons_lead_7d.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={sectionTitle}>Por que /api/lead pulou (7 dias)</h2>
            <p style={{ fontSize: "0.85rem", color: "#a0a0b0", marginBottom: "1rem" }}>
              Leads que preencheram form mas foram filtrados antes de enfileirar. Excluí ruído de cron PI-based.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Motivo</th>
                    <th style={thStyle}>Total</th>
                    <th style={thStyle}>O que significa</th>
                  </tr>
                </thead>
                <tbody>
                  {m.skip_reasons_lead_7d.map((s) => (
                    <tr key={s.reason}>
                      <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", color: "#fbbf24" }}>{s.reason}</td>
                      <td style={tdStyle}>{s.count}</td>
                      <td style={{ ...tdStyle, color: "#a0a0b0" }}>{reasonExplain(s.reason)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <footer style={{ marginTop: "3rem", padding: "1rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>
          Cache: 0s. Página recarrega dados sempre.
        </footer>
      </div>
    </div>
  )
}

const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "#6D4A9B",
  margin: "0 0 1rem",
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: "rgba(15,15,23,0.6)",
  border: "1px solid rgba(109,74,155,0.2)",
}

const thStyle: React.CSSProperties = {
  padding: "0.85rem 1rem",
  textAlign: "left",
  fontFamily: "var(--font-mono)",
  fontSize: "0.65rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#6D4A9B",
  borderBottom: "1px solid rgba(109,74,155,0.3)",
  background: "rgba(109,74,155,0.05)",
}

const tdStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  fontSize: "0.85rem",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  color: "#F3F6FA",
}

function Metric({ label, value, accent, hint }: { label: string; value: number | string; accent?: string; hint?: string }) {
  return (
    <div style={{ padding: "1.25rem 1.5rem", background: "linear-gradient(135deg, rgba(109,74,155,0.08), rgba(15,15,23,0.6))", border: "1px solid rgba(109,74,155,0.25)", borderRadius: 4 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#a0a0b0", margin: 0 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", fontWeight: 700, margin: "0.5rem 0 0", color: accent || "#6D4A9B", lineHeight: 1 }}>{value}</p>
      {hint && <p style={{ fontSize: "0.7rem", color: "#a0a0b0", margin: "0.5rem 0 0" }}>{hint}</p>}
    </div>
  )
}

function FunnelRow({ label, w }: { label: string; w: FunnelWindow }) {
  const conversion = w.queued > 0 ? Math.round(((w.sent + w.canceled_bought) / w.queued) * 100) : 0
  return (
    <tr>
      <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#fbbf24" }}>{label}</td>
      <td style={tdStyle}>{w.leads}</td>
      <td style={tdStyle}>{w.queued}</td>
      <td style={{ ...tdStyle, color: "#4ade80" }}>{w.sent}</td>
      <td style={{ ...tdStyle, color: "#a0a0b0" }}>{w.canceled_bought}</td>
      <td style={{ ...tdStyle, color: w.errors > 0 ? "#fca5a5" : "#F3F6FA" }}>{w.errors}</td>
      <td style={tdStyle}>{w.waiting}{conversion > 0 && <span style={{ marginLeft: "0.5rem", color: "#a0a0b0", fontSize: "0.7rem" }}>(taxa: {conversion}%)</span>}</td>
    </tr>
  )
}

function reasonExplain(reason: string): string {
  switch (reason) {
    case "already_buyer":
      return "Cliente já está em whatsapp_buyers (comprou em algum flow anterior)"
    case "deduped_recent":
      return "Mesmo cliente já foi notificado nos últimos 15 dias (TTL anti-spam)"
    case "became_buyer_before_send":
      return "Cliente comprou entre o enqueue e o envio — recovery cancelada"
    default:
      return "—"
  }
}
