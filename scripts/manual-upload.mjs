// ============================================================================
// manual:upload — compila, sube una versión nueva y la deja al 0% de tráfico.
// ============================================================================
// Herramienta TEMPORAL mientras GitHub Actions está bloqueado. No sustituye a
// .github/workflows/deploy.yml, que sigue siendo el camino normal.
//
// Qué hace, en orden:
//   1. Lee NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY de
//      wrangler.jsonc (valores PÚBLICOS, ya versionados en el repo).
//   2. Los pasa al build solo en memoria — no escribe ningún .env.
//   3. Ejecuta `opennextjs-cloudflare build`.
//   4. VERIFICA que quedaron incrustados en el bundle del navegador.
//      Si no, se detiene y NO sube nada.
//   5. Ejecuta `opennextjs-cloudflare upload`.
//   6. Detecta qué versión está hoy al 100% y crea un deployment con
//      esa misma versión al 100% y la NUEVA al 0%.
//   7. Imprime la cabecera exacta para ModHeader.
//
// Por qué el 0% en vez de la Preview URL de workers.dev: esa URL está en otro
// dominio, así que /miembros no funciona bien (sesión y cookies son de
// los144000.com). Registrando la versión al 0% se puede apuntar a ella con la
// cabecera Cloudflare-Workers-Version-Overrides desde el dominio real, con la
// sesión de verdad, sin que ningún usuario la vea.
//
// Uso (Windows PowerShell — usar npm.cmd, PowerShell bloquea npm.ps1):
//   npm.cmd run manual:upload
//   npm.cmd run manual:upload -- --clean     (borra .next y .open-next antes)
// ============================================================================

import { spawnSync } from "node:child_process"
import { readFileSync, readdirSync, rmSync, existsSync, statSync } from "node:fs"
import { join } from "node:path"

const CLEAN = process.argv.includes("--clean")
const ASSETS_DIR = ".open-next/assets"

function die(msg) {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

function step(n, msg) {
  console.log(`\n\x1b[36m[${n}/6]\x1b[0m ${msg}`)
}

function rule() {
  console.log("═".repeat(72))
}

// ── 1 · Leer las variables públicas de wrangler.jsonc ──────────────────────
// Extracción por regex: wrangler.jsonc lleva comentarios y no es JSON válido.
step(1, "Leyendo variables públicas de wrangler.jsonc")

let wrangler
try {
  wrangler = readFileSync("wrangler.jsonc", "utf8")
} catch {
  die("No encuentro wrangler.jsonc. ¿Estás en la carpeta del proyecto?")
}

function readVar(name) {
  const m = wrangler.match(new RegExp(`"${name}"\\s*:\\s*"([^"]+)"`))
  return m ? m[1] : null
}

const WORKER_NAME = wrangler.match(/"name"\s*:\s*"([^"]+)"/)?.[1] || "los144000"
const SUPABASE_URL = readVar("NEXT_PUBLIC_SUPABASE_URL")
const SUPABASE_ANON_KEY = readVar("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if (!SUPABASE_URL) die('No pude leer "NEXT_PUBLIC_SUPABASE_URL" de wrangler.jsonc')
if (!SUPABASE_ANON_KEY) die('No pude leer "NEXT_PUBLIC_SUPABASE_ANON_KEY" de wrangler.jsonc')

console.log(`    Worker                        = ${WORKER_NAME}`)
console.log(`    NEXT_PUBLIC_SUPABASE_URL      = ${SUPABASE_URL}`)
console.log(`    NEXT_PUBLIC_SUPABASE_ANON_KEY = ${SUPABASE_ANON_KEY.slice(0, 18)}… (${SUPABASE_ANON_KEY.length} car.)`)

// ── 2 · Limpiar ────────────────────────────────────────────────────────────
// ── POR QUÉ SE BORRA SIEMPRE .next/types ──────────────────────────────────
// El proyecto vive dentro de OneDrive, que sincroniza también lo que genera
// la compilación. Mientras sube esos archivos los tiene abiertos, y cuando
// Next intenta rehacerlos salta:
//
//   Error: EPERM: operation not permitted, unlink '.next	ypesapp'
//
// Parece un fallo del código y no lo es: es una carpeta bloqueada. `types` es
// la que se lleva casi todas, así que se borra de entrada. Cuesta segundos y
// evita el susto.
step(2, CLEAN ? "Limpiando .next y .open-next (--clean)" : "Limpiando .open-next y .next/types")
rmSync(".open-next", { recursive: true, force: true })
if (CLEAN) rmSync(".next", { recursive: true, force: true })
else rmSync(".next/types", { recursive: true, force: true })

// ── 3 · Build con las variables en memoria ─────────────────────────────────
step(3, "Compilando (opennextjs-cloudflare build)…")

function compilar() {
  return spawnSync("npx", ["opennextjs-cloudflare", "build"], {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
    },
  })
}

