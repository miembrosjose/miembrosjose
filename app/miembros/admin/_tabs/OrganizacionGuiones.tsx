"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  GUIONES · entregar, revisar, aprobar
// ═══════════════════════════════════════════════════════════════════════════
//
// ── LAS DOS PERSONAS QUE ABREN ESTA PANTALLA ───────────────────────────────
// Regi viene a escribir y a entregar. El dueño viene a UNA cosa: ver qué le
// están esperando y despacharlo. Son dos usos muy distintos del mismo sitio.
//
// Por eso lo primero que se ve es «En revisión»: para ella es lo que ya
// entregó y para él es su bandeja. Todo lo demás está detrás de un filtro.
//
// ── PEDIR CAMBIOS ES UNA SOLA ACCIÓN ───────────────────────────────────────
// Devolver el guion a desarrollo Y decir por qué van juntos, en la misma
// petición. Si fueran dos, la segunda podría fallar y el guion volvería sin
// ninguna observación — que es justo el caso que arruina el método.

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft, Check, Lightbulb, Loader2, MessageSquare, Plus, Send, Trash2, X,
} from "lucide-react"
import { inputCls, labelCls } from "./_shared"

type EstadoGuion = "idea" | "desarrollo" | "revision" | "aprobado" | "publicado"

type Comentario = { autor_id: string | null; autor: string; texto: string; fecha: string }

type Guion = {
  id: string
  titulo: string
  formato: "reel" | "carrusel" | "historias" | "transmision" | "otro"
  ambito: "publico" | "miembros"
  estado: EstadoGuion
  tema: string
  objetivo: string
  gancho: string
  guion: string
  idea_visual: string
  campana: string
  fecha_entrega: string | null
  fecha_publicacion: string | null
  responsable_id: string | null
  comentarios: Comentario[]
  updated_at: string
}

type Miembro = { id: string; nombre: string }

/**
 * El recorrido, en orden.
 *
 * Se dibuja como una tira para que se vea DÓNDE está un guion sin leer nada:
 * un estado suelto obliga a recordar qué viene antes y qué después.
 */
const RECORRIDO: Array<{ id: EstadoGuion; nombre: string; color: string }> = [
  { id: "idea", nombre: "Idea", color: "#8a8fa8" },
  { id: "desarrollo", nombre: "En desarrollo", color: "#c9a86b" },
  { id: "revision", nombre: "En revisión", color: "#8d6bc4" },
  { id: "aprobado", nombre: "Aprobado", color: "#7ec8a0" },
  { id: "publicado", nombre: "Publicado", color: "#5fa8d3" },
]

const FORMATOS: Record<Guion["formato"], string> = {
  reel: "Reel", carrusel: "Carrusel", historias: "Historias",
  transmision: "Transmisión", otro: "Otro",
}

function fechaCorta(iso: string | null): string {
  if (!iso) return "—"
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number)
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-419", {
    day: "numeric", month: "short", timeZone: "UTC",
  })
}

function cuando(iso: string): string {
  return new Date(iso).toLocaleString("es-419", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  })
}

