"use client"

// CENTRO DE COMUNICACIONES — el panel.
//
// ── EL CAMINO, Y POR QUÉ TIENE ESE ORDEN ───────────────────────────────────
//   borrador → vista previa → prueba → audiencia → resumen → confirmar
//
// Cada paso existe para responder una pregunta distinta, y ninguno se puede
// saltar sin dejar una sin responder:
//
//   vista previa  ¿se ve como quiero?
//   prueba        ¿llega bien de verdad, en Gmail y en el móvil?
//   audiencia     ¿a cuánta gente, y quién se queda fuera?
//   resumen       ¿es esto lo que voy a hacer?
//
// No hay ningún botón que mande mil correos de un clic. El de enviar abre el
// resumen; el que envía está dentro, después de leerlo.
//
// ── LO QUE ESTA PANTALLA NO DECIDE ─────────────────────────────────────────
// Nada. Puede enseñar un botón apagado, pero quien decide si algo se puede
// enviar es el servidor, que revalida lo mismo. Esta pantalla es para que sea
// cómodo hacerlo bien, no para impedir hacerlo mal.

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle, Archive, ArrowLeft, Calendar, Check, Clock, Copy, ImagePlus,
  Bold, Heading2, Italic, Link2, List, Loader2, Mail, Minus, Monitor,
  MoreVertical, Plus, Quote, Search, Send, Smartphone, Sparkles, Trash2,
  Undo2, Users, X,
} from "lucide-react"
import { inputCls, labelCls } from "./_shared"

// ── Vocabulario, duplicado a propósito ─────────────────────────────────────
// El servidor tiene el suyo en lib/comunicaciones/tipos.ts. Importarlo aquí
// arrastraría al navegador el módulo entero y sus dependencias de servidor.
// Son seis líneas y un puñado de etiquetas; el servidor sigue siendo quien
// valida, así que una divergencia aquí se vería fea pero no dejaría pasar nada.
const TIPOS = [
  { id: "contenido", nombre: "Nuevo contenido", desc: "Un episodio, un módulo, una transmisión o una temporada.", fecha: false },
  { id: "sesion", nombre: "Sesión en vivo", desc: "Un encuentro en directo con fecha y hora.", fecha: true },
  { id: "activacion", nombre: "Activación", desc: "Una práctica con momento señalado.", fecha: true },
  { id: "encuentro", nombre: "Encuentro", desc: "Un encuentro de La Red.", fecha: true },
  { id: "novedades", nombre: "Novedades de La Red", desc: "Lo que está ocurriendo en la comunidad.", fecha: false },
  { id: "especial", nombre: "Comunicación especial", desc: "Un mensaje que no encaja en los demás.", fecha: false },
] as const

const ESTADOS: Record<string, { etiqueta: string; cls: string }> = {
  draft: { etiqueta: "Borrador", cls: "border-[#2a2a3a] text-[#9a9ab0]" },
  scheduled: { etiqueta: "Programada", cls: "border-[#6D4A9B] text-[#a78bca]" },
  queued: { etiqueta: "En cola", cls: "border-[#6D4A9B] text-[#a78bca]" },
  sending: { etiqueta: "Enviando", cls: "border-[#6D4A9B] text-[#a78bca]" },
  sent: { etiqueta: "Enviada", cls: "border-emerald-700 text-emerald-400" },
  cancelled: { etiqueta: "Cancelada", cls: "border-[#2a2a3a] text-[#7a7a8a]" },
  failed: { etiqueta: "Falló", cls: "border-red-800 text-red-400" },
}

const ZONAS = [
  { id: "America/Mexico_City", etiqueta: "México (Ciudad de México)" },
  { id: "America/Bogota", etiqueta: "Colombia · Ecuador (Bogotá)" },
  { id: "America/Lima", etiqueta: "Perú (Lima)" },
  { id: "America/Santiago", etiqueta: "Chile (Santiago)" },
  { id: "America/Argentina/Buenos_Aires", etiqueta: "Argentina (Buenos Aires)" },
  { id: "America/Caracas", etiqueta: "Venezuela (Caracas)" },
  { id: "America/Guatemala", etiqueta: "Guatemala · El Salvador" },
  { id: "America/Santo_Domingo", etiqueta: "República Dominicana" },
  { id: "America/New_York", etiqueta: "Estados Unidos (Este)" },
  { id: "America/Los_Angeles", etiqueta: "Estados Unidos (Pacífico)" },
  { id: "Europe/Madrid", etiqueta: "España (Madrid)" },
  { id: "UTC", etiqueta: "UTC" },
]

type Audiencia = {
  kind: "todos"
  temporadaMin?: number | null
  temporadaCompletada?: number | null
  roles?: string[] | null
  insignias?: string[] | null
}

/** Lo que el servidor dice que se puede ofrecer. Nunca una copia a mano. */
type Filtros = {
  temporadas: number[]
  roles: Array<{ id: string; etiqueta: string }>
  insignias: Array<{ grupo: string; items: Array<{ id: string; etiqueta: string }> }>
  total_insignias: number
}

const ROLES = [
  { id: "organizador", etiqueta: "Organizador" },
  { id: "facilitador", etiqueta: "Facilitador" },
  { id: "embajador", etiqueta: "Embajador Galáctico" },
  { id: "colaborador", etiqueta: "Colaborador" },
  { id: "cartografo", etiqueta: "Cartógrafo" },
  { id: "guardian", etiqueta: "Guardián de La Red" },
  { id: "instructor", etiqueta: "Instructor" },
]

type Fila = {
  id: string
  type: string
  internal_title: string
  subject: string
  status: string
  scheduled_at: string | null
  scheduled_timezone: string | null
  recipients_estimated: number | null
  sent_at: string | null
  metrics: Record<string, number> | null
  created_at: string
  audience: Audiencia
}

type Comunicacion = Fila & {
  preheader: string
  eyebrow: string
  heading: string
  body: string
  image_url: string | null
  cta_text: string | null
  cta_url: string | null
  event_title: string | null
  event_at: string | null
  event_timezone: string | null
  event_location: string | null
  provider_error: string | null
  recipients_excluded: number | null
}

type Hallazgo = { campo: string; nivel: "error" | "aviso"; mensaje: string }
type Veredicto = { puedeEnviar: boolean; errores: Hallazgo[]; avisos: Hallazgo[] }

type ResumenAudiencia = {
  etiqueta: string
  total: number
  destinatarios: number
  excluidos: number
  motivos: Array<{ motivo: string; etiqueta: string; cuantos: number }>
  preferenciaEtiqueta: string
}

// ═══════════════════════════════════════════════════════════════════════════

export function Comunicaciones() {
  const [abierta, setAbierta] = useState<string | null>(null)
  return abierta
    ? <Editor id={abierta} onVolver={() => setAbierta(null)} />
    : <Lista onAbrir={setAbierta} />
}

// ── La lista ───────────────────────────────────────────────────────────────

function Lista({ onAbrir }: { onAbrir: (id: string) => void }) {
  const [pestana, setPestana] = useState<"borradores" | "programadas" | "enviadas" | "archivadas">("borradores")
  const [busca, setBusca] = useState("")
  const [filas, setFilas] = useState<Fila[]>([])
  const [conteos, setConteos] = useState<Record<string, number>>({})
  const [cargando, setCargando] = useState(true)
  const [eligiendoTipo, setEligiendoTipo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await fetch(`/api/admin/comunicaciones?estado=${pestana}`, { credentials: "include" })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo cargar")
      setFilas(j.comunicaciones || [])
      setConteos(j.conteos || {})
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar")
    } finally {
      setCargando(false)
    }
  }, [pestana])

  useEffect(() => { void cargar() }, [cargar])

  const q = busca.trim().toLowerCase()
  const filtradas = q
    ? filas.filter((f) =>
        (f.subject || "").toLowerCase().includes(q) ||
        (f.internal_title || "").toLowerCase().includes(q))
    : filas

  const crear = async (tipo: string) => {
    try {
      const r = await fetch("/api/admin/comunicaciones", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tipo }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo crear")
      setEligiendoTipo(false)
      onAbrir(j.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear")
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#F3F6FA] [font-family:var(--font-cinzel,serif)]">
            Comunicaciones
          </h2>
          <p className="mt-1 max-w-lg text-sm text-[#8a8fa8]">
            Mantén informada a La Red sobre lo que está ocurriendo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEligiendoTipo(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30"
        >
          <Plus size={14} /> Nueva comunicación
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["borradores", "programadas", "enviadas", "archivadas"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPestana(p)}
            className={`border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${
              pestana === p
                ? "border-[#6D4A9B] bg-[#6D4A9B]/10 text-[#c3b2e0]"
                : "border-[#1f1f2c] text-[#7a7a8a] hover:border-[#2f2f42]"
            }`}
          >
            {p} {conteos[p] != null && <span className="opacity-60">{conteos[p]}</span>}
          </button>
        ))}
      </div>

      {/* Buscar por lo que uno recuerda: el asunto, o el nombre interno. Se
          filtra sobre lo ya cargado —son cien filas como mucho— en vez de
          pedirle al servidor en cada tecla. */}
      {filas.length > 6 && (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a6a]" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por asunto o título interno…"
            className={`${inputCls} pl-9`}
          />
        </div>
      )}

      {error && <Aviso tono="mal">{error}</Aviso>}

      {cargando ? (
        <div className="flex items-center gap-2 py-12 text-sm text-[#7a7a8a]">
          <Loader2 size={15} className="animate-spin" /> Cargando…
        </div>
      ) : filas.length === 0 ? (
        <Vacio pestana={pestana} onCrear={() => setEligiendoTipo(true)} />
      ) : (
        <div className="space-y-2">
          {filtradas.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6a6a7a]">
              Nada coincide con «{busca}».
            </p>
          ) : (
            filtradas.map((f) => (
              <FilaComunicacion key={f.id} f={f} onAbrir={onAbrir} onCambio={cargar} />
            ))
          )}
        </div>
      )}

      {eligiendoTipo && <ElegirTipo onElegir={crear} onCerrar={() => setEligiendoTipo(false)} />}
    </div>
  )
}

