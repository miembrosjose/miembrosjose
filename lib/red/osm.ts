// ═══════════════════════════════════════════════════════════════════════════
//  LEER UNA FICHA DE OPENSTREETMAP · qué puede entrar en el catálogo
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ ESTO ESTÁ SOLO Y SIN IMPORTAR NADA ────────────────────────────
// Porque es la frontera: lo que pase por aquí se escribe en `network_cities`,
// que es una tabla COMPARTIDA —lo que una persona cree ahí lo ven todas—. Un
// descuido no se ve en la pantalla de quien lo provocó: se ve meses después,
// en forma de dos filas del mismo pueblo o de un río en la lista de ciudades.
//
// Sin dependencias, la decisión se prueba con un objeto. Las pruebas están en
// scripts/probar-osm.mjs.
//
// ── LA REGLA DE ORO ───────────────────────────────────────────────────────
// Nada de lo que escriba el navegador llega a la base. El navegador manda un
// identificador; el servidor pide la ficha a OpenStreetMap y de ESA ficha
// salen el nombre, la región y las coordenadas. Estas funciones solo leen la
// ficha, nunca la petición.

/** Lo que devuelve Nominatim, de lo que nos interesa. */
export type FichaOSM = {
  osm_type?: string
  osm_id?: number
  name?: string
  lat?: string | number
  lon?: string | number
  class?: string
  type?: string
  address?: Record<string, string>
}

/** Una ciudad lista para guardar, ya comprobada. */
export type CiudadLeida = {
  name: string
  admin1: string | null
  lat: number
  lon: number
  pais: string
}

/** La letra con la que OpenStreetMap abrevia el tipo: N, W o R. */
export function inicialDeTipo(t: string | undefined): "N" | "W" | "R" | null {
  if (t === "node") return "N"
  if (t === "way") return "W"
  if (t === "relation") return "R"
  return null
}

/** Un identificador de los que acepta el alta: una letra y un número. */
export function esIdentificadorValido(osm: string): boolean {
  return /^[NWR]\d{1,12}$/.test(osm)
}

/**
 * ¿Esta ficha es un sitio donde vive gente?
 *
 * Sin esta comprobación se podría meter un río, una montaña o una tienda en
 * el catálogo de ciudades, y a partir de ahí saldrían en el desplegable de
 * todo el mundo.
 *
 *   place                    ciudades, pueblos, aldeas, barrios
 *   boundary/administrative  municipios y comunas — así figuran muchos
 *                            pueblos pequeños, que es justo el caso que
 *                            obligó a abrir el catálogo
 */
export function esUnSitioHabitado(f: FichaOSM): boolean {
  if (f.class === "place") return true
  return f.class === "boundary" && f.type === "administrative"
}

/**
 * La provincia, el estado o la región. Lo primero que OpenStreetMap sepa.
 *
 * Puede no haber ninguna, y eso es legítimo: hay países sin división
 * intermedia. Devuelve null, no una cadena vacía — la diferencia importa,
 * porque en la base el nulo y el vacío no se comparan igual.
 */
export function regionDe(f: FichaOSM): string | null {
  const a = f.address || {}
  const r = a.state || a.region || a.province || a.county || a.state_district || ""
  return r.trim() || null
}

/** El nombre de la ciudad, en español cuando OpenStreetMap lo tiene. */
export function nombreDe(f: FichaOSM): string {
  const a = f.address || {}
  return (f.name || a.city || a.town || a.village || a.municipality || "").trim()
}

/** Cómo se escribe en la lista: «Cuenca · Azuay», o solo «Cuenca». */
export function etiquetaDe(name: string, admin1: string | null): string {
  return admin1 && admin1 !== name ? `${name} · ${admin1}` : name
}

/**
 * Leer una ficha para guardarla, comprobándolo todo.
 *
 * Devuelve null si algo no cuadra, y quien llama no guarda nada. Las cuatro
 * razones por las que puede no cuadrar:
 *
 *   · no es un sitio habitado — un río, una calle, un comercio
 *   · no está en el país que dice el formulario — guardar Cuenca de Ecuador
 *     declarando España rompería todos los recuentos por país
 *   · no tiene nombre — pasa con algunas fichas administrativas
 *   · no tiene coordenadas válidas — sin ellas no se puede pintar en el mapa
 */
export function leerFicha(f: FichaOSM | null | undefined, paisEsperado: string): CiudadLeida | null {
  if (!f) return null
  if (!esUnSitioHabitado(f)) return null

  const pais = (f.address?.country_code || "").toUpperCase()
  if (!/^[A-Z]{2}$/.test(pais) || pais !== paisEsperado.toUpperCase()) return null

  const name = nombreDe(f)
  if (!name) return null

  const lat = Number(f.lat)
  const lon = Number(f.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  // Fuera del planeta no hay ciudades. Un cero-cero tampoco: es lo que
  // devuelve una ficha rota, y cae en medio del Atlántico.
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  if (lat === 0 && lon === 0) return null

  return { name, admin1: regionDe(f), lat, lon, pais }
}
