// ═══════════════════════════════════════════════════════════════════════════
//  UN COMUNICADO INTERNO SOLO LLEGA A QUIEN VA · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:audiencia
//
// ── POR QUÉ EXISTE ESTO ────────────────────────────────────────────────────
// El 29 de octubre de 2026, José publicó un comunicado dentro de la
// plataforma dirigido a UNA persona, y le llegó también a él.
//
// La consulta que enseña los comunicados al miembro comprobaba tres cosas:
// que fuera interno, que estuviera publicado, y el corte por fecha de alta.
// La audiencia, no. Ninguna.
//
// ── POR QUÉ NO LO VIO NADA ─────────────────────────────────────────────────
// Porque no es un error: es una condición que falta. El código compila, la
// consulta funciona, devuelve filas, y la pantalla las pinta. Todo correcto
// salvo QUIÉN las recibe, que es justamente lo que no se puede ver mirando
// la pantalla propia: hay que entrar con otra cuenta.
//
// Es la clase de fallo que solo aparece cuando ya se ha filtrado algo a quien
// no debía verlo. Por eso se vigila leyendo el código y no probándolo a mano.

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

// ── LA CONSULTA QUE VE EL MIEMBRO ──────────────────────────────────────────

console.log("\n— Lo que el miembro llega a ver —\n")

const internas = leer("lib", "comunicaciones", "internas.ts")

comprobar(
  "la consulta filtra por destinatarios",
  /interno_destinatarios\.is\.null,interno_destinatarios\.cs/.test(internas),
  "sin esto, un comunicado dirigido a una persona lo ve la plataforma entera",
)

comprobar(
  "y sigue filtrando por el corte de fecha",
  /audiencia_hasta\.is\.null,audiencia_hasta\.gte/.test(internas),
  "sin esto, quien se registre mañana ve los anuncios de hoy",
)

comprobar(
  "y solo trae lo publicado",
  /not\("published_at", "is", null\)/.test(internas),
  "sin esto, los borradores se verían",
)

comprobar(
  "y solo lo que va por dentro",
  /contains\("canales", \["interno"\]\)/.test(internas),
  "sin esto, los correos aparecerían en el centro de avisos",
)

// ── LO QUE SE GUARDA AL PUBLICAR ───────────────────────────────────────────

console.log("\n— Lo que se decide al publicar —\n")

const publicar = leer("app", "api", "admin", "comunicaciones", "[id]", "publicar", "route.ts")

comprobar(
  "se resuelve la audiencia",
  /resolverAudiencia\(/.test(publicar),
  "si no se resuelve, no hay a quién limitar",
)

comprobar(
  "y se guarda en la comunicación",
  /interno_destinatarios:\s*destinatarios/.test(publicar),
  "resolverla y no guardarla es trabajo tirado",
)

comprobar(
  "sin filtros se guarda null, no la lista entera",
  /sinFiltros/.test(publicar) && /destinatarios: string\[\] \| null = null/.test(publicar),
  "guardar los setenta congelaría una audiencia que debe crecer con quien llegue",
)

// ── LO QUE NO PUEDE PASAR ──────────────────────────────────────────────────
//
// Dos resultados peores que no publicar: la lista vacía lo esconde de todos,
// y `null` por error se lo enseña a todos. Las dos tienen que estar cortadas.

comprobar(
  "si no se puede calcular, NO se publica",
  /No se pudo calcular a quién llega, así que no se publica/.test(publicar),
  "ante la duda, publicar con null se lo enseña a todo el mundo",
)

comprobar(
  "una audiencia vacía se rechaza",
  /destinatarios\.length === 0/.test(publicar),
  "publicar algo que no llega a nadie es un borrador con otro nombre",
)

// ── LAS PREFERENCIAS DE CORREO NO GOBIERNAN LO DE DENTRO ───────────────────

console.log("\n— Las preferencias de correo, donde corresponde —\n")

const audiencia = leer("lib", "comunicaciones", "audiencia.ts")

comprobar(
  "ni el mensaje directo ni el comunicado interno las miran",
  /sinPreferencias = canal === "dm" \|\| canal === "interno"/.test(audiencia),
  "darse de baja de las novedades no es decir «no me escribáis» ni «escóndeme la plataforma»",
)

comprobar(
  "pero el correo SÍ las mira",
  /email_preferences/.test(audiencia) && /unsubscribed_all/.test(audiencia),
  "escribirle a quien pidió no recibir nada no se deshace",
)

console.log(fallos === 0 ? "\nTODO BIEN\n" : `\n${fallos} ${fallos === 1 ? "FALLO" : "FALLOS"}\n`)
process.exit(fallos === 0 ? 0 : 1)
