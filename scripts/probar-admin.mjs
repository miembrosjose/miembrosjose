// ═══════════════════════════════════════════════════════════════════════════
//  UN ADMINISTRADOR NO DESHACE EL TRABAJO DEL OTRO · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:admin
//
// ── POR QUÉ ESTO SE PRUEBA ─────────────────────────────────────────────────
// El panel tiene acciones que no se deshacen: borrar una cuenta, reiniciar un
// avance, quitar un producto. Estaban pensadas para usarse CON MIEMBROS, y
// mientras hubo un solo administrador daba igual que no comprobaran nada.
//
// Con dos ya no. Un correo mal escrito, o un identificador copiado de la fila
// de al lado, y el trabajo del otro desaparece.
//
// La regla cabe en cuatro líneas, y por eso mismo es fácil romperla sin
// darse cuenta — invirtiendo una comparación, o colando un `||` donde iba un
// `&&`. Esto lo caza.

import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const { esOtroAdmin, isAdmin, avisoDeOtroAdmin } = await import(
  "file:///" + join(aqui, "..", "lib", "admin.ts").replace(/\\/g, "/")
)

let fallos = 0
const comprobar = (titulo, bien, detalle = "") => {
  if (!bien) fallos++
  console.log(`${bien ? "  ok" : "FALLA"}  ${titulo}${bien || !detalle ? "" : `  — ${detalle}`}`)
}

const admin = (id) => ({ id, app_metadata: { is_admin: true } })
const miembro = (id) => ({ id, app_metadata: {} })

const JOSE = "jose-1"
const REGI = "regi-2"

console.log("\n— Quién es administrador —")
comprobar("con la marca en app_metadata, sí", isAdmin(admin(JOSE)) === true)
comprobar("sin ella, no", isAdmin(miembro("x")) === false)
comprobar("sin usuario, no", isAdmin(null) === false)
// La marca tiene que ser exactamente `true`. Un "true" de texto llegado de
// cualquier sitio no cuenta.
comprobar(
  "un «true» de texto no cuenta",
  isAdmin({ id: "x", app_metadata: { is_admin: "true" } }) === false,
)

console.log("\n— La regla —")

comprobar(
  "Regi NO puede actuar sobre José",
  esOtroAdmin(admin(JOSE), REGI) === true,
)
comprobar(
  "José NO puede actuar sobre Regi",
  esOtroAdmin(admin(REGI), JOSE) === true,
)

// Lo que sí se deja, y es tan importante como lo que se impide: una regla
// que además bloquea el uso legítimo se acaba quitando entera.
comprobar(
  "pero sobre SÍ MISMO sí puede",
  esOtroAdmin(admin(JOSE), JOSE) === false,
  "reiniciar el propio avance es justo lo que se hace para probar",
)
comprobar(
  "y sobre un miembro normal también",
  esOtroAdmin(miembro("alguien"), REGI) === false,
  "si bloqueara esto, el panel dejaría de servir para lo que existe",
)

console.log("\n— Casos raros —")
comprobar("objetivo inexistente no bloquea", esOtroAdmin(null, REGI) === false)
comprobar("objetivo indefinido tampoco", esOtroAdmin(undefined, REGI) === false)
comprobar(
  "un objetivo sin metadatos no es administrador",
  esOtroAdmin({ id: "x" }, REGI) === false,
)

console.log("\n— El aviso dice qué se intentaba —")
const aviso = avisoDeOtroAdmin("Reiniciar el avance")
comprobar("nombra la acción", aviso.includes("Reiniciar el avance"))
comprobar("y explica el motivo", aviso.toLowerCase().includes("administraci"))

console.log(fallos === 0 ? "\nTODO BIEN\n" : `\n${fallos} FALLOS\n`)
process.exit(fallos === 0 ? 0 : 1)
