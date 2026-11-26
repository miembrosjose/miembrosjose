// ═══════════════════════════════════════════════════════════════════════════
//  LOS ERRORES DE ENTRADA · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:errores
//
// POR QUÉ ESTA PRUEBA EXISTE
//   El 24-11-2026 alguien se quedó a mitad de crear su cuenta. Escribió la
//   contraseña dos veces y la plataforma le contestó «Algo salió mal.
//   Intenta nuevamente en unos segundos». Lo intentó otra vez y pasó lo
//   mismo, porque ese mensaje era mentira: lo que fallaba no se arreglaba
//   esperando.
//
//   El comodín se estaba tragando los errores más frecuentes de esa
//   pantalla. Aquí están escritos los mensajes TAL COMO los devuelve
//   Supabase, para que si alguno deja de reconocerse se sepa aquí y no en
//   el móvil de alguien que quería entrar.
//
// LAS DOS COSAS QUE SE COMPRUEBAN
//   1. Que cada error diga qué pasó, y no el comodín.
//   2. Que cuando reintentar NO sirve de nada, la pantalla lo sepa
//      (`sesionMuerta`) y mande a pedir un enlace nuevo.

import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const ruta = join(aqui, "..", "lib", "auth-error-messages.ts")
const { clasificarAuthError, translateAuthError } = await import(pathToFileURL(ruta).href)

let pasadas = 0
let fallos = 0

function comprobar(titulo, condicion, detalle = "") {
  if (condicion) {
    pasadas++
    console.log(`  ok    ${titulo}`)
  } else {
    fallos++
    console.log(`  FALLA ${titulo}${detalle ? "  → " + detalle : ""}`)
  }
}

const COMODIN = "Algo salió mal. Intenta nuevamente en unos segundos."

/** ¿Este error se reconoce, o cae en el comodín? */
function reconocido(mensaje) {
  return clasificarAuthError(new Error(mensaje)).mensaje !== COMODIN
}

console.log("\n═══ 1 · EL ENLACE MUERTO: REINTENTAR NO SIRVE ═══\n")
// Todos estos acaban igual: el enlace ya no vale y hay que pedir otro.
// Si alguno dejara de marcarse como muerto, la pantalla volvería a invitar
// a reintentar y la persona se quedaría dando vueltas.
const MUERTOS = [
  "Auth session missing!",
  "Invalid Refresh Token: Refresh Token Not Found",
  "JWT expired",
  "User from sub claim in JWT does not exist",
  "Email link is invalid or has expired",
  "Session not found",
]
for (const m of MUERTOS) {
  const f = clasificarAuthError(new Error(m))
  comprobar(`«${m.slice(0, 42)}» → enlace muerto`, f.sesionMuerta === true, f.mensaje)
  comprobar("   ...y no sale el comodín", f.mensaje !== COMODIN)
}

console.log("\n═══ 2 · LA CONTRASEÑA QUE NO CUMPLE ═══\n")
// El mensaje de Supabase trae el alfabeto entero dentro. Ni se enseña ni se
// traduce palabra por palabra: se dice qué tiene que hacer la persona.
{
  const real =
    "Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, 0123456789."
  const f = clasificarAuthError(new Error(real))
  comprobar("se reconoce el mensaje de requisitos", f.mensaje !== COMODIN)
  comprobar("...y no se le enseña el alfabeto a nadie", !f.mensaje.includes("abcdefghij"))
  comprobar("...y dice qué hacer", f.mensaje.includes("números"))
  comprobar("...y no manda a pedir enlace nuevo", f.sesionMuerta === false)
}
comprobar(
  "contraseña filtrada en brechas",
  reconocido("This password has been found in a data breach and cannot be used."),
)
comprobar(
  "contraseña débil",
  reconocido("Password is known to be weak and easy to guess, please choose a different one."),
)
comprobar("demasiado corta", reconocido("Password should be at least 6 characters"))

