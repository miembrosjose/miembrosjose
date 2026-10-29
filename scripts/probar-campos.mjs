// ═══════════════════════════════════════════════════════════════════════════
//  TODO LO QUE EL EDITOR ESCRIBE, EL SERVIDOR LO GUARDA · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:campos
//
// ── POR QUÉ EXISTE ESTO ────────────────────────────────────────────────────
// El 29 de octubre de 2026, el texto de los mensajes directos no se guardaba.
// El panel decía «guardado» —porque la petición respondía 200— y al mandarlo
// contestaba «no hay texto que mandar».
//
// La causa: `dm_texto` no estaba en `CAMPOS_EDITABLES`. Y `soloEditable`
// descarta lo que no está en esa lista EN SILENCIO, que es lo que hace el
// fallo tan difícil de ver: no hay error, no hay aviso, y el campo
// simplemente no llega nunca a la base.
//
// ── POR QUÉ NO BASTA CON ACORDARSE ─────────────────────────────────────────
// Porque la lista está en un archivo y los `editar("campo", …)` están
// repartidos por tres mil líneas de pantalla. Añadir una columna son cuatro
// sitios —la migración, el tipo, la lista, el formulario— y olvidar uno no se
// nota hasta que alguien intenta usarlo.
//
// Esto compara los dos extremos: lo que el editor dice que escribe contra lo
// que el servidor acepta.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const leer = (...p) => fs.readFileSync(path.join(raiz, ...p), "utf8")

let fallos = 0
const comprobar = (titulo, bien, detalle = "") => {
  if (!bien) fallos++
  console.log(`${bien ? "  ok" : "FALLA"}  ${titulo}${bien || !detalle ? "" : `  — ${detalle}`}`)
}

// ── LO QUE EL SERVIDOR ACEPTA ──────────────────────────────────────────────
const servidor = leer("lib", "comunicaciones", "servidor.ts")
const bloque = servidor.match(/CAMPOS_EDITABLES\s*=\s*\[([\s\S]*?)\]\s*as const/)
if (!bloque) {
  console.log("FALLA  no encuentro CAMPOS_EDITABLES en lib/comunicaciones/servidor.ts\n")
  process.exit(1)
}
const aceptados = new Set(
  [...bloque[1].matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]),
)

// ── LO QUE EL EDITOR ESCRIBE ───────────────────────────────────────────────
//
// Se buscan las llamadas a `editar("campo", …)`, que es como la pantalla
// guarda cualquier cosa. Las que usan una variable en vez de un literal no se
// pueden comprobar así, y se listan aparte para que nadie crea que están
// cubiertas.
const pantalla = leer("app", "miembros", "admin", "_tabs", "Comunicaciones.tsx")

const escritos = new Set(
  [...pantalla.matchAll(/\beditar\(\s*"([a-z0-9_]+)"/g)].map((m) => m[1]),
)

// `campo("x")` es el ayudante que ata un input a una columna. También escribe.
for (const m of pantalla.matchAll(/\bcampo\(\s*"([a-z0-9_]+)"\s*\)/g)) {
  escritos.add(m[1])
}

console.log(`\n— El editor escribe ${escritos.size} campos —\n`)

const huerfanos = [...escritos].filter((c) => !aceptados.has(c)).sort()

comprobar(
  "todos están en CAMPOS_EDITABLES",
  huerfanos.length === 0,
  huerfanos.length === 0 ? "" : huerfanos.join(", "),
)

if (huerfanos.length > 0) {
  console.log("")
  for (const c of huerfanos) {
    console.log(`       \`${c}\` se escribe desde la pantalla y el servidor lo DESCARTA.`)
    console.log(`       El panel dirá «guardado» y el valor no llegará nunca a la base.`)
    console.log(`       Añádelo a CAMPOS_EDITABLES en lib/comunicaciones/servidor.ts.\n`)
  }
}

// ── Y AL REVÉS: LO QUE SE ACEPTA Y NADIE ESCRIBE ───────────────────────────
//
// No es un fallo —hay campos que escribe otra pantalla, o que se dejaron
// preparados— pero conviene verlo: un campo editable que nadie usa es una
// puerta abierta que nadie vigila.
const sinUsar = [...aceptados].filter((c) => !escritos.has(c)).sort()
if (sinUsar.length > 0) {
  console.log(`\n— Aceptados y no escritos desde esta pantalla (${sinUsar.length}) —`)
  console.log(`  ${sinUsar.join(", ")}`)
  console.log("  No es un fallo: puede escribirlos otra pantalla. Pero un campo")
  console.log("  editable que nadie usa es una puerta abierta que nadie vigila.")
}

// ── LAS COLUMNAS DE LA MIGRACIÓN ───────────────────────────────────────────
//
// Que una columna exista en el SQL y no sea editable puede estar bien —las
// que escribe el servidor no deben serlo— pero las de contenido sí.
console.log("\n— Las columnas de contenido de las migraciones —\n")

const migraciones = ["comunicaciones_03_internas.sql", "comunicaciones_04_mensaje_directo.sql"]
const columnas = new Set()
for (const m of migraciones) {
  const sql = leer("docs", "sql", m)

  // ── SOLO LAS DE `communications` ──────────────────────────────────────
  // Estas migraciones tocan varias tablas: la de respuestas del foro añade
  // `parent_reply_id`, que no se edita desde esta pantalla y no tiene por
  // qué ser editable aquí.
  //
  // Se recorre por bloques de `alter table`, quedándose con el nombre de la
  // tabla, en vez de buscar `add column` a secas. Sin eso, la prueba acusa a
  // columnas de otras tablas — y una prueba que acusa a lo correcto se
  // desactiva a la semana.
  for (const bloque of sql.split(/\balter\s+table\s+/i).slice(1)) {
    const tabla = bloque.match(/^(?:public\.)?([a-z0-9_]+)/i)?.[1]
    if (tabla !== "communications") continue
    for (const x of bloque.matchAll(/add column if not exists\s+([a-z0-9_]+)/gi)) {
      columnas.add(x[1])
    }
  }
}

// Las que escribe el servidor, no la persona. No tienen que ser editables.
const DEL_SERVIDOR = new Set(["published_at", "dm_enviado_at", "dm_enviados"])

const deContenido = [...columnas].filter((c) => !DEL_SERVIDOR.has(c)).sort()
const olvidadas = deContenido.filter((c) => !aceptados.has(c))

comprobar(
  `las ${deContenido.length} columnas de contenido son editables`,
  olvidadas.length === 0,
  olvidadas.length === 0 ? "" : "faltan: " + olvidadas.join(", "),
)

console.log(fallos === 0 ? "\nTODO BIEN\n" : `\n${fallos} ${fallos === 1 ? "FALLO" : "FALLOS"}\n`)
process.exit(fallos === 0 ? 0 : 1)