function FilaComunicacion({ f, onAbrir, onCambio }: {
  f: Fila
  onAbrir: (id: string) => void
  onCambio: () => void
}) {
  const est = ESTADOS[f.status] ?? ESTADOS.draft
  const tipo = TIPOS.find((t) => t.id === f.type)

  return (
    // Una fila, no un botón gigante: dentro hay otro botón —el menú— y anidar
    // botones no es válido ni se comporta bien con el teclado.
    <div className="flex flex-col gap-3 border border-[#1a1a24] bg-[#0d0d16]/60 p-4 transition-colors hover:border-[#2f2f42] sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={() => onAbrir(f.id)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] ${est.cls}`}>
            {est.etiqueta}
          </span>
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#6a6a7a]">
            {tipo?.nombre ?? f.type}
          </span>
        </div>
        <p className="mt-2 truncate text-[15px] font-medium text-[#F3F6FA]">
          {f.subject?.trim() || f.internal_title || "Sin asunto"}
        </p>
        <p className="mt-1 text-xs text-[#6a6a7a]">
          {f.status === "sent" && f.sent_at
            ? `Enviada el ${fechaCorta(f.sent_at)}`
            : f.status === "scheduled" && f.scheduled_at
              ? `Programada para el ${fechaCorta(f.scheduled_at, f.scheduled_timezone)}`
              : `Creada el ${fechaCorta(f.created_at)}`}
        </p>
      </button>

      <div className="flex shrink-0 items-center gap-5">
        {f.recipients_estimated != null && (
          <Cifra valor={f.recipients_estimated} etiqueta="destinatarios" />
        )}
        {f.status === "sent" && f.metrics?.aperturas != null && (
          <Cifra valor={f.metrics.aperturas} etiqueta="aperturas" />
        )}
        <MenuFila f={f} onCambio={onCambio} />
      </div>
    </div>
  )
}

/**
 * Las acciones de una fila, detrás de tres puntos.
 *
 * ── POR QUÉ UN MENÚ Y NO BOTONES ──────────────────────────────────────────
 * Son hasta cuatro acciones por fila y siete filas en pantalla. Veintiocho
 * botones visibles convierten una lista en un panel de mandos, y lo que uno
 * quiere hacer casi siempre es ABRIR la comunicación — que es lo que hace el
 * clic en la fila. El menú es para lo demás.
 *
 * Y lo demás importa: sin esto, para borrar un borrador había que entrar en
 * él, bajar hasta el final y volver. Nueve borradores de prueba se apilan en
 * una tarde.
 */
