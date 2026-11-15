// ═══════════════════════════════════════════════════════════════════════════
//  A DÓNDE PUEDE LLEVAR UN AVISO · los sitios que existen de verdad
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ HACE FALTA ESTA LISTA ─────────────────────────────────────────
// El campo «A dónde lleva» era texto libre, y su propio ejemplo —el
// marcador de posición y la ayuda de debajo— proponía
// `/miembros/transmisiones`, que NO EXISTE. Las transmisiones viven en
// `/miembros#feed`.
//
// Un ejemplo equivocado es peor que ninguno: es lo que se copia. Y el aviso
// salía igual, llegaba igual, y al tocarlo caía en una página que no está.
//
// ── POR QUÉ UNA LISTA Y NO UNA EXPRESIÓN REGULAR ──────────────────────────
// Porque la plataforma es una sola pantalla con vistas dentro, y cuál es la
// dirección de cada sección no se puede adivinar mirándola: «Recursos de los
// 144000» se llama `biblioteca` por dentro y «Biblioteca» se llama
// `libreria`. Nadie va a acertar eso escribiendo a mano.
//
// Esta lista es la que se le ofrece a quien redacta, así que elegir mal deja
// de ser posible. Si mañana cambia una ruta, se cambia aquí y se cambian a la
// vez el selector del panel y la validación.
//
// ── DE DÓNDE SALE ─────────────────────────────────────────────────────────
// De `app/miembros/_lib/view-context.tsx` (`parsePath`), que es quien decide
// de verdad qué hace cada dirección, y de las secciones con `id` en la
// portada. Está comprobado una por una: lo que no se pudo comprobar no está.

export type DestinoDePlataforma = {
  /** Lo que se guarda en `cta_url`. */
  ruta: string
  /** Cómo se llama de cara a quien redacta, no por dentro. */
  nombre: string
  /** Para los nombres que no coinciden con lo que se ve en pantalla. */
  nota?: string
}

export const DESTINOS_DE_LA_PLATAFORMA: DestinoDePlataforma[] = [
  { ruta: "/miembros", nombre: "Inicio", nota: "Arriba están las Novedades de Los 144.000" },
  { ruta: "/miembros#feed", nombre: "Transmisiones" },
  { ruta: "/miembros/red", nombre: "La Red", nota: "Entra por el Pulso de la semana" },
  { ruta: "/miembros#cursos", nombre: "Temporadas" },
  { ruta: "/miembros#biblioteca", nombre: "Recursos de los 144000" },
  { ruta: "/miembros#libreria", nombre: "Biblioteca" },
  { ruta: "/miembros#tienda", nombre: "Tienda" },
  { ruta: "/miembros/personas", nombre: "Miembros" },
  { ruta: "/miembros/mensajes", nombre: "Mensajes" },
  { ruta: "/miembros/perfil", nombre: "Mi perfil" },
]

/** Rutas exactas que la plataforma sabe abrir. */
const EXACTAS = new Set([
  "/miembros",
  "/miembros/red",
  "/miembros/perfil",
  "/miembros/personas",
  "/miembros/mensajes",
  "/miembros/admin",
  "/miembros/metricas",
])

/** Rutas con algo detrás: un perfil, un producto, una transmisión. */
const CON_COLA = ["/miembros/u/", "/miembros/producto/", "/miembros/feed/", "/miembros/mensajes/"]

/**
 * Los `#` que `parsePath` entiende sobre `/miembros`.
 *
 * Cualquier otro cae en la portada sin aviso: `/miembros#novedades` no es un
 * error para el navegador, simplemente no va a ninguna parte concreta.
 */
const ANCLAS = new Set([
  "inicio", "comunidad", "feed", "perfil", "admin", "messages", "miembros_lista", "red",
  "cursos", "biblioteca", "libreria", "tienda", "servicios",
])

/**
 * ¿Esta ruta de la plataforma existe?
 *
 * Solo para rutas propias (las que empiezan por `/`). Una dirección completa
 * de otro sitio —un Zoom, un YouTube— no se puede comprobar desde aquí y no
 * es asunto de esta función.
 */
export function rutaDeLaPlataformaExiste(ruta: string): boolean {
  const limpia = ruta.trim()
  if (!limpia.startsWith("/")) return false

  const [camino, hash = ""] = limpia.split("#")
  const base = (camino || "/miembros").replace(/\/+$/, "") || "/miembros"

  if (hash) {
    // Un `#` solo significa algo sobre la portada.
    if (base !== "/miembros") return false
    if (!ANCLAS.has(hash.toLowerCase())) return false
    return true
  }

  if (EXACTAS.has(base)) return true
  return CON_COLA.some((p) => base.startsWith(p) && base.length > p.length)
}

/**
 * ¿Sirve esto como destino de un aviso?
 *
 * Una ruta de la plataforma que exista, o una dirección completa https.
 * `http://` se rechaza a propósito: un aviso de la plataforma que abre algo
 * sin cifrar es un aviso que nadie debería haber mandado.
 */
export function destinoDeAvisoValido(destino: string): boolean {
  const d = destino.trim()
  if (!d) return true
  if (d.startsWith("//")) return false
  if (d.startsWith("/")) return rutaDeLaPlataformaExiste(d)
  try {
    return new URL(d).protocol === "https:"
  } catch {
    return false
  }
}

/** ¿Lleva fuera de la plataforma? Para decirlo en pantalla antes de enviar. */
export function destinoEsDeFuera(destino: string, sitio: string): boolean {
  const d = destino.trim()
  if (!d || d.startsWith("/")) return false
  try {
    return new URL(d).origin !== new URL(sitio).origin
  } catch {
    return false
  }
}