console.log("\n═══ 3 · LOS DEMÁS QUE ANTES CAÍAN EN EL COMODÍN ═══\n")
comprobar("fallo de la base de datos", reconocido("Database error updating user"))
comprobar("espera obligatoria de Supabase", reconocido("For security purposes, you can only request this after 48 seconds."))
comprobar("límite de intentos", reconocido("Email rate limit exceeded"))
comprobar("sin conexión", reconocido("Failed to fetch"))
comprobar("sin conexión (Safari lo dice distinto)", reconocido("Load failed"))

console.log("\n═══ 4 · LOS DE SIEMPRE SIGUEN BIEN ═══\n")
comprobar("credenciales incorrectas", reconocido("Invalid login credentials"))
comprobar("ya existe la cuenta", reconocido("User already registered"))
comprobar("misma contraseña", reconocido("New password should be different from the old password"))
comprobar(
  "ninguno de ellos manda a pedir enlace nuevo",
  ["Invalid login credentials", "User already registered"].every(
    (m) => clasificarAuthError(new Error(m)).sesionMuerta === false,
  ),
)

console.log("\n═══ 5 · NUNCA SE ENSEÑA INGLÉS TÉCNICO ═══\n")
// La regla de siempre: si no se reconoce, comodín. Lo que no puede pasar
// nunca es que el texto crudo de Supabase llegue a la pantalla.
const CRUDOS = [
  "Something completely unexpected happened in the auth layer",
  "ERR_UNKNOWN_THING",
  "",
]
for (const m of CRUDOS) {
  const f = clasificarAuthError(new Error(m))
  comprobar(`«${m.slice(0, 30) || "(vacío)"}» no se filtra tal cual`, f.mensaje !== m)
  comprobar("   ...sale el comodín", f.mensaje === COMODIN)
}

console.log("\n═══ 6 · EL CÓDIGO DEL PANTALLAZO ═══\n")
// Cuando no se reconoce el error, se enseña un código corto. Es lo que
// faltó aquel día: un pantallazo que dijera algo.
{
  const e = new Error("Something totally new")
  e.code = "unexpected_failure_xyz"
  const f = clasificarAuthError(e)
  comprobar("el comodín viene con código", typeof f.codigo === "string" && f.codigo.length > 0)
  comprobar("...sacado del error", f.codigo === "unexpected_failure_xyz")
}
{
  const e = new Error("Something totally new")
  e.status = 500
  comprobar("sin código, vale el estado HTTP", clasificarAuthError(e).codigo === "http_500")
}
{
  const f = clasificarAuthError(new Error("Auth session missing!"))
  comprobar("un error reconocido NO enseña código", f.codigo === null)
}
{
  // El código es para enseñarlo en pantalla: nada de espacios, acentos ni
  // nada que pueda arrastrar datos de la persona.
  const e = new Error("Fallo raro con el correo alguien@correo.com dentro")
  const f = clasificarAuthError(e)
  comprobar("el código no arrastra arrobas", !String(f.codigo).includes("@"))
  comprobar("ni puntos", !String(f.codigo).includes("."))
  comprobar("y es corto", String(f.codigo).length <= 40)
}

console.log("\n═══ 7 · LA PUERTA DE SIEMPRE SIGUE ABIERTA ═══\n")
// `translateAuthError` lo usan el login y el alta. Sigue existiendo y
// devolviendo exactamente lo mismo que antes.
comprobar("translateAuthError sigue traduciendo", translateAuthError("Invalid login credentials") !== COMODIN)
comprobar("translateAuthError sin nada → comodín", translateAuthError(undefined) === COMODIN)
comprobar("translateAuthError con null → comodín", translateAuthError(null) === COMODIN)

console.log(`\n═══ ${pasadas} pasadas · ${fallos} fallos ═══\n`)
process.exit(fallos > 0 ? 1 : 0)
