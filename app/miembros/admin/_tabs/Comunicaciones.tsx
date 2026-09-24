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
  AlertTriangle, ArrowLeft, Calendar, Check, Clock, Copy, Loader2, Mail,
  Monitor, Plus, Send, Smartphone, Trash2, Users, X,
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
  roles?: string[] | null
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
  const [pestana, setPestana] = useState<"borradores" | "programadas" | "enviadas">("borradores")
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
        {(["borradores", "programadas", "enviadas"] as const).map((p) => (
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

      {error && <Aviso tono="mal">{error}</Aviso>}

      {cargando ? (
        <div className="flex items-center gap-2 py-12 text-sm text-[#7a7a8a]">
          <Loader2 size={15} className="animate-spin" /> Cargando…
        </div>
      ) : filas.length === 0 ? (
        <Vacio pestana={pestana} onCrear={() => setEligiendoTipo(true)} />
      ) : (
        <div className="space-y-2">
          {filas.map((f) => <FilaComunicacion key={f.id} f={f} onAbrir={onAbrir} />)}
        </div>
      )}

      {eligiendoTipo && <ElegirTipo onElegir={crear} onCerrar={() => setEligiendoTipo(false)} />}
    </div>
  )
}

function FilaComunicacion({ f, onAbrir }: { f: Fila; onAbrir: (id: string) => void }) {
  const est = ESTADOS[f.status] ?? ESTADOS.draft
  const tipo = TIPOS.find((t) => t.id === f.type)

  return (
    <button
      type="button"
      onClick={() => onAbrir(f.id)}
      className="flex w-full flex-col gap-3 border border-[#1a1a24] bg-[#0d0d16]/60 p-4 text-left transition-colors hover:border-[#2f2f42] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
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
      </div>

      <div className="flex shrink-0 items-center gap-5 text-right">
        {f.recipients_estimated != null && (
          <Cifra valor={f.recipients_estimated} etiqueta="destinatarios" />
        )}
        {f.status === "sent" && f.metrics?.aperturas != null && (
          <Cifra valor={f.metrics.aperturas} etiqueta="aperturas" />
        )}
      </div>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <div className="space-y-5">
          <Campos c={c} editar={editar} editable={editable} llevaFecha={Boolean(tipo?.fecha)} />
        </div>
        <div className="space-y-5">
          <Previsualizacion c={c} />
          {editable && <Prueba id={id} asunto={c.subject} />}
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
        <ResumenFinal c={c} onCerrar={() => setPaso(null)} onEnviada={() => { setPaso(null); void cargar() }} />
      )}
    </div>
  )
}

// ── Los campos ─────────────────────────────────────────────────────────────

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
      <Bloque titulo="En la bandeja de entrada" nota="Lo único que se ve antes de abrir el correo.">
        <div>
          <label className={labelCls}>Asunto</label>
          <input type="text" placeholder="Nueva transmisión disponible" {...campo("subject")} />
        </div>
        <div>
          <label className={labelCls}>Preheader</label>
          <input type="text" placeholder="La línea que Gmail enseña detrás del asunto" {...campo("preheader")} />
        </div>
      </Bloque>

      <Bloque titulo="El correo">
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
          <textarea rows={9} placeholder={"Escribe con normalidad.\n\nDeja una línea en blanco entre párrafos.\n\n- Una línea que empieza por guion es un punto de lista\n- Y **así** se pone algo en negrita"} {...campo("body")} />
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#6a6a7a]">
            Línea en blanco = párrafo nuevo · «- » al principio = punto de lista · **negrita**
          </p>
          {/* La personalización, dicha donde se usa y no en un manual aparte. */}
          <p className="mt-2 border-l-2 border-[#2f2f42] pl-3 text-[11px] leading-relaxed text-[#8a8fa8]">
            Escribe <code className="text-[#c3b2e0]">{"{nombre}"}</code> donde quieras el nombre
            de quien lo recibe, también en el titular. Cada persona verá el suyo. Quien no lo
            tenga guardado leerá «viajero», nunca un hueco.
          </p>
        </div>
        <div>
          <label className={labelCls}>Imagen (opcional)</label>
          <input type="url" placeholder="https://…" {...campo("image_url")} />
          <p className="mt-1.5 text-[11px] text-[#6a6a7a]">
            Va debajo del titular a propósito: muchos clientes no cargan imágenes
            hasta que se lo piden, y si fuera lo primero el correo abriría vacío.
          </p>
        </div>
      </Bloque>

      <Bloque titulo="El botón">
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

  const cambiar = (parcial: Partial<Audiencia>) =>
    editar("audience", { kind: "todos", temporadaMin: a.temporadaMin ?? null, roles: a.roles ?? null, ...parcial })

  const alternarRol = (id: string) => {
    const nuevos = roles.includes(id) ? roles.filter((r) => r !== id) : [...roles, id]
    cambiar({ roles: nuevos.length > 0 ? nuevos : null })
  }

  return (
    <Bloque titulo="A quién va" nota="Sin tocar nada, va a todos. Cada filtro que añades, a menos gente.">
      <div>
        <label className={labelCls}>Por avance en el camino</label>
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
          «Temporada 3+» es quien ha llegado a la tercera o más allá: por haber visto
          algún capítulo de ella, o por tener su acceso.
        </p>
      </div>

      <div>
        <label className={labelCls}>Por rol en La Red</label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
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
        <p className="mt-2 text-[11px] leading-relaxed text-[#6a6a7a]">
          Sin ninguno marcado, el rol da igual. Con varios, basta con tener uno de ellos.
        </p>
      </div>

      <div className="border-t border-[#14141e] pt-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Va a</p>
        <p className="mt-1 text-sm text-[#F3F6FA]">{describir(a)}</p>
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
function describir(a?: Audiencia | null): string {
  if (!a) return "Todos los miembros activos"
  const partes: string[] = []
  if (a.temporadaMin) partes.push(`que llegaron a la Temporada ${a.temporadaMin} o más`)
  if (a.roles?.length) {
    partes.push(`con rol de ${a.roles.map((r) => ROLES.find((x) => x.id === r)?.etiqueta ?? r).join(" o ")}`)
  }
  return partes.length === 0 ? "Todos los miembros activos" : `Miembros ${partes.join(", ")}`
}

function Bloque({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className="border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
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

function Prueba({ id, asunto }: { id: string; asunto: string }) {
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
  c, onCerrar, onEnviada,
}: {
  c: Comunicacion
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
          <Dato etiqueta="Audiencia" valor={describir(c.audience)} />
          <Dato
            etiqueta="Envío"
            valor={modo === "ahora" ? "Ahora" : fecha && hora ? `${fecha} · ${hora} · ${zona.split("/").pop()?.replace(/_/g, " ")}` : "—"}
          />
        </dl>

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
    if (!window.confirm("¿Borrar este borrador? No se puede deshacer.")) return
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