let build = compilar()

// Segundo intento con la carpeta entera en blanco. Si la primera falló por un
// archivo bloqueado —lo normal dentro de OneDrive—, esto lo resuelve solo en
// vez de dejar a quien despliega mirando un volcado de Node.
if (build.status !== 0) {
  console.log("\n" + "─".repeat(72))
  console.log("  La compilación falló. Suele ser un archivo que OneDrive tenía")
  console.log("  abierto mientras lo sincronizaba, no un problema del código.")
  console.log("  Se borra .next entero y se intenta UNA vez más…")
  console.log("─".repeat(72) + "\n")
  rmSync(".next", { recursive: true, force: true })
  rmSync(".open-next", { recursive: true, force: true })
  build = compilar()
}

if (build.status !== 0) {
  die(
    "La compilación falló dos veces. No se sube nada.\n" +
      "  Si el error menciona EPERM o un archivo en uso: pausa la sincronización\n" +
      "  de OneDrive un momento y vuelve a intentarlo.",
  )
}

// ── 4 · Verificar que las variables entraron en el bundle ──────────────────
step(4, "Verificando que las variables quedaron incrustadas en los assets")

if (!existsSync(ASSETS_DIR)) die(`No existe ${ASSETS_DIR}. La compilación no generó assets.`)

function* walkJs(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walkJs(full)
    else if (entry.endsWith(".js")) yield full
  }
}

