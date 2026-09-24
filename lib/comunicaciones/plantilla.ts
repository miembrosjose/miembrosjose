// CENTRO DE COMUNICACIONES — el correo, dibujado.
//
// ── UNA SOLA FUENTE, PARA EL PREVIEW Y PARA EL ENVÍO ───────────────────────
// Esta función es la que produce el HTML que se ve en la vista previa Y el que
// recibe la gente. No hay dos caminos. Un preview que se parece al correo pero
// no es el correo es peor que no tener preview: da confianza sin darla.
//
// ── POR QUÉ TABLAS Y ESTILOS EN LÍNEA ──────────────────────────────────────
// Esto no es una página web. Outlook de escritorio dibuja el correo con el
// motor de Word, que no entiende flex, ni grid, ni casi nada de lo que se usa
// a diario. Gmail borra las hojas de estilo. El resultado es que lo que aquí
// parece anticuado —tablas anidadas, ancho en atributos, estilos repetidos en
// cada celda— es lo único que se ve igual en todas partes.
//
// La regla que se sigue: COMPATIBILIDAD ANTES QUE EFECTO. Si algo bonito
// rompe en un cliente de correo, no entra.
//
// ── POR QUÉ NO HAY FUENTES EXTERNAS ────────────────────────────────────────
// Ningún cliente de correo garantiza que una fuente cargada de fuera aparezca,
// y varios directamente la bloquean. Se usa una pila de fuentes del sistema
// que en todas partes da algo digno. El carácter de Los 144.000 lo ponen el
// color, el espacio y el ritmo, que sí llegan siempre.
//
// ── EL COLOR ───────────────────────────────────────────────────────────────
// Fondo profundo, dorado para lo que importa, violeta para lo secundario. Es
// el mismo lenguaje de la plataforma. El fondo oscuro se pinta en tablas, no
// en el body: varios clientes ignoran el fondo del body y dejarían texto claro
// sobre blanco, que es el peor fallo posible en un correo.

import type { Comunicacion, FamiliaPlantilla, TipoComunicacion } from "./tipos"
import { TIPOS } from "./tipos"

// ── La paleta ──────────────────────────────────────────────────────────────
const C = {
  fondo: "#07070f",
  panel: "#0e0e1b",
  panelSuave: "#141427",
  borde: "#232338",
  bordeCalido: "#3a2f1d",
  texto: "#e9ecf5",
  textoSuave: "#a6abc4",
  textoTenue: "#7c8199",
  dorado: "#d9b866",
  doradoClaro: "#f0dca8",
  violeta: "#a78bca",
} as const

/**
 * EL COLOR DE CADA FAMILIA.
 *
 * ── POR QUÉ NO SON CUATRO DISEÑOS ──────────────────────────────────────────
 * Cuatro plantillas distintas de verdad serían cuatro cosas que mantener y
 * cuatro maneras de que Los 144.000 se vea distinto en una bandeja de entrada.
 * Lo que cambia aquí es el ACENTO: la franja de arriba, el eyebrow, el botón,
 * el marco de la fecha. Es suficiente para que se reconozca de un vistazo qué
 * clase de correo es antes de leer una palabra, y no rompe la unidad.
 *
 * Los colores no se inventan: son los que ya usa la plataforma.
 *   violeta   el camino, las temporadas, los contenidos
 *   dorado    lo que ocurre en un momento señalado — sesiones, activaciones
 *   verde     la comunidad — encuentros, novedades de La Red
 *   claro     lo especial, que no pertenece a ninguna de las tres
 */
const ACENTO: Record<FamiliaPlantilla, { color: string; suave: string; tinta: string; sello: string }> = {
  contenido: { color: "#a78bca", suave: "rgba(167,139,202,0.10)", tinta: "#14101f", sello: "Nuevo contenido" },
  sesion:    { color: "#d9b866", suave: "rgba(217,184,102,0.10)", tinta: "#18120a", sello: "En directo" },
  red:       { color: "#8fc46a", suave: "rgba(143,196,106,0.10)", tinta: "#0d1509", sello: "La Red" },
  especial:  { color: "#f0dca8", suave: "rgba(240,220,168,0.10)", tinta: "#1a1508", sello: "" },
}

