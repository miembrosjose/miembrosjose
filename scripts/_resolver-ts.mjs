// ═══════════════════════════════════════════════════════════════════════════
//  IMPORTAR .ts SIN ESCRIBIR LA EXTENSIÓN
// ═══════════════════════════════════════════════════════════════════════════
//
//   import "./_resolver-ts.mjs"   ← antes de cualquier import dinámico
//
// POR QUÉ HACE FALTA
//   En el proyecto, `import { x } from "./cosa"` funciona porque el
//   empaquetador de Next prueba las extensiones por su cuenta. Node, cuando
//   ejecuta un .mjs a pelo, NO lo hace: exige la ruta exacta y falla con
//   ERR_MODULE_NOT_FOUND.
//
//   Las pruebas corren con Node a pelo, así que cualquier módulo del proyecto
//   que importe a un hermano se caía al probarlo. La alternativa era escribir
//   `from "./cosa.ts"` en el código de la aplicación —que TypeScript solo
//   acepta con una opción especial— o duplicar código para que no hubiera
//   imports. Las dos peores que esto.
//
//   Con esto, las pruebas ven los módulos igual que los ve Next, y el código
//   de la aplicación no se retuerce para poder probarse.

import { registerHooks } from "node:module"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

const EXTENSIONES = [".ts", ".tsx", ".mts", "/index.ts", "/index.tsx"]

registerHooks({
  resolve(especificador, contexto, siguiente) {
    // Solo las rutas relativas y solo si no traen ya extensión. Los paquetes
    // de node_modules se dejan en paz: los resuelve Node como siempre.
    const esRelativa = especificador.startsWith("./") || especificador.startsWith("../")
    const traeExtension = /\.[cm]?[jt]sx?$/i.test(especificador)

    if (esRelativa && !traeExtension && contexto.parentURL) {
      for (const ext of EXTENSIONES) {
        const candidata = new URL(especificador + ext, contexto.parentURL)
        if (existsSync(fileURLToPath(candidata))) {
          return { url: candidata.href, format: "module-typescript", shortCircuit: true }
        }
      }
    }

    return siguiente(especificador, contexto)
  },
})
