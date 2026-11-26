// ═══════════════════════════════════════════════════════════════════════════
//  LOS FILTROS DE TEMPORADA · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:temporadas
//
// POR QUÉ ESTA PRUEBA EXISTE
//   De esta decisión sale a quién le llega un correo. Un error aquí no se
//   ve: sale un número perfectamente creíble y el correo va a quien no
//   debía, que es la clase de equivocación que no se deshace.
//
//   Lo que más cuidado pide son dos cosas. Una, que los borradores viejos
//   guardaron un NÚMERO donde ahora va una lista: si dejaran de leerse, un
//   borrador de hace una semana cambiaría de destinatarios al abrirlo. Y
//   dos, que varias temporadas marcadas se cumplen con CUALQUIERA —es una
//   unión, como los países—; si se exigieran todas, una audiencia de
//   doscientos se quedaría en tres.

import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const ruta = join(aqui, "..", "lib", "comunicaciones", "temporadas.ts")
const { temporadasDe, frasearTemporadas, terminoAlguna, estaAMedias } =
  await import(pathToFileURL(ruta).href)

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

const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

console.log("\n═══ 1 · UNA LISTA, QUE ES LO NUEVO ═══\n")
comprobar("dos temporadas se leen las dos", igual(temporadasDe([2, 3]), [2, 3]))
comprobar("y salen en orden", igual(temporadasDe([3, 1, 2]), [1, 2, 3]))
comprobar("sin repetidas", igual(temporadasDe([2, 2, 3]), [2, 3]))
comprobar("las cuatro", igual(temporadasDe([1, 2, 3, 4]), [1, 2, 3, 4]))

console.log("\n═══ 2 · UN NÚMERO SUELTO, QUE ES LO DE ANTES ═══\n")
// Los borradores guardados antes del 26-11-2026. Si esto dejara de
// funcionar, uno de hace una semana cambiaría de audiencia al abrirlo.
comprobar("un número suelto sigue valiendo", igual(temporadasDe(3), [3]))
comprobar("...y significa exactamente esa", igual(temporadasDe(1), [1]))
comprobar("un número en texto, como lo manda un formulario", igual(temporadasDe("2"), [2]))

console.log("\n═══ 3 · «DA IGUAL» NO ES «LA TEMPORADA 0» ═══\n")
// Lo que no es una temporada se descarta. Convertirlo en un cero dejaría
// una audiencia vacía sin que nadie entienda por qué.
comprobar("nulo es nada", igual(temporadasDe(null), []))
comprobar("ausente es nada", igual(temporadasDe(undefined), []))
comprobar("lista vacía es nada", igual(temporadasDe([]), []))
comprobar("el cero no es una temporada", igual(temporadasDe(0), []))
comprobar("un texto cualquiera tampoco", igual(temporadasDe("todas"), []))
comprobar("y lo malo de una lista se cae solo", igual(temporadasDe([2, null, "x", 0, 3]), [2, 3]))
comprobar("los negativos fuera", igual(temporadasDe([-1, 2]), [2]))
comprobar("los decimales fuera", igual(temporadasDe([1.5, 2]), [2]))

console.log("\n═══ 4 · TERMINÓ: BASTA UNA ═══\n")
// Marcar «terminó la 2» y «terminó la 3» pide la UNIÓN. Exigir las dos
// convertiría una audiencia de doscientos en una de tres.
comprobar("terminó la 2, se pedía la 2 o la 3", terminoAlguna([2, 3], new Set([2])) === true)
comprobar("terminó la 3, se pedía la 2 o la 3", terminoAlguna([2, 3], new Set([3])) === true)
comprobar("terminó las dos", terminoAlguna([2, 3], new Set([2, 3])) === true)
comprobar("no terminó ninguna de las pedidas", terminoAlguna([2, 3], new Set([1])) === false)
comprobar("no ha terminado nada", terminoAlguna([2, 3], new Set()) === false)
comprobar("sin fila de completadas, no entra", terminoAlguna([2], undefined) === false)
comprobar("una sola pedida, como siempre", terminoAlguna([3], new Set([3])) === true)

