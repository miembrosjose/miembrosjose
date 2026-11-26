"use client"

import { useEffect, useMemo, useState } from "react"
import { inputCls, FilterBtn, AdminCard, StatCard, AdminBadge, AdminEmptyState } from "./_shared"
import { tipoDeAcceso, estaEnPrueba } from "@/lib/admin/tipo-acceso"

type Row = {
  /** Lo que identifica la fila. El correo no sirve: alguna no es un correo. */
  id: string
  email: string
  status: string
  subscription_status: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  created_at: string | null
  updated_at: string | null
  /** 'regalo' | 'pago', o null cuando la migración aún no está aplicada. */
  tipo_acceso: string | null
  codigo_promocional: string | null
  primer_pago: number | null
  pago_real_at: string | null
}

type Summary = {
  total: number
  active: number
  past_due: number
  canceled: number
  pending: number
  /** Activos que entraron con código y todavía no han pagado nada. */
  activosDeRegalo: number
  /** Activos que pagan. Es la base del MRR. */
  activosDePago: number
  /** Activos en los tres días de prueba de los invitados. */
  activosEnPrueba: number
  /** Todas las filas de regalo, en cualquier estado. */
  regaloTotal: number
  /** Todas las filas de invitados, en cualquier estado. */
  pruebaTotal: number
  /** ¿Están ya las columnas en la base de datos? */
  regaloDisponible: boolean
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

/** Un mes del corte: cuánta gente entró y cuánta se fue. */
type Mes = {
  clave: string
  altas: number
  bajas: number
  neto: number
}

const STATUS_FILTERS = ["todos", "active", "past_due", "canceled", "pending"] as const
const ACCESO_FILTERS = ["todos", "pago", "regalo", "prueba"] as const
const PAGE_SIZE = 25

function fmt(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es", { year: "numeric", month: "short", day: "numeric" })
}

/** Un día y un mes, para la segunda línea de la columna de acceso. */
function fmtCorto(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es", { month: "short", day: "numeric" })
}

/** "2026-11" → "nov 2026" */
function nombreDeMes(clave: string): string {
  const [a, m] = clave.split("-")
  const d = new Date(Date.UTC(Number(a), Number(m) - 1, 1))
  if (Number.isNaN(d.getTime())) return clave
  return d.toLocaleDateString("es", { month: "short", year: "numeric", timeZone: "UTC" })
}

function statusBadge(r: Row) {
  // Stripe manda «trialing» durante los tres días. Dejarlo en inglés en la
  // columna obligaría a traducirlo de cabeza cada vez que se mira.
  if (estaEnPrueba(r)) return <AdminBadge variant="info">En prueba</AdminBadge>

  const status = r.status
  if (status === "active") return <AdminBadge variant="success">Activo</AdminBadge>
  if (status === "past_due") return <AdminBadge variant="warning">Pago pendiente</AdminBadge>
  if (status === "canceled") return <AdminBadge variant="error">Cancelado</AdminBadge>
  return <AdminBadge variant="neutral">Pendiente</AdminBadge>
}

/**
 * Cómo entró esta persona.
 *
 * Tres estados, no dos: regalo, pago y «no se sabe» —que es lo que hay
 * mientras la migración no esté aplicada—. Un guion es más honesto que
 * marcar «Pago» a todo el mundo por omisión.
 *
 * Cuando el regalo ya se convirtió en un cobro de verdad, la etiqueta pasa a
 * «Pago» y debajo queda la fecha en que ocurrió: así se ve de un vistazo
 * quién se quedó después del mes gratis.
 */
function accesoCelda(r: Row) {
  const tipo = tipoDeAcceso(r)
  if (tipo === null) return <span className="text-[#6a6a7a]">—</span>

  // ── Invitado en sus tres días ───────────────────────────────────────────
  if (tipo === "prueba") {
    return (
      <div className="space-y-1">
        <AdminBadge variant="info">Prueba 3 días</AdminBadge>
        {r.current_period_end && (
          <p className="text-[10px] text-[#6a6a7a]">hasta el {fmtCorto(r.current_period_end)}</p>
        )}
      </div>
    )
  }

  // ── Primer mes de regalo de los encuentros ──────────────────────────────
  if (tipo === "regalo") {
    return (
      <div className="space-y-1">
        <AdminBadge variant="warning">Regalo</AdminBadge>
        {r.codigo_promocional && (
          <p className="font-mono text-[10px] text-[#a78bca]">{r.codigo_promocional}</p>
        )}
      </div>
    )
  }

  // ── Paga ────────────────────────────────────────────────────────────────
  // Si venía de una prueba o de un regalo, la fecha del primer cobro es el
  // dato que interesa: dice que aquello se convirtió.
  return (
    <div className="space-y-1">
      <AdminBadge variant="neutral">Pago</AdminBadge>
      {r.pago_real_at && (
        <p className="text-[10px] text-[#6a6a7a]">pagó el {fmtCorto(r.pago_real_at)}</p>
      )}
    </div>
  )
}

export function Subscriptions() {
  const [rows, setRows] = useState<Row[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [sync, setSync] = useState<Sync | null>(null)
  const [meses, setMeses] = useState<Mes[]>([])
  const [loading, setLoading] = useState(true)
  // Qué fila se está cancelando o borrando ahora mismo.
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("todos")
  const [accesoFilter, setAccesoFilter] = useState<(typeof ACCESO_FILTERS)[number]>("todos")
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
        setMeses(Array.isArray(data.meses) ? data.meses : [])
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

  /** Vuelve a pedir los datos después de tocar una fila. */
  async function recargar() {
    const res = await fetch("/api/admin/subscriptions", { credentials: "include", cache: "no-store" })
    if (!res.ok) return
    const data = await res.json()
    setRows(Array.isArray(data.rows) ? data.rows : [])
    setSummary(data.summary ?? null)
    setSync(data.sync ?? null)
    setMeses(Array.isArray(data.meses) ? data.meses : [])
  }

  /**
   * Cancelar o borrar una fila.
   *
   * Se pregunta antes, con el correo escrito en la pregunta: estas dos
   * acciones se parecen demasiado entre sí y las filas de la tabla son
   * todas iguales. Equivocarse de línea es fácil.
   */
  async function accionarFila(fila: Row, accion: "cancelar" | "borrar") {
    const email = fila.email
    const pregunta =
      accion === "borrar"
        ? `Borrar la fila de ${email}? Desaparece de esta tabla. No cancela nada en Stripe ni borra su cuenta de acceso.`
        : `Marcar ${email} como cancelado? Pierde el acceso. No cancela el cobro en Stripe.`
    if (!window.confirm(pregunta)) return

    setOcupada(fila.id)
    try {
      const res = await fetch("/api/admin/subscriptions/fila", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: fila.id, email, accion }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await recargar()
      window.alert(data.mensaje || "Hecho.")
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo.")
    } finally {
      setOcupada(null)
    }
  }

  /**
   * Los dos botones de cada fila.
   *
   * «Borrar» no se esconde cuando es peligroso: se deja, y el servidor es
   * quien se niega y explica por qué. Un botón que desaparece sin decir
   * nada deja a quien lo busca pensando que la pantalla está rota.
   */
  function acciones(r: Row) {
    const trabajando = ocupada === r.id
    return (
      <div className="flex items-center gap-2">
        {r.status !== "canceled" && (
          <button
            type="button"
            disabled={trabajando}
            onClick={() => accionarFila(r, "cancelar")}
            className="border border-amber-700/50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-400 transition-colors hover:bg-amber-900/20 disabled:opacity-40 [font-family:var(--font-geist-sans)]"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          disabled={trabajando}
          onClick={() => accionarFila(r, "borrar")}
          className="border border-red-700/50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-40 [font-family:var(--font-geist-sans)]"
        >
          {trabajando ? "…" : "Borrar"}
        </button>
      </div>
    )
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== "todos" && r.status !== statusFilter) return false
      if (accesoFilter !== "todos") {
        // Sin migración no hay dato: con el filtro puesto no se finge que
        // todos pagan, simplemente no coinciden.
        if (tipoDeAcceso(r) !== accesoFilter) return false
      }
      if (q && !r.email.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, search, statusFilter, accesoFilter])

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
      "tipo_acceso",
      "codigo_promocional",
      "primer_pago",
      "pago_real_at",
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
          r.tipo_acceso,
          r.codigo_promocional,
          r.primer_pago != null ? String(r.primer_pago) : null,
          r.pago_real_at,
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

  // ¿Se puede distinguir regalo de pago? Solo si la migración está aplicada.
  const regalo = summary?.regaloDisponible === true

  return (
    <div className="space-y-6">
      {/* ── Métricas ─────────────────────────────────────────── */}
      {/* Los de regalo tienen su propia tarjeta, no un paréntesis dentro de
          «Activos». Son miembros con el mismo acceso, pero son los únicos
          números que todavía no se traducen en dinero, y eso se decide
          mirando esta fila. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <StatCard label="Total" value={summary?.total ?? 0} />
        <StatCard
          label="Activos"
          value={summary?.active ?? 0}
          variant="green"
          trend={
            regalo
              ? `${summary?.activosDePago ?? 0} pagan · ${summary?.activosDeRegalo ?? 0} de regalo · ${summary?.activosEnPrueba ?? 0} en prueba`
              : undefined
          }
        />
        <StatCard
          label="Primer mes de regalo"
          value={regalo ? (summary?.activosDeRegalo ?? 0) : "—"}
          variant="gold"
          trend={regalo ? `${summary?.regaloTotal ?? 0} en total` : "sin migrar"}
        />
        {/* Los invitados tienen su propia tarjeta, separada del regalo de
            los encuentros: son dos campañas distintas y se miden aparte. */}
        <StatCard
          label="Prueba de 3 días"
          value={regalo ? (summary?.activosEnPrueba ?? 0) : "—"}
          variant="gold"
          trend={regalo ? `${summary?.pruebaTotal ?? 0} invitados en total` : "sin migrar"}
        />
        <StatCard label="Pago pendiente" value={summary?.past_due ?? 0} variant="red" />
        <StatCard label="Cancelados" value={summary?.canceled ?? 0} />
        <StatCard label="MRR estimado" value={mrr} variant="gold" trend="activos que pagan × precio" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
        MRR es una estimación bruta (activos QUE PAGAN × precio); no incluye comisiones ni impuestos ni a
        quien está en su primer mes de regalo. Métricas de embudo (registros/pagos/conversión) viven en el
        proyecto del embudo.
      </p>
      {!regalo && (
        <p className="border border-amber-700/40 bg-amber-900/10 px-3 py-2 text-[11px] text-amber-300/90 [font-family:var(--font-geist-sans)]">
          Las columnas del acceso de regalo todavía no están en la base de datos, así que no se puede
          distinguir quién entró con código. Nadie pierde acceso por esto y el resto del panel funciona
          igual. Se arregla corriendo <span className="font-mono">docs/sql/acceso_regalo_01_columnas.sql</span>.
        </p>
      )}

      {/* ── Corte mensual ────────────────────────────────────── */}
      <AdminCard
        title="Mes a mes"
        description="Quién entró y quién se fue, los últimos 12 meses."
      >
        {meses.length === 0 ? (
          <AdminEmptyState title="Todavía no hay meses que comparar" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs [font-family:var(--font-geist-sans)]">
                <thead>
                  <tr className="text-[9px] uppercase tracking-[0.2em] text-[#6a6a7a]">
                    <th className="py-2 pr-4">Mes</th>
                    <th className="py-2 pr-4 text-right">Altas</th>
                    <th className="py-2 pr-4 text-right">Bajas</th>
                    <th className="py-2 text-right">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {meses.map((m) => (
                    <tr key={m.clave} className="border-t border-[#1a1a24] text-[#c3c3d4]">
                      <td className="py-2 pr-4 text-[#F3F6FA]">{nombreDeMes(m.clave)}</td>
                      <td className="py-2 pr-4 text-right text-emerald-400">
                        {m.altas > 0 ? `+${m.altas}` : "0"}
                      </td>
                      <td className="py-2 pr-4 text-right text-red-400">
                        {m.bajas > 0 ? `-${m.bajas}` : "0"}
                      </td>
                      {/* El neto es la única columna que se lee de un
                          vistazo: si está en rojo, ese mes se fue más
                          gente de la que entró. */}
                      <td
                        className={`py-2 text-right font-semibold ${
                          m.neto > 0 ? "text-emerald-300" : m.neto < 0 ? "text-red-300" : "text-[#6a6a7a]"
                        }`}
                      >
                        {m.neto > 0 ? `+${m.neto}` : m.neto}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Decir de dónde sale cada número, porque los dos no salen
                del mismo sitio y eso cambia cómo se lee la tabla. */}
            <p className="mt-3 text-[10px] leading-relaxed text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              Las altas son la fecha en que cada persona apareció por primera vez. Las bajas son
              eventos de cancelación recibidos del embudo: en los meses anteriores a que existiera esa
              sincronización salen a cero aunque las hubiera.
            </p>
          </>
        )}
      </AdminCard>

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
          {/* Cómo entró. Solo tiene sentido si hay dato que filtrar. */}
          {regalo && (
            <div className="flex flex-wrap gap-2 border-l border-[#1a1a24] pl-3">
              {ACCESO_FILTERS.map((f) => (
                <FilterBtn
                  key={f}
                  active={accesoFilter === f}
                  onClick={() => {
                    setAccesoFilter(f)
                    setPage(1)
                  }}
                  variant="gold"
                >
                  {f === "todos"
                    ? "Todo acceso"
                    : f === "pago"
                      ? "Pagan"
                      : f === "regalo"
                        ? "De regalo"
                        : "En prueba"}
                </FilterBtn>
              ))}
            </div>
          )}
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
              <table className="w-full min-w-[960px] text-left text-xs [font-family:var(--font-geist-sans)]">
                <thead>
                  <tr className="text-[9px] uppercase tracking-[0.2em] text-[#6a6a7a]">
                    <th className="py-2 pr-4">Correo</th>
                    {/* ── POR QUÉ LAS ACCIONES VAN LAS SEGUNDAS ──────────
                        Estaban al final, que es donde se ponen siempre. El
                        problema es que esta tabla es más ancha que el panel
                        y se desplaza en horizontal: los botones quedaban
                        fuera de la pantalla y nadie los encontraba. Aquí se
                        ven sin mover nada. */}
                    <th className="py-2 pr-4">Acciones</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">Acceso</th>
                    <th className="py-2 pr-4">Stripe (sub)</th>
                    <th className="py-2 pr-4">Stripe (cliente)</th>
                    <th className="py-2 pr-4">Fin de periodo</th>
                    <th className="py-2 pr-4">Creado</th>
                    <th className="py-2">Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id} className="border-t border-[#1a1a24] text-[#c3c3d4]">
                      <td className="py-2 pr-4 text-[#F3F6FA]">{r.email}</td>
                      <td className="py-2 pr-4">{acciones(r)}</td>
                      <td className="py-2 pr-4">{statusBadge(r)}</td>
                      <td className="py-2 pr-4">{accesoCelda(r)}</td>
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