const FUENTE =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

/** Ancho clásico del correo. Más de esto se corta en varios clientes. */
const ANCHO = 600

// ── Lo que necesita el renderizador ────────────────────────────────────────

export type DatosCorreo = {
  tipo: TipoComunicacion
  preheader: string
  eyebrow: string
  heading: string
  body: string
  imageUrl?: string | null
  ctaText?: string | null
  ctaUrl?: string | null
  eventTitle?: string | null
  /** ISO. Se formatea con `eventTimezone`, nunca con la del servidor. */
  eventAt?: string | null
  eventTimezone?: string | null
  eventLocation?: string | null
  /**
   * El nombre de quien lo recibe.
   *
   * En la vista previa y en la prueba va un nombre de verdad, para poder ver
   * cómo queda. En un envío masivo no hay UN nombre: hay ochocientos.
   */
  nombre?: string | null
  /**
   * Cómo se pone el nombre en un envío masivo.
   *
   * "literal"  · se escribe el de `nombre`. Vista previa y prueba.
   * "variable" · se escribe la etiqueta de combinación del proveedor, que él
   *              sustituye por el nombre de cada persona al repartir.
   *
   * ── POR QUÉ ESTO ES DELICADO ────────────────────────────────────────────
   * Una etiqueta mal escrita no falla: se imprime tal cual. Mil personas
   * leyendo «Hola {{{FIRST_NAME}}}» es peor que mil personas leyendo un correo
   * sin saludo. Por eso la etiqueta se escribe en UN solo sitio —aquí— y lleva
   * un valor de respaldo: quien no tenga nombre guardado lee «Hola viajero»,
   * que es como ya le habla el correo de bienvenida.
   */
  nombreModo?: "literal" | "variable"
  /**
   * El enlace para darse de baja.
   *
   * En un envío real lo pone Resend con su propia etiqueta. En el preview se
   * dibuja uno falso para que se vea el pie completo: un preview al que le
   * falta el pie no sirve para comprobar el pie.
   */
  unsubscribeUrl?: string | null
  /** El sitio, para el logotipo y los enlaces del pie. */
  siteUrl: string
}

// ── Utilidades ─────────────────────────────────────────────────────────────

/**
 * Escapa lo que va dentro del HTML.
 *
 * El cuerpo lo escribe administración, no un desconocido, así que esto no es
 * una defensa contra un ataque: es que un apellido con `&` o una frase con
 * comillas angulares no rompa el correo de mil personas en silencio.
 */
