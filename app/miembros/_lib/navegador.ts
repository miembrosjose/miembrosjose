"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  QUÉ NAVEGADOR ES · solo para saber dónde está el botón de instalar
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ HACE FALTA, SI YA SABEMOS QUÉ APARATO ES ──────────────────────
// Porque el aparato dice si es un iPhone, y eso no basta: el menú donde vive
// «añadir a pantalla de inicio» está en un sitio distinto en cada navegador
// del mismo iPhone.
//
// Las instrucciones decían «toca ••• abajo, junto a la dirección», que es
// Safari. En Chrome para iOS ese menú es ⋮ y está arriba a la derecha, así
// que quien entraba desde Chrome miraba donde no era y concluía que esto no
// funciona en su teléfono.
//
// ── Y POR QUÉ NO SE LE MANDA A SAFARI Y YA ────────────────────────────────
// Porque no hace falta. Desde iOS 16.4, cualquier navegador puede añadir una
// web a la pantalla de inicio: lo hace la hoja de compartir del sistema, no
// el navegador. Decirle a alguien «abre esto en Safari» cuando su navegador
// ya puede hacerlo es mandarle a dar un rodeo por nada.
//
// ── ESTO NO DECIDE NADA, SOLO ETIQUETA ────────────────────────────────────
// No se usa para habilitar ni bloquear funciones. Si la identificación miente
// —y miente a menudo— lo peor que pasa es que se enseñen unas instrucciones
// algo menos precisas. Nada depende de acertar.

/** Los navegadores que cambian dónde está el botón de compartir. */
export type Navegador =
  | "safari"        // el de serie en iPhone y iPad
  | "chrome-ios"    // Chrome en iOS: por dentro es WebKit, por fuera no
  | "otro-ios"      // Firefox, Edge, Opera… en iOS
  | "chrome"        // Chrome en Android y escritorio
  | "samsung"       // Samsung Internet
  | "firefox"       // Firefox en Android y escritorio
  | "edge"
  | "otro"

function ua(): string {
  if (typeof navigator === "undefined") return ""
  return navigator.userAgent || ""
}

/**
 * ¿Estamos dentro de iOS?
 *
 * Incluye el iPad, que desde iPadOS 13 se presenta como un Mac: dice
 * `MacIntel` y no menciona el iPad por ninguna parte. La pista que lo delata
 * es que ese «Mac» tiene pantalla táctil, cosa que ningún Mac de verdad
 * tiene.
 */
function enIOS(): boolean {
  if (typeof navigator === "undefined") return false
  if (/iPhone|iPod|iPad/.test(ua())) return true
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
}

/**
 * Qué navegador tenemos delante.
 *
 * ── EL ORDEN DE LAS COMPROBACIONES IMPORTA ────────────────────────────────
 * Todos estos navegadores mienten a propósito: Chrome para iOS dice ser
 * Safari además de Chrome, Edge dice ser Chrome, y Samsung Internet dice ser
 * Chrome también. Si se preguntara por Chrome antes que por los demás,
 * Samsung Internet y Edge responderían «Chrome» y se llevarían instrucciones
 * que no les valen.
 *
 * Por eso se pregunta de lo más específico a lo más general.
 */
export function queNavegador(): Navegador {
  const s = ua()

  // ── iOS primero ───────────────────────────────────────────────────────
  // Dentro de iOS todos los navegadores son WebKit por obligación de Apple,
  // así que lo único que cambia es dónde está su menú.
  if (enIOS()) {
    if (/CriOS/.test(s)) return "chrome-ios"
    if (/FxiOS|EdgiOS|OPT\//.test(s)) return "otro-ios"
    return "safari"
  }

  // Samsung Internet dice ser Chrome. Se pregunta antes.
  if (/SamsungBrowser/.test(s)) return "samsung"
  // Edge también dice ser Chrome. `EdgA` es Android, `Edg` el escritorio.
  if (/EdgA?\//.test(s)) return "edge"
  if (/Firefox\//.test(s)) return "firefox"
  if (/Chrome\//.test(s)) return "chrome"

  // Safari de escritorio llega aquí, y cualquier cosa rara también.
  return "otro"
}

/**
 * Cómo se llama el menú de este navegador, con su símbolo y dónde está.
 *
 * Se devuelve como datos y no escrito dentro de las instrucciones para que
 * añadir un navegador sea añadir una línea aquí, y no copiar un bloque de
 * pasos entero con una palabra cambiada.
 */
export type Menu = { simbolo: string; donde: string }

export function menuDe(navegador: Navegador): Menu {
  switch (navegador) {
    case "safari":
      // Safari moderno esconde compartir detrás de los tres puntos de la
      // barra de abajo. En versiones anteriores estaba a la vista.
      return { simbolo: "•••", donde: "abajo, junto a la dirección" }
    case "chrome-ios":
      return { simbolo: "⋮", donde: "abajo a la derecha" }
    case "otro-ios":
      return { simbolo: "⋮", donde: "en la barra de tu navegador" }
    case "samsung":
      return { simbolo: "≡", donde: "abajo a la derecha" }
    default:
      return { simbolo: "⋮", donde: "arriba a la derecha" }
  }
}