export function OrganizacionGuiones({ equipo }: { equipo: Miembro[] }) {
  const [guiones, setGuiones] = useState<Guion[]>([])
  const [esPropietario, setEsPropietario] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<EstadoGuion | "todos">("revision")
  const [abierto, setAbierto] = useState<Guion | "nuevo" | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await fetch("/api/admin/marketing/guiones", { credentials: "include" })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudieron cargar")
      setGuiones(j.guiones || [])
      setEsPropietario(j.esPropietario === true)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar")
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { void cargar() }, [cargar])

  const porEstado = useMemo(() => {
    const m: Record<string, number> = {}
    for (const g of guiones) m[g.estado] = (m[g.estado] || 0) + 1
    return m
  }, [guiones])

  const visibles = filtro === "todos" ? guiones : guiones.filter((g) => g.estado === filtro)

  if (abierto) {
    return (
      <Ficha
        guion={abierto === "nuevo" ? null : abierto}
        equipo={equipo}
        esPropietario={esPropietario}
        onVolver={() => setAbierto(null)}
        onCambiado={() => { setAbierto(null); void cargar() }}
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* ── LA BANDEJA, LO PRIMERO ────────────────────────────────────────
          Para el dueño es la única pregunta que trae al abrir esto. */}
      {(porEstado.revision ?? 0) > 0 && (
        <div className="flex items-start gap-3 border border-[#3a2a5a] bg-[#1a1228]/60 p-4">
          <MessageSquare size={16} className="mt-0.5 shrink-0 text-[#c3b2e0]" />
          <p className="text-sm text-[#d7c9ee]">
            <strong>{porEstado.revision}</strong>{" "}
            {porEstado.revision === 1 ? "guion está esperando" : "guiones están esperando"} revisión.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {RECORRIDO.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setFiltro(e.id)}
              className={`border px-3 py-1.5 text-[11px] transition-colors ${
                filtro === e.id
                  ? "border-[#6D4A9B] bg-[#6D4A9B] font-medium text-white"
                  : "border-[#2a2a3a] text-[#8a8fa8] hover:border-[#4a4a60]"
              }`}
            >
              {e.nombre}
              {(porEstado[e.id] ?? 0) > 0 && (
                <span className="ml-1.5 opacity-60">{porEstado[e.id]}</span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className={`border px-3 py-1.5 text-[11px] transition-colors ${
              filtro === "todos"
                ? "border-[#6D4A9B] bg-[#6D4A9B] font-medium text-white"
                : "border-[#2a2a3a] text-[#8a8fa8] hover:border-[#4a4a60]"
            }`}
          >
            Todos
          </button>
        </div>

        <button
          type="button"
          onClick={() => setAbierto("nuevo")}
          className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30"
        >
          <Plus size={13} /> Nuevo
        </button>
      </div>

      {error && (
        <p className="border border-red-900 bg-red-950/20 p-3 text-xs text-red-300">{error}</p>
      )}

      {cargando ? (
        <div className="flex items-center gap-2 py-12 text-sm text-[#7a7a8a]">
          <Loader2 size={15} className="animate-spin" /> Cargando…
        </div>
      ) : visibles.length === 0 ? (
        <div className="border border-dashed border-[#1f1f2c] px-6 py-14 text-center">
          <Lightbulb size={26} className="mx-auto text-[#3a3a50]" />
          <p className="mt-4 text-sm text-[#8a8fa8]">
            {filtro === "idea"
              ? "El banco de ideas está vacío. Anota aquí lo que se te ocurra, aunque no esté escrito."
              : "Nada en este estado."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibles.map((g) => {
            const e = RECORRIDO.find((x) => x.id === g.estado)!
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setAbierto(g)}
                className="flex w-full items-start gap-3 border border-[#14141e] bg-[#0d0d16]/40 px-4 py-3 text-left transition-colors hover:border-[#2f2f42]"
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: e.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[#F3F6FA]">{g.titulo}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[#6a6a7a]">
                    <span style={{ color: e.color }}>{e.nombre}</span>
                    <span>·</span>
                    <span>{FORMATOS[g.formato]}</span>
                    <span>·</span>
                    <span>{g.ambito === "publico" ? "Público" : "Miembros"}</span>
                    {g.fecha_entrega && (
                      <>
                        <span>·</span>
                        <span>entrega {fechaCorta(g.fecha_entrega)}</span>
                      </>
                    )}
                    {g.comentarios.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        · <MessageSquare size={10} /> {g.comentarios.length}
                      </span>
                    )}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── LA FICHA ───────────────────────────────────────────────────────────────

function Ficha({ guion, equipo, esPropietario, onVolver, onCambiado }: {
  guion: Guion | null
  equipo: Miembro[]
  esPropietario: boolean
  onVolver: () => void
  onCambiado: () => void
}) {
  const [f, setF] = useState<Partial<Guion>>(
    guion ?? {
      titulo: "", formato: "reel", ambito: "publico", estado: "idea",
      tema: "", objetivo: "", gancho: "", guion: "", idea_visual: "", campana: "",
    },
  )
  const [comentario, setComentario] = useState("")
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (cambios: Partial<Guion> & { comentario?: string }) => {
    setOcupado(true); setError(null)
    try {
      const nuevo = !guion
      const r = await fetch(
        nuevo ? "/api/admin/marketing/guiones" : `/api/admin/marketing/guiones/${guion.id}`,
        {
          method: nuevo ? "POST" : "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cambios),
        },
      )
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo guardar")
      onCambiado()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar")
      setOcupado(false)
    }
  }

  const borrar = async () => {
    if (!guion) return
    if (!window.confirm(`¿Borrar «${guion.titulo}»? No se puede deshacer.`)) return
    setOcupado(true)
    try {
      const r = await fetch(`/api/admin/marketing/guiones/${guion.id}`, {
        method: "DELETE", credentials: "include",
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo borrar")
      onCambiado()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar")
      setOcupado(false)
    }
  }

  const campo = (k: keyof Guion) => ({
    value: (f[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value }),
    className: inputCls,
  })

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#7a7a8a] transition-colors hover:text-[#F3F6FA]"
      >
        <ArrowLeft size={14} /> Guiones
      </button>

      {/* ── DÓNDE ESTÁ, DE UN VISTAZO ─────────────────────────────────── */}
      {guion && (
        <div className="flex flex-wrap items-center gap-1">
          {RECORRIDO.map((e, i) => {
            const actual = RECORRIDO.findIndex((x) => x.id === f.estado)
            const pasado = i <= actual
            return (
              <span key={e.id} className="flex items-center gap-1">
                <span
                  className="border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em]"
                  style={{
                    borderColor: pasado ? e.color : "#2a2a3a",
                    color: pasado ? e.color : "#4a4a5a",
                  }}
                >
                  {e.nombre}
                </span>
                {i < RECORRIDO.length - 1 && <span className="text-[#2a2a3a]">→</span>}
              </span>
            )
          })}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:items-start">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Título</label>
            <input type="text" placeholder="El silencio antes del contacto" {...campo("titulo")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Formato</label>
              <select
                value={f.formato}
                onChange={(e) => setF({ ...f, formato: e.target.value as Guion["formato"] })}
                className={inputCls}
              >
                {(Object.keys(FORMATOS) as Guion["formato"][]).map((k) => (
                  <option key={k} value={k}>{FORMATOS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Dónde va</label>
              <select
                value={f.ambito}
                onChange={(e) => setF({ ...f, ambito: e.target.value as Guion["ambito"] })}
                className={inputCls}
              >
                <option value="publico">Público · redes</option>
                <option value="miembros">Área de miembros</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Tema o motivo</label>
            <textarea rows={2} placeholder="Luna llena de noviembre" {...campo("tema")} />
          </div>

          <div>
            <label className={labelCls}>Objetivo</label>
            <textarea rows={2} placeholder="Qué queremos que sienta o entienda quien lo ve" {...campo("objetivo")} />
          </div>

          <div>
            <label className={labelCls}>Gancho</label>
            <textarea rows={2} placeholder="Los primeros tres segundos" {...campo("gancho")} />
            <p className="mt-1.5 text-[11px] text-[#6a6a7a]">
              Es lo único que decide si alguien se queda. Va aparte del guion a propósito.
            </p>
          </div>

          <div>
            <label className={labelCls}>Guion</label>
            <textarea rows={14} placeholder="El texto completo, o la escaleta con los puntos principales." {...campo("guion")} />
          </div>

          <div>
            <label className={labelCls}>Idea visual</label>
            <textarea rows={3} placeholder="Qué se ve mientras se oye" {...campo("idea_visual")} />
          </div>
        </div>

        {/* ── LA COLUMNA DE LA DERECHA ──────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <div className="space-y-4 border border-[#1a1a24] bg-[#0d0d16]/40 p-4">
            <div>
              <label className={labelCls}>Responsable</label>
              <select
                value={f.responsable_id ?? ""}
                onChange={(e) => setF({ ...f, responsable_id: e.target.value || null })}
                className={inputCls}
              >
                <option value="">Sin asignar</option>
                {equipo.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Entrega</label>
              <input
                type="date"
                value={f.fecha_entrega ?? ""}
                onChange={(e) => setF({ ...f, fecha_entrega: e.target.value || null })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Publicación prevista</label>
              <input
                type="date"
                value={f.fecha_publicacion ?? ""}
                onChange={(e) => setF({ ...f, fecha_publicacion: e.target.value || null })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tema del mes</label>
              <input type="text" placeholder="El contacto extraterrestre" {...campo("campana")} />
            </div>
          </div>

          {/* ── LAS ACCIONES, SEGÚN QUIÉN MIRA ─────────────────────────── */}
          <div className="space-y-2 border border-[#1a1a24] bg-[#0d0d16]/40 p-4">
            <button
              type="button"
              onClick={() => enviar(f)}
              disabled={ocupado}
              className="inline-flex w-full items-center justify-center gap-2 border border-[#2f2f42] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#a0a0b0] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0] disabled:opacity-50"
            >
              {ocupado ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Guardar
            </button>

            {guion && f.estado !== "revision" && f.estado !== "aprobado" && (
              <button
                type="button"
                onClick={() => enviar({ ...f, estado: "revision" })}
                disabled={ocupado}
                className="inline-flex w-full items-center justify-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/20 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/35 disabled:opacity-50"
              >
                <Send size={13} /> Entregar para revisión
              </button>
            )}

            {/* Solo el dueño. El servidor lo vuelve a comprobar: esconder el
                botón es comodidad, no seguridad. */}
            {guion && esPropietario && f.estado === "revision" && (
              <>
                <button
                  type="button"
                  onClick={() => enviar({ ...f, estado: "aprobado" })}
                  disabled={ocupado}
                  className="inline-flex w-full items-center justify-center gap-2 border border-emerald-700 bg-emerald-900/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-300 transition-colors hover:bg-emerald-900/50 disabled:opacity-50"
                >
                  <Check size={13} /> Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!comentario.trim()) {
                      setError("Escribe qué hay que cambiar antes de devolverlo.")
                      return
                    }
                    void enviar({ ...f, estado: "desarrollo", comentario })
                  }}
                  disabled={ocupado}
                  className="inline-flex w-full items-center justify-center gap-2 border border-[#3a2a1a] bg-[#1a1208]/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#e6cf95] transition-colors hover:bg-[#1a1208] disabled:opacity-50"
                >
                  <X size={13} /> Pedir cambios
                </button>
              </>
            )}

            {guion && esPropietario && f.estado === "aprobado" && (
              <button
                type="button"
                onClick={() => enviar({ ...f, estado: "publicado" })}
                disabled={ocupado}
                className="inline-flex w-full items-center justify-center gap-2 border border-[#2f4a5a] bg-[#0f2230]/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9fd3e8] transition-colors disabled:opacity-50"
              >
                <Check size={13} /> Dar por publicado
              </button>
            )}

            {guion && esPropietario && !["aprobado", "publicado"].includes(String(f.estado)) && (
              <button
                type="button"
                onClick={borrar}
                disabled={ocupado}
                className="inline-flex w-full items-center justify-center gap-1.5 py-2 text-[11px] text-[#7a7a8a] transition-colors hover:text-red-400 disabled:opacity-50"
              >
                <Trash2 size={12} /> Borrar
              </button>
            )}
          </div>

          {/* ── LA CONVERSACIÓN ────────────────────────────────────────── */}
          {guion && (
            <div className="border border-[#1a1a24] bg-[#0d0d16]/40 p-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
                Observaciones
              </h4>

              {guion.comentarios.length === 0 ? (
                <p className="mt-3 text-[11px] text-[#6a6a7a]">Todavía no hay ninguna.</p>
              ) : (
                <div className="mt-3 max-h-64 space-y-3 overflow-y-auto">
                  {guion.comentarios.map((c, i) => (
                    <div key={i} className="border-l-2 border-[#2f2f42] pl-3">
                      <p className="text-[10px] text-[#6a6a7a]">
                        {c.autor} · {cuando(c.fecha)}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-[#c8c8dc]">
                        {c.texto}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Qué cambiarías…"
                className={`${inputCls} mt-3 resize-y`}
              />
              <button
                type="button"
                onClick={() => {
                  if (!comentario.trim()) return
                  void enviar({ comentario })
                }}
                disabled={ocupado || !comentario.trim()}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 border border-[#2f2f42] px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-[#a0a0b0] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0] disabled:opacity-40"
              >
                <MessageSquare size={12} /> Añadir observación
              </button>
              <p className="mt-2 text-[11px] leading-relaxed text-[#6a6a7a]">
                «Pedir cambios» devuelve el guion y deja la observación en el mismo gesto.
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="border border-red-900 bg-red-950/20 p-3 text-xs text-red-300">{error}</p>
      )}
    </div>
  )
}
