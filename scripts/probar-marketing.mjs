// ═══════════════════════════════════════════════════════════════════════════
//  LAS REGLAS DEL CENTRO DE ORGANIZACIÓN · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:marketing
//
// ── POR QUÉ ESTO SE PRUEBA Y EL RESTO NO ───────────────────────────────────
// Todo lo demás del centro de organización es trabajo compartido: escribir,
// corregir, reprogramar, marcar. Si alguien hace de más, se deshace.
//
// Aprobar no. Aprobar es la frontera entre «Regi propone» y «el dueño
// decide», y es lo único que no debe poder saltarse nadie — tampoco con una
// petición hecha a mano, saltándose la pantalla.
//
// Por eso la regla vive en el servidor y por eso se comprueba aquí.

import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const {
  PLANTILLA_SEMANAL, CATEGORIAS, CATEGORIAS_DEL_CIELO, esTituloDePartida,
} = await import("file:///" + join(aqui, "..", "lib", "marketing", "reglas.ts").replace(/\\/g, "/"))

const { limpiarGuion, anadirComentario, limpiarMetricas, limpiarPlan } = await import(
  "file:///" + join(aqui, "..", "lib", "marketing", "reglas.ts").replace(/\\/g, "/")
)

let fallos = 0
const comprobar = (titulo, bien, detalle = "") => {
  if (!bien) fallos++
  console.log(`${bien ? "  ok" : "FALLA"}  ${titulo}${bien || !detalle ? "" : `  — ${detalle}`}`)
}

const deja = (r) => !("error" in r)
const rechaza = (r) => "error" in r

// ── LA FRONTERA ───────────────────────────────────────────────────────────

console.log("\n— Aprobar es del dueño —")

for (const estado of ["aprobado", "publicado"]) {
  comprobar(
    `Regi NO puede poner «${estado}»`,
    rechaza(limpiarGuion({ estado }, { parcial: true, esPropietario: false })),
  )
  comprobar(
    `el dueño sí puede poner «${estado}»`,
    deja(limpiarGuion({ estado }, { parcial: true, esPropietario: true })),
  )
}

console.log("\n— Todo lo demás lo pueden los dos —")

for (const estado of ["idea", "desarrollo", "revision"]) {
  comprobar(
    `Regi puede poner «${estado}»`,
    deja(limpiarGuion({ estado }, { parcial: true, esPropietario: false })),
  )
}
comprobar(
  "Regi puede escribir el guion",
  deja(limpiarGuion({ guion: "Texto…", gancho: "Los tres segundos" }, { parcial: true, esPropietario: false })),
)
comprobar(
  "Regi puede reprogramar la entrega",
  deja(limpiarGuion({ fecha_entrega: "2026-11-10" }, { parcial: true, esPropietario: false })),
)

// ── LO QUE NO SE ACEPTA DE NINGUNA MANERA ─────────────────────────────────

console.log("\n— Valores inventados —")

comprobar("un estado que no existe", rechaza(limpiarGuion({ estado: "genial" }, { parcial: true, esPropietario: true })))
comprobar("un formato que no existe", rechaza(limpiarGuion({ formato: "tiktok" }, { parcial: true, esPropietario: true })))
comprobar("un ámbito que no existe", rechaza(limpiarGuion({ ambito: "privado" }, { parcial: true, esPropietario: true })))
comprobar("una fecha que no es fecha", rechaza(limpiarGuion({ fecha_entrega: "mañana" }, { parcial: true, esPropietario: true })))
comprobar("un identificador inventado", rechaza(limpiarGuion({ responsable_id: "regi" }, { parcial: true, esPropietario: true })))
comprobar("un guion sin título", rechaza(limpiarGuion({ titulo: "   " }, { parcial: false, esPropietario: true })))
comprobar("una petición vacía", rechaza(limpiarGuion({}, { parcial: true, esPropietario: true })))

console.log("\n— Lo que NO se puede colar —")

const colado = limpiarGuion(
  { titulo: "Prueba", created_by: "otro", id: "otro", comentarios: [{ texto: "falso" }] },
  { parcial: false, esPropietario: true },
)
comprobar(
  "ni `id`, ni `created_by`, ni comentarios inventados",
  deja(colado)
    && !("id" in colado.campos)
    && !("created_by" in colado.campos)
    && !("comentarios" in colado.campos),
)

// ── LAS OBSERVACIONES ─────────────────────────────────────────────────────

console.log("\n— Las observaciones —")

