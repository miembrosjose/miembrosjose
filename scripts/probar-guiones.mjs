// ═══════════════════════════════════════════════════════════════════════════
//  QUIÉN PUEDE APROBAR UN GUION · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:guiones
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
const { limpiarGuion, anadirComentario } = await import(
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

console.log(fallos === 0 ? "\nTODO BIEN\n" : `\n${fallos} FALLOS\n`)
process.exit(fallos === 0 ? 0 : 1)
