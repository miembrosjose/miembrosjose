// ═══════════════════════════════════════════════════════════════════════════
//  EL HTML ESCRITO A MANO · limpiarlo y avisar de lo que no va a funcionar
// ═══════════════════════════════════════════════════════════════════════════
//
// Administración puede escribir el correo en HTML en vez de rellenar el
// formulario. Esto es lo que se interpone entre lo que escribe y lo que sale.
//
// ── DOS TRABAJOS DISTINTOS, Y NO HAY QUE CONFUNDIRLOS ─────────────────────
//
//   LIMPIAR  es seguridad. Quitar lo que puede hacer daño. No es opinable y
//            no se puede desactivar.
//
//   AVISAR   es oficio. Decir «esto en Outlook no se va a ver». Son consejos,
//            y se pueden ignorar: a veces se sabe que el correo va a una
//            lista que solo usa Gmail.
//
// Mezclarlos llevaría a quitar cosas que solo son feas, o a dejar pasar cosas
// peligrosas porque «es solo un aviso».
//
// ── POR QUÉ NO SE USA UNA LIBRERÍA ────────────────────────────────────────
// Las que existen saneando HTML para navegador —DOMPurify y compañía— dan por
// hecho que hay un DOM. Aquí se dibuja en el servidor, en un Worker de
// Cloudflare, donde no lo hay. Y el problema es más pequeño que el general:
// no hay que defender un navegador, hay que producir HTML de correo, donde
// JavaScript no existe para nadie y casi todas las etiquetas sobran.
//
// ── EL HTML SE GUARDA SIN LIMPIAR ─────────────────────────────────────────
// Se limpia al DIBUJARLO, no al guardarlo. Si se guardara ya limpio, el
// original se perdería: el día que este saneador mejore, lo que está en la
// base no se puede volver a procesar. Y quien escribió el correo vería su
// código mutilado al volver a abrirlo, sin saber qué le pasó.

/** Lo que se quita entero, con su contenido dentro. */
const ETIQUETAS_PROHIBIDAS = [
  // Nunca se ejecuta en un correo, y en una vista previa dentro del panel
  // sí se ejecutaría: es la vía para robarle la sesión a quien revisa.
  "script",
  // Carga cosas de fuera y puede tapar la pantalla.
  "iframe", "object", "embed", "applet",
  // Un formulario dentro de un correo es una invitación a escribir una
  // contraseña en algo que nadie ha verificado.
  "form", "input", "button", "select", "textarea",
  // `<base>` cambia a dónde apuntan TODOS los enlaces de golpe.
  "base", "link", "meta",
  // Enseña texto sin interpretarlo; sirve para esconder cosas al revisor.
  "noscript", "template",
] as const

/**
 * Atributos que se quitan de cualquier etiqueta.
 *
 * Todo lo que empiece por `on` es un manejador de eventos. No se listan uno a
 * uno —hay más de setenta y aparecen nuevos— sino por cómo empiezan.
 */
