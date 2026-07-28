"use client"

import { useEffect, useMemo, useState } from "react"
import { inputCls, FilterBtn, AdminCard, StatCard, AdminBadge, AdminEmptyState } from "./_shared"

type Row = {
  email: string
  status: string
  subscription_status: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  created_at: string | null
  updated_at: string | null
}

type Summary = {
  total: number
  active: number
  past_due: number
  canceled: number
  pending: number
  currency: string
  mrrEstimate: number | null
}

type Sync = {
  failed: number
  processing: number
  completed: number
  lastSuccessAt: string | null
  recentFailures: { id: string | null; type: string | null; action: string | null; at: string | null }[]
  health: "operativo" | "requiere_atencion" | "sin_datos"
  available: boolean
}

const STATUS_FILTERS = ["todos", "active", "past_due", "canceled", "pending"] as const
const PAGE_SIZE = 25

function fmt(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es", { year: "numeric", month: "short", day: "numeric" })
}

function statusBadge(status: string) {
  if (status === "active") return <AdminBadge variant="success">Activo</AdminBadge>
  if (status === "past_due") return <AdminBadge variant="warning">Pago pendiente</AdminBadge>
  if (status === "canceled") return <AdminBadge variant="error">Cancelado</AdminBadge>
  return <AdminBadge variant="neutral">Pendiente</AdminBadge>
}