const host = SUPABASE_URL.replace(/^https?:\/\//, "")
const keyFragment = SUPABASE_ANON_KEY.slice(0, 32)

let urlHits = 0
let keyHits = 0
let scanned = 0

for (const file of walkJs(ASSETS_DIR)) {
  scanned++
  const content = readFileSync(file, "utf8")
  if (content.includes(host)) urlHits++
  if (content.includes(keyFragment)) keyHits++
}

console.log(`    Archivos .js revisados: ${scanned}`)
console.log(`    Coincidencias de la URL de Supabase: ${urlHits}`)
console.log(`    Coincidencias de la clave anon:      ${keyHits}`)

if (urlHits === 0 || keyHits === 0) {
  die(
    "Las variables NO quedaron incrustadas en el bundle del navegador.\n" +
      "  Subir esto publicaría el sitio roto (el error de 'NEXT_PUBLIC_SUPABASE_URL\n" +
      "  não configurada' que ya viste). NO se ha subido nada.",
  )
}

console.log("    \x1b[32m✔ Verificación superada.\x1b[0m")

// ── 5 · Subir la versión ───────────────────────────────────────────────────
step(5, "Subiendo versión (opennextjs-cloudflare upload)…")

const upload = spawnSync("npx", ["opennextjs-cloudflare", "upload"], {
  encoding: "utf8",
  shell: true,
  env: process.env,
})

const uploadOut = `${upload.stdout || ""}${upload.stderr || ""}`
process.stdout.write(uploadOut)

if (upload.status !== 0) die("La subida falló. No hay versión nueva.")

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

const newVersionId =
  uploadOut.match(new RegExp(`Worker Version ID:\\s*(${UUID})`, "i"))?.[1] ||
  uploadOut.match(new RegExp(`Version ID:\\s*(${UUID})`, "i"))?.[1] ||
  null

if (!newVersionId) {
  console.log("\n" + "─".repeat(72))
  console.log("  La versión se subió, pero no pude leer su Version ID de la salida.")
  console.log("  Búscalo arriba (o en Cloudflare → Workers → " + WORKER_NAME + " → Versions)")
  console.log("  y regístralo al 0% a mano:")
  console.log(`\n    npx wrangler versions deploy <ACTUAL>@100% <NUEVA>@0%\n`)
  process.exit(0)
}

// ── 6 · Registrar la nueva al 0%, manteniendo la actual al 100% ────────────
step(6, "Detectando la versión que está hoy al 100% en producción")

const status = spawnSync("npx", ["wrangler", "deployments", "status"], {
  encoding: "utf8",
  shell: true,
  env: process.env,
})

const statusOut = `${status.stdout || ""}${status.stderr || ""}`
const currentVersionId = statusOut.match(new RegExp(`\\(100%\\)\\s*(${UUID})`, "i"))?.[1] || null

if (!currentVersionId) {
  console.log("\n" + "─".repeat(72))
  console.log("  No pude detectar la versión actual al 100%. Salida de wrangler:")
  console.log("─".repeat(72))
  process.stdout.write(statusOut)
  console.log("─".repeat(72))
  console.log("\n  La versión NUEVA está subida pero NO registrada en el deployment,")
  console.log("  así que la cabecera de ModHeader todavía no la encontrará.")
  console.log("  Regístrala a mano con el id de la actual:")
  console.log(`\n    npx wrangler versions deploy <ACTUAL>@100% ${newVersionId}@0%\n`)
  process.exit(1)
}

if (currentVersionId === newVersionId) {
  console.log(`    La versión nueva ya es la que está al 100%. Nada que registrar.`)
  process.exit(0)
}

console.log(`    Versión en producción: ${currentVersionId}`)
console.log(`\n    Creando deployment: actual al 100%, nueva al 0%…`)
console.log(`    (el tráfico real NO se mueve; wrangler puede pedirte confirmación)\n`)

const split = spawnSync(
  "npx",
  ["wrangler", "versions", "deploy", `${currentVersionId}@100%`, `${newVersionId}@0%`],
  { stdio: "inherit", shell: true, env: process.env },
)

if (split.status !== 0) {
  console.error("\n✖ No se pudo registrar la versión nueva al 0%.")
  console.error("  La versión está subida; puedes registrarla a mano con:")
  console.error(`\n    npx wrangler versions deploy ${currentVersionId}@100% ${newVersionId}@0%\n`)
  process.exit(1)
}

// ── Resumen ───────────────────────────────────────────────────────────────
console.log("\n")
rule()
console.log("  VERSIÓN SUBIDA Y REGISTRADA AL 0% — ningún usuario la ve")
rule()
console.log(`  Producción (100%) : ${currentVersionId}`)
console.log(`  Nueva      (  0%) : ${newVersionId}`)
console.log(`  Worker Version ID : ${newVersionId}`)
rule()
console.log("\n  PARA PROBARLA en https://los144000.com con tu sesión real,")
console.log("  añade esta cabecera en ModHeader:\n")
console.log("    Nombre : Cloudflare-Workers-Version-Overrides")
console.log(`    Valor  : ${WORKER_NAME}="${newVersionId}"\n`)
console.log("  Con la cabecera activa ves la versión nueva; sin ella, la de")
console.log("  siempre. El resto de usuarios sigue en la actual al 100%.\n")
console.log("  Cuando te convenza, promuévela a producción con:\n")
console.log(`    npm.cmd run manual:deploy -- ${newVersionId}\n`)
