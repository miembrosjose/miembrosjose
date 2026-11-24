// ═══════════════════════════════════════════════════════════════════════════
//  BUSCAR LA CIUDAD DE NACIMIENTO
// ═══════════════════════════════════════════════════════════════════════════
//
// ── EL FALLO QUE VENIMOS A ARREGLAR ───────────────────────────────────────
// La búsqueda era `cityTimezones.lookupViaCity(texto)`, que compara el nombre
// ENTERO y EXACTO —solo perdona mayúsculas—. Con eso, la gente escribía su
// ciudad una y otra vez y no aparecía ninguna opción; y como el lugar hay que
// ELEGIRLO de la lista, el botón se quedaba apagado y el formulario seguía
// pidiendo el lugar. Desde fuera parecía que no se enteraba de lo que
// escribías.
//
// Son tres problemas distintos, y hacían falta los tres arreglados:
//
//   1. LAS TILDES, y en los dos sentidos. La base guarda 7.304 ciudades sin
//      tilde (`Bogota`, `Medellin`, `Asuncion`) y 25 CON tilde (`Córdoba`,
//      `Tucumán`, `São Luís`). O sea que escribir bien falla para unas y
//      escribir sin tildes falla para otras, y no hay manera de que nadie
//      adivine cuál toca. Se comparan las dos sin tildes y se acabó.
//
//   2. LOS NOMBRES EN INGLÉS. La base es inglesa: `Mexico City`, `Havana`,
//      `Seville`, `Panama City`, `Guatemala`. Quien escribe «Ciudad de
//      México» o «La Habana» —es decir, cualquiera— no encontraba nada. De
//      ahí la tabla de equivalencias de abajo.
//
//   3. NO HABÍA COINCIDENCIA PARCIAL. «Buenos» no daba nada hasta teclear
//      «Buenos Aires» completo. Ahora se busca por principio y por dentro.
//
// ── LO QUE ESTA FUNCIÓN NO HACE ───────────────────────────────────────────
// No inventa ciudades. La base tiene 7.329 en todo el mundo, así que los
// pueblos pequeños NO están, y eso no se arregla con una búsqueda mejor. Para
// esos casos devuelve `vacio`, y la pantalla lo dice con palabras y propone
// usar la ciudad grande más cercana. Para el Ascendente, unos kilómetros de
// diferencia no cambian el resultado; el silencio sí lo cambiaba todo.
//
// Nada de esto sale del dispositivo: la base viaja dentro de la aplicación.

import cityTimezones from "city-timezones"

export type CiudadEncontrada = {
  /** Lo que se le enseña a la persona: «Bogota, Colombia». */
  nombre: string
  provincia: string
  lat: number
  lon: number
  zona: string
}

export type Resultado =
  | { estado: "corto" }
  | { estado: "vacio" }
  | { estado: "ok"; ciudades: CiudadEncontrada[] }

type Fila = {
  city: string
  city_ascii?: string
  country: string
  province?: string
  state_ansi?: string
  lat: number
  lng: number
  pop?: number
  timezone: string
}

/** Sin tildes, sin mayúsculas, sin puntuación y con los espacios juntos. */
export function normalizar(texto: string): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'´`’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// ── CIUDADES QUE LA BASE GUARDA CON OTRO NOMBRE ───────────────────────────
// Solo las que de verdad cambian de nombre. Las que únicamente pierden la
// tilde —`Panamá`, `Asunción`, `Bogotá`— ya las resuelve `normalizar()` y no
// hacen falta aquí.
//
// La clave va normalizada. El valor es el nombre tal como está en la base.
const OTRO_NOMBRE: Record<string, string> = {
  "ciudad de mexico": "Mexico City",
  "cdmx": "Mexico City",
  "mexico df": "Mexico City",
  "df": "Mexico City",
  "distrito federal": "Mexico City",
  "la habana": "Havana",
  "habana": "Havana",
  "sevilla": "Seville",
  "ciudad de guatemala": "Guatemala",
  "guatemala city": "Guatemala",
  "ciudad de panama": "Panama City",
  "santiago de chile": "Santiago",
  "cuzco": "Cusco",
  "la coruna": "A Coruna",
  "rio": "Rio de Janeiro",
}

