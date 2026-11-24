// ═══════════════════════════════════════════════════════════════════════════
//  BUSCAR LA CIUDAD DE NACIMIENTO · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:ciudades
//
// POR QUÉ ESTA PRUEBA EXISTE
//   La Cartografía Estelar no se puede trazar sin el lugar de nacimiento, y
//   el lugar hay que ELEGIRLO de una lista. Si la búsqueda no devuelve nada,
//   no sale ningún error: sale una lista vacía, el botón se queda apagado y
//   el formulario repite que falta el lugar. La gente escribe su ciudad diez
//   veces y se va pensando que la plataforma está rota. Pasó.
//
//   Comprobarlo a mano son veinte ciudades a dedo en el navegador. Aquí son
//   unos milisegundos, y cada caso que falló alguna vez se queda escrito.
//
// LO QUE ESTO NO PRUEBA
//   Que una ciudad exista en la base. Son 7.329 en todo el mundo: los pueblos
//   pequeños NO están y ninguna búsqueda los va a encontrar. Para esos el
//   resultado correcto es `vacio`, y lo que importa es que la pantalla lo
//   diga con palabras. Aquí se comprueba que devuelve `vacio` y no un
//   silencio.

import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const { buscarCiudades, normalizar } = await import(
  "file:///" +
    join(aqui, "..", "app", "miembros", "_lib", "cartografia-estelar", "geo", "ciudades.ts")
      .replace(/\\/g, "/")
)

let pasadas = 0
let fallos = 0

function comprobar(titulo, condicion, detalle = "") {
  if (condicion) {
    pasadas++
    console.log(`  ok    ${titulo}`)
  } else {
    fallos++
    console.log(`  FALLA ${titulo}${detalle ? "  → " + detalle : ""}`)
  }
}

/** Busca y devuelve la primera ciudad, o null. */
function primera(texto) {
  const r = buscarCiudades(texto)
  return r.estado === "ok" ? r.ciudades[0] : null
}

/** ¿Sale esta ciudad entre las propuestas? */
function contiene(texto, parte) {
  const r = buscarCiudades(texto)
  if (r.estado !== "ok") return false
  return r.ciudades.some((c) => normalizar(c.nombre).includes(normalizar(parte)))
}

console.log("\n═══ 1 · LAS TILDES, EN LOS DOS SENTIDOS ═══\n")
// La base guarda «Bogota» sin tilde. Quien escribe bien fallaba.
comprobar("«Bogotá» (bien escrito) encuentra Bogota", contiene("Bogotá", "Bogota"))
comprobar("«Bogota» (sin tilde) también", contiene("Bogota", "Bogota"))
comprobar("«Medellín» encuentra Medellin", contiene("Medellín", "Medellin"))
comprobar("«Asunción» encuentra Asuncion", contiene("Asunción", "Asuncion"))
// Y al revés: estas 25 SÍ están con tilde en la base.
comprobar("«Tucuman» (sin tilde) encuentra Tucumán", contiene("Tucuman", "Tucumán"))
comprobar("«Córdoba» encuentra Córdoba", contiene("Córdoba", "Córdoba"))
comprobar("«Cordoba» (sin tilde) también", contiene("Cordoba", "Córdoba"))
comprobar("«Vina del Mar» encuentra Vina del Mar", contiene("Vina del Mar", "Vina del Mar"))

console.log("\n═══ 2 · LOS NOMBRES QUE LA BASE TIENE EN INGLÉS ═══\n")
comprobar("«Ciudad de México» → Mexico City", contiene("Ciudad de México", "Mexico City"))
comprobar("«CDMX» → Mexico City", contiene("CDMX", "Mexico City"))
comprobar("«México DF» → Mexico City", contiene("México DF", "Mexico City"))
comprobar("«La Habana» → Havana", contiene("La Habana", "Havana"))
comprobar("«Sevilla» → Seville", contiene("Sevilla", "Seville"))
comprobar("«Ciudad de Guatemala» → Guatemala", contiene("Ciudad de Guatemala", "Guatemala"))
comprobar("«Santiago de Chile» → Santiago", contiene("Santiago de Chile", "Santiago"))
comprobar("«Cuzco» → Cusco", contiene("Cuzco", "Cusco"))

console.log("\n═══ 3 · COINCIDENCIA PARCIAL ═══\n")
comprobar("«Buenos» ya propone Buenos Aires", contiene("Buenos", "Buenos Aires"))
comprobar("«Guadala» ya propone Guadalajara", contiene("Guadala", "Guadalajara"))
comprobar("«Barran» ya propone Barranquilla", contiene("Barran", "Barranquilla"))
comprobar("dos letras bastan para empezar", buscarCiudades("Li").estado === "ok")
comprobar("una sola letra es demasiado corto", buscarCiudades("L").estado === "corto")
comprobar("vacío es demasiado corto", buscarCiudades("").estado === "corto")

