// ═══════════════════════════════════════════════════════════════════════════
//  EL CORREO SALE A QUIEN DICE LA PANTALLA · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:envio
//
// ── POR QUÉ EXISTE ESTO ────────────────────────────────────────────────────
// El 12 de noviembre de 2026, un correo dirigido a dos personas llegó a toda
// la plataforma.
//
// No fue un descuido de quien lo mandó. El código calculaba bien los
// destinatarios, los enseñaba en pantalla —«2 personas», y era verdad— y
// después mandaba un Broadcast del proveedor sobre la audiencia principal,
// que es la lista de todo el mundo. La lista filtrada servía para contar y
// para refrescar contactos; el envío iba por su cuenta.
//
// Había DOS listas. Una se enseñaba y otra se usaba. Nadie las había mirado
// juntas, y por separado las dos parecían correctas.
//
// ── QUÉ VIGILA ─────────────────────────────────────────────────────────────
// Que el envío de correo siga mandando a la MISMA variable que devuelve el
// cálculo de audiencia. Es la única invariante que importa aquí, y es la que
// se rompió.
//
// No comprueba que el cálculo esté bien —eso es otra cosa, y tiene su propia
// prueba— sino que nadie vuelva a meter una segunda lista por el medio.

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

const ruta = leer("app", "api", "admin", "comunicaciones", "[id]", "enviar", "route.ts")

/**
 * El archivo sin sus comentarios.
 *
 * Hace falta porque los comentarios de este repositorio EXPLICAN el fallo, y
 * nombran lo que ya no se usa: «antes esto creaba un Broadcast sobre
 * audienciaPrincipal()». Buscando a secas, la prueba acusaba a la
 * explicación de ser el problema.
 *
 * Se quitan las líneas que son comentario entero, no los `//` que aparecen
 * dentro de una cadena —`https://`— que son código y tienen que seguir ahí.
 */
// Un salto de línea sin escaparlo: este repositorio ha perdido ya varias
// barras invertidas al pasar por el intérprete, y \n dentro de una cadena
// se ha convertido más de una vez en un salto de verdad que rompe el archivo.
const SALTO = String.fromCharCode(10)

const codigo = ruta
  .split(SALTO)
  .filter((l) => {
    const t = l.trim()
    return !(t.startsWith("//") || t.startsWith("*") || t.startsWith("/*"))
  })
  .join(SALTO)

console.log("\n— El envío de correo —\n")

// ── 1 · DE DÓNDE SALE LA LISTA ─────────────────────────────────────────────
const calculo = ruta.match(/const\s*\{\s*destinatarios[^}]*\}\s*=\s*await\s+resolverAudiencia\(/)
comprobar(
  "los destinatarios salen de resolverAudiencia()",
  !!calculo,
  "no encuentro el cálculo de audiencia",
)

// ── 2 · Y A DÓNDE VA ───────────────────────────────────────────────────────
//
// Se busca la llamada al envío y se mira qué lista recibe. Tiene que ser
// `destinatarios` a secas: cualquier otra cosa —una audiencia, una lista
// traída de otro sitio, una variable distinta— es exactamente el fallo.
const envio = ruta.match(/enviarUnoAUno\(\{([\s\S]{0,400}?)\}\)/)
comprobar("el correo se manda con enviarUnoAUno()", !!envio)

if (envio) {
  const argumentos = envio[1]
  const lista = argumentos.match(/destinatarios\s*(?::\s*([A-Za-z0-9_.]+))?/)
  const recibe = lista ? (lista[1] ?? "destinatarios") : null

  comprobar(
    "le pasa la lista que se acaba de calcular",
    recibe === "destinatarios",
    recibe ? `le pasa \`${recibe}\`` : "no le pasa ninguna lista",
  )
}

// ── 3 · Y NO POR EL CAMINO QUE CAUSÓ EL FALLO ──────────────────────────────
//
// Un Broadcast se manda a una AUDIENCIA del proveedor, no a una lista de
// direcciones. Mientras la plataforma tenga una sola audiencia —la de todo el
// mundo— cualquier Broadcast le llega a todo el mundo, filtre quien filtre.
for (const prohibido of ["crearBroadcast", "enviarBroadcast", "audienciaPrincipal"]) {
  comprobar(
    `no usa ${prohibido}()`,
    !new RegExp(`\\b${prohibido}\\s*\\(`).test(codigo),
    "manda a la audiencia entera, no a la lista",
  )
}

// ── 4 · LO QUE SE GUARDA EN EL HISTORIAL ES LO QUE SALIÓ ───────────────────
//
// `recipients_estimated` decía cuántos se habían CALCULADO. Si vuelven a ser
// dos números distintos, el historial deja de servir para detectar que algo
// se desvió — que es justo lo que habría hecho falta aquí.
comprobar(
  "el historial guarda los correos que salieron, no los calculados",
  /recipients_estimated:\s*envio\.enviados/.test(ruta),
  "vuelve a guardar el número del cálculo",
)

// ── 5 · UN ENVÍO QUE NO SALIÓ NO SE MARCA COMO ENVIADO ─────────────────────
comprobar(
  "si no sale ni un correo, se marca como fallo",
  /envio\.enviados\s*===\s*0/.test(ruta),
)

console.log(fallos === 0 ? "\nTODO BIEN\n" : `\n${fallos} ${fallos === 1 ? "FALLO" : "FALLOS"}\n`)
process.exit(fallos === 0 ? 0 : 1)
