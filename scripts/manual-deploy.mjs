// ============================================================================
// manual:deploy — promueve a producción una versión YA SUBIDA y probada.
// ============================================================================
// Herramienta TEMPORAL mientras GitHub Actions está bloqueado.
//
// NO compila. NO sube. NO usa `wrangler deploy`.
// Usa `wrangler versions deploy`, que es el comando de PROMOCIÓN: coge una
// versión que ya existe en Cloudflare y la pone a servir el 100% del tráfico.
//
// La diferencia importa: `wrangler deploy` subiría lo que haya ahora mismo en
// .open-next saltándose la verificación de manual:upload. Este script solo
// mueve el puntero de producción a una versión que ya comprobaste.
//
// Uso:
//   npm.cmd run manual:deploy -- <version-id>   promueve esa versión
//   npm.cmd run manual:deploy                  wrangler te deja elegirla
//
// Si algo sale mal, se vuelve atrás promoviendo la versión anterior — el
// historial está en el panel de Cloudflare, en Workers → los144000 → Versions.
// ============================================================================

import { spawnSync } from "node:child_process"

const args = process.argv.slice(2)
const versionId = args.find((a) => !a.startsWith("-")) || null

console.log("\n" + "═".repeat(70))
console.log("  PROMOVER UNA VERSIÓN A PRODUCCIÓN")
console.log("═".repeat(70))
console.log("  Este comando NO compila y NO sube nada: solo pone a servir una")
console.log("  versión que YA estaba subida.")
console.log("  Si cambiaste código después de la última subida, primero:")
console.log("      npm.cmd run manual:upload")
console.log("  Ese sí compila, y al terminar te da el id que va aquí.")
console.log("═".repeat(70))

if (versionId) {
  console.log(`  Versión a promover : ${versionId}`)
  console.log("  Tráfico            : 100%")
} else {
  console.log("  No indicaste una versión: wrangler te mostrará la lista")
  console.log("  para que elijas cuál promover.")
  console.log("\n  (Si prefieres pasarla directamente:")
  console.log("     npm.cmd run manual:deploy -- <version-id>  )")
}

console.log("═".repeat(70))
console.log("\n  Esto cambia lo que ven los usuarios en los144000.com.")
console.log("  Asegúrate de haberla probado antes con la cabecera de ModHeader")
console.log("  (Cloudflare-Workers-Version-Overrides) sobre el dominio real.\n")

// ── ¿Es la última que se subió? ───────────────────────────────────────────
// El fallo fácil de cometer: volver a promover el id que quedó en el historial
// del terminal y creer que se ha publicado lo de hoy. Producción no cambia y
// no hay ningún error que lo delate.
//
// Esto es solo un aviso. Si no se puede comprobar, se sigue adelante; y nunca
// impide promover una versión antigua a propósito, que es justo lo que hay que
// hacer para volver atrás.
if (versionId) {
  const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
  const lista = spawnSync("npx", ["wrangler", "versions", "list"], {
    encoding: "utf8", shell: true, env: process.env,
  })
  const salida = `${lista.stdout || ""}${lista.stderr || ""}`
  // wrangler lista de más reciente a más antigua: la primera es la última.
  const ultima = salida.match(new RegExp(UUID, "i"))?.[0] || null

  if (ultima && ultima.toLowerCase() !== versionId.toLowerCase()) {
    console.log("\n" + "!".repeat(70))
    console.log("  AVISO: esa NO es la última versión subida.")
    console.log(`    La que vas a promover : ${versionId}`)
    console.log(`    La última subida      : ${ultima}`)
    console.log("")
    console.log("  Si querías publicar los cambios de ahora, esto NO los publica:")
    console.log("  corre antes  npm.cmd run manual:upload  y usa el id que te dé.")
    console.log("  Si vas hacia atrás a propósito, ignora este aviso.")
    console.log("!".repeat(70) + "\n")
  }
}

// Sin version-id, `wrangler versions deploy` entra en modo interactivo y
// pregunta cuál. Con id, se le pasa al 100% y wrangler pide confirmación.
const cmdArgs = versionId
  ? ["wrangler", "versions", "deploy", `${versionId}@100%`]
  : ["wrangler", "versions", "deploy"]

const res = spawnSync("npx", cmdArgs, { stdio: "inherit", shell: true, env: process.env })

if (res.status !== 0) {
  console.error("\n✖ La promoción no se completó. Producción sigue como estaba.\n")
  process.exit(1)
}

console.log("\n✔ Versión promovida. Comprueba https://los144000.com con Ctrl+Shift+R.\n")
