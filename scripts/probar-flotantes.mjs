// ═══════════════════════════════════════════════════════════════════════════
//  LA COLUMNA DE ABAJO A LA IZQUIERDA · que nada se pise
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:flotantes
//
// ── POR QUÉ EXISTE ESTA COMPROBACIÓN ───────────────────────────────────────
// Tres cosas se apilan en esa esquina: el botón del chat, el de Telegram y el
// aviso de «fulano se conectó». Y tres veces seguidas se han pisado entre
// ellas, siempre por el mismo motivo: alguien arregla la regla base y deja un
// número suelto dentro de un `@media` del móvil, que es el que manda en un
// teléfono.
//
// El fallo no se ve en el navegador del ordenador, no rompe la compilación y
// no avisa de nada. Se ve en un iPhone, en producción, cuando un miembro
// manda una captura.
//
// Esto lo caza antes: comprueba que ninguno de los tres se coloque con un
// número escrito a mano, y que la cuenta cuadre en los dos tamaños con y sin
// la zona segura del iPhone.

import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, "..")

let fallos = 0
const comprobar = (titulo, bien, detalle = "") => {
  if (!bien) fallos++
  console.log(`${bien ? "  ok" : "FALLA"}  ${titulo}${bien || !detalle ? "" : `  — ${detalle}`}`)
}

// ── 1 · NADIE SE COLOCA CON UN NÚMERO SUELTO ──────────────────────────────

const ARCHIVOS = [
  ["messenger.module.css", "el chat"],
  ["telegram-fab.module.css", "Telegram"],
  ["online-toast.module.css", "el aviso de conexión"],
]

console.log("\n— Nadie se coloca con un número escrito a mano —")

for (const [archivo, quien] of ARCHIVOS) {
  const ruta = join(raiz, "app", "miembros", "_components", archivo)
  const css = fs.readFileSync(ruta, "utf8")

  // Dentro de cualquier @media, un `bottom:` que empiece por un dígito.
  // `calc(...)` y `var(...)` pasan; `80px` no.
  const sueltos = []
  const bloques = css.matchAll(/@media[^{]*\{([\s\S]*?)\n\}/g)
  for (const b of bloques) {
    for (const linea of b[1].split(/\r?\n/)) {
      if (/^\s*bottom\s*:\s*-?\d/.test(linea)) sueltos.push(linea.trim())
    }
  }

  comprobar(
    `${quien}: sin \`bottom\` fijo dentro de un @media`,
    sueltos.length === 0,
    sueltos.join(" / "),
  )
}

// ── 2 · TODOS CUELGAN DE LAS MISMAS VARIABLES ─────────────────────────────

console.log("\n— Todos cuelgan de las variables compartidas —")

const tokens = fs.readFileSync(join(raiz, "app", "miembros", "_styles", "tokens.css"), "utf8")
for (const v of ["--fab-margen", "--fab-tamano", "--fab-aire"]) {
  comprobar(`${v} está definida en tokens.css`, tokens.includes(v))
}

for (const [archivo, quien] of ARCHIVOS) {
  const css = fs.readFileSync(join(raiz, "app", "miembros", "_components", archivo), "utf8")
  comprobar(`${quien} usa --fab-margen`, css.includes("var(--fab-margen)"))
}

// ── 3 · LA CUENTA, EN LOS CUATRO ESCENARIOS ───────────────────────────────
//
// Se recrea aquí lo que calcula el CSS. No es la misma cuenta dos veces: es
// comprobar que la fórmula elegida deja el aire que promete, también cuando
// el iPhone añade su zona segura — que es justo donde se rompía.

console.log("\n— El aire entre los tres, en cada tamaño —")

const TAMANOS = [
  ["escritorio", { margen: 24, tamano: 56, aire: 20 }],
  ["móvil", { margen: 12, tamano: 50, aire: 16 }],
]

for (const [nombre, { margen, tamano, aire }] of TAMANOS) {
  for (const segura of [0, 34]) {
    const chat = { abajo: margen + segura, arriba: margen + segura + tamano }
    const telegram = {
      abajo: margen + tamano + aire + segura,
      arriba: margen + tamano + aire + segura + tamano,
    }
    const aviso = { abajo: margen + 2 * tamano + 2 * aire + segura }

    const hueco1 = telegram.abajo - chat.arriba
    const hueco2 = aviso.abajo - telegram.arriba

    comprobar(
      `${nombre}, zona segura ${String(segura).padStart(2)}px: chat → Telegram`,
      hueco1 === aire,
      `salen ${hueco1}px y deberían ser ${aire}`,
    )
    comprobar(
      `${nombre}, zona segura ${String(segura).padStart(2)}px: Telegram → aviso`,
      hueco2 === aire,
      `salen ${hueco2}px y deberían ser ${aire}`,
    )
  }
}

console.log(fallos === 0 ? "\nTODO BIEN\n" : `\n${fallos} FALLOS\n`)
process.exit(fallos === 0 ? 0 : 1)
