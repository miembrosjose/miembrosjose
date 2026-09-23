// El enganche en sí. Corre en su propio hilo, aislado del código de pruebas.

import { existsSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"

/**
 * Rutas relativas que no resuelven tal cual → prueba .ts, /index.ts y .tsx
 *
 * No basta con mirar si el especificador "tiene extensión": un módulo como
 * "./puntos.content" parece tenerla (.content) y en realidad es un nombre de
 * archivo sin extensión. Tampoco basta con que la ruta exista: "./portales"
 * existe como DIRECTORIO, y lo que hace falta es su index.ts. Por eso la
 * comprobación es que exista y además sea un archivo.
 */
export async function resolve(especificador, contexto, siguiente) {
  const esRelativo = especificador.startsWith("./") || especificador.startsWith("../")

  if (esRelativo && contexto.parentURL) {
    if (!esArchivo(new URL(especificador, contexto.parentURL))) {
      for (const sufijo of [".ts", "/index.ts", ".tsx"]) {
        const candidato = new URL(especificador + sufijo, contexto.parentURL)
        if (esArchivo(candidato)) {
          return siguiente(especificador + sufijo, contexto)
        }
      }
    }
  }
  return siguiente(especificador, contexto)
}

function esArchivo(url) {
  const ruta = fileURLToPath(url)
  return existsSync(ruta) && statSync(ruta).isFile()
}