export function escapar(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * ¿Es una dirección a la que se puede mandar a alguien?
 *
 * Solo http y https. Un `javascript:` en un botón de correo no llega a
 * ejecutarse en ningún cliente serio, pero tampoco tiene nada que hacer aquí.
 */
export function esUrlValida(u: string | null | undefined): boolean {
  if (!u) return false
  try {
    const url = new URL(u)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * La etiqueta de combinación de Resend, con respaldo.
 *
 * Tres llaves, no dos: dos llaves escapan el contenido y el nombre saldría con
 * las tildes rotas. El respaldo va detrás de la barra.
 */
const ETIQUETA_NOMBRE = "{{{FIRST_NAME|viajero}}}"

/**
 * Cómo se escribe el nombre en este correo.
 *
 * Es la única función que decide entre el nombre de verdad y la etiqueta. Todo
 * lo demás —el saludo, el titular, el cuerpo— la usa a ella.
 */
function nombreDe(d: DatosCorreo): string {
  if (d.nombreModo === "variable") return ETIQUETA_NOMBRE
  const n = (d.nombre || "").trim().split(/\s+/)[0]
  return n || ""
}

/**
 * Sustituye {nombre} allí donde administración lo haya escrito.
 *
 * Es la personalización dentro del texto, y es deliberadamente una sola cosa:
 * un sistema de variables con condiciones y bucles se convierte en algo que
 * hay que aprender, y aquí lo que hace falta es poder decir «Hola {nombre}, la
 * Temporada 4 ya está abierta» sin pensar en nada más.
 *
 * Cuando no hay nombre —una vista previa sin datos— el token desaparece junto
 * con la coma o el espacio que lo seguía, para que no quede «Hola , la...».
 */
function ponerNombre(texto: string, nombre: string): string {
  if (!texto.includes("{nombre}")) return texto
  if (nombre) return texto.replace(/\{nombre\}/g, nombre)
  return texto.replace(/\s*\{nombre\}\s*,?\s*/g, " ").replace(/\s{2,}/g, " ").trim()
}

/**
 * El cuerpo, de texto a párrafos.
 *
 * Administración escribe en un campo de texto normal, con líneas en blanco
 * entre párrafos. No hay HTML que editar, que era la condición.
 *
 * Se reconocen dos cosas más, porque son las dos que se echan de menos
 * enseguida y no obligan a aprender nada:
 *   · una línea que empieza por «- » es un punto de una lista
 *   · **así** pone algo en negrita
 */
export function cuerpoAHtml(texto: string): string {
  const bloques = String(texto ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)

  const enfatizar = (s: string) =>
    escapar(s).replace(/\*\*(.+?)\*\*/g, `<strong style="color:${C.texto};font-weight:600;">$1</strong>`)

  return bloques
    .map((bloque) => {
      const lineas = bloque.split("\n").map((l) => l.trim())
      const esLista = lineas.every((l) => l.startsWith("- ") || l.startsWith("• "))

      if (esLista) {
        const items = lineas
          .map((l) => l.replace(/^[-•]\s+/, ""))
          .map(
            (l) =>
              `<tr><td valign="top" width="18" style="padding:0 0 10px 0;color:${C.dorado};font-family:${FUENTE};font-size:16px;line-height:26px;">&bull;</td>` +
              `<td style="padding:0 0 10px 0;color:${C.textoSuave};font-family:${FUENTE};font-size:16px;line-height:26px;">${enfatizar(l)}</td></tr>`,
          )
          .join("")
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">${items}</table>`
      }

      // Los saltos sueltos dentro de un párrafo se respetan: una dirección o
      // una firma se escriben así y partirlas en párrafos las separa de más.
      const conSaltos = enfatizar(bloque).replace(/\n/g, "<br />")
      return `<p style="margin:0 0 18px 0;color:${C.textoSuave};font-family:${FUENTE};font-size:16px;line-height:26px;">${conSaltos}</p>`
    })
    .join("")
}

/**
 * La fecha de una sesión, escrita como la escribiría una persona.
 *
 * SIEMPRE en la zona horaria que eligió administración, nunca en la del
 * servidor ni en la de quien mira. «Miércoles 7:00 PM México» tiene que decir
 * lo mismo en Lima, en Madrid y en el Worker que manda el correo.
 */
export function fechaLegible(iso: string, zona: string): { dia: string; hora: string } | null {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return null
  try {
    const dia = new Intl.DateTimeFormat("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: zona,
    }).format(d)
    const hora = new Intl.DateTimeFormat("es-ES", {
      hour: "numeric", minute: "2-digit", hour12: true, timeZone: zona,
    }).format(d)
    return { dia: dia.charAt(0).toUpperCase() + dia.slice(1), hora }
  } catch {
    // Zona horaria que el entorno no conoce: antes media fecha que ninguna.
    return null
  }
}

// ── Las piezas ─────────────────────────────────────────────────────────────

/**
 * El preheader: el trocito que Gmail enseña detrás del asunto.
 *
 * Va oculto y seguido de espacios invisibles. Sin ese relleno, el cliente
 * completa la línea con lo primero que encuentre del correo —normalmente
 * «Ver en el navegador» o la propia cabecera— y se desperdicia el único sitio
 * donde se puede añadir algo al asunto.
 */
function Preheader(texto: string): string {
  if (!texto.trim()) return ""
  const relleno = "&#847;&zwnj;&nbsp;".repeat(90)
  return (
    `<div style="display:none;font-size:1px;color:${C.fondo};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">` +
    `${escapar(texto)}${relleno}</div>`
  )
}

function Cabecera(siteUrl: string, acento: (typeof ACENTO)[FamiliaPlantilla]): string {
  return (
    // La franja. Cuatro píxeles del color de la familia, lo primero que se ve
    // al abrir. Es lo que hace que una sesión en vivo y un episodio nuevo se
    // distingan antes de leer nada.
    `<tr><td height="4" style="height:4px;line-height:4px;font-size:4px;background-color:${acento.color};">&nbsp;</td></tr>` +

    `<tr><td align="center" style="padding:32px 24px 8px 24px;">` +
    `<a href="${escapar(siteUrl)}" style="text-decoration:none;">` +
    `<span style="font-family:${FUENTE};font-size:15px;font-weight:700;letter-spacing:6px;color:${C.doradoClaro};text-transform:uppercase;">` +
    `LOS&nbsp;144000</span></a>` +
    `</td></tr>` +
    // Una línea fina en vez de un borde: el borde de una celda se dibuja
    // distinto en cada cliente; una celda de 1px de alto con fondo, no.
    `<tr><td align="center" style="padding:16px 24px 0 24px;">` +
    `<table role="presentation" width="60" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td height="1" style="height:1px;line-height:1px;font-size:1px;background-color:${acento.color};opacity:0.5;">&nbsp;</td>` +
    `</tr></table></td></tr>`
  )
}

function Hero(d: DatosCorreo, acento: (typeof ACENTO)[FamiliaPlantilla]): string {
  const partes: string[] = []
  const nombre = nombreDe(d)

  if (d.eyebrow.trim()) {
    // El eyebrow va en una pastilla del color de la familia: a este tamaño, un
    // texto de color sobre fondo oscuro se lee peor que uno claro sobre un
    // fondo teñido, y además marca mejor la clase de correo.
    partes.push(
      `<tr><td align="center" style="padding:28px 28px 0 28px;">` +
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>` +
      `<td style="background-color:${acento.suave};padding:6px 14px;">` +
      `<span style="font-family:${FUENTE};font-size:11px;font-weight:700;letter-spacing:3px;color:${acento.color};text-transform:uppercase;">` +
      `${escapar(d.eyebrow)}</span></td></tr></table></td></tr>`,
    )
  }

  if (d.heading.trim()) {
    partes.push(
      `<tr><td align="center" style="padding:16px 28px 0 28px;">` +
      `<h1 style="margin:0;font-family:${FUENTE};font-size:27px;line-height:34px;font-weight:700;color:${C.texto};">` +
      `${escapar(ponerNombre(d.heading, nombre))}</h1></td></tr>`,
    )
  }

  // La imagen va DESPUÉS del titular a propósito. Muchos clientes no cargan
  // imágenes hasta que la persona lo pide; si la imagen fuera lo primero, el
  // correo abriría con un rectángulo vacío y ningún texto.
  if (esUrlValida(d.imageUrl)) {
    partes.push(
      `<tr><td align="center" style="padding:26px 24px 0 24px;">` +
      `<img src="${escapar(d.imageUrl!)}" alt="" width="${ANCHO - 48}" ` +
      `style="display:block;width:100%;max-width:${ANCHO - 48}px;height:auto;border:0;outline:none;text-decoration:none;" />` +
      `</td></tr>`,
    )
  }

  return partes.join("")
}

function Saludo(nombre: string): string {
  if (!nombre) return ""
  // La etiqueta de combinación NO se escapa: si se escapara, las llaves
  // saldrían convertidas y el proveedor no las reconocería. Un nombre literal
  // sí, porque lo escribe una persona.
  const texto = nombre === ETIQUETA_NOMBRE ? nombre : escapar(nombre)
  return (
    `<tr><td style="padding:30px 28px 0 28px;">` +
    `<p style="margin:0;font-family:${FUENTE};font-size:16px;line-height:26px;color:${C.texto};">` +
    `Hola ${texto},</p></td></tr>`
  )
}

function Cuerpo(texto: string, conSaludo: boolean, nombre: string): string {
  const html = cuerpoAHtml(ponerNombre(texto, nombre))
  if (!html) return ""
  return `<tr><td style="padding:${conSaludo ? 14 : 30}px 28px 0 28px;">${html}</td></tr>`
}

/**
 * El bloque de fecha de una sesión o un encuentro.
 *
 * Lo que necesita alguien que va a asistir, en el orden en que lo necesita:
 * qué día, a qué hora, en qué zona horaria y dónde. La zona SIEMPRE escrita:
 * «7:00 PM» sin más es una cita a la que media Red llega tarde.
 */
function BloqueFecha(d: DatosCorreo, acento: (typeof ACENTO)[FamiliaPlantilla]): string {
  if (!d.eventAt || !d.eventTimezone) return ""
  const f = fechaLegible(d.eventAt, d.eventTimezone)
  if (!f) return ""

  const zonaCorta = d.eventTimezone.split("/").pop()?.replace(/_/g, " ") || d.eventTimezone
  const filas: string[] = []

  if (d.eventTitle?.trim()) {
    filas.push(
      `<tr><td align="center" style="padding:0 0 12px 0;">` +
      `<span style="font-family:${FUENTE};font-size:18px;font-weight:700;color:${acento.color};">${escapar(d.eventTitle)}</span>` +
      `</td></tr>`,
    )
  }

  filas.push(
    `<tr><td align="center" style="padding:0 0 6px 0;">` +
    `<span style="font-family:${FUENTE};font-size:15px;line-height:24px;color:${C.texto};">${escapar(f.dia)}</span>` +
    `</td></tr>`,
    `<tr><td align="center" style="padding:0 0 4px 0;">` +
    `<span style="font-family:${FUENTE};font-size:23px;line-height:30px;font-weight:700;color:${acento.color};">${escapar(f.hora)}</span>` +
    `</td></tr>`,
    `<tr><td align="center" style="padding:0;">` +
    `<span style="font-family:${FUENTE};font-size:12px;letter-spacing:1px;color:${C.textoTenue};text-transform:uppercase;">` +
    `Hora de ${escapar(zonaCorta)}</span></td></tr>`,
  )

  if (d.eventLocation?.trim()) {
    filas.push(
      `<tr><td align="center" style="padding:12px 0 0 0;">` +
      `<span style="font-family:${FUENTE};font-size:14px;line-height:22px;color:${C.textoSuave};">${escapar(d.eventLocation)}</span>` +
      `</td></tr>`,
    )
  }

  return (
    `<tr><td style="padding:26px 28px 0 28px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ` +
    `style="background-color:${C.panelSuave};border:1px solid ${acento.color};">` +
    `<tr><td style="padding:24px 20px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${filas.join("")}</table>` +
    `</td></tr></table></td></tr>`
  )
}

/**
 * El botón.
 *
 * Una tabla con fondo y un enlace de bloque dentro: es la forma que funciona
 * en Outlook sin recurrir a VML. Sin `border-radius`, que Outlook ignora y
 * deja un rectángulo — mejor un rectángulo a propósito que uno por accidente.
 */
function Boton(texto: string, url: string, acento: (typeof ACENTO)[FamiliaPlantilla]): string {
  return (
    `<tr><td align="center" style="padding:30px 28px 0 28px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0">` +
    `<tr><td align="center" style="background-color:${acento.color};">` +
    `<a href="${escapar(url)}" target="_blank" ` +
    `style="display:inline-block;padding:15px 34px;font-family:${FUENTE};font-size:13px;font-weight:700;` +
    `letter-spacing:2px;text-transform:uppercase;color:${acento.tinta};text-decoration:none;">` +
    `${escapar(texto)}</a></td></tr></table></td></tr>`
  )
}

/**
 * El pie.
 *
 * Lleva quién escribe, desde dónde, y cómo dejar de recibirlo. Lo último no es
 * un adorno legal: un correo editorial sin salida es lo que hace que la gente
 * marque como spam en vez de darse de baja, y eso daña el dominio entero,
 * incluidos los correos de acceso que sí hacen falta.
 */
function Pie(d: DatosCorreo): string {
  const baja = d.unsubscribeUrl
    ? `<tr><td align="center" style="padding:14px 28px 0 28px;">` +
      `<a href="${escapar(d.unsubscribeUrl)}" style="font-family:${FUENTE};font-size:12px;line-height:20px;color:${C.textoTenue};text-decoration:underline;">` +
      `Dejar de recibir estas comunicaciones</a></td></tr>`
    : ""

  return (
    `<tr><td align="center" style="padding:40px 28px 0 28px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td height="1" style="height:1px;line-height:1px;font-size:1px;background-color:${C.borde};">&nbsp;</td>` +
    `</tr></table></td></tr>` +

    `<tr><td align="center" style="padding:22px 28px 0 28px;">` +
    `<span style="font-family:${FUENTE};font-size:12px;line-height:20px;color:${C.textoTenue};">` +
    `Recibes este correo porque formas parte de Los 144.000.</span></td></tr>` +

    baja +

    `<tr><td align="center" style="padding:14px 28px 0 28px;">` +
    `<a href="${escapar(d.siteUrl)}" style="font-family:${FUENTE};font-size:12px;line-height:20px;color:${C.violeta};text-decoration:none;">` +
    `los144000.com</a></td></tr>` +

    `<tr><td style="padding:0 0 40px 0;">&nbsp;</td></tr>`
  )
}

// ── El correo entero ───────────────────────────────────────────────────────

/**
 * De los datos de una comunicación al HTML que recibe la gente.
 *
 * La familia de plantilla decide el orden de las piezas. Son cuatro órdenes,
 * no cuatro diseños: el sello visual es el mismo en todas, porque todas vienen
 * del mismo sitio y quien las recibe tiene que reconocerlas sin leer.
 */
export function renderCorreo(d: DatosCorreo): string {
  const familia: FamiliaPlantilla = TIPOS[d.tipo].familia
  const acento = ACENTO[familia]
  const nombre = nombreDe(d)
  const conSaludo = Boolean(nombre)
  const hayBoton = Boolean(d.ctaText?.trim()) && esUrlValida(d.ctaUrl)

  const piezas: string[] = [Cabecera(d.siteUrl, acento), Hero(d, acento)]

  if (familia === "sesion" || familia === "red") {
    // En una sesión, la fecha es la noticia. Va antes que el texto: quien abre
    // esto quiere saber cuándo, y solo después por qué.
    piezas.push(BloqueFecha(d, acento))
    if (conSaludo) piezas.push(Saludo(nombre))
    piezas.push(Cuerpo(d.body, conSaludo, nombre))
  } else {
    if (conSaludo) piezas.push(Saludo(nombre))
    piezas.push(Cuerpo(d.body, conSaludo, nombre))
    piezas.push(BloqueFecha(d, acento))
  }

  if (hayBoton) piezas.push(Boton(d.ctaText!.trim(), d.ctaUrl!, acento))
  piezas.push(Pie(d))

  const cuerpo = piezas.filter(Boolean).join("")

  return `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark light" />
<meta name="supported-color-schemes" content="dark light" />
<title>${escapar(d.heading || "Los 144.000")}</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<style>
  /* Lo único que se deja en una hoja de estilos es lo que NO puede ir en
     línea: la consulta de ancho y los retoques de un par de clientes. Gmail
     borra casi todo esto, y por eso el correo ya se ve bien sin ello. */
  body { margin:0 !important; padding:0 !important; width:100% !important; background-color:${C.fondo}; }
  table { border-collapse:collapse !important; }
  img { -ms-interpolation-mode:bicubic; }
  a { color:${C.violeta}; }
  /* Apple Mail y algunos Android subrayan y colorean lo que les parece un
     teléfono o una dirección. Aquí eso deja el pie con enlaces azules. */
  a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; font-size:inherit !important; }
  @media only screen and (max-width:620px) {
    .marco { width:100% !important; }
    .h1movil { font-size:23px !important; line-height:30px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.fondo};">
${Preheader(d.preheader)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.fondo};">
<tr><td align="center" style="padding:0;">
<table role="presentation" class="marco" width="${ANCHO}" cellpadding="0" cellspacing="0" border="0" style="width:${ANCHO}px;max-width:${ANCHO}px;background-color:${C.panel};">
${cuerpo}
</table>
</td></tr>
</table>
</body>
</html>`
}

/**
 * La versión en texto plano.
 *
 * No es un trámite. Algunos clientes la enseñan, los filtros de spam la
 * comparan con el HTML, y un correo sin ella puntúa peor. Se genera del mismo
 * contenido, así que nunca puede decir algo distinto.
 */
export function renderTexto(d: DatosCorreo): string {
  const lineas: string[] = ["LOS 144000", ""]

  if (d.eyebrow.trim()) lineas.push(d.eyebrow.toUpperCase(), "")
  if (d.heading.trim()) lineas.push(ponerNombre(d.heading, nombreDe(d)), "")

  const nombre = nombreDe(d)
  if (nombre) lineas.push(`Hola ${nombre},`, "")

  if (d.body.trim()) {
    lineas.push(ponerNombre(d.body, nombre).replace(/\*\*(.+?)\*\*/g, "$1").trim(), "")
  }

  if (d.eventAt && d.eventTimezone) {
    const f = fechaLegible(d.eventAt, d.eventTimezone)
    if (f) {
      const zona = d.eventTimezone.split("/").pop()?.replace(/_/g, " ") || d.eventTimezone
      if (d.eventTitle?.trim()) lineas.push(d.eventTitle)
      lineas.push(`${f.dia} · ${f.hora} (hora de ${zona})`)
      if (d.eventLocation?.trim()) lineas.push(d.eventLocation)
      lineas.push("")
    }
  }

  if (d.ctaText?.trim() && esUrlValida(d.ctaUrl)) {
    lineas.push(`${d.ctaText.trim()}: ${d.ctaUrl}`, "")
  }

  lineas.push("—", "Recibes este correo porque formas parte de Los 144.000.")
  if (d.unsubscribeUrl) lineas.push(`Dejar de recibirlas: ${d.unsubscribeUrl}`)
  lineas.push(d.siteUrl)

  return lineas.join("\n")
}

/** De una fila de la base a lo que necesita el renderizador. */
export function datosDesdeComunicacion(
  c: Pick<
    Comunicacion,
    | "type" | "preheader" | "eyebrow" | "heading" | "body" | "image_url"
    | "cta_text" | "cta_url" | "event_title" | "event_at" | "event_timezone"
    | "event_location"
  >,
  extra: {
    nombre?: string | null
    nombreModo?: "literal" | "variable"
    unsubscribeUrl?: string | null
    siteUrl: string
  },
): DatosCorreo {
  return {
    tipo: c.type,
    preheader: c.preheader || "",
    eyebrow: c.eyebrow || "",
    heading: c.heading || "",
    body: c.body || "",
    imageUrl: c.image_url,
    ctaText: c.cta_text,
    ctaUrl: c.cta_url,
    eventTitle: c.event_title,
    eventAt: c.event_at,
    eventTimezone: c.event_timezone,
    eventLocation: c.event_location,
    nombre: extra.nombre ?? null,
    nombreModo: extra.nombreModo ?? "literal",
    unsubscribeUrl: extra.unsubscribeUrl ?? null,
    siteUrl: extra.siteUrl,
  }
}