console.log("\n═══ 5 · A MEDIAS: LAS DOS CONDICIONES ═══\n")
// Llegó a esa temporada Y no la tiene completa. Las dos, o no es «a medias».
comprobar(
  "empezó la 2 y no la terminó",
  estaAMedias([2], 2, new Set([1])) === "entra",
)
comprobar(
  "va por la 3, así que la 2 la pasó... pero sin completarla",
  estaAMedias([2], 3, new Set([1])) === "entra",
)
comprobar(
  "ya terminó la 2: no está a medias",
  estaAMedias([2], 2, new Set([1, 2])) === "ya_la_termino",
)
comprobar(
  "todavía no ha llegado a la 2",
  estaAMedias([2], 1, new Set([1])) === "no_la_empezo",
)
comprobar(
  "sin ningún avance",
  estaAMedias([2], 0, undefined) === "no_la_empezo",
)

console.log("\n═══ 6 · A MEDIAS CON VARIAS: BASTA UNA COLGANDO ═══\n")
{
  // Dejó la 1 a medias y la 2 ni la ha visto. Se piden las dos: entra.
  comprobar("una de las dos colgando", estaAMedias([1, 2], 1, new Set()) === "entra")
  // Terminó la 1, va por la 2 y no la ha acabado: entra por la 2.
  comprobar("entra por la segunda", estaAMedias([1, 2], 2, new Set([1])) === "entra")
  // Terminó las dos: va por delante, no a medias.
  comprobar(
    "terminó las dos pedidas",
    estaAMedias([1, 2], 3, new Set([1, 2])) === "ya_la_termino",
  )
  // No ha llegado a ninguna de las dos.
  comprobar("no llegó a ninguna", estaAMedias([3, 4], 1, new Set([1])) === "no_la_empezo")
}

console.log("\n═══ 7 · LOS DOS MOTIVOS NO SE CONFUNDEN ═══\n")
// Son razones opuestas de quedarse fuera, y el ensayo las enseña separadas:
// a quien no ha llegado hay que animarle a empezar, y a quien ya acabó, a
// seguir. Darlas como un solo «no cumple» sería perder lo que explica la
// cifra.
comprobar(
  "ir por detrás no se cuenta como haber acabado",
  estaAMedias([3], 1, new Set()) !== "ya_la_termino",
)
comprobar(
  "haber acabado no se cuenta como ir por detrás",
  estaAMedias([3], 3, new Set([3])) !== "no_la_empezo",
)

console.log("\n═══ 8 · CÓMO SE LEE EN LA FRASE ═══\n")
comprobar("una sola", frasearTemporadas([2]) === "la Temporada 2")
comprobar("dos, con «o»", frasearTemporadas([2, 3]) === "la Temporada 2 o la Temporada 3")
comprobar(
  "tres, con comas y una «o» al final",
  frasearTemporadas([1, 2, 3]) === "la Temporada 1, la Temporada 2 o la Temporada 3",
)
comprobar("ninguna no dice nada", frasearTemporadas([]) === "")

console.log("\n═══ 9 · NADIE SE QUEDA FUERA SIN FILTRO ═══\n")
// La regla de toda la pantalla: sin filtro no se estrecha. Si «da igual»
// llegara al motor como una lista vacía que nadie comprueba, `some` daría
// false y la audiencia se quedaría en cero.
comprobar("sin pedir nada, terminoAlguna no excluye por su cuenta", terminoAlguna([], new Set([1])) === false)
comprobar("...por eso el motor pregunta antes si hay algo pedido", temporadasDe(null).length === 0)

console.log(`\n═══ ${pasadas} pasadas · ${fallos} fallos ═══\n`)
process.exit(fallos > 0 ? 1 : 0)