const uno = anadirComentario([], { autorId: "a", autor: "José María", texto: "  Acorta el gancho  " })
comprobar("se guarda sin espacios de más", Array.isArray(uno) && uno[0].texto === "Acorta el gancho")
comprobar("y con quién la escribió", Array.isArray(uno) && uno[0].autor === "José María")
comprobar("una vacía se rechaza", "error" in anadirComentario([], { autorId: "a", autor: "x", texto: "   " }))

// Una conversación larguísima no debe crecer sin fin dentro de la fila.
let muchas = []
for (let i = 0; i < 80; i++) {
  muchas = anadirComentario(muchas, { autorId: "a", autor: "x", texto: `n${i}` })
}
comprobar("se conservan las últimas 60", muchas.length === 60, `salen ${muchas.length}`)
comprobar("y las últimas son las recientes", muchas[muchas.length - 1].texto === "n79")


// ── LOS NÚMEROS ───────────────────────────────────────────────────────────

console.log("\n— Vacío y cero no son lo mismo —")

const vacio = limpiarMetricas({ periodo: "2026-11-02", alcance: "", me_gusta: 0 })
comprobar(
  "un campo en blanco se guarda como NULO",
  deja(vacio) && vacio.campos.alcance === null,
  "un blanco guardado como 0 diría «lo miré y no pasó nada»",
)
comprobar("un cero escrito se guarda como 0", deja(vacio) && vacio.campos.me_gusta === 0)

console.log("\n— Números imposibles —")

comprobar("sin semana no se guarda", rechaza(limpiarMetricas({ alcance: 10 })))
comprobar("alcance negativo", rechaza(limpiarMetricas({ periodo: "2026-11-02", alcance: -5 })))
comprobar("alcance con decimales", rechaza(limpiarMetricas({ periodo: "2026-11-02", alcance: 3.5 })))
comprobar("un dedo de más al teclear", rechaza(limpiarMetricas({ periodo: "2026-11-02", alcance: 999999999999 })))
comprobar("apertura del 150 %", rechaza(limpiarMetricas({ periodo: "2026-11-02", tasa_apertura: 150 })))
comprobar(
  "apertura con decimales sí vale",
  deja(limpiarMetricas({ periodo: "2026-11-02", tasa_apertura: 42.37 })),
)

// ── EL PLAN ───────────────────────────────────────────────────────────────

console.log("\n— Las frecuencias son del dueño —")

const unaFrec = [{ categoria: "reel", cantidad: 3, cada: "semana" }]

comprobar(
  "Regi NO puede cambiar las frecuencias",
  rechaza(limpiarPlan({ mes: "2026-11-01", frecuencias: unaFrec }, { esPropietario: false })),
)
comprobar(
  "el dueño sí puede",
  deja(limpiarPlan({ mes: "2026-11-01", frecuencias: unaFrec }, { esPropietario: true })),
)
comprobar(
  "pero Regi sí escribe los acuerdos de la reunión",
  deja(limpiarPlan({ mes: "2026-11-01", acuerdos: "Subimos a 4 reels" }, { esPropietario: false })),
)

console.log("\n— Frecuencias que no tienen sentido —")

comprobar(
  "una categoría inventada",
  rechaza(limpiarPlan(
    { mes: "2026-11-01", frecuencias: [{ categoria: "tiktok", cantidad: 1, cada: "semana" }] },
    { esPropietario: true },
  )),
)
comprobar(
  "cantidad cero",
  rechaza(limpiarPlan(
    { mes: "2026-11-01", frecuencias: [{ categoria: "reel", cantidad: 0, cada: "semana" }] },
    { esPropietario: true },
  )),
)
comprobar(
  "la misma categoría dos veces",
  rechaza(limpiarPlan({
    mes: "2026-11-01",
    frecuencias: [
      { categoria: "reel", cantidad: 3, cada: "semana" },
      { categoria: "reel", cantidad: 5, cada: "semana" },
    ],
  }, { esPropietario: true })),
  "dos metas para lo mismo dejarían al generador sin saber a cuál hacer caso",
)
comprobar("un mes que no es día 1", rechaza(limpiarPlan({ mes: "2026-11-15" }, { esPropietario: true })))

// ── LO QUE CUENTA EL GENERADOR ────────────────────────────────────────────
//
// La cuenta misma, recreada: el generador vive en una ruta y no se puede
// importar sin Next, pero la aritmética sí se puede comprobar — y es donde
// está el riesgo de duplicar.

console.log("\n— El generador cuenta por semana, no por mes —")

const faltan = (meta, yaHay) => Math.max(0, meta - yaHay)

