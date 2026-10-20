// CENTRO DE COMUNICACIONES — lo que hay que comprobar antes de que salga.
//
// ── POR QUÉ ESTO ES UNA BARRERA Y NO UN CONSEJO ────────────────────────────
// Un correo a toda La Red no se puede corregir. No hay «editar» después: hay
// mil bandejas de entrada con lo que se mandó. Por eso lo que aquí sale como
// ERROR impide el envío del lado del servidor, no solo apaga un botón en
// pantalla. Un botón apagado se salta con una petición a mano.
//
// Lo que sale como AVISO no impide nada: son cosas que suelen estar mal pero a
// veces se hacen a propósito. Un correo sin botón es raro; un correo sin
// asunto es un fallo.

import type { Comunicacion } from "./tipos"
import { TIPOS } from "./tipos"
import { esUrlValida } from "./plantilla"

export type Hallazgo = {
  campo: string
  /** `error` bloquea el envío. `aviso` solo se enseña. */
  nivel: "error" | "aviso"
  mensaje: string
}

export type Veredicto = {
  puedeEnviar: boolean
  errores: Hallazgo[]
  avisos: Hallazgo[]
}

/** Longitud a partir de la cual el asunto se corta en el móvil. */
const ASUNTO_COMODO = 60
const PREHEADER_COMODO = 100

export type OpcionesValidacion = {
  /** Cuando se va a programar, la fecha tiene que ser futura de verdad. */
  programadoPara?: string | null
  /** Margen mínimo, en minutos, entre ahora y la hora programada. */
  margenMinutos?: number
}

/** Lo que se lee de un título de notificación antes de que lo corte el sistema. */
const TITULO_COMODO = 45
/** Lo que caben las dos líneas de texto de una notificación. */
const TEXTO_COMODO = 120

/**
 * ¿A dónde puede llevar una notificación?
 *
 * A diferencia del botón de un correo, aquí vale una ruta de la propia
 * plataforma —`/miembros/transmisiones`— porque la notificación se abre dentro
 * de la aplicación. El trabajador de servicio la resuelve contra el origen.
 *
 * Lo que NO vale es cualquier otra cosa: un `javascript:` o un esquema raro
 * acabaría en `clients.openWindow`, y eso se abre sin que nadie lo revise.
 */
function destinoDeNotificacionValido(url: string): boolean {
  if (url.startsWith("/")) return !url.startsWith("//")
  return esUrlValida(url)
}

/**
 * La validación de una notificación.
 *
 * ── POR QUÉ ES OTRA FUNCIÓN Y NO UNOS `if` DENTRO DE LA DEL CORREO ─────────
 * Porque casi nada coincide. El correo exige titular y preheader, y una
 * notificación no tiene ni uno ni otro; el correo avisa si no lleva botón, y
 * una notificación sin destino simplemente abre la aplicación, que está bien.
 * Mezclarlas habría dejado la mitad de las comprobaciones con un «salvo si es
 * push» colgando, que es la forma segura de que dentro de un año una de las
 * dos reglas se corrija y la otra no.
 *
 * Lo que sí comparten —que haya audiencia, y que una fecha programada sea
 * futura— está repetido a propósito: son cuatro líneas, y la alternativa es un
 * tercer sitio donde buscar por qué algo no se envía.
 */