// ── PAÍSES EN ESPAÑOL ─────────────────────────────────────────────────────
// Para que «Madrid, España» o «Bogotá, Colombia» funcionen. Igual que arriba:
// solo los que cambian de nombre, no los que solo pierden la tilde.
const PAIS_EN_ESPANOL: Record<string, string> = {
  "espana": "Spain",
  "brasil": "Brazil",
  "estados unidos": "United States of America",
  "eeuu": "United States of America",
  "eua": "United States of America",
  "usa": "United States of America",
  "republica dominicana": "Dominican Republic",
  "reino unido": "United Kingdom",
  "inglaterra": "United Kingdom",
  "alemania": "Germany",
  "francia": "France",
  "italia": "Italy",
  "suiza": "Switzerland",
  "holanda": "Netherlands",
  "paises bajos": "Netherlands",
  "belgica": "Belgium",
  "irlanda": "Ireland",
  "japon": "Japan",
  "corea del sur": "South Korea",
  "marruecos": "Morocco",
  "egipto": "Egypt",
  "grecia": "Greece",
  "turquia": "Turkey",
  "rusia": "Russia",
  "suecia": "Sweden",
  "noruega": "Norway",
  "dinamarca": "Denmark",
  "finlandia": "Finland",
  "polonia": "Poland",
}

/** La base, preparada una sola vez. */
let indice: Array<Fila & { nCity: string; nAscii: string; nProv: string; nPais: string }> | null = null

function construirIndice() {
  if (indice) return indice
  const filas = cityTimezones.cityMapping as unknown as Fila[]
  indice = filas
    .filter((c) => c.timezone && Number.isFinite(c.lat) && Number.isFinite(c.lng))
    .map((c) => ({
      ...c,
      nCity: normalizar(c.city),
      nAscii: normalizar(c.city_ascii ?? c.city),
      nProv: normalizar(c.province ?? ""),
      nPais: normalizar(c.country ?? ""),
    }))
  return indice
}

const CUANTAS = 8

export function buscarCiudades(texto: string): Resultado {
  const crudo = (texto ?? "").trim()
  // Dos letras, no tres: «Ica», «Loja» o «Ur» empiezan a dar pistas antes de
  // lo que se pensaba, y esperar a la tercera parecía que no respondía.
  if (normalizar(crudo).length < 2) return { estado: "corto" }

  // ── «CIUDAD, PAÍS» ──────────────────────────────────────────────────────
  // Es como lo escribe la mayoría. La coma separa; si no hay coma, todo es
  // nombre de ciudad.
  const partes = crudo.split(",")
  let consulta = normalizar(partes[0])
  const resto = normalizar(partes.slice(1).join(" "))
  const lugarPedido = PAIS_EN_ESPANOL[resto] ? normalizar(PAIS_EN_ESPANOL[resto]) : resto

  // Si escribió el nombre en español, se cambia por el que tiene la base.
  if (OTRO_NOMBRE[consulta]) consulta = normalizar(OTRO_NOMBRE[consulta])

  const filas = construirIndice()
  const puntuadas: Array<{ c: (typeof filas)[number]; punto: number }> = []

  for (const c of filas) {
    // Cuando se ha pedido país o provincia, lo que no cuadre se descarta.
    if (lugarPedido) {
      const cuadra =
        c.nPais.includes(lugarPedido) ||
        c.nProv.includes(lugarPedido) ||
        normalizar(c.state_ansi ?? "").includes(lugarPedido)
      if (!cuadra) continue
    }

    let punto = 0
    if (c.nCity === consulta || c.nAscii === consulta) punto = 100
    else if (c.nCity.startsWith(consulta) || c.nAscii.startsWith(consulta)) punto = 70
    else if (c.nCity.includes(consulta) || c.nAscii.includes(consulta)) punto = 40
    // Sin país pedido, se permite acertar por provincia: quien escribe
    // «Cundinamarca» o «Jalisco» está diciendo dónde nació.
    else if (!lugarPedido && consulta.length >= 4 && c.nProv.includes(consulta)) punto = 15

    if (punto > 0) puntuadas.push({ c, punto })
  }

  if (puntuadas.length === 0) return { estado: "vacio" }

  // Primero lo que encaja mejor; a igual encaje, la ciudad más poblada. Así
  // «Santiago» enseña el de Chile antes que el de Veraguas, que tiene 45.000
  // habitantes y casi nunca es el que se busca.
  puntuadas.sort((a, b) => b.punto - a.punto || (b.c.pop ?? 0) - (a.c.pop ?? 0))

  const vistas = new Set<string>()
  const ciudades: CiudadEncontrada[] = []

  for (const { c } of puntuadas) {
    const clave = `${c.nCity}|${c.nProv}|${c.nPais}`
    if (vistas.has(clave)) continue
    vistas.add(clave)
    ciudades.push({
      nombre: `${c.city}, ${c.country}`,
      // La provincia distingue los cuatro «Santiago» y los ocho «San Juan».
      // Se omite cuando repite el nombre de la ciudad, que no aclara nada.
      provincia: normalizar(c.province ?? "") === c.nCity ? "" : (c.province ?? ""),
      lat: c.lat,
      lon: c.lng,
      zona: c.timezone,
    })
    if (ciudades.length >= CUANTAS) break
  }

  return { estado: "ok", ciudades }
}
