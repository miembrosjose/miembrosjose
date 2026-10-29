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
import { MessageSquare,
  AlertTriangle, Archive, ArrowLeft, Bell, Calendar, Check, Clock, Copy, ImagePlus,
  Bold, Heading2, Italic, Link2, List, Loader2, Mail, Minus, Monitor,
  MoreVertical, Plus, Quote, Search, Send, Smartphone, Sparkles, Trash2,
  Undo2, Users, X,
} from "lucide-react"
import { inputCls, labelCls } from "./_shared"
import { EditorCodigo, PLANTILLAS } from "./EditorCodigo"
// La única cosa del servidor que se importa aquí: no toca la base, es un mapa
// de países y una cuenta de horas. Tener dos copias sería tener dos verdades.
import { avisoDeHora, type AvisoDeHora } from "@/lib/comunicaciones/horas"

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
  { id: "lanzamiento", nombre: "Próximo lanzamiento", desc: "Algo que estará disponible pronto. Se anuncia antes de abrirlo.", fecha: false },
  { id: "recursos", nombre: "Nuevos recursos", desc: "Guías, meditaciones, materiales y herramientas de preparación.", fecha: false },
  { id: "recordatorio", nombre: "Recordatorio", desc: "Para quien dejó algo a medias o lleva tiempo sin aparecer.", fecha: false },
] as const

/**
 * Lo que se ofrece al crear una NOTIFICACIÓN.
 *
 * ── POR QUÉ SON CINCO Y NO LOS NUEVE DEL CORREO ───────────────────────────
 * Porque en un aviso al teléfono el tipo solo decide una cosa: qué interruptor
 * de las preferencias respeta. Las otras dos que distinguen a los nueve —la
 * plantilla del correo y el bloque de fecha— no existen aquí: una notificación
 * tiene título, texto y destino, y la pinta el sistema operativo.
 *
 * Y de los nueve tipos solo salen CINCO interruptores distintos. Es decir:
 *
 *   «Nuevos recursos»          hace exactamente lo mismo que «Nuevo contenido»
 *   «Activación»               lo mismo que «Sesión en vivo»
 *   «Comunicación especial»    lo mismo que «Novedades de La Red»
 *   «Próximo lanzamiento»      lo mismo que «Novedades de La Red»
 *
 * Ofrecer nueve tarjetas de las que cuatro no cambian nada —ni a quién llega,
 * ni cómo se ve, ni qué respeta— y no decir cuáles son las repetidas es pedir
 * una decisión que no existe. Lo que se aprende de una pantalla así es a
 * dejar de fiarse de ella.
 *
 * ── Y POR QUÉ EN EL CORREO SÍ SE GANAN LAS NUEVE ──────────────────────────
 * Allí el tipo elige plantilla. Una sesión en vivo se dibuja distinta de un
 * episodio nuevo y lleva su bloque de fecha con zona horaria. Esa diferencia
 * se ve en la bandeja de entrada, así que allí los nueve tienen sentido.
 *
 * ── EL TIPO QUE SE GUARDA ─────────────────────────────────────────────────
 * Cada grupo guarda uno de los nueve de siempre: no se inventa ningún tipo
 * nuevo, y una comunicación creada aquí se puede pasar a correo sin más.
 *
 * Estos nombres son los MISMOS que ve el miembro en sus preferencias. Que el
 * panel ofrezca justo lo que el otro lado puede apagar es lo que hace que
 * elegir aquí signifique algo.
 */
const TIPOS_PUSH = [
  {
    id: "contenido",
    nombre: "Contenidos y recursos",
    desc: "Episodios, módulos, transmisiones, guías y materiales.",
  },
  {
    id: "sesion",
    nombre: "Sesiones y activaciones",
    desc: "Lo que ocurre en directo, con momento señalado.",
  },
  {
    id: "encuentro",
    nombre: "Encuentros de La Red",
    desc: "Encuentros y convocatorias de la comunidad.",
  },
  {
    id: "novedades",
    nombre: "Novedades y anuncios",
    desc: "Lo que está ocurriendo, y lo que está por llegar.",
  },
  {
    id: "recordatorio",
    nombre: "Recordatorio",
    desc: "Para quien dejó algo a medias o lleva tiempo sin aparecer.",
  },
] as const

/**
 * Cómo se llama este tipo, en el idioma del canal por el que sale.
 *
 * Quien crea una notificación elige entre cinco grupos; si luego la lista
 * dijera el nombre del tipo del correo que hay debajo —«Novedades de La
 * Red» donde eligió «Novedades y anuncios»— parecería que la plataforma
 * cambió su decisión por su cuenta.
 */
function nombreDeTipo(tipo: string, canal: string): string {
  if (canal === "push") {
    const grupo = TIPOS_PUSH.find((t) => t.id === tipo)
    if (grupo) return grupo.nombre
  }
  return TIPOS.find((t) => t.id === tipo)?.nombre ?? tipo
}

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
  /** Empezó esa temporada y no la terminó. El segmento de la continuidad. */
  empezoSinTerminar?: number | null
  roles?: string[] | null
  insignias?: string[] | null
  /** Sin señales de vida desde hace estos días o más. */
  inactivoDias?: number | null
  /** Lo contrario: que haya aparecido en los últimos días. */
  activoDias?: number | null
  paises?: string[] | null
  ciudades?: number[] | null
  /** Nombradas una por una. Se cruza con los demás filtros, no los sustituye. */
  personas?: string[] | null
}