function validarNotificacion(
  c: Partial<Comunicacion>,
  op: OpcionesValidacion,
): Veredicto {
  const errores: Hallazgo[] = []
  const avisos: Hallazgo[] = []
  const err = (campo: string, mensaje: string) => errores.push({ campo, nivel: "error", mensaje })
  const avi = (campo: string, mensaje: string) => avisos.push({ campo, nivel: "aviso", mensaje })

  // ── El título ───────────────────────────────────────────────────────────
  const titulo = (c.subject || "").trim()
  if (!titulo) {
    err("subject", "Falta el título. Es la línea en negrita del aviso, y sin ella no se manda nada.")
  } else if (titulo.length > TITULO_COMODO) {
    avi("subject", `El título tiene ${titulo.length} caracteres; el teléfono corta cerca de los ${TITULO_COMODO} y el resto no se lee.`)
  }

  // ── El texto ────────────────────────────────────────────────────────────
  const texto = (c.body || "").trim()
  if (!texto) {
    err("body", "El texto está vacío. Un aviso con solo título no dice a qué viene.")
  } else if (texto.length > TEXTO_COMODO) {
    // Un aviso, no un error: el envío recorta, así que lo que sobra no rompe
    // nada. Pero conviene saber que se va a perder antes de mandarlo.
    avi("body", `El texto tiene ${texto.length} caracteres; en el aviso se ven unos ${TEXTO_COMODO}. El resto se recorta al enviar.`)
  }

  // ── A dónde lleva ───────────────────────────────────────────────────────
  const destino = (c.cta_url || "").trim()
  if (destino && !destinoDeNotificacionValido(destino)) {
    err(
      "cta_url",
      "El destino no es válido. Puede ser una ruta de la plataforma —/miembros/transmisiones— " +
      "o una dirección completa que empiece por https://.",
    )
  }
  if (!destino) {
    avi("cta_url", "Sin destino, al tocar el aviso se abre la plataforma por el inicio. Se puede enviar así.")
  }

  // ── La audiencia ────────────────────────────────────────────────────────
  const aud = c.audience as { kind?: string; temporadaMin?: number | null; roles?: string[] | null } | undefined
  if (!aud?.kind) {
    err("audience", "No hay audiencia elegida.")
  } else if (aud.kind !== "todos") {
    err("audience", "Esa audiencia no está disponible.")
  }

  // ── POR QUÉ UNA NOTIFICACIÓN NO SE PUEDE PROGRAMAR ──────────────────────
  // El correo lo programa el proveedor: se le entrega y él lo suelta a su
  // hora, aunque aquí no haya nadie. Las notificaciones las reparte esta
  // plataforma, y nada despierta al servidor a las siete de la tarde.
  //
  // Antes que una programación que calladamente no se cumpliera, se dice.
  if (op.programadoPara) {
    err(
      "scheduled_at",
      "Las notificaciones no se pueden programar todavía: se envían en el momento. " +
      "Quita la fecha para mandarla ahora.",
    )
  }

  // Lo que es del correo y aquí no se usa. No es un error —son campos que la
  // misma tabla guarda para las dos cosas— pero si alguien convirtió un
  // borrador de correo en notificación, conviene que sepa qué se queda fuera.
  const sobrantes: string[] = []
  if ((c.heading || "").trim()) sobrantes.push("el titular")
  if ((c.preheader || "").trim()) sobrantes.push("el preheader")
  if (c.image_url) sobrantes.push("la imagen")
  if (c.event_at) sobrantes.push("los datos del encuentro")
  if (sobrantes.length) {
    avi(
      "canal",
      `En una notificación no se ve ${sobrantes.join(", ")}. Solo salen el título, el texto y el destino.`,
    )
  }

  return { puedeEnviar: errores.length === 0, errores, avisos }
}

export function validarComunicacion(
  c: Partial<Comunicacion>,
  op: OpcionesValidacion = {},
): Veredicto {
  // Una notificación se comprueba con otras reglas: ver `validarNotificacion`.
  if (c.canal === "push") return validarNotificacion(c, op)

  const errores: Hallazgo[] = []
  const avisos: Hallazgo[] = []
  const err = (campo: string, mensaje: string) => errores.push({ campo, nivel: "error", mensaje })
  const avi = (campo: string, mensaje: string) => avisos.push({ campo, nivel: "aviso", mensaje })

  // ── Lo que se ve en la bandeja ──────────────────────────────────────────
  const asunto = (c.subject || "").trim()
  if (!asunto) {
    err("subject", "El asunto está vacío. Es lo único que se ve seguro antes de abrir.")
  } else if (asunto.length > ASUNTO_COMODO) {
    avi("subject", `El asunto tiene ${asunto.length} caracteres; en el móvil se corta cerca de los ${ASUNTO_COMODO}.`)
  }

  const preheader = (c.preheader || "").trim()
  if (!preheader) {
    avi("preheader", "Sin preheader, el cliente de correo rellena esa línea con lo primero que encuentre.")
  } else if (preheader.length > PREHEADER_COMODO) {
    avi("preheader", `El preheader tiene ${preheader.length} caracteres; se corta cerca de los ${PREHEADER_COMODO}.`)
  }

  // ── El contenido ────────────────────────────────────────────────────────
  if (!(c.heading || "").trim()) {
    err("heading", "Falta el titular. Es lo primero que se lee al abrir.")
  }
  if (!(c.body || "").trim()) {
    err("body", "El cuerpo está vacío.")
  }

  // ── Las direcciones ─────────────────────────────────────────────────────
  const ctaTexto = (c.cta_text || "").trim()
  const ctaUrl = (c.cta_url || "").trim()

  if (ctaTexto && !ctaUrl) {
    err("cta_url", "Hay texto de botón pero no hay dirección: el botón no llevaría a ninguna parte.")
  }
  if (ctaUrl && !ctaTexto) {
    err("cta_text", "Hay dirección pero el botón no tiene texto.")
  }
  if (ctaUrl && !esUrlValida(ctaUrl)) {
    err("cta_url", "La dirección del botón no es válida. Tiene que empezar por http:// o https://.")
  }
  if (!ctaTexto && !ctaUrl) {
    avi("cta_text", "Esta comunicación no lleva botón. Se puede enviar así, pero nadie tendrá adónde ir.")
  }

  if (c.image_url && !esUrlValida(c.image_url)) {
    err("image_url", "La dirección de la imagen no es válida.")
  }

  // ── El bloque de fecha ──────────────────────────────────────────────────
  const def = c.type ? TIPOS[c.type] : null
  if (def?.llevaFecha) {
    if (!c.event_at) {
      avi("event_at", `Una comunicación de tipo «${def.nombre}» suele llevar fecha y hora, y esta no la tiene.`)
    } else {
      if (!c.event_timezone) {
        err("event_timezone", "Hay fecha pero no zona horaria. Sin zona, la hora significa algo distinto en cada país.")
      } else if (!zonaConocida(c.event_timezone)) {
        err("event_timezone", "Esa zona horaria no existe.")
      }
      if (!Number.isFinite(new Date(c.event_at).getTime())) {
        err("event_at", "La fecha del evento no es una fecha válida.")
      }
    }
  }

  // ── La audiencia ────────────────────────────────────────────────────────
  const aud = c.audience as { kind?: string; temporadaMin?: number | null; roles?: string[] | null } | undefined
  if (!aud?.kind) {
    err("audience", "No hay audiencia elegida.")
  } else if (aud.kind !== "todos") {
    err("audience", "Esa audiencia no está disponible.")
  }

  // Un aviso, no un error: filtrar mucho es legítimo —una nota para los siete
  // organizadores es una comunicación perfectamente razonable— pero conviene
  // que quien la manda sepa que la está estrechando.
  if (aud?.temporadaMin && aud?.roles?.length) {
    avi(
      "audience",
      "Estás filtrando por avance Y por rol a la vez. Solo lo recibirá quien cumpla las dos cosas; " +
      "mira el número en el ensayo de audiencia antes de enviar.",
    )
  }

  // ── La programación ─────────────────────────────────────────────────────
  if (op.programadoPara) {
    const cuando = new Date(op.programadoPara)
    if (!Number.isFinite(cuando.getTime())) {
      err("scheduled_at", "La fecha de envío no es válida.")
    } else {
      const margen = (op.margenMinutos ?? 5) * 60 * 1000
      if (cuando.getTime() < Date.now() + margen) {
        err(
          "scheduled_at",
          `La fecha de envío tiene que estar al menos ${op.margenMinutos ?? 5} minutos por delante. ` +
          "Programar para dentro de un instante es enviar ahora, pero sin poder cancelarlo.",
        )
      }
    }
  }

  return { puedeEnviar: errores.length === 0, errores, avisos }
}

