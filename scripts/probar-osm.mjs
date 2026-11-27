// ═══════════════════════════════════════════════════════════════════════════
//  LAS CIUDADES QUE VIENEN DE FUERA · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:osm
//
// POR QUÉ ESTA PRUEBA EXISTE
//   `network_cities` es una tabla COMPARTIDA: la ciudad que crea una persona
//   la ve todo el mundo en su desplegable. Lo que se cuela aquí no se nota el
//   día que pasa —quien lo provocó ve su ciudad y sigue— sino meses después,
//   cuando hay dos filas del mismo pueblo repartiéndose a los miembros, o un
//   río en la lista de ciudades de un país.
//
//   Y es también la frontera de seguridad: el navegador solo manda un
//   identificador, y es el servidor quien pide la ficha y la lee. Estas
//   funciones son esa lectura. Si aceptaran de más, cualquiera con la consola
//   abierta podría escribir en el catálogo de todos.

import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const ruta = join(aqui, "..", "lib", "red", "osm.ts")
const {
  leerFicha, esUnSitioHabitado, regionDe, nombreDe, etiquetaDe,
  inicialDeTipo, esIdentificadorValido,
} = await import(pathToFileURL(ruta).href)

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

/** Una ficha de ciudad normal, de las que devuelve Nominatim. */
function ficha(extra = {}) {
  return {
    osm_type: "relation",
    osm_id: 1234,
    name: "Cuenca",
    lat: "-2.9001",
    lon: "-79.0059",
    class: "place",
    type: "city",
    address: { state: "Azuay", country_code: "ec" },
    ...extra,
  }
}

console.log("\n═══ 1 · UNA CIUDAD NORMAL ═══\n")
{
  const c = leerFicha(ficha(), "EC")
  comprobar("se lee", c !== null)
  comprobar("el nombre", c?.name === "Cuenca")
  comprobar("la región", c?.admin1 === "Azuay")
  comprobar("las coordenadas son números", c?.lat === -2.9001 && c?.lon === -79.0059)
  comprobar("el país en mayúsculas", c?.pais === "EC")
  comprobar("la etiqueta junta las dos", etiquetaDe("Cuenca", "Azuay") === "Cuenca · Azuay")
}

console.log("\n═══ 2 · EL PAÍS TIENE QUE COINCIDIR ═══\n")
// El caso que de verdad importa: hay una Cuenca en Ecuador y otra en España.
// Guardar la de Ecuador declarando España metería a esa persona en los
// recuentos del país equivocado, y en el mapa saldría a 9.000 km de su casa.
comprobar("Cuenca de Ecuador NO entra como española", leerFicha(ficha(), "ES") === null)
comprobar("y sí entra como ecuatoriana", leerFicha(ficha(), "EC") !== null)
comprobar("da igual cómo venga escrito el país pedido", leerFicha(ficha(), "ec") !== null)
comprobar(
  "sin país en la ficha, no entra",
  leerFicha(ficha({ address: { state: "Azuay" } }), "EC") === null,
)

console.log("\n═══ 3 · UN RÍO NO ES UNA CIUDAD ═══\n")
// Sin esto, buscar el nombre de un pueblo que coincide con el de un río
// metería el río en el desplegable de ciudades de ese país, para siempre.
comprobar(
  "un río no entra",
  leerFicha(ficha({ class: "waterway", type: "river" }), "EC") === null,
)
comprobar(
  "una calle no entra",
  leerFicha(ficha({ class: "highway", type: "residential" }), "EC") === null,
)
comprobar(
  "un comercio no entra",
  leerFicha(ficha({ class: "shop", type: "bakery" }), "EC") === null,
)
comprobar(
  "una montaña no entra",
  leerFicha(ficha({ class: "natural", type: "peak" }), "EC") === null,
)

console.log("\n═══ 4 · PERO UN PUEBLO PEQUEÑO SÍ ═══\n")
// Es el caso por el que todo esto existe. Muchos pueblos no figuran como
// `place` sino como frontera administrativa: si se exigiera `place`, la
// gente de los pueblos seguiría sin poder decir de dónde es.
comprobar(
  "un municipio administrativo entra",
  leerFicha(ficha({ class: "boundary", type: "administrative" }), "EC") !== null,
)
comprobar("una aldea entra", leerFicha(ficha({ class: "place", type: "hamlet" }), "EC") !== null)
comprobar("un pueblo entra", leerFicha(ficha({ class: "place", type: "town" }), "EC") !== null)
comprobar(
  "pero una frontera que no es administrativa, no",
  leerFicha(ficha({ class: "boundary", type: "protected_area" }), "EC") === null,
)