const ATRIBUTOS_PROHIBIDOS = /\s(on[a-z]+|srcdoc|formaction|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi

/** Una dirección que no sea de estas no se queda en un `href` ni en un `src`. */
const ESQUEMAS_BUENOS = /^(https?:|mailto:|tel:|cid:|#|\/)/i

export type AvisoHtml = {
  nivel: "error" | "aviso"
  mensaje: string
}

/**
 * Deja el HTML en condiciones de salir por correo.
 *
 * No intenta entender la estructura: trabaja sobre el texto. Un analizador
 * completo sería más elegante y aquí no hace falta, porque lo que se quita
 * son etiquetas y atributos concretos, no estructuras.
 */
export function limpiarHtmlCorreo(html: string): string {
  let out = html

  // ── 1 · LOS COMENTARIOS CONDICIONALES DE OUTLOOK SE RESPETAN ───────────
  // `<!--[if mso]>` es la única forma de arreglar cosas en Outlook, y es un
  // comentario: si se quitaran los comentarios a ciegas, se rompería justo
  // el cliente más difícil.
  //
  // Los demás comentarios también se dejan: no hacen daño y a veces llevan
  // notas de quien escribió la plantilla.

  // ── 2 · FUERA LAS ETIQUETAS PROHIBIDAS, CON SU CONTENIDO ───────────────
  for (const etiqueta of ETIQUETAS_PROHIBIDAS) {
    // Con contenido: <script>...</script>
    out = out.replace(
      new RegExp(`<${etiqueta}\\b[^>]*>[\\s\\S]*?<\\/${etiqueta}\\s*>`, "gi"),
      "",
    )
    // Sueltas o sin cerrar: <meta ...>, <script ...> huérfano
    out = out.replace(new RegExp(`<\\/?${etiqueta}\\b[^>]*>`, "gi"), "")
  }

  // ── 3 · FUERA LOS MANEJADORES DE EVENTOS ───────────────────────────────
  out = out.replace(ATRIBUTOS_PROHIBIDOS, "")

  // ── 4 · LAS DIRECCIONES QUE NO SON DIRECCIONES ─────────────────────────
  // `javascript:` en un `href` no se ejecuta en ningún cliente de correo
  // serio, pero sí en la vista previa del panel si se dibujara suelta.
  out = out.replace(
    /\s(href|src|background|action)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (entero, atributo: string, _comillas: string, dobles?: string, simples?: string, pelado?: string) => {
      const valor = (dobles ?? simples ?? pelado ?? "").trim()
      if (ESQUEMAS_BUENOS.test(valor)) return entero
      // Se quita el atributo entero, no solo el valor: un `href` vacío
      // convierte el enlace en un enlace a la página actual, que en un correo
      // no significa nada.
      return ""
    },
  )

  // ── 5 · `style` CON `expression()` ─────────────────────────────────────
  // Un resto de Internet Explorer que ejecutaba JavaScript desde CSS. No lo
  // entiende ningún cliente actual, pero aparece en plantillas copiadas de
  // sitios viejos y no cuesta nada quitarlo.
  out = out.replace(/expression\s*\(/gi, "")

  return out
}

/**
 * Lo que no va a funcionar, o va a funcionar a medias.
 *
 * ── POR QUÉ ESTO NO BLOQUEA EL ENVÍO ──────────────────────────────────────
 * Porque son consejos sobre clientes de correo, no errores. Alguien puede
 * saber perfectamente que ese correo va a una lista que abre todo en Gmail, y
 * un sistema que no le deja enviar por eso se convierte en un estorbo que la
 * gente aprende a rodear.
 *
 * Lo único que SÍ bloquea es que no haya nada escrito.
 */
export function revisarHtmlCorreo(html: string): AvisoHtml[] {
  const avisos: AvisoHtml[] = []
  const bajo = html.toLowerCase()

  if (!html.trim()) {
    avisos.push({ nivel: "error", mensaje: "No hay nada escrito." })
    return avisos
  }

  // ── LO QUE SE QUITÓ, DICHO ──────────────────────────────────────────────
  // Que el saneador funcione en silencio es peor que no tenerlo: quien
  // escribió un formulario y no lo ve en la prueba pensará que falló el
  // envío y volverá a intentarlo tres veces.
  if (/<script\b/i.test(html)) {
    avisos.push({
      nivel: "aviso",
      mensaje: "Hay un <script>. Se quita al enviar: ningún cliente de correo ejecuta JavaScript.",
    })
  }
  if (/<form\b|<input\b|<button\b/i.test(html)) {
    avisos.push({
      nivel: "aviso",
      mensaje: "Hay un formulario. Se quita: en un correo no funciona, y pedir datos ahí es lo que hace el phishing.",
    })
  }
  if (/<iframe\b|<object\b|<embed\b/i.test(html)) {
    avisos.push({
      nivel: "aviso",
      mensaje: "Hay contenido incrustado (iframe, object o embed). Se quita: no lo muestra ningún cliente.",
    })
  }

  // ── LO QUE SE QUEDA PERO NO SE VA A VER ────────────────────────────────
  if (/<style\b/i.test(html)) {
    avisos.push({
      nivel: "aviso",
      mensaje: "Hay una hoja de estilos. Gmail la recorta y Outlook la ignora a trozos. "
        + "Lo que tenga que verse seguro va en `style=\"\"` dentro de cada etiqueta.",
    })
  }
  if (/\bdisplay\s*:\s*flex|\bdisplay\s*:\s*grid/i.test(bajo)) {
    avisos.push({
      nivel: "aviso",
      mensaje: "Hay flex o grid. Outlook los ignora y el diseño se apila en una columna. "
        + "Para que quede igual en todas partes, la maquetación va con <table>.",
    })
  }
  if (/position\s*:\s*(absolute|fixed)/i.test(bajo)) {
    avisos.push({
      nivel: "aviso",
      mensaje: "Hay posicionamiento absoluto o fijo. En correo no funciona en casi ningún sitio.",
    })
  }
  if (/@media\b/i.test(bajo) && !/<style\b/i.test(html)) {
    avisos.push({
      nivel: "aviso",
      mensaje: "Hay una consulta @media fuera de un <style>. Ahí no hace nada.",
    })
  }
  if (/\bsvg\b/i.test(bajo) && /<svg\b/i.test(html)) {
    avisos.push({
      nivel: "aviso",
      mensaje: "Hay un SVG. Gmail no lo enseña. Para un logo, un PNG se ve en todas partes.",
    })
  }
  if (/<video\b|<audio\b/i.test(html)) {
    avisos.push({
      nivel: "aviso",
      mensaje: "Hay vídeo o audio. No se reproduce en el correo: lo normal es una imagen que enlaza.",
    })
  }

  // ── LO QUE FALTA ────────────────────────────────────────────────────────
  const imagenes = html.match(/<img\b[^>]*>/gi) || []
  const sinAlt = imagenes.filter((i) => !/\balt\s*=/i.test(i))
  if (sinAlt.length > 0) {
    avisos.push({
      nivel: "aviso",
      mensaje: `${sinAlt.length} ${sinAlt.length === 1 ? "imagen no tiene" : "imágenes no tienen"} texto alternativo. `
        + "Muchos clientes no cargan imágenes por defecto: sin él ahí no se lee nada.",
    })
  }

  // Un correo sin ningún enlace para darse de baja no es ilegal por sí mismo
  // —lo transaccional no lo lleva— pero esto es editorial, y aquí sí hace
  // falta. El dibujo final lo añade si no está; se avisa para que nadie
  // suponga que lo puso.
  if (!/unsubscribe|baja|dar.{0,3}de.{0,3}baja/i.test(bajo)) {
    avisos.push({
      nivel: "aviso",
      mensaje: "No se ve ningún enlace para darse de baja. Se añade automáticamente al pie.",
    })
  }

  return avisos
}