/** Lo que el servidor dice que se puede ofrecer. Nunca una copia a mano. */
type Filtros = {
  temporadas: number[]
  roles: Array<{ id: string; etiqueta: string }>
  insignias: Array<{ grupo: string; items: Array<{ id: string; etiqueta: string }> }>
  total_insignias: number
  /** Los tramos de tiempo que se ofrecen, con su nombre en palabras. */
  tramos_dias?: Array<{ dias: number; etiqueta: string }>
  /** Solo donde hay gente, con cuánta hay. Un filtro que da cero no se ofrece. */
  paises?: Array<{ id: string; etiqueta: string; cuantos: number }>
  ciudades?: Array<{ id: number; etiqueta: string; pais: string; cuantos: number }>
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

/** Por dónde puede salir una comunicación. */
type Canal = "email" | "push" | "interno" | "dm"

type Fila = {
  id: string
  /** Por dónde sale. Lo que se creó antes de que existiera el push es correo. */
  canal: "email" | "push"
  /**
   * Todos los canales por los que va. `canal` es el primero de esta lista y
   * se conserva porque alguna consulta vieja puede leerlo todavía.
   *
   * Puede llegar indefinida: entre desplegar y correr el SQL hay un hueco en
   * el que la columna no existe. Se cae a `[canal]`, que es lo que la fila
   * quería decir.
   */
  canales?: Canal[]
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
  // ── DENTRO DE LA PLATAFORMA ──────────────────────────────────────────────
  // Admiten nulo y caen a los del correo: marcar «también dentro» en algo ya
  // escrito no obliga a reescribirlo.
  interno_titulo: string | null
  interno_cuerpo: string | null
  interno_image_url: string | null
  interno_cta_text: string | null
  interno_cta_url: string | null
  interno_cta_accion: "telegram" | null
  dm_texto: string | null
  dm_enviado_at: string | null
  dm_enviados: number | null

  display_mode: "feed" | "modal_once"
  audiencia_hasta: string | null
  published_at: string | null

  // ── EL CORREO ESCRITO A MANO ─────────────────────────────────────────────
  email_modo: "visual" | "codigo"
  email_html: string | null

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

/**
 * Las cuatro formas de comunicar.
 *
 * ── POR QUÉ UNA SOLA, Y NO VARIAS A LA VEZ ────────────────────────────────
 * Se probó con casillas combinables y no funcionaba. Correo y notificación
 * escriben en las MISMAS columnas —`subject` es el asunto y también el
 * título, `body` es el cuerpo y también el texto— así que marcar los dos
 * dejaba dos formularios editando lo mismo sin decirlo: acortar el asunto
 * para que quepa en el móvil y encontrarse el correo con cuatro palabras.
 *
 * Y un mensaje directo no se parece a ninguno de los otros tres: no se
 * «publica» ni se «envía a una lista», se le escribe a alguien y contesta.
 *
 * Una comunicación, una forma. Si hay que decir lo mismo por dos sitios, se
 * duplica —que ya existe el botón— y cada copia se escribe como toca.
 */
const CANALES: Array<{ id: Canal; nombre: string; que: string; largo: string }> = [
  {
    id: "email",
    nombre: "Correo",
    que: "A la bandeja de entrada.",
    largo: "Llega a la bandeja de entrada. Admite titular, imagen y texto largo. "
      + "Se puede programar para otro día. Respeta a quien se dio de baja.",
  },
  {
    id: "push",
    nombre: "Notificación",
    que: "Suena en el móvil.",
    largo: "Suena en el teléfono al momento, aunque la plataforma esté cerrada. "
      + "Un título y dos líneas. Solo a quien los activó.",
  },
  {
    id: "interno",
    nombre: "Dentro de la plataforma",
    que: "Espera a que entre.",
    largo: "Espera dentro de Los 144000 hasta que la persona entra. No depende de "
      + "nada: ni del correo, ni de que tenga los avisos activados. Puede quedarse "
      + "esperando o interrumpir una vez.",
  },
  {
    id: "dm",
    nombre: "Mensaje directo",
    que: "A su bandeja de mensajes.",
    largo: "Un mensaje privado de verdad, en su bandeja, donde puede responderte. "
      + "Abre una conversación con cada persona, así que no se deshace: avisa de "
      + "cuántas va a abrir antes de hacerlo.",
  },
]

const CANAL = (id: Canal) => CANALES.find((c) => c.id === id)

/** Cómo se llama lo que crea el botón de cada pantalla. */
const NUEVA = (canal: Canal) => ({
  email: "Nuevo correo",
  push: "Nueva notificación",
  interno: "Nuevo comunicado",
  dm: "Nuevo mensaje directo",
}[canal] ?? "Nueva comunicación")

/** El dibujo de cada canal. Aparte del catálogo: eso es texto, esto es React. */
const ICONO_CANAL: Record<Canal, typeof Mail> = {
  email: Mail,
  push: Bell,
  interno: MessageSquare,
  dm: Send,
}

/**
 * Los canales de una comunicación, con el hueco cubierto.
 *
 * Entre desplegar este código y correr el SQL que crea `canales` hay horas
 * o días. En ese hueco la columna no llega, y sin esto la pantalla diría que
 * la comunicación no sale por ningún sitio.
 */
function canalesDe(c: { canal: "email" | "push"; canales?: Canal[] }): Canal[] {
  const v = c.canales
  return Array.isArray(v) && v.length > 0 ? v : [c.canal]
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

/**
 * Una pantalla por forma de comunicar.
 *
 * ── POR QUÉ CUATRO PANTALLAS Y UN SOLO COMPONENTE ─────────────────────────
 * Las cuatro comparten lo caro: el motor de audiencias con sus filtros, el
 * ciclo de borrador, la lista con su búsqueda y su borrado en bloque, y el
 * registro de quién hizo qué.
 *
 * Escribirlas cuatro veces sería tener cuatro listas de filtros que se
 * separan: el día que se ajuste uno, quedará ajustado en una pantalla y mal
 * en las otras tres. Eso ya pasó en este proyecto con las categorías, que
 * vivían en cuatro archivos.
 *
 * Así que lo que cambia es el canal que se le pasa. La lista enseña solo lo
 * suyo, el editor enseña solo los campos que ese canal usa, y «Nueva» crea
 * directamente sin preguntar por dónde sale: ya se sabe, es la pantalla en la
 * que estás.
 */
export function Comunicaciones({ canal = "email" }: { canal?: Canal }) {
  const [abierta, setAbierta] = useState<string | null>(null)
  return abierta
    ? <Editor id={abierta} onVolver={() => setAbierta(null)} />
    : <Lista onAbrir={setAbierta} canal={canal} />
}

// ── La lista ───────────────────────────────────────────────────────────────

function Lista({ onAbrir, canal }: { onAbrir: (id: string) => void; canal: Canal }) {
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
      // ── CADA PANTALLA, LO SUYO ──────────────────────────────────────
      // Se filtra aquí y no en el servidor porque son cien filas como
      // mucho y la consulta ya está hecha. Si algún día crecen, el filtro
      // sube a la petición; hasta entonces, una ida y vuelta menos.
      setFilas((j.comunicaciones || []).filter((f: Fila) => canalesDe(f)[0] === canal))
      setConteos(j.conteos || {})
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar")
    } finally {
      setCargando(false)
    }
  }, [pestana, canal])

  useEffect(() => { void cargar() }, [cargar])

  // ── BORRAR VARIOS BORRADORES ──────────────────────────────────────────
  // Solo en la pestaña de borradores. En las demás no hay nada que borrar
  // en bloque: lo enviado es historial, y lo programado se cancela, no se
  // borra.
  const [marcados, setMarcados] = useState<string[]>([])
  const [borrando, setBorrando] = useState(false)

  // Al cambiar de pestaña o de búsqueda se suelta lo marcado. Si no, se
  // podría acabar borrando lo que ya no se ve: los identificadores siguen
  // siendo válidos y el servidor obedecería.
  useEffect(() => { setMarcados([]) }, [pestana, busca])

  const q = busca.trim().toLowerCase()
  const filtradas = q
    ? filas.filter((f) =>
        (f.subject || "").toLowerCase().includes(q) ||
        (f.internal_title || "").toLowerCase().includes(q))
    : filas

  /**
   * El botón de «nueva».
   *
   * En correo y notificación abre el diálogo del tipo, que decide la
   * plantilla y qué preferencia del miembro gobierna el envío. En los otros
   * dos el tipo no gobierna nada, así que crea y entra directamente: una
   * pregunta cuya respuesta da igual es una pregunta de más.
   */
  const nueva = () => {
    if (canal === "email" || canal === "push") setEligiendoTipo(true)
    else void crear("especial", canal)
  }

  const borrarMarcados = async () => {
    if (marcados.length === 0) return
    const cuantos = marcados.length
    if (!window.confirm(
      `Eliminar ${cuantos} ${cuantos === 1 ? "borrador" : "borradores"}.\n\n` +
      "Se eliminan de forma permanente. No se puede deshacer.",
    )) return

    setBorrando(true)
    setError(null)
    try {
      // Una sola petición, no una por fila: catorce peticiones desde el
      // navegador son catorce formas de quedarse a medias.
      const r = await fetch("/api/admin/comunicaciones/borrar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: marcados }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo borrar")

      setMarcados([])
      await cargar()

      // Lo que NO se borró se dice, con su motivo. Sin esto la pantalla
      // diría «14 borradas» habiendo borrado 13.
      if (Array.isArray(j.conservadas) && j.conservadas.length > 0) {
        setError(
          `Se borraron ${j.borradas}. No se borraron: ${j.conservadas.join(" · ")}.`,
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar")
    } finally {
      setBorrando(false)
    }
  }

  const crear = async (tipo: string, canal: Canal) => {
    try {
      const r = await fetch("/api/admin/comunicaciones", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tipo, canal }),
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
          onClick={nueva}
          className="inline-flex shrink-0 items-center justify-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30"
        >
          <Plus size={14} /> {NUEVA(canal)}
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

      {/* ── SELECCIONAR PARA BORRAR ────────────────────────────────────
          «Todos» son los que se ven AHORA, no todos los borradores que
          existen. Con una búsqueda escrita eso es lo que cualquiera espera,
          y la alternativa —seleccionar cosas que no están en pantalla— es
          como se borra lo que no se quería. */}
      {pestana === "borradores" && filtradas.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border border-[#1f1f2c] bg-[#0d0d16]/60 px-3 py-2.5">
          <button
            type="button"
            onClick={() =>
              setMarcados(
                marcados.length === filtradas.length ? [] : filtradas.map((f) => f.id),
              )
            }
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[#8a8fa8] transition-colors hover:text-[#c3b2e0]"
          >
            <span
              aria-hidden
              className={`grid h-4 w-4 place-items-center border ${
                marcados.length === filtradas.length
                  ? "border-[#6D4A9B] bg-[#6D4A9B] text-white"
                  : "border-[#3a3a4a]"
              }`}
            >
              {marcados.length === filtradas.length && <Check size={11} />}
            </span>
            {marcados.length === filtradas.length ? "Ninguno" : "Todos los visibles"}
          </button>

          <span className="text-[11px] text-[#6a6a7a]">
            {marcados.length > 0
              ? `${marcados.length} ${marcados.length === 1 ? "marcado" : "marcados"}`
              : `${filtradas.length} en pantalla`}
          </span>

          {marcados.length > 0 && (
            <button
              type="button"
              onClick={borrarMarcados}
              disabled={borrando}
              className="ml-auto inline-flex items-center gap-2 border border-[#4a1f2a] bg-[#1a0d12]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e0a0b0] transition-colors hover:border-red-500/60 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {borrando
                ? <><Loader2 size={12} className="animate-spin" /> Eliminando…</>
                : <><Trash2 size={12} /> Eliminar</>}
            </button>
          )}
        </div>
      )}

      {error && <Aviso tono="mal">{error}</Aviso>}

      {cargando ? (
        <div className="flex items-center gap-2 py-12 text-sm text-[#7a7a8a]">
          <Loader2 size={15} className="animate-spin" /> Cargando…
        </div>
      ) : filas.length === 0 ? (
        <Vacio pestana={pestana} onCrear={nueva} canal={canal} />
      ) : (
        <div className="space-y-2">
          {filtradas.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6a6a7a]">
              Nada coincide con «{busca}».
            </p>
          ) : (
            filtradas.map((f) => (
              <div key={f.id} className="flex items-start gap-2">
                {pestana === "borradores" && (
                  <button
                    type="button"
                    onClick={() =>
                      setMarcados((v) =>
                        v.includes(f.id) ? v.filter((x) => x !== f.id) : [...v, f.id],
                      )
                    }
                    aria-label={marcados.includes(f.id) ? "Quitar de la selección" : "Seleccionar"}
                    className={`mt-4 grid h-4 w-4 shrink-0 place-items-center border transition-colors ${
                      marcados.includes(f.id)
                        ? "border-[#6D4A9B] bg-[#6D4A9B] text-white"
                        : "border-[#3a3a4a] hover:border-[#6D4A9B]"
                    }`}
                  >
                    {marcados.includes(f.id) && <Check size={11} />}
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <FilaComunicacion f={f} onAbrir={onAbrir} onCambio={cargar} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* El canal ya está decidido: es esta pantalla. Lo único que queda
          por elegir es el TIPO, y solo cuando hay correo: es lo que decide
          la plantilla y qué preferencia gobierna el envío. En los otros tres
          canales no gobierna nada, así que se crea directamente. */}
      {/* El canal ya está decidido: es esta pantalla. Lo que queda por
          elegir es el TIPO, y solo en correo y notificación: ahí decide la
          plantilla y qué preferencia del miembro gobierna el envío.

          En los otros dos no gobierna nada, así que no se pregunta. */}
      {eligiendoTipo && (canal === "email" || canal === "push") && (
        <ElegirTipoDeCorreo
          canal={canal}
          onElegir={(t) => crear(t, canal)}
          onCerrar={() => setEligiendoTipo(false)}
        />
      )}
    </div>
  )
}

function FilaComunicacion({ f, onAbrir, onCambio }: {
  f: Fila
  onAbrir: (id: string) => void
  onCambio: () => void
}) {
  const est = ESTADOS[f.status] ?? ESTADOS.draft
  const nombreTipo = nombreDeTipo(f.type, f.canal)

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
          {/* El canal, antes que nada: lo primero que hay que saber de una
              fila es si eso sonó en el teléfono de alguien o llegó a una
              bandeja. Se dibuja distinto porque se deshacen distinto: un
              correo se puede ignorar, un aviso ya interrumpió. */}
          {/* Una etiqueta por canal. Antes era un «o esto o lo otro»; ahora
              una comunicación puede ir por dos sitios a la vez, y la fila
              tiene que decirlo o no se sabe qué se mandó. */}
          {canalesDe(f).map((can) => {
            const pinta = {
              push: { Icono: Bell, texto: "Notificación", cls: "border-[#6D4A9B] text-[#c3b2e0]" },
              interno: { Icono: MessageSquare, texto: "En la plataforma", cls: "border-[#3a5a4a] text-[#7ec8a0]" },
              dm: { Icono: Send, texto: "Mensaje directo", cls: "border-[#4a3a5a] text-[#c3b2e0]" },
              email: { Icono: Mail, texto: "Correo", cls: "border-[#2a2a3a] text-[#8a8fa8]" },
            }[can]
            if (!pinta) return null
            const { Icono } = pinta
            return (
              <span
                key={can}
                className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] ${pinta.cls}`}
              >
                <Icono size={9} /> {pinta.texto}
              </span>
            )
          })}
          {/* El tipo solo dice algo cuando hay correo: es lo que decide la
              plantilla y la preferencia. En una interna pura no gobierna
              nada, y enseñarlo haría pensar que sí. */}
          {canalesDe(f).includes("email") && (
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#6a6a7a]">
              {nombreTipo}
            </span>
          )}
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

function Vacio({ pestana, onCrear, canal }: {
  canal: Canal; pestana: string; onCrear: () => void
}) {
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
          <Plus size={13} /> {NUEVA(canal)}
        </button>
      )}
    </div>
  )
}

/**
 * Dos preguntas, en este orden: por dónde sale, y qué es.
 *
 * ── POR QUÉ EL CANAL VA PRIMERO ───────────────────────────────────────────
 * Porque cambia todo lo que viene después. Un correo se lee sentado, acepta
 * un titular, una imagen y cinco párrafos. Una notificación interrumpe, y lo
 * que cabe es un título y dos líneas. Preguntarlo al final habría dejado a
 * alguien escribiendo un correo entero para descubrir luego que de todo eso
 * solo salen dos líneas.
 *
 * ── POR QUÉ LA NOTIFICACIÓN TAMBIÉN TIENE TIPO ────────────────────────────
 * Parece de más —en el teléfono no se ve el tipo por ninguna parte— pero el
 * tipo es lo que dice de qué va: quien apagó los avisos de sesiones en vivo
 * no quiere que le suene una sesión en vivo, ni por correo ni por teléfono.
 */
/**
 * Qué clase de correo.
 *
 * ── POR QUÉ YA NO PREGUNTA EL CANAL ───────────────────────────────────────
 * Porque lo contesta la pantalla en la que estás. Entrar a «Correo» y que te
 * pregunten si querías correo es pedir que repitas lo que acabas de elegir.
 *
 * ── Y POR QUÉ ESTO SÍ SE PREGUNTA ─────────────────────────────────────────
 * Porque decide dos cosas de verdad: con qué plantilla se dibuja y qué
 * preferencia del miembro gobierna el envío. Quien apaga «sesiones en vivo»
 * deja de recibir sesiones, y eso sale de aquí.
 *
 * En los otros tres canales no gobierna nada, así que ahí no se pregunta: se
 * crea directamente.
 */
function ElegirTipoDeCorreo({ canal, onElegir, onCerrar }: {
  /** De dónde se abrió. Correo y notificación tienen listas distintas. */
  canal: "email" | "push"
  onElegir: (t: string) => void
  onCerrar: () => void
}) {


  return (
    <Modal
      titulo={canal === "push" ? "¿De qué es el aviso?" : "¿Qué quieres comunicar?"}
      onCerrar={onCerrar}
    >
      {canal === "push" && (
        <p className="mb-4 border-l-2 border-[#2f2f42] pl-3 text-[11px] leading-relaxed text-[#8a8fa8]">
          Esto no se ve en el teléfono: decide a quién le llega. Son los mismos
          cinco grupos que cada miembro puede apagar en sus preferencias.
        </p>
      )}
      {/* Cinco en notificación y nueve en correo, y no es una simplificación:
          en un aviso al teléfono cuatro de los nueve no cambian nada. El
          porqué, en `TIPOS_PUSH`. */}
      <div className="grid gap-2 sm:grid-cols-2">
        {(canal === "push" ? TIPOS_PUSH : TIPOS).map((t) => (
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

  // ── PUBLICAR DENTRO DE LA PLATAFORMA ──────────────────────────────────
  // Estado propio, separado del de enviar el correo. Son dos operaciones
  // distintas que pueden fallar por motivos distintos, y compartir el
  // mensaje de error haría que un fallo de Resend pareciera un fallo al
  // publicar.
  const [publicando, setPublicando] = useState(false)
  const [errorPublicar, setErrorPublicar] = useState<string | null>(null)
  const [ocupadoDm, setOcupadoDm] = useState(false)

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

  // ── VERLA COMO LA VERÁN ────────────────────────────────────────────────
  // Se le pasa lo que hay escrito AHORA, sin guardar ni publicar nada. La
  // ventana vive en el layout de miembros, así que ya está montada: basta
  // con avisarla.
  const verComoLoVeran = useCallback(() => {
    if (!c) return
    window.dispatchEvent(new CustomEvent("los144k:previsualizar-aviso", {
      detail: {
        id: c.id,
        titulo: (c.interno_titulo || c.heading || c.subject || "Sin titular").trim(),
        cuerpo: (c.interno_cuerpo || c.body || "").trim(),
        imagen_url: c.interno_image_url || c.image_url || null,
        cta_text: c.interno_cta_text || null,
        cta_url: c.interno_cta_url || null,
        cta_accion: c.interno_cta_accion || null,
      },
    }))
  }, [c])

  // ── MANDAR COMO MENSAJE DIRECTO ────────────────────────────────────────
  //
  // Dos pasos a propósito: primero «ver a cuántos», después mandar. Es el
  // único canal que abre una fila por persona y el único que no se puede
  // retirar, así que saber que son setenta ANTES vale más aquí que en
  // ningún otro sitio.
  //
  // La confirmación dice el número, no «¿seguro?». «¿Seguro?» se contesta
  // que sí sin leer; «Abrir 68 conversaciones» hace pararse.
  const mandarDm = useCallback(async (soloMirar: boolean) => {
    setOcupadoDm(true)
    setErrorPublicar(null)
    try {
      if (!soloMirar) {
        const r = await fetch(`/api/admin/comunicaciones/${id}/enviar-dm`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ simular: true }),
        })
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || "No se pudo comprobar")
        if (!window.confirm(
          `Abrir ${j.personas} ${j.personas === 1 ? "conversación" : "conversaciones"}.\n\n` +
          "Cada persona recibe el mensaje en su bandeja y puede responderte.\n" +
          "No se puede retirar.",
        )) return
      }

      const r = await fetch(`/api/admin/comunicaciones/${id}/enviar-dm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simular: soloMirar }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo mandar")

      if (soloMirar) {
        window.alert(
          `Son ${j.personas} ${j.personas === 1 ? "persona" : "personas"}.\n\n` +
          "No se ha mandado nada todavía.",
        )
        return
      }

      // Se refleja sin recargar: lo único que cambia son dos columnas, y
      // recargar perdería lo que se estuviera escribiendo.
      setC((v) => (v ? {
        ...v,
        dm_enviado_at: new Date().toISOString(),
        dm_enviados: j.enviados ?? null,
      } : v))
    } catch (e) {
      setErrorPublicar(e instanceof Error ? e.message : "No se pudo mandar")
    } finally {
      setOcupadoDm(false)
    }
  }, [id])

  const publicarDentro = useCallback(async () => {
    setPublicando(true)
    setErrorPublicar(null)
    try {
      const r = await fetch(`/api/admin/comunicaciones/${id}/publicar`, {
        method: "POST",
        credentials: "include",
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo publicar")

      // Se refleja sin recargar la comunicación entera: lo único que cambia
      // son estas dos columnas, y una recarga completa perdería lo que
      // estuviera escribiéndose en ese momento.
      setC((v) => (v ? {
        ...v,
        published_at: j.published_at ?? new Date().toISOString(),
        audiencia_hasta: j.audiencia_hasta ?? v.audiencia_hasta,
      } : v))
    } catch (e) {
      setErrorPublicar(e instanceof Error ? e.message : "No se pudo publicar")
    } finally {
      setPublicando(false)
    }
  }, [id])

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

      {/* Aperturas y clics son del proveedor de correo. Un aviso no tiene
          nada de eso —nadie informa de si se miró la pantalla de bloqueo—
          así que en vez de cuatro cifras en cero se dice lo que sí se sabe:
          a cuántos teléfonos llegó, que lo guarda la propia fila. */}
      {c.status === "sent" && canalesDe(c).includes("email") && (
        <Resultados id={id} previstos={c.recipients_estimated} />
      )}
      {c.status === "sent" && canalesDe(c).includes("push") && (
        <ResultadosPush id={id} previstos={c.recipients_estimated} />
      )}

      {errorPublicar && <Aviso tono="mal">{errorPublicar}</Aviso>}

      {/* ── EL LAYOUT ───────────────────────────────────────────────────────
          Dos columnas en escritorio: lo que se escribe a la izquierda, lo que
          va a llegar a la derecha. La derecha se queda pegada al desplazar,
          porque la pregunta que uno se hace mientras escribe es «¿cómo está
          quedando?», y bajar a mirarla y volver rompe el hilo.

          En móvil se apilan y el preview va primero de la lista de la derecha:
          ahí no cabe tenerlo siempre a la vista, pero sí que esté cerca. */}
      <NavSecciones editable={editable} canales={canalesDe(c)} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
        <div className="space-y-5">
          {/* Los canales van ARRIBA del todo: es lo primero que hay que
              saber de una comunicación, y lo que decide qué campos de abajo
              significan algo. */}
          <CanalesYDentro
            c={c}
            editar={editar}
            editable={editable}
            onPublicar={publicarDentro}
            onVistaPrevia={verComoLoVeran}
            publicando={publicando}
            onEnviarDm={() => void mandarDm(false)}
            ocupadoDm={ocupadoDm}
          />
          <Campos c={c} editar={editar} editable={editable} llevaFecha={Boolean(tipo?.fecha)} />
          <AQuienLlega id={id} canal={canalesDe(c)[0]} />
        </div>
        {/* La columna de la derecha es «cómo va a llegar». Una comunicación
            que solo se queda dentro de la plataforma no llega a ninguna
            bandeja ni a ningún teléfono: su vista previa es el botón «Ver
            como lo verán», que está al lado de donde se escribe. */}
        {/* Una vista previa por canal. Si va por los dos, se ven las dos:
            la pregunta «¿cómo está quedando?» tiene dos respuestas y
            enseñar solo una es enseñar media verdad. */}
        {(canalesDe(c).includes("email") || canalesDe(c).includes("push")) && (
        <div className="space-y-5 lg:sticky lg:top-4">
          {canalesDe(c).includes("push") && <VistaPreviaPush c={c} />}
          {canalesDe(c).includes("email") && <Previsualizacion c={c} />}
          {editable && canalesDe(c).includes("push") && (
            <PruebaPush id={id} titulo={c.subject} onEnviada={setUltimaPrueba} />
          )}
          {editable && canalesDe(c).includes("email") && (
            <Prueba id={id} asunto={c.subject} onEnviada={setUltimaPrueba} />
          )}
        </div>
        )}
      </div>

      {veredicto && (veredicto.errores.length > 0 || veredicto.avisos.length > 0) && (
        <Hallazgos v={veredicto} />
      )}

      {editable && (
        <div className="flex flex-wrap items-center gap-3 border-t border-[#1a1a24] pt-6">
          {/* Enviar habla con Resend. Una comunicación que solo va por
              dentro no tiene nada que enviar: se publica, y eso tiene su
              propio botón arriba. */}
          {(canalesDe(c).includes("email") || canalesDe(c).includes("push")) && (
          <button
            type="button"
            disabled={!veredicto?.puedeEnviar}
            onClick={() => setPaso("audiencia")}
            className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Users size={14} /> Revisar audiencia y enviar
          </button>
          )}
          <Secundarios id={id} onVolver={onVolver} puedeBorrar />
          {(canalesDe(c).includes("email") || canalesDe(c).includes("push")) &&
            !veredicto?.puedeEnviar && (
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
const SECCIONES: Record<"email" | "push", Array<{ id: string; etiqueta: string }>> = {
  email: [
    { id: "bandeja", etiqueta: "Bandeja" },
    { id: "correo", etiqueta: "El correo" },
    { id: "boton", etiqueta: "Botón" },
    { id: "audiencia", etiqueta: "A quién va" },
  ],
  // Una notificación tiene tres cosas y ya: lo que se lee, a dónde lleva y a
  // quién le suena. El índice lo dice tal cual, para que nadie busque dónde
  // se pone la imagen.
  push: [
    { id: "aviso", etiqueta: "El aviso" },
    { id: "destino", etiqueta: "A dónde lleva" },
    { id: "audiencia", etiqueta: "A quién le suena" },
  ],
}

function NavSecciones({ editable, canales }: { editable: boolean; canales: Canal[] }) {
  // ── EL ÍNDICE ES LA SUMA DE LOS CANALES ────────────────────────────────
  // Una comunicación que va por correo Y por notificación tiene los bloques
  // de los dos, así que el índice tiene que llevar a los dos. Antes salía de
  // un solo valor, y entonces la mitad de la pantalla no tenía entrada.
  //
  // Lo interno no pone secciones: son dos bloques y están arriba del todo.
  const lista = [
    ...(canales.includes("email") ? SECCIONES.email : []),
    ...(canales.includes("push") ? SECCIONES.push : []),
  ]
  if (!editable || lista.length === 0) return null
  return (
    <nav className="sticky top-0 z-10 -mx-4 flex gap-1 overflow-x-auto border-b border-[#14141e] bg-[#000000]/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
      {lista.map((s) => (
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

/**
 * Los campos de una notificación.
 *
 * ── POR QUÉ NO SON LOS MISMOS CON LA MITAD ESCONDIDA ──────────────────────
 * Porque no son los mismos campos con otro nombre. «Asunto» y «título» se
 * escriben distinto: un asunto puede ser una frase entera porque hay un correo
 * debajo que la explica; un título de notificación es lo único que mucha gente
 * va a leer, con la pantalla apagándose.
 *
 * Lo mismo con el cuerpo. Allí hay un editor con negritas, listas y citas,
 * porque el correo las pinta. Aquí no hay nada que pintar: el sistema
 * operativo enseña texto plano, así que el editor rico habría sido una
 * promesa falsa. Un recuadro de texto, y el contador diciendo cuánto se ve.
 */
function CamposPush({
  c, editar, editable,
}: {
  c: Comunicacion
  editar: (campo: string, v: unknown) => void
  editable: boolean
}) {
  const titulo = c.subject ?? ""
  const texto = c.body ?? ""

  return (
    <>
      <Bloque
        id="aviso"
        titulo="El aviso"
        nota="Lo que se lee en la pantalla de bloqueo, sin abrir nada."
      >
        <div>
          <label className={labelCls}>Título</label>
          <input
            type="text"
            placeholder="Nueva transmisión disponible"
            value={titulo}
            onChange={(e) => editar("subject", e.target.value)}
            disabled={!editable}
            className={inputCls}
          />
          <Contador largo={titulo.length} comodo={45} que="El teléfono corta el título" />
        </div>
        <div>
          <label className={labelCls}>Texto</label>
          <textarea
            rows={3}
            placeholder="José María acaba de publicar el cierre de la temporada."
            value={texto}
            onChange={(e) => editar("body", e.target.value)}
            disabled={!editable}
            className={`${inputCls} resize-y`}
          />
          <Contador largo={texto.length} comodo={120} que="En el aviso se ven unos" />
          <p className="mt-2 border-l-2 border-[#2f2f42] pl-3 text-[11px] leading-relaxed text-[#8a8fa8]">
            Aquí no hay negritas ni enlaces: el teléfono enseña texto tal cual.
            Y no empieza con «Hola, semilla estelar» —eso es del correo—: un
            aviso tiene dos líneas y el saludo se come una.
          </p>
        </div>
      </Bloque>

      <Bloque
        id="destino"
        titulo="A dónde lleva"
        nota="Dónde se abre la plataforma cuando alguien toca el aviso."
      >
        <div>
          <label className={labelCls}>Destino</label>
          <input
            type="text"
            placeholder="/miembros/transmisiones"
            value={c.cta_url ?? ""}
            onChange={(e) => editar("cta_url", e.target.value)}
            disabled={!editable}
            className={inputCls}
          />
          <p className="mt-2 text-[11px] leading-relaxed text-[#6a6a7a]">
            Una ruta de la plataforma —<code className="text-[#c3b2e0]">/miembros/transmisiones</code>—
            o una dirección completa. Si lo dejas vacío, se abre por el inicio.
          </p>
        </div>
      </Bloque>

      <Audiencias c={c} editar={editar} editable={editable} />

      <Bloque titulo="Para administración" nota="No se ve en el aviso. Es cómo la reconoces en la lista.">
        <div>
          <label className={labelCls}>Título interno</label>
          <input
            type="text"
            value={c.internal_title ?? ""}
            onChange={(e) => editar("internal_title", e.target.value)}
            disabled={!editable}
            className={inputCls}
          />
        </div>
      </Bloque>
    </>
  )
}

/**
 * Cuánto de lo escrito se va a leer.
 *
 * No impide pasarse —a veces la frase necesita esa palabra de más y el corte
 * cae en buen sitio— pero lo dice mientras se escribe, que es cuando sirve.
 * Enterarse al enviar es enterarse tarde.
 */
function Contador({ largo, comodo, que }: { largo: number; comodo: number; que: string }) {
  const pasado = largo > comodo
  return (
    <p className={`mt-1.5 text-[11px] ${pasado ? "text-[#c9a86b]" : "text-[#5a5a6a]"}`}>
      {largo} caracteres · {que} cerca de los {comodo}
      {pasado && " — lo de más no se lee"}
    </p>
  )
}


/**
 * Los canales por los que sale, y lo que se ve dentro de la plataforma.
 *
 * ── POR QUÉ LOS CANALES SE ELIGEN AQUÍ Y NO SOLO AL CREAR ─────────────────
 * Porque al crear todavía no se sabe. Se empieza un correo, se escribe, y a
 * mitad se ve que además debería quedarse dentro de la plataforma para quien
 * no lo abra. Obligar a decidirlo antes de escribir una palabra lleva a
 * crearla dos veces.
 */
function CanalesYDentro({
  c, editar, editable, onPublicar, onVistaPrevia, publicando,
  onEnviarDm, ocupadoDm,
}: {
  c: Comunicacion
  editar: (campo: string, v: unknown) => void
  editable: boolean
  onPublicar: () => void
  onVistaPrevia: () => void
  publicando: boolean
  onEnviarDm: () => void
  ocupadoDm: boolean
}) {
  const canales = canalesDe(c)
  const dentro = canales.includes("interno")
  const yaPublicada = !!c.published_at

  // ── UNA SOLA FORMA POR COMUNICACIÓN ───────────────────────────────────
  //
  // Esto empezó siendo casillas combinables y no funcionaba. Correo y
  // notificación escriben en las MISMAS columnas —`subject` es el asunto y
  // también el título, `body` es el cuerpo y también el texto— así que
  // marcar los dos dejaba dos formularios editando lo mismo sin decirlo:
  // acortar el asunto para que quepa en el móvil y encontrarse el correo con
  // cuatro palabras.
  //
  // Si hay que decir lo mismo por dos sitios, se duplica la comunicación —el
  // botón ya existe— y cada copia se escribe como le toca.
  const elegir = (canal: Canal) => {
    if (canales[0] === canal) return
    editar("canales", [canal])
    // También `canal`. El servidor lo deriva solo, pero el navegador no lo
    // sabe hasta recargar, y es el navegador el que pinta el formulario, el
    // índice y la vista previa.
    editar("canal", canal)
  }

  const campo = (k: keyof Comunicacion) => ({
    value: (c[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      editar(k, e.target.value),
    disabled: !editable,
    className: inputCls,
  })

  return (
    <>
      {/* ── QUÉ ES ESTO ──────────────────────────────────────────────────
          No es un control: el canal es la pantalla en la que estás, y
          cambiarlo es cambiar de pantalla. Pero al abrir un borrador viejo
          desde una búsqueda hay que poder saber qué se está mirando sin
          deducirlo de qué campos aparecen. */}
      <div className="flex items-center gap-2.5 border border-[#1f1f2c] bg-[#0d0d16]/60 px-4 py-3">
        {(() => {
          const Icono = ICONO_CANAL[canales[0]] ?? Mail
          return <Icono size={15} className="shrink-0 text-[#a78bca]" />
        })()}
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#F3F6FA]">
            {CANAL(canales[0])?.nombre ?? "Correo"}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-[#7a7a8a]">
            {CANAL(canales[0])?.largo ?? ""}
          </p>
        </div>
      </div>

      {/* A QUIEN. Va aqui y no dentro del formulario de correo porque
          estos dos canales no tienen formulario de correo. Es el MISMO
          componente: duplicarlo seria tener dos listas de filtros que se
          desincronizan a la primera. */}
      {(canales[0] === "dm" || canales[0] === "interno") && (
        <Audiencias c={c} editar={editar} editable={editable} />
      )}

      {canales[0] === "dm" && (
        <Bloque
          id="mensaje"
          titulo="El mensaje"
          nota="Se lee en una burbuja de chat, no en un correo: sin titular, sin botón y sin pie."
        >
          <div>
            <label className={labelCls}>Texto</label>
            <textarea
              rows={6}
              placeholder="Hola. Te escribo para contarte…"
              value={c.dm_texto ?? ""}
              onChange={(e) => editar("dm_texto", e.target.value)}
              disabled={!editable}
              className={inputCls}
            />
          </div>

          {/* ── LO QUE HAY QUE SABER ANTES DE PULSAR ────────────────────
              Es el único canal que abre una fila por persona, y el único
              que no se puede retirar: una vez en su bandeja, está en su
              bandeja. Decirlo aquí, y no en un aviso al final, es lo que
              hace que nadie lo descubra después. */}
          <p className="border border-[#2a2420] bg-[#15120d]/50 p-3 text-[11px] leading-relaxed text-[#c8bfa8]">
            Esto abre una conversación con cada persona, y cada una puede
            responderte. No se puede retirar: una vez en su bandeja, está en su
            bandeja. No respeta la baja de los correos —darse de baja de las
            novedades no es decir «no me escribáis»— pero sí los bloqueos entre
            personas.
          </p>

          <div className="border-t border-[#1a1a24] pt-4">
            {c.dm_enviado_at ? (
              <p className="text-[11px] text-[#009d68]">
                Mandado el {new Date(c.dm_enviado_at).toLocaleString("es-ES")}
                {typeof c.dm_enviados === "number" && <> · {c.dm_enviados} conversaciones</>}.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                {/* Antes había aquí un «ver a cuántos» que contestaba con una
                    ventana del navegador y un número. Lo contesta mejor el
                    panel «A quién le llega», con nombres, justo debajo. */}
                <button
                  type="button"
                  onClick={onEnviarDm}
                  disabled={!editable || ocupadoDm || !(c.dm_texto || "").trim()}
                  className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {ocupadoDm ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {ocupadoDm ? "Mandando…" : "Mandar el mensaje"}
                </button>
              </div>
            )}
          </div>
        </Bloque>
      )}

      {dentro && (
        <Bloque
          id="dentro"
          titulo="Dentro de la plataforma"
          nota="Si lo dejas en blanco, se usa lo del correo."
        >
          <div>
            <label className={labelCls}>Titular</label>
            <input type="text" placeholder={c.heading || "Lo primero que se lee"} {...campo("interno_titulo")} />
          </div>

          <div>
            <label className={labelCls}>Texto</label>
            <textarea rows={5} placeholder="Deja una línea en blanco entre párrafos." {...campo("interno_cuerpo")} />
          </div>

          {/* ── CÓMO APARECE ────────────────────────────────────────────
              Dos opciones y no un interruptor suelto, porque «importante»
              no dice qué va a pasar. Esto sí: una espera, la otra
              interrumpe. */}
          <div>
            <label className={labelCls}>Cómo aparece</label>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
              {([
                {
                  id: "feed",
                  nombre: "Espera en los avisos",
                  que: "Aparece sin leer y la abre cuando quiera.",
                },
                {
                  id: "modal_once",
                  nombre: "Interrumpe una vez",
                  que: "Ventana que bloquea hasta cerrarla. No vuelve a salir nunca para esa persona.",
                },
              ] as const).map((op) => {
                const puesto = (c.display_mode ?? "feed") === op.id
                return (
                  <button
                    key={op.id}
                    type="button"
                    disabled={!editable}
                    onClick={() => editar("display_mode", op.id)}
                    aria-pressed={puesto}
                    className={`border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      puesto ? "border-[#6D4A9B] bg-[#6D4A9B]/15" : "border-[#1f1f2c] bg-[#0d0d16] hover:border-[#3a3a4a]"
                    }`}
                  >
                    <span className="text-xs font-medium text-[#F3F6FA]">{op.nombre}</span>
                    <span className="mt-1 block text-[11px] leading-snug text-[#7a7a8a]">{op.que}</span>
                  </button>
                )
              })}
            </div>
            {c.display_mode === "modal_once" && (
              <p className="mt-2 text-[11px] leading-relaxed text-[#8a8fa8]">
                Al publicarla se guarda la hora. Quien se registre después no la verá:
                un anuncio de hoy no debe salirle a quien llegue dentro de seis meses.
              </p>
            )}
          </div>

          {/* ── EL BOTÓN ────────────────────────────────────────────────
              O lleva a una dirección, o hace algo aquí dentro. Las dos
              cosas a la vez no: habría que decidir cuál gana, y quien
              rellenara las dos no sabría cuál se usa. */}
          <div>
            <label className={labelCls}>Botón (opcional)</label>
            <input type="text" placeholder="Unirme al canal de Telegram" {...campo("interno_cta_text")} />
          </div>

          {(c.interno_cta_text || "").trim() !== "" && (
            <div>
              <label className={labelCls}>Qué hace el botón</label>
              <select
                value={c.interno_cta_accion ?? "url"}
                disabled={!editable}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === "telegram") {
                    editar("interno_cta_accion", "telegram")
                    // Se limpia la dirección: si quedara puesta, el día que
                    // alguien cambiara la acción volvería a aparecer un
                    // destino que nadie recuerda haber escrito.
                    editar("interno_cta_url", "")
                  } else {
                    editar("interno_cta_accion", null)
                  }
                }}
                className={inputCls}
              >
                <option value="url">Lleva a una dirección</option>
                <option value="telegram">Abre Telegram (el mismo botón flotante)</option>
              </select>

              {c.interno_cta_accion === "telegram" ? (
                <p className="mt-2 text-[11px] leading-relaxed text-[#8a8fa8]">
                  No lleva ningún enlace. Hace lo mismo que el botón flotante de Telegram:
                  pide una invitación personal, a nombre de quien la pulsa. Un enlace fijo
                  se saltaría la comprobación de suscripción.
                </p>
              ) : (
                <div className="mt-3">
                  <label className={labelCls}>Dirección</label>
                  <input type="url" placeholder="https://..." {...campo("interno_cta_url")} />
                </div>
              )}
            </div>
          )}

          {/* ── PUBLICAR ────────────────────────────────────────────────
              Es su propio botón, separado del de enviar el correo. Son dos
              cosas distintas: una habla con Resend y puede fallar a medias,
              la otra pone una fecha en una columna. */}
          <div className="border-t border-[#1a1a24] pt-4">
            {yaPublicada ? (
              <p className="text-[11px] text-[#009d68]">
                Publicada dentro de la plataforma el{" "}
                {new Date(c.published_at!).toLocaleString("es-ES")}.
                {c.audiencia_hasta && (
                  <> Solo la ven las cuentas creadas antes de esa hora.</>
                )}
              </p>
            ) : (
              <>
                {/* ── VERLA ANTES DE PUBLICARLA ────────────────────────
                    Una ventana que interrumpe a setenta personas y no se
                    puede volver a enseñar tiene que poder mirarse antes.

                    La vista previa NO marca nada: se le pasa el contenido a
                    mano y el componente, al ver que es de prueba, se salta
                    la llamada que registra la lectura. Si marcara, quien la
                    previsualizara se quedaria sin verla de verdad. */}
                <button
                  type="button"
                  onClick={onVistaPrevia}
                  className="mb-3 inline-flex items-center gap-2 border border-[#2a2a3a] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#8a8fa8] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0]"
                >
                  <Smartphone size={13} /> Ver como lo veran
                </button>

                <button
                  type="button"
                  onClick={onPublicar}
                  disabled={!editable || publicando}
                  className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {publicando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  {publicando ? "Publicando…" : "Publicar dentro de la plataforma"}
                </button>
                <p className="mt-2 text-[11px] leading-relaxed text-[#7a7a8a]">
                  Esto no manda ningún correo. Deja la comunicación dentro de Los 144000
                  para quien entre a partir de ahora.
                </p>
              </>
            )}
          </div>
        </Bloque>
      )}
    </>
  )
}


/**
 * A quién le va a llegar esto, con nombres.
 *
 * ── POR QUÉ NO BASTA CON EL NÚMERO ────────────────────────────────────────
 * Porque un número no se puede comprobar. «68 personas» es igual de creíble
 * siendo correcto que estando mal: no hay forma de mirarlo y decir «falta
 * fulana» o «esa no debería estar».
 *
 * Con los nombres delante sí, y esa comprobación es lo único que hay entre
 * un filtro mal puesto y setenta personas recibiendo algo que no les tocaba.
 *
 * ── POR QUÉ SE PIDE Y NO SE CALCULA SOLO ──────────────────────────────────
 * Resolver la audiencia recorre varias tablas. Hacerlo en cada tecla que se
 * escribe en el cuerpo del correo sería gastar eso cien veces para una
 * pregunta que se hace dos: al empezar y antes de mandar.
 */
function AQuienLlega({ id, canal }: { id: string; canal: Canal }) {
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [datos, setDatos] = useState<{
    personas: Array<{ userId: string; email: string; nombre: string | null }>
    mas: number
    total: number
    excluidos: number
  } | null>(null)

  const pedir = async () => {
    setAbierto(true)
    setCargando(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/comunicaciones/${id}/audiencia`, {
        method: "POST",
        credentials: "include",
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo calcular")
      setDatos({
        personas: j.personas || [],
        mas: j.mas || 0,
        total: j.resumen?.destinatarios ?? (j.personas || []).length,
        excluidos: j.resumen?.excluidos ?? 0,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo calcular")
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="border border-[#1a1a24] bg-[#0d0d16]/40">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
          A quién le llega
        </h3>
        <button
          type="button"
          onClick={pedir}
          disabled={cargando}
          className="inline-flex items-center gap-2 border border-[#2a2a3a] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[#8a8fa8] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0] disabled:opacity-40"
        >
          {cargando
            ? <><Loader2 size={12} className="animate-spin" /> Calculando…</>
            : <><Users size={12} /> {abierto ? "Volver a calcular" : "Ver la lista"}</>}
        </button>
      </div>

      {error && (
        <p className="border-t border-[#1a1a24] px-4 py-3 text-[11px] text-red-300">{error}</p>
      )}

      {datos && !cargando && (
        <div className="border-t border-[#1a1a24]">
          <p className="px-4 py-3 text-xs text-[#a0a0b4]">
            <strong className="text-[#F3F6FA]">{datos.total}</strong>{" "}
            {datos.total === 1 ? "persona" : "personas"}
            {datos.excluidos > 0 && (
              <span className="text-[#7a7a8a]">
                {" "}· {datos.excluidos} fuera por sus preferencias
              </span>
            )}
          </p>

          {datos.personas.length === 0 ? (
            <p className="border-t border-[#1a1a24] px-4 py-4 text-[11px] text-[#e0a0b0]">
              No hay nadie. Con esta audiencia no sale nada.
            </p>
          ) : (
            <>
              {/* Se desplaza por dentro. Doscientos nombres empujando el
                  botón de enviar fuera de la pantalla es peor que no
                  enseñarlos. */}
              <ul className="max-h-72 overflow-y-auto border-t border-[#1a1a24]">
                {datos.personas.map((x) => (
                  <li
                    key={x.userId}
                    className="flex flex-wrap items-baseline gap-x-2 border-b border-[#14141e] px-4 py-2 last:border-b-0"
                  >
                    <span className="text-xs text-[#F3F6FA]">
                      {x.nombre?.trim() || "Sin nombre"}
                    </span>
                    {/* El correo también, porque dos personas pueden
                        llamarse igual y la cuenta es lo que las distingue. */}
                    <span className="text-[11px] text-[#6a6a7a]">{x.email}</span>
                  </li>
                ))}
              </ul>
              {datos.mas > 0 && (
                <p className="border-t border-[#1a1a24] px-4 py-2.5 text-[11px] text-[#7a7a8a]">
                  Y {datos.mas} más. Se enseñan las primeras {datos.personas.length} para
                  poder reconocer la audiencia; el número de arriba es el total.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
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
  // ── CADA CANAL, SUS CAMPOS ─────────────────────────────────────────────
  //
  // Un aviso al móvil no se escribe con los campos del correo a medias:
  // «asunto» y «título» no se escriben igual —un asunto puede ser una frase
  // entera porque hay un correo debajo que la explica; un título de
  // notificación es lo único que mucha gente va a leer, con la pantalla
  // apagándose. Ver `CamposPush`.
  //
  // Y si no sale por ninguno de los dos, no se enseña nada: el asunto, el
  // preencabezado y el botón no se ven en ningún sitio, y tenerlos delante
  // lleva a escribir el titular en «Asunto» y preguntarse por qué no sale.
  // Lo que se ve dentro de la plataforma lo pinta `CanalesYDentro`, arriba.
  const canales = canalesDe(c)
  const hayCorreo = canales.includes("email")
  const hayAviso = canales.includes("push")

  if (!hayCorreo && !hayAviso) return null
  if (hayAviso && !hayCorreo) return <CamposPush c={c} editar={editar} editable={editable} />

  const enCodigo = c.email_modo === "codigo"

  // ── LAS PLANTILLAS GUARDADAS ───────────────────────────────────────────
  // Se piden solo al entrar en modo código: quien escribe con el formulario
  // no las necesita, y una consulta de más en cada apertura del editor se
  // nota en el móvil.
  const [guardadas, setGuardadas] = useState<Array<{ id: string; nombre: string; que: string; html: string }>>([])

  const cargarGuardadas = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/comunicaciones/plantillas", { credentials: "include" })
      if (!r.ok) return
      const j = await r.json()
      setGuardadas((j.plantillas || []).map((t: { id: string; nombre: string; descripcion: string; html: string }) => ({
        id: t.id,
        nombre: t.nombre,
        que: t.descripcion || "Guardada por administración.",
        html: t.html,
      })))
    } catch { /* se queda con las de fábrica, que es suficiente para empezar */ }
  }, [])

  useEffect(() => { if (enCodigo) void cargarGuardadas() }, [enCodigo, cargarGuardadas])

  const campo = (k: keyof Comunicacion) => ({
    value: (c[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => editar(k, e.target.value),
    disabled: !editable,
    className: inputCls,
  })

  return (
    <>
      {/* ── LA BANDEJA VA EN LOS DOS MODOS ──────────────────────────────
          El asunto y el preencabezado no son parte del diseño: son lo que
          decide si alguien abre el correo. En modo código siguen haciendo
          falta, y de hecho el preencabezado se inyecta igual aunque quien
          escribe no se acuerde de él. */}
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

      {/* ── CÓMO SE ESCRIBE ─────────────────────────────────────────────
          El conmutador NO borra nada al cambiar: lo del formulario y lo del
          código se guardan en columnas distintas y conviven. Se puede ir y
          volver sin perder ninguno de los dos, que es lo que hace que
          probar el modo código no dé miedo. */}
      <Bloque id="modo" titulo="Cómo se escribe">
        <div className="flex border border-[#1f1f2c]">
          {([
            { id: "visual", nombre: "Formulario", que: "Titular, texto, imagen y botón." },
            { id: "codigo", nombre: "Código", que: "HTML a mano, para diseños propios." },
          ] as const).map((op) => (
            <button
              key={op.id}
              type="button"
              disabled={!editable}
              onClick={() => editar("email_modo", op.id)}
              aria-pressed={(c.email_modo ?? "visual") === op.id}
              className={`flex-1 p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                (c.email_modo ?? "visual") === op.id
                  ? "bg-[#6D4A9B]/20 text-[#F3F6FA]"
                  : "text-[#7a7a8a] hover:text-[#a0a0b4]"
              }`}
            >
              <span className="text-xs font-medium">{op.nombre}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-[#6a6a7a]">{op.que}</span>
            </button>
          ))}
        </div>

        {enCodigo && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-[#5a5a6a]">
                Partir de
              </span>
              {[...PLANTILLAS, ...guardadas].map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  disabled={!editable}
                  title={pl.que}
                  onClick={() => {
                    // Pisar lo escrito sin preguntar es la forma más rápida
                    // de perder media hora de trabajo.
                    if ((c.email_html || "").trim() &&
                        !window.confirm("Esto reemplaza lo que hay escrito.\n\n¿Seguir?")) return
                    editar("email_html", pl.html)
                  }}
                  className="border border-[#2a2a3a] px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-[#8a8fa8] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0] disabled:opacity-40"
                >
                  {pl.nombre}
                </button>
              ))}
            </div>

            <EditorCodigo
              valor={c.email_html ?? ""}
              onCambio={(v) => editar("email_html", v)}
              editable={editable}
            />

            {/* ── GUARDAR LO QUE SE ACABA DE DISEÑAR ──────────────────────
                Sin esto, un diseño que costó una tarde se queda dentro de
                un correo concreto y la siguiente vez se empieza de cero o
                se duplica esa comunicación entera para heredarlo. */}
            {editable && (c.email_html || "").trim() !== "" && (
              <button
                type="button"
                onClick={async () => {
                  const nombre = window.prompt(
                    "¿Cómo se va a llamar?\n\nSi ya existe una con ese nombre, se reemplaza.",
                  )
                  if (!nombre?.trim()) return
                  try {
                    const r = await fetch("/api/admin/comunicaciones/plantillas", {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ nombre, html: c.email_html }),
                    })
                    const j = await r.json()
                    if (!r.ok) throw new Error(j?.error || "No se pudo guardar")
                    await cargarGuardadas()
                  } catch (e) {
                    window.alert(e instanceof Error ? e.message : "No se pudo guardar")
                  }
                }}
                className="text-[11px] text-[#7a7a8a] underline underline-offset-2 transition-colors hover:text-[#c3b2e0]"
              >
                Guardar este diseño como plantilla
              </button>
            )}
          </>
        )}
      </Bloque>

      {/* En modo código, los campos del formulario no pintan nada: el cuerpo
          sale del HTML. Enseñarlos igual haría creer que se usan. */}
      {enCodigo ? null : (
      <>

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
      )}
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

  // Se manda la audiencia ENTERA en cada cambio, no solo lo que cambió.
  // El guardado junta campos de distintos tecleos en una sola petición, y un
  // parcial haría que marcar un país borrara el rol elegido medio segundo
  // antes.
  const cambiar = (parcial: Partial<Audiencia>) =>
    editar("audience", {
      kind: "todos",
      temporadaMin: a.temporadaMin ?? null,
      temporadaCompletada: a.temporadaCompletada ?? null,
      empezoSinTerminar: a.empezoSinTerminar ?? null,
      roles: a.roles ?? null,
      insignias: a.insignias ?? null,
      inactivoDias: a.inactivoDias ?? null,
      activoDias: a.activoDias ?? null,
      paises: a.paises ?? null,
      ciudades: a.ciudades ?? null,
      personas: a.personas ?? null,
      ...parcial,
    })

  const alternarRol = (id: string) => {
    const nuevos = roles.includes(id) ? roles.filter((r) => r !== id) : [...roles, id]
    cambiar({ roles: nuevos.length > 0 ? nuevos : null })
  }

  const alternarPais = (id: string) => {
    const ya = a.paises ?? []
    const nuevos = ya.includes(id) ? ya.filter((x) => x !== id) : [...ya, id]
    cambiar({ paises: nuevos.length > 0 ? nuevos : null })
  }

  const alternarCiudad = (id: number) => {
    const ya = a.ciudades ?? []
    const nuevas = ya.includes(id) ? ya.filter((x) => x !== id) : [...ya, id]
    cambiar({ ciudades: nuevas.length > 0 ? nuevas : null })
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

      {/* ── EMPEZÓ Y LO DEJÓ ───────────────────────────────────────────────
          El segmento más útil que tiene la plataforma, y el que no se puede
          construir con los dos de arriba: «llegó a la 3» incluye a quien la
          terminó, y los filtros de esta pantalla solo estrechan — no hay forma
          de decir «y que NO la haya terminado». Por eso tiene su propia fila. */}
      <div>
        <label className={labelCls}>Por preparación a medias</label>
        <p className="-mt-1 mb-2 text-[11px] text-[#6a6a7a]">
          Quien <strong className="text-[#8a8fa8]">empezó</strong> una temporada y no la ha
          terminado. Es a quien tiene sentido decirle «continúa donde lo dejaste».
        </p>
        <div className="flex flex-wrap gap-2">
          <Pastilla activa={!a.empezoSinTerminar} onClick={() => cambiar({ empezoSinTerminar: null })} desactivada={!editable}>
            Da igual
          </Pastilla>
          {[1, 2, 3, 4].map((n) => (
            <Pastilla
              key={n}
              activa={a.empezoSinTerminar === n}
              onClick={() => cambiar({ empezoSinTerminar: n })}
              desactivada={!editable}
            >
              Dejó la {n} a medias
            </Pastilla>
          ))}
        </div>
      </div>

      {/* ── CUÁNTO LLEVA SIN APARECER ──────────────────────────────────────
          Lo que hace posible una campaña de reactivación. Las dos direcciones
          se excluyen a propósito: pedir «sin aparecer en 30 días» y «apareció
          en los últimos 7» a la vez da siempre cero, y un cero sin explicación
          parece que la herramienta está rota. */}
      <div>
        <label className={labelCls}>Por tiempo sin aparecer</label>
        <p className="-mt-1 mb-2 text-[11px] text-[#6a6a7a]">
          Cuenta como aparecer tanto entrar en la plataforma como hacer algo en ella: un
          comentario, un capítulo, un corazón. Lo más reciente de las dos cosas.
        </p>
        <div className="flex flex-wrap gap-2">
          <Pastilla
            activa={!a.inactivoDias && !a.activoDias}
            onClick={() => cambiar({ inactivoDias: null, activoDias: null })}
            desactivada={!editable}
          >
            Da igual
          </Pastilla>
          {(filtros?.tramos_dias ?? TRAMOS).map((t) => (
            <Pastilla
              key={`in-${t.dias}`}
              activa={a.inactivoDias === t.dias}
              onClick={() => cambiar({ inactivoDias: t.dias, activoDias: null })}
              desactivada={!editable}
            >
              Sin aparecer {t.etiqueta}
            </Pastilla>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(filtros?.tramos_dias ?? TRAMOS).slice(0, 3).map((t) => (
            <Pastilla
              key={`ac-${t.dias}`}
              activa={a.activoDias === t.dias}
              onClick={() => cambiar({ activoDias: t.dias, inactivoDias: null })}
              desactivada={!editable}
            >
              Activos en {t.etiqueta}
            </Pastilla>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[#6a6a7a]">
          Quien no tiene ninguna señal registrada queda <strong className="text-[#8a8fa8]">fuera</strong> de
          los dos. No sabemos cuándo apareció, y mandarle un «vuelve» a quien quizá entró
          ayer es peor que no mandarle nada.
        </p>
      </div>

      {/* ── DÓNDE ESTÁ ─────────────────────────────────────────────────────
          Solo se ofrecen los sitios donde hay gente, con el recuento al lado:
          un filtro que da cero no es un filtro, es una opción que obliga a
          elegirla, mirar el ensayo y volver atrás. */}
      {(filtros?.paises?.length ?? 0) > 0 && (
        <div>
          <label className={labelCls}>Por país</label>
          <p className="-mt-1 mb-2 text-[11px] text-[#6a6a7a]">
            Según lo que cada miembro puso al entrar en La Red. El número es cuánta gente
            hay en cada sitio.
          </p>
          <div className="flex flex-wrap gap-2">
            {(filtros?.paises ?? []).map((p) => (
              <Pastilla
                key={p.id}
                activa={(a.paises ?? []).includes(p.id)}
                onClick={() => alternarPais(p.id)}
                desactivada={!editable}
              >
                {p.etiqueta} <span className="opacity-50">{p.cuantos}</span>
              </Pastilla>
            ))}
          </div>
        </div>
      )}

      {(filtros?.ciudades?.length ?? 0) > 0 && (
        <div>
          <label className={labelCls}>Por ciudad</label>
          <p className="-mt-1 mb-2 text-[11px] text-[#6a6a7a]">
            Solo las ciudades con dos o más miembros. La ciudad es opcional, así que este
            filtro estrecha mucho: míralo en el ensayo antes de enviar.
          </p>
          <div className="flex flex-wrap gap-2">
            {(filtros?.ciudades ?? []).map((ciu) => (
              <Pastilla
                key={ciu.id}
                activa={(a.ciudades ?? []).includes(ciu.id)}
                onClick={() => alternarCiudad(ciu.id)}
                desactivada={!editable}
              >
                {ciu.etiqueta} <span className="opacity-50">{ciu.cuantos}</span>
              </Pastilla>
            ))}
          </div>
        </div>
      )}

      <PersonasElegidas
        elegidas={a.personas ?? []}
        onCambiar={(ids) => cambiar({ personas: ids.length > 0 ? ids : null })}
        editable={editable}
      />

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

        {/* Lo que hay puesto, junto y con su equis. Antes, para quitar un
            filtro había que acordarse de en qué bloque estaba y bajar a
            buscarlo entre doce opciones. */}
        <FiltrosPuestos
          a={a}
          filtros={filtros}
          onQuitar={cambiar}
          onQuitarTodo={() => cambiar({
            temporadaMin: null, temporadaCompletada: null, empezoSinTerminar: null,
            roles: null, insignias: null, inactivoDias: null, activoDias: null,
            paises: null, ciudades: null, personas: null,
          })}
          editable={editable}
        />
        {/* La semántica, escrita. Confundir «y» con «o» aquí es la diferencia
            entre mandar a doscientos y mandar a tres. */}
        {(a.temporadaMin || a.temporadaCompletada || a.empezoSinTerminar ||
          a.inactivoDias || a.activoDias || roles.length > 0 || insignias.length > 0 ||
          (a.paises?.length ?? 0) > 0 || (a.ciudades?.length ?? 0) > 0) && (
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

/**
 * Los tramos de tiempo, por si el servidor no los manda.
 *
 * Es una copia de respaldo, no la fuente: la de verdad está en la ruta de
 * filtros. Sin esto, un fallo de red dejaría la fila de inactividad sin
 * ninguna opción y parecería que el filtro no existe.
 */
const TRAMOS = [
  { dias: 7, etiqueta: "una semana" },
  { dias: 14, etiqueta: "dos semanas" },
  { dias: 30, etiqueta: "un mes" },
  { dias: 60, etiqueta: "dos meses" },
]

type Hallada = { id: string; full_name: string; username: string | null; email: string | null }

/**
 * Escribirle a personas concretas.
 *
 * ── POR QUÉ ESTO ES UN FILTRO Y NO OTRA CLASE DE AUDIENCIA ────────────────
 * Porque sigue la regla de toda la pantalla: cada casilla baja el número,
 * ninguna lo sube. Una lista de personas junto con «que terminaron la 2» da
 * la intersección, que es lo que uno espera aquí. Si fuera otra clase de
 * audiencia habría que decidir qué pasa con los filtros ya puestos, y
 * cualquier respuesta sorprendería a alguien.
 *
 * ── POR QUÉ SE BUSCA EN EL SERVIDOR ───────────────────────────────────────
 * Porque el padrón entero no tiene por qué estar en el navegador de
 * administración para escribir tres nombres. Se busca lo que se teclea y
 * vuelven como mucho veinticinco resultados.
 *
 * ── LO QUE SE GUARDA ES EL IDENTIFICADOR ──────────────────────────────────
 * El nombre se enseña, pero lo que queda en la audiencia es el identificador.
 * Si alguien se cambia el nombre después, la campaña sigue dirigida a la
 * misma persona.
 */
function PersonasElegidas({
  elegidas, onCambiar, editable,
}: {
  elegidas: string[]
  onCambiar: (ids: string[]) => void
  editable: boolean
}) {
  const [busca, setBusca] = useState("")
  const [resultados, setResultados] = useState<Hallada[]>([])
  const [buscando, setBuscando] = useState(false)
  // Los nombres de quienes ya están elegidos, para poder enseñarlos al abrir
  // una comunicación guardada: la audiencia solo tiene identificadores.
  const [nombres, setNombres] = useState<Record<string, string>>({})

  // Se busca poco después de dejar de teclear. Sin esperar, cada letra sería
  // una consulta al padrón.
  useEffect(() => {
    const q = busca.trim()
    if (q.length < 2) { setResultados([]); return }
    const t = window.setTimeout(async () => {
      setBuscando(true)
      try {
        const r = await fetch(`/api/admin/red/buscar?q=${encodeURIComponent(q)}`, { credentials: "include" })
        const j = await r.json()
        if (r.ok) setResultados((j.resultados || j.miembros || []) as Hallada[])
      } catch { /* la búsqueda no rompe el editor */ }
      finally { setBuscando(false) }
    }, 400)
    return () => window.clearTimeout(t)
  }, [busca])

  // Al abrir una comunicación ya guardada hay identificadores sin nombre. Se
  // piden TODOS de una vez: uno por uno serían cincuenta peticiones para
  // dibujar cincuenta pastillas.
  useEffect(() => {
    const faltan = elegidas.filter((id) => !nombres[id])
    if (faltan.length === 0) return
    void (async () => {
      try {
        const r = await fetch(`/api/admin/red/buscar?ids=${faltan.join(",")}`, { credentials: "include" })
        const j = await r.json()
        if (!r.ok) return
        const nuevos: Record<string, string> = {}
        for (const m of (j.miembros || []) as Hallada[]) nuevos[m.id] = m.full_name
        // Un identificador que ya no existe se queda sin nombre para siempre si
        // no se le pone algo: se enseña recortado, y así se ve que hay que
        // quitarlo en vez de mirar una pastilla en blanco.
        for (const id of faltan) if (!nuevos[id]) nuevos[id] = id.slice(0, 8)
        setNombres((v) => ({ ...v, ...nuevos }))
      } catch { /* se queda sin nombres; la campaña sigue siendo válida */ }
    })()
  }, [elegidas, nombres])

  const anadir = (p: Hallada) => {
    if (elegidas.includes(p.id)) return
    setNombres((v) => ({ ...v, [p.id]: p.full_name }))
    onCambiar([...elegidas, p.id])
    setBusca("")
    setResultados([])
  }

  const quitar = (id: string) => onCambiar(elegidas.filter((x) => x !== id))

  return (
    <div>
      <label className={labelCls}>A personas concretas</label>
      <p className="-mt-1 mb-2 text-[11px] text-[#6a6a7a]">
        Para escribirle a alguien en particular. Si eliges personas, se cruza con los
        demás filtros: no los sustituye.
      </p>

      {elegidas.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {elegidas.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => quitar(id)}
              disabled={!editable}
              className="inline-flex items-center gap-1.5 border border-[#6D4A9B] bg-[#6D4A9B]/20 px-3 py-1.5 text-[11px] text-[#c3b2e0] disabled:opacity-40"
            >
              {nombres[id] ?? "…"} <X size={11} />
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a6a]" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          disabled={!editable}
          className={`${inputCls} pl-9`}
        />
        {buscando && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#6a6a7a]" />}
      </div>

      {resultados.length > 0 && (
        <div className="mt-2 max-h-52 overflow-y-auto border border-[#14141e] bg-[#07070f]">
          {resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => anadir(p)}
              disabled={!editable || elegidas.includes(p.id)}
              className="flex w-full items-baseline justify-between gap-3 border-b border-[#14141e] px-3 py-2 text-left last:border-0 hover:bg-[#6D4A9B]/10 disabled:opacity-40"
            >
              <span className="truncate text-xs text-[#F3F6FA]">{p.full_name}</span>
              <span className="shrink-0 text-[10px] text-[#6a6a7a]">
                {elegidas.includes(p.id) ? "ya está" : p.username ? `@${p.username}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}

      {busca.trim().length >= 2 && !buscando && resultados.length === 0 && (
        <p className="mt-2 text-[11px] text-[#6a6a7a]">Nadie coincide con «{busca.trim()}».</p>
      )}
    </div>
  )
}

/**
 * Una opción de filtro.
 *
 * ── POR QUÉ LLEVA UNA MARCA Y NO SOLO OTRO COLOR ──────────────────────────
 * Lo marcado se distinguía de lo no marcado por un borde algo más claro y un
 * fondo violeta al 15 %. Sobre un panel oscuro eso es casi nada: había que
 * comparar dos pastillas juntas para saber cuál estaba puesta, y con doce
 * insignias en pantalla no se sabía qué se había elegido.
 *
 * Ahora lo marcado lleva fondo sólido, texto claro y una marca de verificado.
 * La marca es lo que lo hace legible de un vistazo y sin comparar: o está o
 * no está.
 *
 * ── Y POR QUÉ LA MARCA SE VUELVE UNA EQUIS AL PASAR POR ENCIMA ────────────
 * Porque la otra queja era «no me deja quitar filtros», y sí dejaba: se
 * vuelve a pulsar y se quita. Lo que faltaba era decirlo. Una equis donde
 * estaba el verificado es la forma más corta de decir «esto se puede
 * deshacer», y en el móvil —donde no hay pasar por encima— está además el
 * resumen de abajo, con su equis por filtro.
 */
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
      aria-pressed={activa}
      className={`group inline-flex items-center gap-1.5 border px-3 py-1.5 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        activa
          ? "border-[#8d6bc4] bg-[#6D4A9B] font-medium text-white"
          : "border-[#2a2a3a] text-[#8a8fa8] hover:border-[#4a4a60] hover:text-[#c3b2e0]"
      }`}
    >
      {activa && (
        <>
          <Check size={11} className="shrink-0 group-hover:hidden" />
          <X size={11} className="hidden shrink-0 group-hover:block" />
        </>
      )}
      {children}
    </button>
  )
}

/**
 * Lo que hay puesto ahora mismo, con su equis para quitarlo.
 *
 * ── POR QUÉ HACE FALTA, SI LAS PASTILLAS YA SE DESMARCAN ──────────────────
 * Porque para quitar un filtro había que acordarse de en qué bloque estaba y
 * bajar a buscarlo entre doce opciones. Con cuatro filtros puestos en cuatro
 * bloques distintos, deshacerlos era una expedición.
 *
 * Aquí están los cuatro juntos, cada uno con su equis, al lado de la frase
 * que dice a quién va. Que es donde uno mira cuando el número no cuadra.
 */
function FiltrosPuestos({ a, filtros, onQuitar, onQuitarTodo, editable }: {
  a: Audiencia
  filtros: Filtros | null
  onQuitar: (parcial: Partial<Audiencia>) => void
  onQuitarTodo: () => void
  editable: boolean
}) {
  const nombrePais = (c: string) => filtros?.paises?.find((p) => p.id === c)?.etiqueta ?? c
  const nombreCiudad = (id: number) => filtros?.ciudades?.find((c) => c.id === id)?.etiqueta ?? `Ciudad ${id}`

  const puestos: Array<{ clave: string; texto: string; quitar: () => void }> = []

  if (a.temporadaMin) {
    puestos.push({
      clave: "tmin",
      texto: `Llegaron a la Temporada ${a.temporadaMin}`,
      quitar: () => onQuitar({ temporadaMin: null }),
    })
  }
  if (a.temporadaCompletada) {
    puestos.push({
      clave: "tcomp",
      texto: a.temporadaCompletada >= 4
        ? "Completaron el camino"
        : `Terminaron la Temporada ${a.temporadaCompletada}`,
      quitar: () => onQuitar({ temporadaCompletada: null }),
    })
  }
  if (a.empezoSinTerminar) {
    puestos.push({
      clave: "medias",
      texto: `Dejaron la Temporada ${a.empezoSinTerminar} a medias`,
      quitar: () => onQuitar({ empezoSinTerminar: null }),
    })
  }
  if (a.inactivoDias) {
    puestos.push({
      clave: "inactivo",
      texto: `Sin aparecer ${a.inactivoDias} días o más`,
      quitar: () => onQuitar({ inactivoDias: null }),
    })
  }
  if (a.activoDias) {
    puestos.push({
      clave: "activo",
      texto: `Activos en los últimos ${a.activoDias} días`,
      quitar: () => onQuitar({ activoDias: null }),
    })
  }
  for (const r of a.roles ?? []) {
    puestos.push({
      clave: `rol-${r}`,
      texto: ROLES.find((x) => x.id === r)?.etiqueta ?? r,
      quitar: () => {
        const quedan = (a.roles ?? []).filter((x) => x !== r)
        onQuitar({ roles: quedan.length > 0 ? quedan : null })
      },
    })
  }
  for (const i of a.insignias ?? []) {
    puestos.push({
      clave: `ins-${i}`,
      texto: nombreDeInsignia(i, filtros),
      quitar: () => {
        const quedan = (a.insignias ?? []).filter((x) => x !== i)
        onQuitar({ insignias: quedan.length > 0 ? quedan : null })
      },
    })
  }
  for (const c of a.paises ?? []) {
    puestos.push({
      clave: `pais-${c}`,
      texto: nombrePais(c),
      quitar: () => {
        const quedan = (a.paises ?? []).filter((x) => x !== c)
        onQuitar({ paises: quedan.length > 0 ? quedan : null })
      },
    })
  }
  for (const c of a.ciudades ?? []) {
    puestos.push({
      clave: `ciu-${c}`,
      texto: nombreCiudad(c),
      quitar: () => {
        const quedan = (a.ciudades ?? []).filter((x) => x !== c)
        onQuitar({ ciudades: quedan.length > 0 ? quedan : null })
      },
    })
  }
  if ((a.personas?.length ?? 0) > 0) {
    puestos.push({
      clave: "personas",
      texto: a.personas!.length === 1 ? "Una persona elegida" : `${a.personas!.length} personas elegidas`,
      quitar: () => onQuitar({ personas: null }),
    })
  }

  if (puestos.length === 0) {
    return (
      <p className="mt-2 text-[11px] text-[#6a6a7a]">
        Sin filtros: va a todos los miembros activos.
      </p>
    )
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        {puestos.map((f) => (
          <button
            key={f.clave}
            type="button"
            onClick={f.quitar}
            disabled={!editable}
            title="Quitar este filtro"
            className="inline-flex items-center gap-1.5 border border-[#6D4A9B] bg-[#6D4A9B]/25 px-2.5 py-1 text-[11px] text-[#d7c9ee] transition-colors hover:border-red-800 hover:bg-red-950/40 hover:text-red-200 disabled:opacity-40"
          >
            {f.texto} <X size={11} className="shrink-0" />
          </button>
        ))}
      </div>

      {puestos.length > 1 && (
        <button
          type="button"
          onClick={onQuitarTodo}
          disabled={!editable}
          className="mt-2 text-[11px] text-[#7a7a8a] underline underline-offset-2 transition-colors hover:text-[#F3F6FA] disabled:opacity-40"
        >
          Quitar los {puestos.length} filtros
        </button>
      )}
    </div>
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
  if (a.empezoSinTerminar) {
    partes.push(`que empezaron la Temporada ${a.empezoSinTerminar} y no la terminaron`)
  }
  if (a.inactivoDias) partes.push(`sin aparecer desde hace ${a.inactivoDias} días o más`)
  if (a.activoDias) partes.push(`que han aparecido en los últimos ${a.activoDias} días`)
  if (a.paises?.length) {
    const nombre = (c: string) => filtros?.paises?.find((p) => p.id === c)?.etiqueta ?? c
    partes.push(`de ${a.paises.map(nombre).join(" o ")}`)
  }
  if (a.ciudades?.length) {
    partes.push(a.ciudades.length === 1 ? "de una ciudad concreta" : `de ${a.ciudades.length} ciudades`)
  }
  if (a.personas?.length) {
    const cuantas = a.personas.length === 1 ? "Una persona" : `${a.personas.length} personas elegidas`
    return partes.length === 0 ? cuantas : `${cuantas}, ${partes.join(", ")}`
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

/**
 * Cómo se va a ver el aviso.
 *
 * ── POR QUÉ SE DIBUJA AQUÍ Y NO SE PIDE AL SERVIDOR ───────────────────────
 * La vista previa del correo la dibuja el servidor porque el correo lo dibuja
 * el servidor: el HTML que se enseña es literalmente el que se manda, y si lo
 * montara el navegador por su cuenta no estaría probando nada.
 *
 * Un aviso no tiene HTML. Lo pinta el sistema operativo del teléfono con sus
 * propios tipos de letra y su propio recorte. Nada que pidiéramos al servidor
 * se parecería más a lo real que esto, y en cambio costaría una petición por
 * cada tecla.
 *
 * Lo que sí es fiel es el recorte: dos líneas de texto, y el título en una.
 * Que es justo lo que hay que poder mirar antes de mandarlo.
 */
function VistaPreviaPush({ c }: { c: Comunicacion }) {
  const titulo = (c.subject || "").trim()
  const texto = (c.body || "").replace(/\s+/g, " ").trim()
  const hora = new Date().toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit" })

  return (
    <section className="border border-[#1a1a24] bg-[#0d0d16]/40">
      <div className="flex items-center justify-between border-b border-[#1a1a24] px-4 py-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
          Cómo se verá
        </h3>
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#6a6a7a]">
          <Smartphone size={12} /> Pantalla de bloqueo
        </span>
      </div>

      {/* El fondo oscuro no es decoración: un aviso se lee casi siempre sobre
          una pantalla apagada, y el contraste real es ese. */}
      <div className="bg-[#07070f] px-4 py-8">
        <div className="mx-auto max-w-[340px]">
          <p className="mb-5 text-center text-[42px] font-light leading-none tracking-tight text-white/90">
            {hora}
          </p>

          <div className="rounded-[20px] bg-white/[0.14] p-3.5 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-[#6D4A9B] text-[9px] font-bold text-white">
                144
              </span>
              <span className="text-[11px] uppercase tracking-wide text-white/60">
                Los 144.000
              </span>
              <span className="ml-auto text-[11px] text-white/40">ahora</span>
            </div>

            <p className="mt-2 line-clamp-1 text-[14px] font-semibold leading-snug text-white">
              {titulo || <span className="text-red-300">Sin título</span>}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white/75">
              {texto || "…"}
            </p>
          </div>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-[#6a6a7a]">
            Cada teléfono lo pinta a su manera. Lo que sí es igual en todos es
            el recorte: un renglón de título y dos de texto.
          </p>
        </div>
      </div>

      {c.cta_url && (
        <div className="border-t border-[#1a1a24] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Al tocarlo abre</p>
          <p className="mt-1 truncate text-xs text-[#c3b2e0]">{c.cta_url}</p>
        </div>
      )}
    </section>
  )
}

/**
 * La prueba de un aviso.
 *
 * Va a los dispositivos de quien está mirando esta pantalla, y a ninguno más.
 * No acepta destinatario a propósito: ver cómo queda es cosa de uno, y poder
 * escribir aquí el nombre de otra persona habría convertido el botón de
 * probar en una forma de mandarle un aviso saltándose la audiencia.
 */
function PruebaPush({ id, titulo, onEnviada }: {
  id: string
  titulo: string
  onEnviada?: (cuando: string) => void
}) {
  const [enviando, setEnviando] = useState(false)
  const [hecho, setHecho] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const enviar = async () => {
    setEnviando(true); setError(null); setHecho(null)
    try {
      const r = await fetch(`/api/admin/comunicaciones/${id}/prueba`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo enviar")
      setHecho(new Date(j.cuando).toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
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
        Va solo a tus dispositivos. No toca la audiencia, no cuenta como envío
        y no puede alcanzar a ningún miembro. Si tienes la plataforma instalada
        en el teléfono, míralo ahí: en el escritorio se ve distinto.
      </p>
      <button
        type="button"
        onClick={enviar}
        disabled={enviando || !titulo.trim()}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-[#2f2f42] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a0a0b0] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {enviando ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
        {enviando ? "Enviando…" : "Enviármela a mí"}
      </button>
      {!titulo.trim() && (
        <p className="mt-2 text-[11px] text-[#6a6a7a]">Ponle título antes: es la línea que se lee primero.</p>
      )}
      {hecho && <p className="mt-3 text-xs text-emerald-400">Enviada a las {hecho}. Mira tu teléfono.</p>}
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
  // Un aviso no se puede programar: lo reparte esta plataforma, y nada
  // despierta al servidor a las siete de la tarde. Ver `validarNotificacion`
  // en lib/comunicaciones/validacion.ts.
  // Se mira la LISTA, no el valor viejo. Esta pantalla es la última que se
  // ve antes de que algo salga a mil bandejas: si dijera «Correo» cuando
  // además va al móvil, estaría pidiendo permiso para otra cosa.
  const canales = canalesDe(c)
  const esPush = canales.includes("push") && !canales.includes("email")
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
          <Dato
            etiqueta={canales.length > 1 ? "Canales" : "Canal"}
            valor={canales.map((x) => (
              x === "push" ? "Notificación en el teléfono"
                : x === "interno" ? "Dentro de la plataforma"
                : "Correo"
            )).join(" + ")}
          />
          <Dato etiqueta={esPush ? "Título" : "Asunto"} valor={c.subject} />
          {canales.includes("email") && (
            <Dato etiqueta="Tipo" valor={nombreDeTipo(c.type, "email")} />
          )}
          {canales.includes("interno") && (
            <Dato
              etiqueta="Dentro de la plataforma"
              valor="No sale ahora: se publica aparte, con su propio botón."
            />
          )}
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
            {esPush
              ? "No te has mandado ninguna prueba desde que abriste esta comunicación. Verla en tu propio teléfono cuesta un minuto y es la única forma de saber dónde corta el texto."
              : "No has enviado ninguna prueba desde que abriste esta comunicación. Mandarte una antes cuesta un minuto y es la única forma de ver cómo llega de verdad."}
          </p>
        )}

        {!esPush && <div className="flex gap-2">
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
        </div>}

        {modo === "programar" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={enviando} className={inputCls} />
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} disabled={enviando} className={inputCls} />
            <select value={zona} onChange={(e) => setZona(e.target.value)} disabled={enviando} className={inputCls}>
              {ZONAS.map((z) => <option key={z.id} value={z.id}>{z.etiqueta}</option>)}
            </select>
          </div>
        )}

        {/* Solo en las notificaciones, y solo si sale ahora: una programada
            para mañana a las siete no tiene nada que ver con la hora que es
            en este momento. */}
        {esPush && modo === "ahora" && <AvisoDeMadrugada />}

        <div className="flex items-start gap-3 border border-[#3a2a1a] bg-[#1a1208]/60 p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#e6cf95]" />
          <p className="text-xs leading-relaxed text-[#d8c9a4]">
            {esPush
              ? "Esta acción hace sonar el teléfono de personas reales, ahora mismo. No se puede deshacer ni cancelar: cuando el aviso sale, ya ha interrumpido a quien lo recibe."
              : "Esta acción envía correos reales a personas reales. No se puede deshacer: una vez entregado, el correo está en su bandeja."}
            {!esPush && modo === "programar" && " Una programada sí se puede cancelar mientras no haya salido."}
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

/**
 * «Son las tres de la mañana en Colombia, donde hay 34 miembros.»
 *
 * ── POR QUÉ UN AVISO Y NO UNA REGLA ───────────────────────────────────────
 * Porque no sabemos la hora de nadie: sabemos el país que cada quien eligió, y
 * México, Brasil y Estados Unidos tienen varias zonas. Retener un envío por
 * una suposición es retenerlo mal para mucha gente, y además dejar de
 * enviarlo justo cuando alguien decidió enviarlo.
 *
 * Decirlo, en cambio, siempre acierta. Y muchas veces la respuesta correcta es
 * «da igual, es urgente» — que una regla automática no sabría.
 *
 * Solo aparece en las notificaciones. Un correo espera en la bandeja; un aviso
 * en el teléfono no espera a nada.
 */
function AvisoDeMadrugada() {
  const [aviso, setAviso] = useState<AvisoDeHora | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/admin/comunicaciones/filtros", { credentials: "include" })
        const j = await r.json()
        if (r.ok) setAviso(avisoDeHora(j.paises || []))
      } catch { /* sin esto la confirmación sigue funcionando */ }
    })()
  }, [])

  if (!aviso || aviso.durmiendo === 0) return null

  const primeros = aviso.sitios.slice(0, 3)

  return (
    <div className="flex items-start gap-3 border border-[#2a2440] bg-[#120f20]/70 p-4">
      <Clock size={16} className="mt-0.5 shrink-0 text-[#a78bca]" />
      <div className="text-xs leading-relaxed text-[#a8a8c0]">
        <p>
          Ahora mismo es de noche para{" "}
          <strong className="text-[#c3b2e0]">{aviso.durmiendo} miembros</strong>:{" "}
          {primeros.map((s, i) => (
            <span key={s.pais}>
              {i > 0 && (i === primeros.length - 1 ? " y " : ", ")}
              {s.etiqueta} ({s.hora}, {s.cuantos})
            </span>
          ))}
          {aviso.sitios.length > primeros.length && ` y ${aviso.sitios.length - primeros.length} país(es) más`}.
          Un aviso suena igual a esa hora.
        </p>
        {aviso.sinSituar > 0 && (
          <p className="mt-2 text-[#8b90b4]">
            De otros {aviso.sinSituar} no se puede decir la hora: están en países con varias
            zonas horarias —México, Brasil, Estados Unidos— y suponerla sería decir una hora
            equivocada.
          </p>
        )}
      </div>
    </div>
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

/**
 * Los resultados de una campaña de notificaciones.
 *
 * ── POR QUÉ NO SON LAS MISMAS CIFRAS QUE EL CORREO ────────────────────────
 * Porque de un correo se sabe si se entregó y si se abrió, y de una
 * notificación no. El servicio de push responde «aceptado» cuando recibe el
 * aviso, y de ahí en adelante no informa de nada: ni si el teléfono estaba
 * encendido, ni si llegó, ni si alguien lo miró.
 *
 * Así que aquí no aparece ningún «entregado» y ningún «abrieron». Lo que se
 * enseña es lo que de verdad se sabe, con el nombre que le corresponde. Una
 * cifra inventada en esta pantalla es una decisión equivocada el mes que
 * viene.
 */
function ResultadosPush({ id, previstos }: { id: string; previstos: number | null }) {
  const [d, setD] = useState<{
    push: {
      intentos: number
      aceptados: number
      personas: number
      tocaron: number
      fallidos: number
      retiradas: number
      tasaToque: number | null
    }
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
          No hay ni un envío apuntado. No significa que no le interesara a nadie: significa
          que el envío no llegó a ocurrir.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metrica etiqueta="Les llegó" valor={d.push.personas} />
            <Metrica etiqueta="Lo tocaron" valor={d.push.tocaron} pct={d.push.tasaToque} />
            <Metrica etiqueta="Dispositivos" valor={d.push.aceptados} />
            <Metrica etiqueta="Previstos" valor={previstos ?? 0} />
          </div>

          {/* Lo que la cifra NO dice, dicho donde se lee la cifra y no en un
              manual aparte. */}
          <p className="mt-4 border-l-2 border-[#2f2f42] pl-3 text-[11px] leading-relaxed text-[#8a8fa8]">
            <strong className="text-[#c3b2e0]">«Les llegó»</strong> es a cuántas personas lo
            aceptó el servicio de push en al menos un dispositivo. No es lo mismo que
            «entregado»: desde ahí, ni Apple ni Google dicen si el aviso apareció en el
            teléfono. <strong className="text-[#c3b2e0]">«Lo tocaron»</strong> sí es un dato
            nuestro, y es el único seguro que hay después de enviar.
          </p>

          {(d.push.fallidos > 0 || d.push.retiradas > 0) && (
            <p className="mt-3 text-xs text-[#8a8fa8]">
              {d.push.fallidos > 0 && `${d.push.fallidos} dispositivos fallaron. `}
              {d.push.retiradas > 0 && `${d.push.retiradas} suscripciones ya no existían y se han apagado.`}
            </p>
          )}
        </>
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