console.log("\n═══ 5 · SIN REGIÓN TAMBIÉN SE PUEDE VIVIR ═══\n")
// Hay países sin división intermedia. Lo que NO puede pasar es que la falta
// de región llegue como cadena vacía: en la base el nulo y el vacío no se
// comparan igual, y eso acabaría creando dos filas del mismo sitio.
{
  const c = leerFicha(ficha({ address: { country_code: "mc" } }), "MC")
  comprobar("entra sin región", c !== null)
  comprobar("y la región es null, no vacío", c?.admin1 === null)
}
comprobar(
  "una región en blanco también es null",
  leerFicha(ficha({ address: { state: "   ", country_code: "ec" } }), "EC")?.admin1 === null,
)
comprobar("la etiqueta sin región es solo el nombre", etiquetaDe("Mónaco", null) === "Mónaco")
comprobar(
  "y no se repite cuando ciudad y región se llaman igual",
  etiquetaDe("Guatemala", "Guatemala") === "Guatemala",
)

console.log("\n═══ 6 · DE DÓNDE SALE EL NOMBRE ═══\n")
comprobar("del nombre, si lo hay", nombreDe(ficha()) === "Cuenca")
comprobar(
  "o de la ciudad de la dirección",
  nombreDe({ address: { city: "Quito" } }) === "Quito",
)
comprobar(
  "o del pueblo",
  nombreDe({ address: { town: "Baños" } }) === "Baños",
)
comprobar("sin nada, cadena vacía", nombreDe({}) === "")
comprobar("y sin nombre no se guarda", leerFicha(ficha({ name: "", address: { country_code: "ec" } }), "EC") === null)

console.log("\n═══ 7 · LAS COORDENADAS ═══\n")
// Sin coordenadas buenas la ciudad no se puede pintar, y un cero-cero —lo
// que devuelve una ficha rota— pondría a esa persona en medio del Atlántico.
comprobar("un texto no es una coordenada", leerFicha(ficha({ lat: "arriba" }), "EC") === null)
comprobar("ni una ausencia", leerFicha(ficha({ lon: undefined }), "EC") === null)
comprobar("cero-cero no vale", leerFicha(ficha({ lat: "0", lon: "0" }), "EC") === null)
comprobar("una latitud imposible no vale", leerFicha(ficha({ lat: "120" }), "EC") === null)
comprobar("una longitud imposible no vale", leerFicha(ficha({ lon: "-400" }), "EC") === null)
comprobar("los límites sí valen", leerFicha(ficha({ lat: "90", lon: "180" }), "EC") !== null)

console.log("\n═══ 8 · NADA ES ALGO ═══\n")
comprobar("null no revienta", leerFicha(null, "EC") === null)
comprobar("undefined tampoco", leerFicha(undefined, "EC") === null)
comprobar("un objeto vacío tampoco", leerFicha({}, "EC") === null)
comprobar("y esUnSitioHabitado con nada es false", esUnSitioHabitado({}) === false)
comprobar("regionDe con nada es null", regionDe({}) === null)

console.log("\n═══ 9 · EL IDENTIFICADOR QUE MANDA EL NAVEGADOR ═══\n")
// Es lo ÚNICO que se acepta del navegador, así que es lo único que hay que
// desconfiar. Todo lo demás sale de la ficha que pide el servidor.
comprobar("una relación", esIdentificadorValido("R1234") === true)
comprobar("un nodo", esIdentificadorValido("N1") === true)
comprobar("un camino", esIdentificadorValido("W999999999") === true)
comprobar("una letra que no existe", esIdentificadorValido("X123") === false)
comprobar("sin número", esIdentificadorValido("R") === false)
comprobar("con texto detrás", esIdentificadorValido("R123; drop table") === false)
comprobar("vacío", esIdentificadorValido("") === false)
comprobar("demasiado largo", esIdentificadorValido("R1234567890123") === false)
comprobar("en minúsculas no, se normaliza antes", esIdentificadorValido("r123") === false)

comprobar("relation es R", inicialDeTipo("relation") === "R")
comprobar("node es N", inicialDeTipo("node") === "N")
comprobar("way es W", inicialDeTipo("way") === "W")
comprobar("cualquier otra cosa es null", inicialDeTipo("galaxia") === null)
comprobar("y nada es null", inicialDeTipo(undefined) === null)

console.log(`\n═══ ${pasadas} pasadas · ${fallos} fallos ═══\n`)
process.exit(fallos > 0 ? 1 : 0)