function MenuFila({ f, onCambio }: { f: Fila; onCambio: () => void }) {
  const [abierto, setAbierto] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const caja = useRef<HTMLDivElement | null>(null)

  // Se cierra al tocar fuera o al pulsar Escape. Un menú que solo se cierra
  // con su propio botón es un menú que se queda abierto.
  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false)
    }
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false) }
    document.addEventListener("mousedown", fuera)
    window.addEventListener("keydown", tecla)
    return () => {
      document.removeEventListener("mousedown", fuera)
      window.removeEventListener("keydown", tecla)
    }
  }, [abierto])

  const llamar = async (url: string, opciones?: RequestInit, confirmar?: string) => {
    if (confirmar && !window.confirm(confirmar)) return
    setOcupado(true)
    try {
      const r = await fetch(url, { credentials: "include", ...opciones })
      if (!r.ok) {
        const j = await r.json().catch(() => null)
        window.alert(j?.error || "No se pudo completar la acción")
        return
      }
      setAbierto(false)
      onCambio()
    } finally { setOcupado(false) }
  }

  const base = `/api/admin/comunicaciones/${f.id}`
  const esBorrador = f.status === "draft" || f.status === "failed"
  const acabada = ["sent", "cancelled", "failed"].includes(f.status)

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Más acciones"
        aria-expanded={abierto}
        disabled={ocupado}
        className="border border-transparent p-2 text-[#5a5a6a] transition-colors hover:border-[#2f2f42] hover:text-[#a0a0b0] disabled:opacity-40"
      >
        {ocupado ? <Loader2 size={16} className="animate-spin" /> : <MoreVertical size={16} />}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 border border-[#1f1f2c] bg-[#0a0a14] py-1 shadow-xl">
          <Opcion icono={Copy} onClick={() => llamar(`${base}/duplicar`, { method: "POST" })}>
            Duplicar
          </Opcion>

          {f.status === "scheduled" && (
            <Opcion
              icono={X}
              onClick={() => llamar(`${base}/cancelar`, { method: "POST" }, "¿Cancelar el envío programado?")}
            >
              Cancelar programación
            </Opcion>
          )}

          {acabada && (
            <Opcion
              icono={Archive}
              onClick={() => llamar(`${base}/archivar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ archivar: true }),
              })}
            >
              Archivar
            </Opcion>
          )}

          {f.status === "archived" && (
            <Opcion
              icono={Undo2}
              onClick={() => llamar(`${base}/archivar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ archivar: false }),
              })}
            >
              Devolver a Enviadas
            </Opcion>
          )}

          {/* Borrar solo lo que nunca salió. Lo enviado se archiva: borrarlo no
              borraría el correo, solo la memoria de haberlo mandado. */}
          {esBorrador && (
            <>
              <div className="my-1 border-t border-[#14141e]" />
              <Opcion
                icono={Trash2}
                peligro
                onClick={() => llamar(
                  base,
                  { method: "DELETE" },
                  `¿Borrar «${f.subject?.trim() || f.internal_title || "este borrador"}»?\n\nNo se puede deshacer.`,
                )}
              >
                Borrar borrador
              </Opcion>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Opcion({
  icono: Icono, children, onClick, peligro,
}: {
  icono: typeof Copy
  children: React.ReactNode
  onClick: () => void
  peligro?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
        peligro
          ? "text-[#c07a7a] hover:bg-red-950/40 hover:text-red-400"
          : "text-[#a0a0b0] hover:bg-[#14141e] hover:text-[#F3F6FA]"
      }`}
    >
      <Icono size={13} className="shrink-0" />
      {children}
    </button>
  )
}

function Cifra({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums text-[#e6cf95] [font-family:var(--font-cinzel,serif)]">
        {valor.toLocaleString("es-419")}
      </p>
      <p className="text-[9px] uppercase tracking-[0.15em] text-[#6a6a7a]">{etiqueta}</p>
    </div>
  )
}

function Vacio({ pestana, onCrear }: { pestana: string; onCrear: () => void }) {
  const texto: Record<string, string> = {
    borradores: "No hay ningún borrador. Empieza uno cuando tengas algo que contar.",
    programadas: "No hay nada programado ahora mismo.",
    enviadas: "Todavía no se ha enviado ninguna comunicación.",
    archivadas: "Nada archivado. Lo que archives desde «Enviadas» aparecerá aquí.",
  }
  return (
    <div className="border border-dashed border-[#1f1f2c] px-6 py-14 text-center">
      <Mail size={26} className="mx-auto text-[#3a3a50]" />
      <p className="mt-4 text-sm text-[#8a8fa8]">{texto[pestana]}</p>
      {pestana === "borradores" && (
        <button
          type="button"
          onClick={onCrear}
          className="mt-5 inline-flex items-center gap-2 border border-[#2f2f42] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a0a0b0] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0]"
        >
          <Plus size={13} /> Nueva comunicación
        </button>
      )}
    </div>
  )
}

function ElegirTipo({ onElegir, onCerrar }: { onElegir: (t: string) => void; onCerrar: () => void }) {
  return (
    <Modal titulo="¿Qué quieres comunicar?" onCerrar={onCerrar}>
      <div className="grid gap-2 sm:grid-cols-2">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onElegir(t.id)}
            className="border border-[#1f1f2c] bg-[#0d0d16] p-4 text-left transition-colors hover:border-[#6D4A9B]"
          >
            <p className="text-sm font-medium text-[#F3F6FA]">{t.nombre}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#7a7a8a]">{t.desc}</p>
          </button>
        ))}
      </div>
    </Modal>
  )
}

// ── El editor ──────────────────────────────────────────────────────────────

function Editor({ id, onVolver }: { id: string; onVolver: () => void }) {
  const [c, setC] = useState<Comunicacion | null>(null)
  const [veredicto, setVeredicto] = useState<Veredicto | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paso, setPaso] = useState<null | "audiencia" | "resumen">(null)
  const [ultimaPrueba, setUltimaPrueba] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/comunicaciones/${id}`, { credentials: "include" })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo cargar")
      setC(j.comunicacion)
      setVeredicto(j.veredicto)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar")
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => { void cargar() }, [cargar])

  // ── El guardado ─────────────────────────────────────────────────────────
  // Se guarda solo, un segundo después de dejar de escribir. Un botón de
  // guardar en una pantalla como esta es una forma de perder trabajo: se
  // escribe media hora, se cambia de pestaña y se pierde.
  const pendiente = useRef<Record<string, unknown>>({})
  const reloj = useRef<number | null>(null)

  const editar = useCallback((campo: string, valor: unknown) => {
    setC((v) => (v ? { ...v, [campo]: valor } as Comunicacion : v))
    pendiente.current[campo] = valor
    if (reloj.current) window.clearTimeout(reloj.current)
    reloj.current = window.setTimeout(async () => {
      const cambios = pendiente.current
      pendiente.current = {}
      if (Object.keys(cambios).length === 0) return
      setGuardando(true)
      try {
        const r = await fetch(`/api/admin/comunicaciones/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cambios),
        })
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || "No se pudo guardar")
        setVeredicto(j.veredicto)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar")
      } finally {
        setGuardando(false)
      }
    }, 900)
  }, [id])

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-[#7a7a8a]">
        <Loader2 size={15} className="animate-spin" /> Cargando…
      </div>
    )
  }
  if (!c) return <Aviso tono="mal">{error || "No se pudo abrir"}</Aviso>

  const tipo = TIPOS.find((t) => t.id === c.type)
  const editable = c.status === "draft" || c.status === "failed"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#7a7a8a] transition-colors hover:text-[#F3F6FA]"
        >
          <ArrowLeft size={14} /> Comunicaciones
        </button>
        <div className="flex items-center gap-3 text-[11px] text-[#6a6a7a]">
          {guardando ? (
            <span className="inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> guardando</span>
          ) : editable ? (
            <span className="inline-flex items-center gap-1.5"><Check size={12} /> guardado</span>
          ) : null}
          <span className={`border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] ${(ESTADOS[c.status] ?? ESTADOS.draft).cls}`}>
            {(ESTADOS[c.status] ?? ESTADOS.draft).etiqueta}
          </span>
        </div>
      </div>

      {error && <Aviso tono="mal">{error}</Aviso>}
      {c.provider_error && <Aviso tono="mal">{c.provider_error}</Aviso>}

      {!editable && (
        <Aviso tono="neutro">
          Esta comunicación ya no se edita. Cambiar el texto de algo que está en
          mil bandejas de entrada no cambia nada en esas bandejas. Duplícala si
          quieres partir de ella.
        </Aviso>
      )}

      {c.status === "sent" && <Resultados id={id} previstos={c.recipients_estimated} />}

      {/* ── EL LAYOUT ───────────────────────────────────────────────────────
          Dos columnas en escritorio: lo que se escribe a la izquierda, lo que
          va a llegar a la derecha. La derecha se queda pegada al desplazar,
          porque la pregunta que uno se hace mientras escribe es «¿cómo está
          quedando?», y bajar a mirarla y volver rompe el hilo.

          En móvil se apilan y el preview va primero de la lista de la derecha:
          ahí no cabe tenerlo siempre a la vista, pero sí que esté cerca. */}
      <NavSecciones editable={editable} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
        <div className="space-y-5">
          <Campos c={c} editar={editar} editable={editable} llevaFecha={Boolean(tipo?.fecha)} />
        </div>
        <div className="space-y-5 lg:sticky lg:top-4">
          <Previsualizacion c={c} />
          {editable && <Prueba id={id} asunto={c.subject} onEnviada={setUltimaPrueba} />}
        </div>
      </div>

      {veredicto && (veredicto.errores.length > 0 || veredicto.avisos.length > 0) && (
        <Hallazgos v={veredicto} />
      )}

      {editable && (
        <div className="flex flex-wrap items-center gap-3 border-t border-[#1a1a24] pt-6">
          <button
            type="button"
            disabled={!veredicto?.puedeEnviar}
            onClick={() => setPaso("audiencia")}
            className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Users size={14} /> Revisar audiencia y enviar
          </button>
          <Secundarios id={id} onVolver={onVolver} puedeBorrar />
          {!veredicto?.puedeEnviar && (
            <span className="text-xs text-[#7a7a8a]">Faltan cosas por resolver antes de poder enviarla.</span>
          )}
        </div>
      )}

      {!editable && (
        <div className="flex flex-wrap items-center gap-3 border-t border-[#1a1a24] pt-6">
          <Secundarios id={id} onVolver={onVolver} puedeBorrar={false} />
          {c.status === "scheduled" && <CancelarProgramada id={id} onHecho={cargar} cuando={c.scheduled_at} zona={c.scheduled_timezone} />}
          {["sent", "cancelled", "failed"].includes(c.status) && (
            <Archivar id={id} archivada={false} onHecho={onVolver} />
          )}
          {c.status === "archived" && <Archivar id={id} archivada onHecho={cargar} />}
        </div>
      )}

      {paso === "audiencia" && (
        <EnsayoAudiencia
          id={id}
          onCerrar={() => setPaso(null)}
          onSeguir={() => setPaso("resumen")}
        />
      )}
      {paso === "resumen" && (
        <ResumenFinal
          c={c}
          ultimaPrueba={ultimaPrueba}
          onCerrar={() => setPaso(null)}
          onEnviada={() => { setPaso(null); void cargar() }}
        />
      )}
    </div>
  )
}

// ── Los campos ─────────────────────────────────────────────────────────────

/**
 * El índice de la pantalla.
 *
 * ── POR QUÉ ESTO Y NO UN ASISTENTE POR PASOS ──────────────────────────────
 * Un asistente obliga a pasar por todo en un orden, y escribir una comunicación
 * no funciona así: se escribe el titular, se cambia el asunto, se vuelve al
 * cuerpo, se mira la audiencia, se vuelve a tocar el titular. Un asistente
 * convertiría eso en diez clics.
 *
 * Esto es lo contrario: la pantalla sigue siendo una, se puede escribir en
 * cualquier orden, y esto solo lleva de un sitio a otro sin perder lo demás de
 * vista. Se queda pegado arriba porque su utilidad es justamente estar cuando
 * uno ya ha bajado mucho.
 */
const SECCIONES = [
  { id: "bandeja", etiqueta: "Bandeja" },
  { id: "correo", etiqueta: "El correo" },
  { id: "boton", etiqueta: "Botón" },
  { id: "audiencia", etiqueta: "A quién va" },
]

function NavSecciones({ editable }: { editable: boolean }) {
  if (!editable) return null
  return (
    <nav className="sticky top-0 z-10 -mx-4 flex gap-1 overflow-x-auto border-b border-[#14141e] bg-[#000000]/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
      {SECCIONES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => {
            const el = document.getElementById(`seccion-${s.id}`)
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
          }}
          className="shrink-0 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-[#7a7a8a] transition-colors hover:text-[#c3b2e0]"
        >
          {s.etiqueta}
        </button>
      ))}
    </nav>
  )
}

function Campos({
  c, editar, editable, llevaFecha,
}: {
  c: Comunicacion
  editar: (campo: string, v: unknown) => void
  editable: boolean
  llevaFecha: boolean
}) {
  const campo = (k: keyof Comunicacion) => ({
    value: (c[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => editar(k, e.target.value),
    disabled: !editable,
    className: inputCls,
  })

  return (
    <>
      <Bloque id="bandeja" titulo="En la bandeja de entrada" nota="Lo único que se ve antes de abrir el correo.">
        <div>
          <label className={labelCls}>Asunto</label>
          <input type="text" placeholder="Nueva transmisión disponible" {...campo("subject")} />
        </div>
        <div>
          <label className={labelCls}>Preheader</label>
          <input type="text" placeholder="La línea que Gmail enseña detrás del asunto" {...campo("preheader")} />
        </div>
      </Bloque>

      <Bloque id="correo" titulo="El correo">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input type="text" placeholder="Nuevo en Los 144.000" {...campo("eyebrow")} />
        </div>
        <div>
          <label className={labelCls}>Titular</label>
          <input type="text" placeholder="Lo primero que se lee al abrir" {...campo("heading")} />
        </div>
        <div>
          <label className={labelCls}>Cuerpo</label>
          <EditorCuerpo
            valor={c.body ?? ""}
            onCambiar={(v) => editar("body", v)}
            editable={editable}
          />
          {/* El tratamiento, dicho donde se usa y no en un manual aparte. */}
          <p className="mt-2 border-l-2 border-[#2f2f42] pl-3 text-[11px] leading-relaxed text-[#8a8fa8]">
            El correo abre con <span className="text-[#c3b2e0]">«Hola, semilla estelar.»</span> —
            siempre, sin nombres. Si lo necesitas a mitad de frase, escribe{" "}
            <code className="text-[#c3b2e0]">{"{semilla}"}</code>.
          </p>
        </div>
        <ImagenDelCorreo
          url={c.image_url}
          onCambiar={(u) => editar("image_url", u)}
          editable={editable}
        />
      </Bloque>

      <Bloque id="boton" titulo="El botón">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Texto</label>
            <input type="text" placeholder="Ver ahora" {...campo("cta_text")} />
          </div>
          <div>
            <label className={labelCls}>Dirección</label>
            <input type="url" placeholder="https://los144000.com/miembros" {...campo("cta_url")} />
          </div>
        </div>
      </Bloque>

      {llevaFecha && (
        <Bloque titulo="Cuándo ocurre" nota="La zona horaria se escribe en el correo. Sin ella, «7:00 PM» significa algo distinto en cada país.">
          <div>
            <label className={labelCls}>Título del encuentro</label>
            <input type="text" placeholder="Cierre de Libra" {...campo("event_title")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Fecha y hora</label>
              <input
                type="datetime-local"
                value={aLocal(c.event_at)}
                onChange={(e) => editar("event_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                disabled={!editable}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Zona horaria</label>
              <select
                value={c.event_timezone ?? ""}
                onChange={(e) => editar("event_timezone", e.target.value || null)}
                disabled={!editable}
                className={inputCls}
              >
                <option value="">Elige una…</option>
                {ZONAS.map((z) => <option key={z.id} value={z.id}>{z.etiqueta}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Dónde (opcional)</label>
            <input type="text" placeholder="En línea · Sala de La Red" {...campo("event_location")} />
          </div>
        </Bloque>
      )}

      <Audiencias c={c} editar={editar} editable={editable} />

      <Bloque titulo="Para administración" nota="No sale en el correo. Es cómo la reconoces en la lista.">
        <div>
          <label className={labelCls}>Título interno</label>
          <input type="text" {...campo("internal_title")} />
        </div>
      </Bloque>
    </>
  )
}

/**
 * A quién va.
 *
 * ── LOS FILTROS SOLO ESTRECHAN ────────────────────────────────────────────
 * Nada de lo que hay aquí puede ampliar la audiencia. Sin tocar nada va a
 * todos; cada filtro que se añade, el número baja. Es lo que permite mirar el
 * ensayo de audiencia y razonar la cifra en vez de confiar en ella.
 *
 * Solo se ofrecen filtros de cosas que la base SABE. «Por ciudad» no está
 * porque apenas unas pocas personas la han puesto, y una audiencia de tres
 * personas por un filtro que parecía razonable es la forma más rápida de
 * dejar de fiarse de la herramienta.
 */
function Audiencias({
  c, editar, editable,
}: {
  c: Comunicacion
  editar: (campo: string, v: unknown) => void
  editable: boolean
}) {
  const a: Audiencia = c.audience || { kind: "todos" }
  const roles = a.roles || []
  const insignias = a.insignias || []

  // Las opciones vienen del servidor, no escritas aquí: las insignias son un
  // catálogo que crece, y una copia a mano se queda vieja sin que se note.
  const [filtros, setFiltros] = useState<Filtros | null>(null)
  const [buscaInsignia, setBuscaInsignia] = useState("")

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/admin/comunicaciones/filtros", { credentials: "include" })
        if (r.ok) setFiltros(await r.json())
      } catch { /* se queda con las de respaldo */ }
    })()
  }, [])

  const cambiar = (parcial: Partial<Audiencia>) =>
    editar("audience", {
      kind: "todos",
      temporadaMin: a.temporadaMin ?? null,
      temporadaCompletada: a.temporadaCompletada ?? null,
      roles: a.roles ?? null,
      insignias: a.insignias ?? null,
      ...parcial,
    })

  const alternarRol = (id: string) => {
    const nuevos = roles.includes(id) ? roles.filter((r) => r !== id) : [...roles, id]
    cambiar({ roles: nuevos.length > 0 ? nuevos : null })
  }

  const alternarInsignia = (id: string) => {
    const nuevas = insignias.includes(id) ? insignias.filter((i) => i !== id) : [...insignias, id]
    cambiar({ insignias: nuevas.length > 0 ? nuevas : null })
  }

  const qi = buscaInsignia.trim().toLowerCase()
  const gruposVisibles = (filtros?.insignias ?? [])
    .map((g) => ({ grupo: g.grupo, items: qi ? g.items.filter((i) => i.etiqueta.toLowerCase().includes(qi)) : g.items }))
    .filter((g) => g.items.length > 0)

  return (
    <Bloque id="audiencia" titulo="A quién va" nota="Sin tocar nada, va a todos. Cada filtro que añades, a menos gente.">
      <div>
        <label className={labelCls}>Por avance en el camino</label>
        <p className="-mt-1 mb-2 text-[11px] text-[#6a6a7a]">Por dónde va en el recorrido.</p>
        <div className="flex flex-wrap gap-2">
          <Pastilla activa={!a.temporadaMin} onClick={() => cambiar({ temporadaMin: null })} desactivada={!editable}>
            Da igual
          </Pastilla>
          {[1, 2, 3, 4].map((n) => (
            <Pastilla
              key={n}
              activa={a.temporadaMin === n}
              onClick={() => cambiar({ temporadaMin: n })}
              desactivada={!editable}
            >
              Temporada {n}+
            </Pastilla>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[#6a6a7a]">
          «Temporada 3+» es quien ha <strong className="text-[#8a8fa8]">llegado</strong> a la
          tercera o más allá: basta un capítulo, o tener su acceso.
        </p>
      </div>

      {/* ── TERMINAR NO ES LLEGAR ──────────────────────────────────────────
          «Llegó a la 3» incluye a quien vio el primer capítulo y lo dejó.
          «Terminó la 3» es quien la vio entera. Entre las dos cosas está toda
          la diferencia entre «sigue, que viene la 4» y «felicidades». */}
      <div>
        <label className={labelCls}>Por temporada terminada</label>
        <p className="-mt-1 mb-2 text-[11px] text-[#6a6a7a]">
          Quién la vio <strong className="text-[#8a8fa8]">entera</strong>. Es lo que sirve para
          felicitar, o para invitar a seguir con la siguiente.
        </p>
        <div className="flex flex-wrap gap-2">
          <Pastilla activa={!a.temporadaCompletada} onClick={() => cambiar({ temporadaCompletada: null })} desactivada={!editable}>
            Da igual
          </Pastilla>
          {[1, 2, 3].map((n) => (
            <Pastilla
              key={n}
              activa={a.temporadaCompletada === n}
              onClick={() => cambiar({ temporadaCompletada: n })}
              desactivada={!editable}
            >
              Terminó la {n}
            </Pastilla>
          ))}
          <Pastilla
            activa={a.temporadaCompletada === 4}
            onClick={() => cambiar({ temporadaCompletada: 4 })}
            desactivada={!editable}
          >
            Completó el camino
          </Pastilla>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[#6a6a7a]">
          Se cuenta contra los capítulos que tiene cargados cada temporada, con el mismo
          criterio que las insignias: si aquí contara distinto, «terminó la 3» y la insignia
          de terminarla dirían cosas distintas de la misma persona.
        </p>
      </div>

      <div>
        <label className={labelCls}>Por rol en La Red</label>
        <p className="-mt-1 mb-2 text-[11px] text-[#6a6a7a]">Qué función desempeña.</p>
        <div className="flex flex-wrap gap-2">
          {(filtros?.roles ?? ROLES).map((r) => (
            <Pastilla
              key={r.id}
              activa={roles.includes(r.id)}
              onClick={() => alternarRol(r.id)}
              desactivada={!editable}
            >
              {r.etiqueta}
            </Pastilla>
          ))}
        </div>
      </div>

      {/* ── INSIGNIAS ─────────────────────────────────────────────────────
          Tercer concepto, y distinto de los otros dos: el avance dice por
          dónde va, el rol qué hace, y la insignia qué ha logrado. Un Guardián
          puede no haber pasado de la primera temporada, y quien tiene diez
          insignias puede no tener ningún rol.

          Son más de cincuenta, así que van agrupadas y con buscador: una tira
          de cincuenta pastillas no se lee, se sufre. */}
      <div>
        <label className={labelCls}>Por insignia lograda</label>
        <p className="-mt-1 mb-2 text-[11px] text-[#6a6a7a]">
          Qué ha alcanzado. Sirve para felicitar a quien acaba de llegar a algo.
        </p>

        {insignias.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {insignias.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => alternarInsignia(id)}
                disabled={!editable}
                className="inline-flex items-center gap-1.5 border border-[#6D4A9B] bg-[#6D4A9B]/20 px-3 py-1.5 text-[11px] text-[#c3b2e0] disabled:opacity-40"
              >
                {nombreDeInsignia(id, filtros)} <X size={11} />
              </button>
            ))}
          </div>
        )}

        {!filtros ? (
          <p className="text-[11px] text-[#6a6a7a]">Cargando insignias…</p>
        ) : (
          <>
            <div className="relative mb-2">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a6a]" />
              <input
                type="search"
                value={buscaInsignia}
                onChange={(e) => setBuscaInsignia(e.target.value)}
                placeholder={`Buscar entre ${filtros.total_insignias} insignias…`}
                disabled={!editable}
                className={`${inputCls} pl-9`}
              />
            </div>

            <div className="max-h-64 space-y-4 overflow-y-auto border border-[#14141e] bg-[#07070f] p-3">
              {gruposVisibles.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-[#6a6a7a]">
                  Ninguna insignia coincide con «{buscaInsignia}».
                </p>
              ) : (
                gruposVisibles.map((g) => (
                  <div key={g.grupo}>
                    <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-[#5a5a6a]">{g.grupo}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((i) => (
                        <Pastilla
                          key={i.id}
                          activa={insignias.includes(i.id)}
                          onClick={() => alternarInsignia(i.id)}
                          desactivada={!editable}
                        >
                          {i.etiqueta}
                        </Pastilla>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-[#14141e] pt-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Va a</p>
        <p className="mt-1 text-sm text-[#F3F6FA]">{describir(a, filtros)}</p>
        {/* La semántica, escrita. Confundir «y» con «o» aquí es la diferencia
            entre mandar a doscientos y mandar a tres. */}
        {(a.temporadaMin || a.temporadaCompletada || roles.length > 0 || insignias.length > 0) && (
          <p className="mt-2 text-[11px] leading-relaxed text-[#8a8fa8]">
            Entre bloques distintos se cumple <strong className="text-[#c3b2e0]">todo</strong>:
            hay que tener el avance <em>y</em> el rol <em>y</em> la insignia. Dentro de un
            mismo bloque basta <strong className="text-[#c3b2e0]">uno</strong>: con dos roles
            marcados, entra quien tenga cualquiera de los dos.
          </p>
        )}
      </div>
    </Bloque>
  )
}

function Pastilla({
  children, activa, onClick, desactivada,
}: {
  children: React.ReactNode; activa: boolean; onClick: () => void; desactivada?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactivada}
      className={`border px-3 py-1.5 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        activa
          ? "border-[#6D4A9B] bg-[#6D4A9B]/15 text-[#c3b2e0]"
          : "border-[#1f1f2c] text-[#7a7a8a] hover:border-[#2f2f42]"
      }`}
    >
      {children}
    </button>
  )
}

/** La misma frase que compone el servidor, para que digan lo mismo. */
function describir(a?: Audiencia | null, filtros?: Filtros | null): string {
  if (!a) return "Todos los miembros activos"
  const partes: string[] = []
  if (a.temporadaMin) partes.push(`que llegaron a la Temporada ${a.temporadaMin} o más`)
  if (a.temporadaCompletada) {
    partes.push(
      a.temporadaCompletada >= 4
        ? "que completaron el camino entero"
        : `que terminaron la Temporada ${a.temporadaCompletada}`,
    )
  }
  if (a.roles?.length) {
    partes.push(`con rol de ${a.roles.map((r) => ROLES.find((x) => x.id === r)?.etiqueta ?? r).join(" o ")}`)
  }
  if (a.insignias?.length) {
    partes.push(`con la insignia ${a.insignias.map((i) => nombreDeInsignia(i, filtros)).join(" o ")}`)
  }
  return partes.length === 0 ? "Todos los miembros activos" : `Miembros ${partes.join(", ")}`
}

function nombreDeInsignia(id: string, filtros?: Filtros | null): string {
  for (const g of filtros?.insignias ?? []) {
    const encontrada = g.items.find((i) => i.id === id)
    if (encontrada) return encontrada.etiqueta
  }
  return id
}

/**
 * La imagen del correo: se elige del disco, no se pega una dirección.
 *
 * ── POR QUÉ ESTO IMPORTA MÁS DE LO QUE PARECE ─────────────────────────────
 * Pedir una URL obliga a tener la imagen ya subida a algún sitio, y ese «algún
 * sitio» acaba siendo cualquiera: un enlace de Drive que caduca, una imagen de
 * otra web que un día se borra. Un correo no se puede corregir después, así
 * que una imagen rota en mil bandejas es permanente.
 *
 * Subiéndola aquí va al mismo almacén que el resto de la plataforma —el que ya
 * usa el panel para portadas y vídeos— y la dirección la pone el servidor.
 *
 * ── LO QUE SE COMPRUEBA ANTES DE SUBIR ────────────────────────────────────
 * El formato y el peso, y se avisa de las dimensiones. No por capricho: una
 * imagen de cuatro megas en un correo tarda en cargar en un móvil con mala
 * cobertura, y varios clientes recortan los correos que pesan demasiado —Gmail
 * corta a 102 KB de HTML y esconde el resto detrás de «ver mensaje completo»,
 * que es donde está el botón.
 */
/**
 * El cuerpo, con botones en vez de asteriscos.
 *
 * ── POR QUÉ NO UN EDITOR DE VERDAD ────────────────────────────────────────
 * Un editor visual —de los que ponen la negrita en negrita mientras escribes—
 * es una librería grande, y en un correo tiene un problema de fondo: lo que se
 * ve ahí no es lo que va a salir. El correo lo dibuja el servidor con tablas y
 * estilos en línea, así que un editor visual enseñaría una tercera versión
 * distinta del preview y del correo real.
 *
 * Esto es lo contrario: se escribe texto plano, los botones ponen las marcas
 * por ti, y lo que se ve como resultado es el preview de al lado — que es el
 * correo. Una versión menos que mantener.
 *
 * ── LO QUE HACEN LOS BOTONES ──────────────────────────────────────────────
 * Envuelven lo seleccionado, o insertan un ejemplo donde está el cursor si no
 * hay nada seleccionado. Y devuelven el foco al texto con la selección puesta
 * donde toca: un botón de formato que te deja fuera del campo obliga a volver
 * con el ratón cada vez.
 */
function EditorCuerpo({
  valor, onCambiar, editable,
}: {
  valor: string
  onCambiar: (v: string) => void
  editable: boolean
}) {
  const area = useRef<HTMLTextAreaElement | null>(null)

  /** Envuelve la selección. Sin selección, escribe el ejemplo. */
  const envolver = (antes: string, despues: string, ejemplo: string) => {
    const el = area.current
    if (!el) return
    const { selectionStart: a, selectionEnd: b } = el
    const dentro = valor.slice(a, b) || ejemplo
    const nuevo = valor.slice(0, a) + antes + dentro + despues + valor.slice(b)
    onCambiar(nuevo)
    // Después de que React repinte, el cursor va sobre el texto envuelto para
    // poder seguir escribiendo encima.
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(a + antes.length, a + antes.length + dentro.length)
    })
  }

  /** Marca el principio de la línea: subtítulos, listas, citas, destacados. */
  const prefijar = (marca: string, ejemplo: string) => {
    const el = area.current
    if (!el) return
    const a = el.selectionStart
    const b = el.selectionEnd

    const inicioLinea = valor.lastIndexOf("\n", a - 1) + 1
    const finLinea = valor.indexOf("\n", b) === -1 ? valor.length : valor.indexOf("\n", b)
    const trozo = valor.slice(inicioLinea, finLinea)

    // Si ya tiene la marca, se quita: el mismo botón pone y saca.
    const yaTiene = trozo.split("\n").every((l) => l.startsWith(marca))
    const lineas = (trozo || ejemplo).split("\n")
    const cambiado = lineas
      .map((l) => (yaTiene ? l.slice(marca.length) : marca + l))
      .join("\n")

    const nuevo = valor.slice(0, inicioLinea) + cambiado + valor.slice(finLinea)
    onCambiar(nuevo)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(inicioLinea, inicioLinea + cambiado.length)
    })
  }

  const insertar = (texto: string) => {
    const el = area.current
    if (!el) return
    const a = el.selectionStart
    const nuevo = valor.slice(0, a) + texto + valor.slice(el.selectionEnd)
    onCambiar(nuevo)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(a + texto.length, a + texto.length)
    })
  }

  const HERRAMIENTAS: Array<{ icono: typeof Bold; titulo: string; hacer: () => void }> = [
    { icono: Bold, titulo: "Negrita", hacer: () => envolver("**", "**", "texto") },
    { icono: Italic, titulo: "Cursiva", hacer: () => envolver("*", "*", "texto") },
    { icono: Link2, titulo: "Enlace", hacer: () => envolver("[", "](https://los144000.com)", "texto del enlace") },
    { icono: Heading2, titulo: "Subtítulo", hacer: () => prefijar("## ", "Un subtítulo") },
    { icono: List, titulo: "Lista", hacer: () => prefijar("- ", "Un punto") },
    { icono: Quote, titulo: "Cita", hacer: () => prefijar("> ", "Una frase que respira") },
    { icono: Sparkles, titulo: "Destacado", hacer: () => prefijar("!! ", "Lo que no puede perderse") },
    { icono: Minus, titulo: "Separación", hacer: () => insertar("\n\n---\n\n") },
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-0.5 border border-b-0 border-[#1a1a24] bg-[#0d0d16] p-1">
        {HERRAMIENTAS.map((h) => (
          <button
            key={h.titulo}
            type="button"
            onClick={h.hacer}
            disabled={!editable}
            title={h.titulo}
            aria-label={h.titulo}
            className="p-2 text-[#7a7a8a] transition-colors hover:bg-[#1a1a24] hover:text-[#c3b2e0] disabled:opacity-30"
          >
            <h.icono size={14} />
          </button>
        ))}
      </div>

      <textarea
        ref={area}
        rows={12}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        disabled={!editable}
        placeholder={"Escribe con normalidad.\n\nDeja una línea en blanco entre párrafos.\n\nLos botones de arriba ponen las marcas por ti; también puedes escribirlas a mano."}
        className={`${inputCls} rounded-none`}
      />

      <p className="mt-1.5 text-[11px] leading-relaxed text-[#6a6a7a]">
        Línea en blanco = párrafo nuevo. Lo que ves en la vista previa de al lado es
        exactamente lo que va a salir.
      </p>
    </div>
  )
}

function ImagenDelCorreo({
  url, onCambiar, editable,
}: {
  url: string | null
  onCambiar: (u: string | null) => void
  editable: boolean
}) {
  const entrada = useRef<HTMLInputElement | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // Lo que los clientes de correo dibujan sin sorpresas. WEBP se queda fuera a
  // propósito: Outlook de escritorio no lo pinta, y ahí la imagen no es que se
  // vea peor, es que no se ve.
  const FORMATOS = ["image/jpeg", "image/png", "image/gif"]
  const MAX = 1.5 * 1024 * 1024
  const ANCHO_IDEAL = 1200

  const elegir = async (archivo: File) => {
    setError(null)
    setAviso(null)

    if (!FORMATOS.includes(archivo.type)) {
      setError("Solo JPG, PNG o GIF. WEBP no lo dibuja Outlook de escritorio.")
      return
    }
    if (archivo.size > MAX) {
      setError(`Pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB. El tope es 1,5 MB: por encima, el correo tarda en abrir en un móvil.`)
      return
    }

    // Las dimensiones son un aviso, no un impedimento. Se mide antes de subir
    // para no gastar la subida si va a quedar mal.
    try {
      const medidas = await medir(archivo)
      if (medidas && medidas.ancho < 600) {
        setAviso(`Mide ${medidas.ancho}px de ancho. El correo tiene 600, así que se verá borrosa; lo ideal son ${ANCHO_IDEAL}px.`)
      }
    } catch { /* si no se puede medir, se sube igual */ }

    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append("file", archivo)
      const r = await fetch("/api/admin/upload", { method: "POST", credentials: "include", body: fd })
      const j = await r.json()
      if (!r.ok || !j?.url) throw new Error(j?.error || "No se pudo subir")
      onCambiar(j.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir")
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div>
      <label className={labelCls}>Imagen (opcional)</label>

      {url ? (
        <div className="space-y-3">
          <div className="overflow-hidden border border-[#1f1f2c] bg-[#07070f]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="block max-h-56 w-full object-cover" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              disabled={!editable || subiendo}
              className="inline-flex items-center gap-2 border border-[#2f2f42] px-3 py-2 text-[11px] uppercase tracking-[0.15em] text-[#a0a0b0] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0] disabled:opacity-40"
            >
              <ImagePlus size={13} /> Reemplazar
            </button>
            <button
              type="button"
              onClick={() => { onCambiar(null); setAviso(null); setError(null) }}
              disabled={!editable || subiendo}
              className="inline-flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-[0.15em] text-[#5a5a6a] transition-colors hover:text-red-400 disabled:opacity-40"
            >
              <Trash2 size={13} /> Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={!editable || subiendo}
          className="flex w-full flex-col items-center gap-2 border border-dashed border-[#2f2f42] px-4 py-8 transition-colors hover:border-[#6D4A9B] disabled:opacity-40"
        >
          {subiendo ? (
            <Loader2 size={20} className="animate-spin text-[#6a6a7a]" />
          ) : (
            <ImagePlus size={20} className="text-[#5a5a6a]" />
          )}
          <span className="text-xs text-[#8a8fa8]">
            {subiendo ? "Subiendo…" : "Elegir una imagen de tu ordenador"}
          </span>
          <span className="text-[10px] text-[#5a5a6a]">JPG, PNG o GIF · hasta 1,5 MB · {ANCHO_IDEAL}px de ancho</span>
        </button>
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          // Se limpia para que elegir el mismo archivo otra vez vuelva a
          // disparar el evento; si no, reintentar tras un fallo no hace nada.
          e.target.value = ""
          if (f) void elegir(f)
        }}
      />

      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      {aviso && <p className="mt-2 text-[11px] text-[#c9a86b]">{aviso}</p>}

      <p className="mt-2 text-[11px] leading-relaxed text-[#6a6a7a]">
        Va debajo del titular a propósito: muchos clientes no cargan imágenes hasta
        que se lo piden, y si fuera lo primero el correo abriría en blanco.
      </p>
    </div>
  )
}

/** Mide una imagen sin subirla. */
function medir(archivo: File): Promise<{ ancho: number; alto: number } | null> {
  return new Promise((resolver) => {
    const url = URL.createObjectURL(archivo)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolver({ ancho: img.naturalWidth, alto: img.naturalHeight })
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolver(null) }
    img.src = url
  })
}

function Bloque({ id, titulo, nota, children }: {
  id?: string
  titulo: string
  nota?: string
  children: React.ReactNode
}) {
  return (
    // `scroll-mt` deja hueco para la barra pegada de arriba: sin eso, saltar a
    // una sección la deja justo debajo del índice y no se ve su título.
    <section id={id ? `seccion-${id}` : undefined} className="scroll-mt-16 border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">{titulo}</h3>
      {nota && <p className="mt-1.5 text-xs leading-relaxed text-[#6a6a7a]">{nota}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

// ── La vista previa ────────────────────────────────────────────────────────

function Previsualizacion({ c }: { c: Comunicacion }) {
  const [vista, setVista] = useState<"desktop" | "movil">("desktop")
  const [html, setHtml] = useState<string>("")
  const [sobre, setSobre] = useState<{ de: string; asunto: string; preheader: string } | null>(null)
  const [cargando, setCargando] = useState(false)

  // Se redibuja poco después de cada cambio. Sin esperar, cada tecla sería una
  // petición; esperando demasiado, deja de sentirse como una vista previa.
  useEffect(() => {
    const t = window.setTimeout(async () => {
      setCargando(true)
      try {
        const r = await fetch("/api/admin/comunicaciones/preview", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(c),
        })
        const j = await r.json()
        if (r.ok) { setHtml(j.html); setSobre(j.sobre) }
      } catch { /* la vista previa no rompe el editor */ }
      finally { setCargando(false) }
    }, 500)
    return () => window.clearTimeout(t)
  }, [c])

  return (
    <section className="border border-[#1a1a24] bg-[#0d0d16]/40">
      <div className="flex items-center justify-between border-b border-[#1a1a24] px-4 py-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
          Cómo se verá
        </h3>
        <div className="flex items-center gap-1">
          {cargando && <Loader2 size={12} className="mr-2 animate-spin text-[#6a6a7a]" />}
          {([["desktop", Monitor], ["movil", Smartphone]] as const).map(([v, Icono]) => (
            <button
              key={v}
              type="button"
              onClick={() => setVista(v)}
              aria-label={v === "desktop" ? "Escritorio" : "Móvil"}
              className={`border p-1.5 transition-colors ${
                vista === v ? "border-[#6D4A9B] text-[#c3b2e0]" : "border-transparent text-[#5a5a6a] hover:text-[#8a8fa8]"
              }`}
            >
              <Icono size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* El sobre: lo que se decide antes de abrir. */}
      {sobre && (
        <div className="border-b border-[#1a1a24] px-4 py-3 text-xs">
          <p className="truncate text-[#8a8fa8]">{sobre.de}</p>
          <p className="mt-0.5 truncate font-medium text-[#F3F6FA]">
            {sobre.asunto || <span className="text-red-400">Sin asunto</span>}
          </p>
          <p className="mt-0.5 truncate text-[#6a6a7a]">{sobre.preheader}</p>
        </div>
      )}

      <div className="flex justify-center bg-[#07070f] p-4">
        {/* En un iframe aislado: el correo trae sus propios estilos y, suelto en
            la página, los mezclaría con los del panel y la vista previa dejaría
            de parecerse a lo que recibe la gente. */}
        <iframe
          title="Vista previa del correo"
          srcDoc={html}
          sandbox=""
          className="border border-[#1a1a24] bg-white transition-all"
          style={{
            width: vista === "movil" ? 375 : "100%",
            maxWidth: vista === "movil" ? 375 : 640,
            height: 560,
          }}
        />
      </div>
    </section>
  )
}

// ── La prueba ──────────────────────────────────────────────────────────────

const CLAVE_PRUEBA = "los144k_correos_prueba"

function Prueba({ id, asunto, onEnviada }: {
  id: string
  asunto: string
  onEnviada?: (cuando: string) => void
}) {
  const [direcciones, setDirecciones] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [hecho, setHecho] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Las direcciones de prueba se recuerdan en este navegador. Escribir cuatro
  // correos cada vez que se quiere comprobar algo es la forma más segura de
  // que nadie compruebe nada.
  useEffect(() => {
    try { setDirecciones(localStorage.getItem(CLAVE_PRUEBA) || "") } catch { /* sin almacenamiento */ }
  }, [])

  const enviar = async () => {
    const lista = direcciones.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
    if (lista.length === 0) { setError("Escribe al menos una dirección."); return }
    setEnviando(true); setError(null); setHecho(null)
    try {
      const r = await fetch(`/api/admin/comunicaciones/${id}/prueba`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinatarios: lista }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo enviar")
      try { localStorage.setItem(CLAVE_PRUEBA, direcciones) } catch { /* da igual */ }
      setHecho(new Date(j.cuando).toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
      // El resumen final lo enseña: «última prueba, hace tres minutos» es la
      // diferencia entre enviar con confianza y enviar con esperanza.
      onEnviada?.(j.cuando)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
        Probarla antes
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-[#6a6a7a]">
        Va solo a estas direcciones. No toca la audiencia, no cuenta como envío
        y no puede alcanzar a ningún miembro. Manda una a Gmail y otra a
        Outlook: pintan distinto.
      </p>
      <input
        type="text"
        value={direcciones}
        onChange={(e) => setDirecciones(e.target.value)}
        placeholder="tu@gmail.com, tu@outlook.com"
        className={`${inputCls} mt-4`}
      />
      <button
        type="button"
        onClick={enviar}
        disabled={enviando || !asunto.trim()}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-[#2f2f42] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a0a0b0] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {enviando ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        {enviando ? "Enviando…" : "Enviar prueba"}
      </button>
      {!asunto.trim() && (
        <p className="mt-2 text-[11px] text-[#6a6a7a]">Ponle asunto antes: es lo primero que hay que comprobar.</p>
      )}
      {hecho && <p className="mt-3 text-xs text-emerald-400">Prueba enviada a las {hecho}. Revisa tu bandeja.</p>}
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </section>
  )
}

// ── El ensayo de audiencia ─────────────────────────────────────────────────

function EnsayoAudiencia({ id, onCerrar, onSeguir }: { id: string; onCerrar: () => void; onSeguir: () => void }) {
  const [r, setR] = useState<ResumenAudiencia | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/admin/comunicaciones/${id}/audiencia`, { credentials: "include" })
        const j = await res.json()
        if (!res.ok) throw new Error(j?.error || "No se pudo calcular")
        setR(j.resumen)
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo calcular")
      }
    })()
  }, [id])

  return (
    <Modal titulo="¿A quién le va a llegar?" onCerrar={onCerrar}>
      {error ? (
        <Aviso tono="mal">{error}</Aviso>
      ) : !r ? (
        <div className="flex items-center gap-2 py-8 text-sm text-[#7a7a8a]">
          <Loader2 size={15} className="animate-spin" /> Contando…
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#6a6a7a]">{r.etiqueta}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#2a2a3a] bg-[#0d0d16] p-4">
              <p className="text-3xl font-semibold tabular-nums text-[#e6cf95] [font-family:var(--font-cinzel,serif)]">
                {r.destinatarios.toLocaleString("es-419")}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#8a8fa8]">lo recibirán</p>
            </div>
            <div className="border border-[#1f1f2c] bg-[#0d0d16] p-4">
              <p className="text-3xl font-semibold tabular-nums text-[#7a7a8a] [font-family:var(--font-cinzel,serif)]">
                {r.excluidos.toLocaleString("es-419")}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#6a6a7a]">quedan fuera</p>
            </div>
          </div>

          {r.motivos.length > 0 && (
            <div>
              <p className={labelCls}>Por qué quedan fuera</p>
              <ul className="space-y-1.5">
                {r.motivos.map((m) => (
                  <li key={m.motivo} className="flex items-center justify-between border-b border-[#14141e] pb-1.5 text-xs">
                    <span className="text-[#8a8fa8]">{m.etiqueta}</span>
                    <span className="tabular-nums text-[#6a6a7a]">{m.cuantos}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs leading-relaxed text-[#6a6a7a]">
            Esta comunicación la gobierna «{r.preferenciaEtiqueta}» en el perfil de
            cada miembro. Quien lo tenga apagado no la recibe, aunque siga
            recibiendo las demás.
          </p>

          <div className="flex flex-wrap gap-3 border-t border-[#1a1a24] pt-4">
            <button
              type="button"
              onClick={onSeguir}
              disabled={r.destinatarios === 0}
              className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-[#7a7a8a] transition-colors hover:text-[#F3F6FA]"
            >
              Volver al borrador
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── El resumen final ───────────────────────────────────────────────────────

function ResumenFinal({
  c, ultimaPrueba, onCerrar, onEnviada,
}: {
  c: Comunicacion
  ultimaPrueba: string | null
  onCerrar: () => void
  onEnviada: () => void
}) {
  const [modo, setModo] = useState<"ahora" | "programar">("ahora")
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("19:00")
  const [zona, setZona] = useState("America/Mexico_City")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // La llave se genera UNA VEZ, al abrir este diálogo, y no cambia aunque se
  // pulse tres veces. Es lo que convierte el segundo clic en una repetición
  // reconocible en vez de en un segundo envío.
  const llave = useRef<string>("")
  if (!llave.current) {
    llave.current = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `k${Date.now()}${Math.random().toString(36).slice(2)}`
  }

  const enviar = async () => {
    setEnviando(true); setError(null)
    try {
      const r = await fetch(`/api/admin/comunicaciones/${c.id}/enviar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          modo === "programar"
            ? { llave: llave.current, cuando: fecha, hora, zona }
            : { llave: llave.current },
        ),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo enviar")
      onEnviada()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar")
      setEnviando(false)
    }
  }

  const listo = modo === "ahora" || Boolean(fecha && hora && zona)

  return (
    <Modal titulo="Confirmar comunicación" onCerrar={enviando ? undefined : onCerrar}>
      <div className="space-y-5">
        <dl className="space-y-3 border border-[#1f1f2c] bg-[#0d0d16] p-4 text-sm">
          <Dato etiqueta="Asunto" valor={c.subject} />
          <Dato etiqueta="Tipo" valor={TIPOS.find((t) => t.id === c.type)?.nombre ?? c.type} />
          <Dato etiqueta="Audiencia" valor={describir(c.audience, null)} />
          <Dato
            etiqueta="Envío"
            valor={modo === "ahora" ? "Ahora" : fecha && hora ? `${fecha} · ${hora} · ${zona.split("/").pop()?.replace(/_/g, " ")}` : "—"}
          />
          <Dato
            etiqueta="Prueba"
            valor={ultimaPrueba ? `Enviada a las ${new Date(ultimaPrueba).toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit" })}` : "Ninguna en esta sesión"}
          />
        </dl>

        {/* No lo impide —a veces se duplica algo ya probado— pero lo dice. */}
        {!ultimaPrueba && (
          <p className="text-xs leading-relaxed text-[#c9a86b]">
            No has enviado ninguna prueba desde que abriste esta comunicación. Mandarte una
            antes cuesta un minuto y es la única forma de ver cómo llega de verdad.
          </p>
        )}

        <div className="flex gap-2">
          {([["ahora", "Enviar ahora", Send], ["programar", "Programar", Calendar]] as const).map(([m, txt, Icono]) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              disabled={enviando}
              className={`inline-flex flex-1 items-center justify-center gap-2 border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors ${
                modo === m ? "border-[#6D4A9B] bg-[#6D4A9B]/10 text-[#c3b2e0]" : "border-[#1f1f2c] text-[#7a7a8a]"
              }`}
            >
              <Icono size={13} /> {txt}
            </button>
          ))}
        </div>

        {modo === "programar" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={enviando} className={inputCls} />
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} disabled={enviando} className={inputCls} />
            <select value={zona} onChange={(e) => setZona(e.target.value)} disabled={enviando} className={inputCls}>
              {ZONAS.map((z) => <option key={z.id} value={z.id}>{z.etiqueta}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-start gap-3 border border-[#3a2a1a] bg-[#1a1208]/60 p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#e6cf95]" />
          <p className="text-xs leading-relaxed text-[#d8c9a4]">
            Esta acción envía correos reales a personas reales. No se puede
            deshacer: una vez entregado, el correo está en su bandeja.
            {modo === "programar" && " Una programada sí se puede cancelar mientras no haya salido."}
          </p>
        </div>

        {error && <Aviso tono="mal">{error}</Aviso>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={enviar}
            disabled={enviando || !listo}
            className="inline-flex items-center gap-2 border border-[#e6cf95] bg-[#e6cf95] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#18120a] transition-colors hover:bg-[#d9b866] disabled:cursor-wait disabled:opacity-50"
          >
            {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {enviando ? "Enviando…" : modo === "ahora" ? "Enviar ahora" : "Programar"}
          </button>
          {!enviando && (
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-[#7a7a8a] transition-colors hover:text-[#F3F6FA]"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#14141e] pb-2 last:border-0 last:pb-0">
      <dt className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">{etiqueta}</dt>
      <dd className="min-w-0 flex-1 text-right text-[#F3F6FA]">{valor || "—"}</dd>
    </div>
  )
}

// ── Resultados ─────────────────────────────────────────────────────────────

function Resultados({ id, previstos }: { id: string; previstos: number | null }) {
  const [d, setD] = useState<{
    metricas: Record<string, number>
    tasas: { apertura: number | null; clic: number | null }
    sinDatos: boolean
  } | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`/api/admin/comunicaciones/${id}/metricas`, { credentials: "include" })
        if (r.ok) setD(await r.json())
      } catch { /* la pantalla se abre igual */ }
    })()
  }, [id])

  if (!d) return null

  return (
    <section className="border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">Resultados</h3>
      {d.sinDatos ? (
        <p className="mt-3 text-xs leading-relaxed text-[#6a6a7a]">
          Todavía no hay datos. No significa que nadie la haya abierto: significa
          que los avisos del proveedor aún no han llegado, o que el webhook no
          está configurado.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metrica etiqueta="Enviados" valor={previstos ?? d.metricas.enviados} />
          <Metrica etiqueta="Entregados" valor={d.metricas.entregados} />
          <Metrica etiqueta="Abrieron" valor={d.metricas.aperturas} pct={d.tasas.apertura} />
          <Metrica etiqueta="Hicieron clic" valor={d.metricas.clics} pct={d.tasas.clic} />
        </div>
      )}
      {!d.sinDatos && (d.metricas.rebotes > 0 || d.metricas.quejas > 0) && (
        <p className="mt-4 text-xs text-[#8a8fa8]">
          {d.metricas.rebotes > 0 && `${d.metricas.rebotes} rebotaron. `}
          {d.metricas.quejas > 0 && `${d.metricas.quejas} lo marcaron como no deseado.`}
        </p>
      )}
    </section>
  )
}

function Metrica({ etiqueta, valor, pct }: { etiqueta: string; valor?: number; pct?: number | null }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums text-[#F3F6FA] [font-family:var(--font-cinzel,serif)]">
        {(valor ?? 0).toLocaleString("es-419")}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-[#6a6a7a]">
        {etiqueta}{pct != null && <span className="ml-1.5 text-[#a78bca]">{pct}%</span>}
      </p>
    </div>
  )
}

// ── Acciones secundarias ───────────────────────────────────────────────────

function Secundarios({ id, onVolver, puedeBorrar }: { id: string; onVolver: () => void; puedeBorrar: boolean }) {
  const [ocupado, setOcupado] = useState(false)

  const duplicar = async () => {
    setOcupado(true)
    try {
      const r = await fetch(`/api/admin/comunicaciones/${id}/duplicar`, { method: "POST", credentials: "include" })
      if (r.ok) onVolver()
    } finally { setOcupado(false) }
  }

  const borrar = async () => {
    // Un borrador nunca salió, así que aquí sí se borra de verdad: no hay
    // historial que preservar ni métricas que perder. Lo enviado se archiva.
    if (!window.confirm("¿Borrar este borrador?\n\nNo se puede deshacer.")) return
    setOcupado(true)
    try {
      const r = await fetch(`/api/admin/comunicaciones/${id}`, { method: "DELETE", credentials: "include" })
      if (r.ok) onVolver()
    } finally { setOcupado(false) }
  }

  return (
    <>
      <button
        type="button"
        onClick={duplicar}
        disabled={ocupado}
        className="inline-flex items-center gap-2 border border-[#1f1f2c] px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-[#7a7a8a] transition-colors hover:border-[#2f2f42] hover:text-[#a0a0b0] disabled:opacity-40"
      >
        <Copy size={13} /> Duplicar
      </button>
      {puedeBorrar && (
        <button
          type="button"
          onClick={borrar}
          disabled={ocupado}
          className="inline-flex items-center gap-2 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-[#5a5a6a] transition-colors hover:text-red-400 disabled:opacity-40"
        >
          <Trash2 size={13} /> Borrar
        </button>
      )}
    </>
  )
}

/**
 * Apartar una comunicación terminada, sin perderla.
 *
 * ── POR QUÉ NO HAY «BORRAR» AQUÍ ──────────────────────────────────────────
 * Se pidió poder quitar comunicaciones enviadas de la lista, y borrar sería lo
 * obvio y lo equivocado. Borrar la fila NO borra el correo —está en mil
 * bandejas de entrada y ahí se queda— pero sí borra la única forma de
 * responder a «¿qué mandamos el martes, y a cuánta gente?», y se lleva por
 * delante las métricas, que cuelgan de ella.
 *
 * Lo que molesta es que la lista crezca. Para eso basta con apartarla, y eso
 * se deshace.
 */
function Archivar({ id, archivada, onHecho }: { id: string; archivada: boolean; onHecho: () => void }) {
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hacer = async () => {
    setOcupado(true); setError(null)
    try {
      const r = await fetch(`/api/admin/comunicaciones/${id}/archivar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivar: !archivada }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo")
      onHecho()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo")
    } finally { setOcupado(false) }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={hacer}
        disabled={ocupado}
        className="inline-flex items-center gap-2 border border-[#1f1f2c] px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-[#7a7a8a] transition-colors hover:border-[#2f2f42] hover:text-[#a0a0b0] disabled:opacity-40"
      >
        {ocupado ? <Loader2 size={13} className="animate-spin" /> : archivada ? <Undo2 size={13} /> : <Archive size={13} />}
        {archivada ? "Devolver a Enviadas" : "Archivar"}
      </button>
      {!archivada && (
        <span className="text-[11px] text-[#6a6a7a]">
          Sale de la lista. No se borra nada: el historial y las métricas siguen ahí.
        </span>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

function CancelarProgramada({
  id, onHecho, cuando, zona,
}: {
  id: string; onHecho: () => void; cuando: string | null; zona: string | null
}) {
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancelar = async () => {
    if (!window.confirm("¿Cancelar el envío programado?")) return
    setOcupado(true); setError(null)
    try {
      const r = await fetch(`/api/admin/comunicaciones/${id}/cancelar`, { method: "POST", credentials: "include" })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo cancelar")
      onHecho()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cancelar")
    } finally { setOcupado(false) }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={cancelar}
        disabled={ocupado}
        className="inline-flex items-center gap-2 border border-[#3a1f1f] px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-[#c07a7a] transition-colors hover:border-red-800 hover:text-red-400 disabled:opacity-40"
      >
        {ocupado ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />} Cancelar programación
      </button>
      {cuando && (
        <span className="inline-flex items-center gap-1.5 text-xs text-[#6a6a7a]">
          <Clock size={12} /> saldría el {fechaCorta(cuando, zona)}
        </span>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

// ── Piezas sueltas ─────────────────────────────────────────────────────────

function Hallazgos({ v }: { v: Veredicto }) {
  return (
    <div className="space-y-2">
      {v.errores.map((h, i) => (
        <div key={`e${i}`} className="flex items-start gap-3 border border-[#3a1f1f] bg-[#1a0d0d]/60 p-3">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-xs leading-relaxed text-[#e0b0b0]">{h.mensaje}</p>
        </div>
      ))}
      {v.avisos.map((h, i) => (
        <div key={`a${i}`} className="flex items-start gap-3 border border-[#2a2416] bg-[#14110a]/60 p-3">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#c9a86b]" />
          <p className="text-xs leading-relaxed text-[#bdb192]">{h.mensaje}</p>
        </div>
      ))}
    </div>
  )
}

function Aviso({ tono, children }: { tono: "mal" | "neutro"; children: React.ReactNode }) {
  const cls = tono === "mal"
    ? "border-[#3a1f1f] bg-[#1a0d0d]/60 text-[#e0b0b0]"
    : "border-[#1f1f2c] bg-[#0d0d16]/60 text-[#8a8fa8]"
  return <div className={`border p-4 text-xs leading-relaxed ${cls}`}>{children}</div>
}

function Modal({ titulo, onCerrar, children }: { titulo: string; onCerrar?: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!onCerrar) return
    const alTeclado = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar() }
    window.addEventListener("keydown", alTeclado)
    const previo = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", alTeclado)
      document.body.style.overflow = previo
    }
  }, [onCerrar])

  return (
    <div
      className="fixed inset-0 z-[500] flex items-start justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm sm:items-center"
      style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar?.() }}
    >
      <div className="w-full max-w-lg border border-[#1f1f2c] bg-[#0a0a14] p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-[#F3F6FA] [font-family:var(--font-cinzel,serif)]">{titulo}</h3>
          {onCerrar && (
            <button type="button" onClick={onCerrar} aria-label="Cerrar" className="shrink-0 text-[#6a6a7a] transition-colors hover:text-[#F3F6FA]">
              <X size={18} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Fechas ─────────────────────────────────────────────────────────────────

function fechaCorta(iso: string, zona?: string | null): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return "—"
  try {
    return new Intl.DateTimeFormat("es-419", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: zona || undefined,
    }).format(d)
  } catch {
    return d.toLocaleString("es-419")
  }
}

/** ISO → el formato que entiende un input datetime-local, en hora local. */
function aLocal(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ""
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
