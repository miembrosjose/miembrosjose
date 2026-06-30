"use client"

// Tab admin: saude de envio de emails pos-compra.
// Mostra:
//  - Stats (sucessos / falhas / taxa de entrega)
//  - Orphans: clientes que compraram e NAO receberam email — botao retry 1 click
//  - Falhas recentes do email_send_log

import { useCallback, useEffect, useState } from "react"
import { Mail, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react"

type Orphan = {
  stripe_payment_intent_id: string
  email: string
  customer_name: string | null
  sale_type: string
  amount_total: number
  currency: string
  created_at: string
  hours_ago: number
}

type Failure = {
  id: string
  email: string
  email_type: string
  source: string
  source_ref: string | null
  status: string
  error_message: string | null
  attempt: number
  created_at: string
}

type Stats = {
  total_7d: number
  success_7d: number
  failed_7d: number
  total_24h: number
  failed_24h: number
  success_1h: number
  success_rate_7d: number | null
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  })

export function EmailHealth() {
  const [orphans, setOrphans] = useState<Orphan[]>([])
  const [orphansCount, setOrphansCount] = useState(0)
  const [failures, setFailures] = useState<Failure[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch("/api/admin/email-health", { credentials: "include", cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setOrphans(data.orphans?.list || [])
      setOrphansCount(data.orphans?.count || 0)
      setFailures(data.failures || [])
      setStats(data.stats || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const retry = async (email: string) => {
    setRetrying(email)
    try {
      const res = await fetch("/api/admin/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      alert(`✓ ${data.message || "Email reenviado"}`)
      load()
    } catch (e) {
      alert(`✗ Falhou: ${e instanceof Error ? e.message : "erro"}`)
    } finally {
      setRetrying(null)
    }
  }

  if (loading) return <p className="text-xs text-[#6a6a7a]">Carregando estado dos emails...</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
          Saúde de envio de emails
        </h2>
        <p className="mt-2 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Monitor de emails pós-compra (invite + login). Detecta clientes que compraram e não receberam email pra retry com 1 click.
        </p>
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Taxa de sucesso 7d" value={stats.success_rate_7d != null ? `${stats.success_rate_7d}%` : "—"} good={stats.success_rate_7d != null && stats.success_rate_7d >= 95} />
          <StatCard label="Total 7 dias" value={stats.total_7d.toString()} />
          <StatCard label="Falhas 24h" value={stats.failed_24h.toString()} good={stats.failed_24h === 0} bad={stats.failed_24h > 5} />
          <StatCard label="Sucessos 1h" value={stats.success_1h.toString()} />
        </div>
      )}

      {/* ORPHANS */}
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-red-400 [font-family:var(--font-geist-sans)]">
          <AlertTriangle size={13} />
          Compras sem email entregue ({orphansCount})
        </h3>
        <p className="mb-3 text-[11px] text-[#a0a0b0]">
          Clientes que compraram há mais de 5min e não têm registro de email entregue. Click em &quot;Reenviar&quot; pra mandar de novo (detecta automaticamente se manda invite ou login).
        </p>
        {orphans.length === 0 ? (
          <p className="text-[11px] text-[#009d68] flex items-center gap-2"><CheckCircle2 size={14} /> Tudo entregue. Nenhum cliente órfão nas últimas 7d.</p>
        ) : (
          <div className="border border-[#1a1a24] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1a1a24] bg-[#12121a]/40">
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Cliente</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Tipo</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Há</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Quando</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a] w-24"></th>
                </tr>
              </thead>
              <tbody>
                {orphans.map((o) => (
                  <tr key={o.stripe_payment_intent_id} className="border-b border-[#1a1a24]">
                    <td className="px-2 py-2">
                      <div className="text-[#F3F6FA]">{o.email}</div>
                      {o.customer_name && <div className="text-[10px] text-[#6a6a7a]">{o.customer_name}</div>}
                    </td>
                    <td className="px-2 py-2 text-[#a0a0b0] uppercase text-[10px] tracking-[0.2em] [font-family:var(--font-mono)]">{o.sale_type}</td>
                    <td className="px-2 py-2 text-[#a0a0b0] [font-family:var(--font-mono)]">{o.hours_ago}h</td>
                    <td className="px-2 py-2 text-[#6a6a7a] [font-family:var(--font-mono)]">{formatDateTime(o.created_at)}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => retry(o.email)}
                        disabled={retrying === o.email}
                        className="inline-flex items-center gap-1 border border-[#6D4A9B]/40 bg-[#6D4A9B]/10 text-[#6D4A9B] text-[10px] font-semibold uppercase tracking-[0.2em] px-2 py-1 hover:bg-[#6D4A9B]/20 disabled:opacity-50"
                      >
                        <RefreshCw size={11} className={retrying === o.email ? "animate-spin" : ""} />
                        {retrying === o.email ? "..." : "Reenviar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* FAILURES */}
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
          <Mail size={13} />
          Falhas recentes ({failures.length})
        </h3>
        <p className="mb-3 text-[11px] text-[#a0a0b0]">
          Últimas 50 tentativas com status failed/error. Útil pra identificar padrão (Resend down, domínio bloqueado, mailbox cheia, etc).
        </p>
        {failures.length === 0 ? (
          <p className="text-[11px] text-[#009d68]">Sem falhas registradas nos últimos 7d. ✓</p>
        ) : (
          <div className="border border-[#1a1a24] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1a1a24] bg-[#12121a]/40">
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Email</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Tipo</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Origem</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Erro</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Quando</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a] w-24"></th>
                </tr>
              </thead>
              <tbody>
                {failures.map((f) => (
                  <tr key={f.id} className="border-b border-[#1a1a24]">
                    <td className="px-2 py-2 text-[#F3F6FA]">{f.email}</td>
                    <td className="px-2 py-2 text-[10px] text-[#a0a0b0] uppercase [font-family:var(--font-mono)]">{f.email_type}</td>
                    <td className="px-2 py-2 text-[10px] text-[#a0a0b0] uppercase [font-family:var(--font-mono)]">{f.source}</td>
                    <td className="px-2 py-2 text-[10px] text-red-400 max-w-xs truncate" title={f.error_message || ""}>{f.error_message || "—"}</td>
                    <td className="px-2 py-2 text-[10px] text-[#6a6a7a] [font-family:var(--font-mono)]">{formatDateTime(f.created_at)}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => retry(f.email)}
                        disabled={retrying === f.email}
                        className="inline-flex items-center gap-1 border border-[#6D4A9B]/40 bg-[#6D4A9B]/10 text-[#6D4A9B] text-[10px] font-semibold uppercase tracking-[0.2em] px-2 py-1 hover:bg-[#6D4A9B]/20 disabled:opacity-50"
                      >
                        <RefreshCw size={11} className={retrying === f.email ? "animate-spin" : ""} />
                        Retry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  return (
    <div
      className={`border p-3 ${
        bad ? "border-red-500/40 bg-red-500/5" :
        good ? "border-[#009d68]/40 bg-[#009d68]/5" :
        "border-[#1a1a24] bg-[#12121a]/40"
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a] [font-family:var(--font-mono)]">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${bad ? "text-red-400" : good ? "text-[#009d68]" : "text-[#F3F6FA]"} [font-family:var(--font-display)]`}>
        {value}
      </div>
    </div>
  )
}