/** ¿El entorno reconoce esta zona horaria? */
export function zonaConocida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat("es-ES", { timeZone: zona })
    return true
  } catch {
    return false
  }
}

/**
 * Las zonas que se ofrecen en el panel.
 *
 * No son todas las del mundo: son donde está La Red. Una lista de cuatrocientas
 * zonas obliga a buscar; una de doce se lee. Si algún día hace falta otra, se
 * añade aquí.
 */
export const ZONAS_HORARIAS: Array<{ id: string; etiqueta: string }> = [
  { id: "America/Mexico_City", etiqueta: "México (Ciudad de México)" },
  { id: "America/Bogota", etiqueta: "Colombia · Perú · Ecuador (Bogotá)" },
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

/**
 * De «fecha + hora + zona» al instante exacto.
 *
 * ── POR QUÉ NO BASTA new Date("2026-09-26T19:00") ──────────────────────────
 * Esa cadena la interpreta el navegador en SU zona horaria, no en la elegida.
 * Programar «19:00 México» desde un portátil en Madrid daría las 19:00 de
 * Madrid: siete horas antes de lo que se quería, y sin ningún aviso.
 *
 * Aquí se calcula al revés: se toma una hora tentativa, se pregunta qué hora
 * marca en la zona de destino, y se corrige por la diferencia. Dos pasadas
 * bastan incluso cuando el ajuste cruza un cambio de horario de verano.
 */
export function instanteEnZona(fecha: string, hora: string, zona: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha)
  const h = /^(\d{1,2}):(\d{2})$/.exec(hora)
  if (!m || !h) return null
  if (!zonaConocida(zona)) return null

  const deseado = Date.UTC(+m[1], +m[2] - 1, +m[3], +h[1], +h[2], 0, 0)

  const desfase = (instante: number): number => {
    const f = new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).formatToParts(new Date(instante))
    const g = (t: string) => Number(f.find((p) => p.type === t)?.value ?? "0")
    // `hour` puede venir como 24 a medianoche en algunos entornos.
    const hh = g("hour") % 24
    const comoZona = Date.UTC(g("year"), g("month") - 1, g("day"), hh, g("minute"), g("second"))
    return comoZona - instante
  }

  let resultado = deseado - desfase(deseado)
  resultado = deseado - desfase(resultado)

  const d = new Date(resultado)
  return Number.isFinite(d.getTime()) ? d.toISOString() : null
}
