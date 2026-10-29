// ═══════════════════════════════════════════════════════════════════════════
//  «LLÉVAME A TELEGRAM» · el mismo gesto, desde donde sea
// ═══════════════════════════════════════════════════════════════════════════
//
// El botón flotante de Telegram no abre una dirección fija: le pide a la Edge
// Function `telegram-link-start` una PERSONAL, a nombre de quien la pide y
// con caducidad. Esa es la única manera legítima de entrar al grupo.
//
// ── POR QUÉ ESTO EXISTE ────────────────────────────────────────────────────
// Porque el aviso de bienvenida también tiene que poder llevar ahí, y no
// puede llevar un enlace: un enlace fijo al grupo saltaría la comprobación de
// suscripción, y uno personal no se puede escribir en una comunicación que
// leen setenta personas distintas.
//
// Así que el aviso no lleva a ningún sitio: le pide al botón flotante que
// haga lo que ya sabe hacer.
//
// ── POR QUÉ UN EVENTO Y NO UNA FUNCIÓN COMPARTIDA ─────────────────────────
// Porque el flujo necesita el ESTADO del botón —si está ocupado, si hay que
// enseñar un error— y sacarlo de ahí obligaría a levantar un contexto para
// algo que ocurre una vez. El evento deja la lógica donde ya estaba.
//
// ── Y POR QUÉ TIENE QUE SER SÍNCRONO ──────────────────────────────────────
// El botón abre la pestaña ANTES de pedir el enlace, porque una pestaña
// abierta después de un `await` ya no cuenta como respuesta a un clic y el
// navegador la bloquea. Eso significa que este aviso tiene que salir dentro
// del manejador del clic, antes de cualquier espera. Si se mandara después,
// el grupo se abriría en unos navegadores y en otros no, que es la clase de
// fallo que solo aparece en el móvil de otra persona.

const EVENTO = "los144k:abrir-telegram"

/** Lo llama quien tiene un botón que debe llevar a Telegram. */
export function pedirTelegram(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(EVENTO))
}

/** Lo llama el botón flotante, que es quien sabe hacerlo de verdad. */
export function alPedirTelegram(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(EVENTO, fn)
  return () => window.removeEventListener(EVENTO, fn)
}
