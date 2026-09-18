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