comprobar("semana vacía con meta 3 → crea 3", faltan(3, 0) === 3)
comprobar("semana con 2 de 3 → crea 1", faltan(3, 2) === 1)
comprobar("semana completa → no crea nada", faltan(3, 3) === 0)
comprobar("semana con 4 de 3 → tampoco quita", faltan(3, 4) === 0)

// Doce en la primera semana NO completan un mes de «3 por semana»: las otras
// tres semanas siguen vacías. Contar por mes habría dicho que todo está bien.
const semanas = [12, 0, 0, 0]
const porSemana = semanas.reduce((t, hay) => t + faltan(3, hay), 0)
comprobar(
  "doce el primer lunes no completan el mes",
  porSemana === 9,
  `faltarían ${porSemana} y contando por mes habría dicho 0`,
)

// ═══════════════════════════════════════════════════════════════════════════
//  LA SEMANA TIPO
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ SE PRUEBA ──────────────────────────────────────────────────────
// La plantilla es una lista escrita a mano, y lo que se escribe a mano se
// descuadra: un día 8, una categoría que ya no existe, un título repetido
// que luego hace creer que el generador duplicó algo. Nada de eso rompe la
// compilación ni se ve en la pantalla hasta que alguien genera un mes.

console.log("\n— La semana tipo —")

comprobar(
  "todas las ranuras caen de lunes a domingo",
  PLANTILLA_SEMANAL.every((r) => Number.isInteger(r.dia) && r.dia >= 1 && r.dia <= 7),
  "un día fuera de 1–7 crearía la actividad en la semana de al lado",
)

comprobar(
  "todas las categorías existen",
  PLANTILLA_SEMANAL.every((r) => CATEGORIAS.includes(r.categoria)),
  PLANTILLA_SEMANAL.filter((r) => !CATEGORIAS.includes(r.categoria))
    .map((r) => r.categoria).join(", "),
)

comprobar(
  "ninguna nace del cielo",
  PLANTILLA_SEMANAL.every((r) => !CATEGORIAS_DEL_CIELO.includes(r.categoria)),
  "una luna no es trabajo que nadie tenga que hacer",
)

// Dos actividades iguales el mismo día son indistinguibles en el calendario,
// y al regenerar no hay forma de saber si faltaba una o ya estaban las dos.
const porDia = new Map()
for (const r of PLANTILLA_SEMANAL) {
  const k = `${r.dia}|${r.titulo}`
  porDia.set(k, (porDia.get(k) || 0) + 1)
}
comprobar(
  "ningún título se repite el mismo día",
  [...porDia.values()].every((v) => v === 1),
  [...porDia.entries()].filter(([, v]) => v > 1).map(([k]) => k).join(", "),
)

// Lo acordado con José: 3 reels, 2 carruseles, 3 historias, 1 correo,
// 1 notificación y 1 revisión de resultados por semana. Si alguien toca la
// plantilla y descuadra esto, el acuerdo deja de cumplirse en silencio.
const cuenta = (cat) => PLANTILLA_SEMANAL.filter((r) => r.categoria === cat).length
for (const [cat, esperado] of [
  ["reel", 3], ["carrusel", 2], ["historias", 3],
  ["correo", 1], ["notificacion", 1], ["resultados", 1], ["reunion", 1],
]) {
  comprobar(
    `${esperado} de «${cat}» por semana`,
    cuenta(cat) === esperado,
    `hay ${cuenta(cat)}`,
  )
}

comprobar(
  "cada día tiene algo",
  [1, 2, 3, 4, 5, 6, 7].every((d) => PLANTILLA_SEMANAL.some((r) => r.dia === d)),
  "un día vacío en la plantilla es un día que el generador se salta",
)

console.log("\n— Los nombres de partida —")

comprobar(
  "los de la plantilla cuentan como sin definir",
  PLANTILLA_SEMANAL.every((r) => esTituloDePartida(r.titulo)),
  "si no, «borrar las sin definir» dejaría atrás lo que acaba de generarse",
)

comprobar(
  "«Por definir» sigue contando",
  esTituloDePartida("Por definir"),
  "hay actividades viejas en la base que se llaman así",
)

comprobar(
  "lo escrito por una persona NO cuenta",
  !esTituloDePartida("Reel sobre el eclipse de marzo"),
  "el atajo de borrado se lleva por delante trabajo de verdad",
)

comprobar(
  "y los espacios de más no engañan",
  esTituloDePartida("  Reel de atracción  "),
)

console.log(fallos === 0 ? "\nTODO BIEN\n" : `\n${fallos} FALLOS\n`)
process.exit(fallos === 0 ? 0 : 1)