console.log("\n═══ 4 · «CIUDAD, PAÍS», QUE ES COMO LO ESCRIBE LA GENTE ═══\n")
comprobar("«Lima, Perú»", contiene("Lima, Perú", "Lima"))
comprobar("«Madrid, España» (España→Spain)", contiene("Madrid, España", "Madrid"))
comprobar("«Bogotá, Colombia»", contiene("Bogotá, Colombia", "Bogota"))
comprobar("«Santiago, Chile» trae el de Chile primero", primera("Santiago, Chile")?.nombre === "Santiago, Chile")
comprobar("«São Paulo, Brasil» (Brasil→Brazil)", contiene("Sao Paulo, Brasil", "Sao Paulo"))
comprobar(
  "«Santiago, República Dominicana» trae el dominicano",
  primera("Santiago, República Dominicana")?.nombre === "Santiago, Dominican Republic",
)

console.log("\n═══ 5 · EL ORDEN: LA MÁS POBLADA PRIMERO ═══\n")
// Hay cuatro Santiago. El de Veraguas tiene 45.000 habitantes y casi nunca
// es el que alguien busca.
comprobar("«Santiago» a secas trae el de Chile primero", primera("Santiago")?.nombre === "Santiago, Chile")
comprobar("«Lima» a secas trae el de Perú primero", primera("Lima")?.nombre === "Lima, Peru")
// Dos Valencia, y la grande NO es la española: en esta base la venezolana
// tiene 1.569.526 habitantes y la de España 806.652. Que salga primero la
// venezolana es lo correcto por población, y además es la que más se busca
// desde este lado del Atlántico. Las dos tienen que estar en la lista.
comprobar("«Valencia» trae la de Venezuela primero (es la más poblada)",
  primera("Valencia")?.nombre === "Valencia, Venezuela")
comprobar("«Valencia» también ofrece la de España", contiene("Valencia", "Valencia, Spain"))
comprobar("«Valencia, España» trae la española", primera("Valencia, España")?.nombre === "Valencia, Spain")

console.log("\n═══ 6 · DESEMPATE: LA PROVINCIA SE VE ═══\n")
{
  const r = buscarCiudades("Santiago")
  const conProvincia = r.estado === "ok" && r.ciudades.filter((c) => c.provincia).length >= 2
  comprobar("varios Santiago llevan provincia para distinguirlos", conProvincia)
  const r2 = buscarCiudades("Montevideo")
  const sinRepetir = r2.estado === "ok" && r2.ciudades[0].provincia === ""
  comprobar("no se repite la provincia cuando es igual al nombre", sinRepetir,
    r2.estado === "ok" ? `provincia = «${r2.ciudades[0].provincia}»` : "")
}

console.log("\n═══ 7 · LO QUE NO EXISTE DEBE DECIRLO, NO CALLARSE ═══\n")
comprobar("un pueblo inventado devuelve «vacio»", buscarCiudades("Villaquetalvez del Monte").estado === "vacio")
comprobar("letras sueltas sin sentido devuelven «vacio»", buscarCiudades("zzzqwx").estado === "vacio")

console.log("\n═══ 8 · LOS DATOS QUE SALEN SIRVEN PARA CALCULAR ═══\n")
{
  const c = primera("Bogotá")
  comprobar("trae latitud", Number.isFinite(c?.lat))
  comprobar("trae longitud", Number.isFinite(c?.lon))
  comprobar("trae zona horaria IANA", typeof c?.zona === "string" && c.zona.includes("/"), c?.zona)
  // Sin esto el Ascendente sale en otro sitio.
  comprobar("la latitud de Bogotá es la de Bogotá (±1°)", Math.abs((c?.lat ?? 0) - 4.6) < 1, String(c?.lat))
  const m = primera("Ciudad de México")
  comprobar("la zona de Ciudad de México es America/Mexico_City", m?.zona === "America/Mexico_City", m?.zona)
}

console.log("\n═══ 9 · NO SE DEVUELVE UNA LISTA INTERMINABLE ═══\n")
{
  const r = buscarCiudades("San")
  comprobar("como mucho 8 propuestas", r.estado === "ok" && r.ciudades.length <= 8,
    r.estado === "ok" ? String(r.ciudades.length) : r.estado)
}

console.log(`\n${"─".repeat(60)}`)
console.log(`  ${pasadas} bien · ${fallos} mal`)
console.log(`${"─".repeat(60)}\n`)

process.exit(fallos > 0 ? 1 : 0)