export function Subscriptions() {
  const [rows, setRows] = useState<Row[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [sync, setSync] = useState<Sync | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("todos")
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch("/api/admin/subscriptions", { credentials: "include", cache: "no-store" })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        if (!alive) return
        setRows(Array.isArray(data.rows) ? data.rows : [])
        setSummary(data.summary ?? null)
        setSync(data.sync ?? null)
      } catch {
        if (alive) setErrorMsg("No se pudieron cargar las suscripciones.")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== "todos" && r.status !== statusFilter) return false
      if (q && !r.email.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const pageRows = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

  function exportCsv() {
    const header = [
      "email",
      "status",
      "subscription_status",
      "stripe_customer_id",
      "stripe_subscription_id",
      "current_period_end",
      "created_at",
      "updated_at",
    ]
    const escape = (v: string | null) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const lines = [
      header.join(","),
      ...filtered.map((r) =>
        [
          r.email,
          r.status,
          r.subscription_status,
          r.stripe_customer_id,
          r.stripe_subscription_id,
          r.current_period_end,
          r.created_at,
          r.updated_at,
        ]
          .map(escape)
          .join(","),
      ),
    ]
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `suscripciones-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <AdminEmptyState title="Cargando suscripciones…" />
  }
  if (errorMsg) {
    return <AdminEmptyState title={errorMsg} description="Intenta recargar la página." />
  }

  const mrr =
    summary?.mrrEstimate != null ? `${summary.currency} ${summary.mrrEstimate.toLocaleString("es")}` : "—"

  return (
    <div className="space-y-6">
      {/* ── Métricas ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total" value={summary?.total ?? 0} />
        <StatCard label="Activos" value={summary?.active ?? 0} variant="green" />
        <StatCard label="Pago pendiente" value={summary?.past_due ?? 0} variant="red" />
        <StatCard label="Cancelados" value={summary?.canceled ?? 0} />
        <StatCard label="MRR estimado" value={mrr} variant="gold" trend="activos × precio" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
        MRR es una estimación bruta (activos × precio); no incluye comisiones ni impuestos. Métricas de
        embudo (registros/pagos/conversión) viven en el proyecto del embudo.
      </p>

      {/* ── Estado del sistema ───────────────────────────────── */}
      <AdminCard
        title="Estado del sistema"
        description="Sincronización embudo → plataforma (member_sync_events)."
        accent={sync?.health === "requiere_atencion" ? "red" : sync?.health === "operativo" ? "green" : "neutral"}
      >
        {!sync?.available ? (
          <p className="text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
            Sin datos: la tabla de eventos de sincronización aún no está disponible.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {sync.health === "operativo" && <AdminBadge variant="success">Operativo</AdminBadge>}
              {sync.health === "requiere_atencion" && <AdminBadge variant="error">Requiere atención</AdminBadge>}
              {sync.health === "sin_datos" && <AdminBadge variant="neutral">Sin datos recientes</AdminBadge>}
              <span className="text-[11px] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
                Fallidas: {sync.failed} · En proceso: {sync.processing} · Completadas: {sync.completed}
              </span>
              <span className="text-[11px] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                Última sync exitosa: {fmt(sync.lastSuccessAt)}
              </span>
            </div>

            {sync.recentFailures.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-xs [font-family:var(--font-geist-sans)]">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-[0.2em] text-[#6a6a7a]">
                      <th className="py-1.5 pr-4">Evento</th>
                      <th className="py-1.5 pr-4">Acción</th>
                      <th className="py-1.5 pr-4">Tipo</th>
                      <th className="py-1.5">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sync.recentFailures.map((f, i) => (
                      <tr key={i} className="border-t border-[#1a1a24] text-[#c3c3d4]">
                        <td className="py-1.5 pr-4 font-mono text-[#a78bca]">{f.id ?? "—"}</td>
                        <td className="py-1.5 pr-4">{f.action ?? "—"}</td>
                        <td className="py-1.5 pr-4">{f.type ?? "—"}</td>
                        <td className="py-1.5">{fmt(f.at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </AdminCard>

      {/* ── Tabla de suscripciones ───────────────────────────── */}
      <AdminCard title="Suscripciones" description={`${filtered.length} de ${rows.length} registros`}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por correo…"
            className={`${inputCls} max-w-xs`}
            aria-label="Buscar por correo"
          />
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <FilterBtn
                key={f}
                active={statusFilter === f}
                onClick={() => {
                  setStatusFilter(f)
                  setPage(1)
                }}
                variant={f === "past_due" || f === "canceled" ? "red" : "gold"}
              >
                {f === "todos" ? "Todos" : f === "active" ? "Activos" : f === "past_due" ? "Pago pendiente" : f === "canceled" ? "Cancelados" : "Pendientes"}
              </FilterBtn>
            ))}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="ml-auto border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:text-[#F3F6FA] [font-family:var(--font-geist-sans)]"
          >
            Exportar CSV
          </button>
        </div>

        {filtered.length === 0 ? (
          <AdminEmptyState title="Sin resultados" description="Ajusta la búsqueda o el filtro." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs [font-family:var(--font-geist-sans)]">
                <thead>
                  <tr className="text-[9px] uppercase tracking-[0.2em] text-[#6a6a7a]">
                    <th className="py-2 pr-4">Correo</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">Stripe (sub)</th>
                    <th className="py-2 pr-4">Stripe (cliente)</th>
                    <th className="py-2 pr-4">Fin de periodo</th>
                    <th className="py-2 pr-4">Creado</th>
                    <th className="py-2">Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.email} className="border-t border-[#1a1a24] text-[#c3c3d4]">
                      <td className="py-2 pr-4 text-[#F3F6FA]">{r.email}</td>
                      <td className="py-2 pr-4">{statusBadge(r.status)}</td>
                      <td className="py-2 pr-4 font-mono text-[#8a8aa0]">{r.stripe_subscription_id ?? "—"}</td>
                      <td className="py-2 pr-4 font-mono text-[#8a8aa0]">{r.stripe_customer_id ?? "—"}</td>
                      <td className="py-2 pr-4">{fmt(r.current_period_end)}</td>
                      <td className="py-2 pr-4">{fmt(r.created_at)}</td>
                      <td className="py-2">{fmt(r.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-[11px] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pageClamped <= 1}
                  className="border border-[#1a1a24] px-3 py-1.5 uppercase tracking-[0.2em] disabled:opacity-40"
                >
                  Anterior
                </button>
                <span>
                  Página {pageClamped} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={pageClamped >= totalPages}
                  className="border border-[#1a1a24] px-3 py-1.5 uppercase tracking-[0.2em] disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </AdminCard>
    </div>
  )
}
