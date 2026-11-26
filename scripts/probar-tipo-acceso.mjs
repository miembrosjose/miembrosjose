// ═══════════════════════════════════════════════════════════════════════════
//  LAS TRES PUERTAS · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:acceso
//
// POR QUÉ ESTA PRUEBA EXISTE
//   Hay tres formas de estar dentro: pagando, con el primer mes de regalo
//   de los encuentros (LLAMADO144) y con los tres días de prueba de los
//   invitados (INVITACION). Las tres dan el mismo acceso y dos de ellas
//   todavía no son dinero.
//
//   De esta clasificación salen el MRR y las tarjetas del panel. Si un
//   invitado en prueba contara como «paga», el MRR diría que hay ingresos
//   que no existen — y lo diría con un número perfectamente creíble.
//
//   El caso que más cuidado pide es la conversión: cuando el invitado paga
//   al cuarto día, el código promocional SE QUEDA en su fila. Si se mirara
//   el código antes que el tipo, esa persona seguiría contando como «en
//   prueba» para siempre y nunca entraría en el MRR.

import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const ruta = join(aqui, "..", "lib", "admin", "tipo-acceso.ts")
const { tipoDeAcceso, estaEnPrueba, CODIGO_INVITACION } = await import(pathToFileURL(ruta).href)

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

console.log("\n═══ 1 · LAS TRES PUERTAS ═══\n")
comprobar(
  "quien paga, paga",
  tipoDeAcceso({ tipo_acceso: "pago", codigo_promocional: null }) === "pago",
)
comprobar(
  "LLAMADO144 es regalo",
  tipoDeAcceso({ tipo_acceso: "regalo", codigo_promocional: "LLAMADO144" }) === "regalo",
)
comprobar(
  "INVITACION es prueba",
  tipoDeAcceso({ tipo_acceso: "regalo", codigo_promocional: "INVITACION" }) === "prueba",
)
comprobar("el código del embudo es el que esperamos", CODIGO_INVITACION === "INVITACION")

console.log("\n═══ 2 · LA CONVERSIÓN, QUE ES LO DELICADO ═══\n")
// Al cuarto día Stripe cobra los $14.99. El embudo manda acceso_regalo =
// false, así que `tipo_acceso` pasa a 'pago' — pero el código se queda,
// porque es el histórico de cómo llegó esa persona.
{
  const yaPago = { tipo_acceso: "pago", codigo_promocional: "INVITACION", pago_real_at: "2026-11-28T10:00:00Z" }
  comprobar("un invitado que ya pagó cuenta como pago", tipoDeAcceso(yaPago) === "pago")
  comprobar("...y NO sigue contando como prueba", tipoDeAcceso(yaPago) !== "prueba")
}
{
  const regaloQuePago = { tipo_acceso: "pago", codigo_promocional: "LLAMADO144" }
  comprobar("lo mismo con el regalo de los encuentros", tipoDeAcceso(regaloQuePago) === "pago")
}

console.log("\n═══ 3 · LAS DOS CAMPAÑAS NO SE MEZCLAN ═══\n")
// La tarjeta «Primer mes de regalo» dejó de contar a los invitados. Si
// volvieran a mezclarse, las dos campañas serían imposibles de medir.
{
  const filas = [
    { tipo_acceso: "regalo", codigo_promocional: "LLAMADO144" },
    { tipo_acceso: "regalo", codigo_promocional: "LLAMADO144" },
    { tipo_acceso: "regalo", codigo_promocional: "INVITACION" },
    { tipo_acceso: "pago", codigo_promocional: null },
  ]
  const cuenta = (t) => filas.filter((f) => tipoDeAcceso(f) === t).length
  comprobar("dos de regalo", cuenta("regalo") === 2)
  comprobar("uno en prueba", cuenta("prueba") === 1)
  comprobar("uno de pago", cuenta("pago") === 1)
  comprobar("y nadie se queda sin clasificar", cuenta("regalo") + cuenta("prueba") + cuenta("pago") === filas.length)
}

console.log("\n═══ 4 · EL CÓDIGO, VENGA COMO VENGA ═══\n")
comprobar(
  "en minúsculas",
  tipoDeAcceso({ tipo_acceso: "regalo", codigo_promocional: "invitacion" }) === "prueba",
)
comprobar(
  "con espacios alrededor",
  tipoDeAcceso({ tipo_acceso: "regalo", codigo_promocional: "  INVITACION  " }) === "prueba",
)
comprobar(
  "mezclado",
  tipoDeAcceso({ tipo_acceso: "regalo", codigo_promocional: "Invitacion" }) === "prueba",
)
comprobar(
  "un código parecido NO es una invitación",
  tipoDeAcceso({ tipo_acceso: "regalo", codigo_promocional: "INVITACION2027" }) === "regalo",
)
comprobar(
  "sin código, es regalo",
  tipoDeAcceso({ tipo_acceso: "regalo", codigo_promocional: null }) === "regalo",
)

console.log("\n═══ 5 · SIN MIGRAR NO SE INVENTA NADA ═══\n")
// Cuando las columnas no existen, `tipo_acceso` llega a null. Decir «pago»
// por omisión sería contar como ingresos a gente de la que no sabemos nada.
comprobar("sin dato, no se clasifica", tipoDeAcceso({ tipo_acceso: null }) === null)
comprobar("sin la propiedad siquiera", tipoDeAcceso({}) === null)
comprobar(
  "y el código suelto no basta",
  tipoDeAcceso({ tipo_acceso: null, codigo_promocional: "INVITACION" }) === null,
)

console.log("\n═══ 6 · «TRIALING» SE LEE EN PRUEBA ═══\n")
comprobar("lo que manda Stripe", estaEnPrueba({ subscription_status: "trialing" }) === true)
comprobar("por si llegara en la otra columna", estaEnPrueba({ status: "trialing" }) === true)
comprobar("activo no es prueba", estaEnPrueba({ subscription_status: "active", status: "active" }) === false)
comprobar("impago no es prueba", estaEnPrueba({ subscription_status: "past_due" }) === false)
comprobar("sin datos, no es prueba", estaEnPrueba({}) === false)

console.log("\n═══ 7 · EL MRR NO SE INFLA ═══\n")
// La regla de la que sale el dinero: solo cuentan los activos de pago.
{
  const filas = [
    { status: "active", tipo_acceso: "pago", codigo_promocional: null },
    { status: "active", tipo_acceso: "regalo", codigo_promocional: "INVITACION" },
    { status: "active", tipo_acceso: "regalo", codigo_promocional: "LLAMADO144" },
    { status: "past_due", tipo_acceso: "pago", codigo_promocional: null },
    { status: "canceled", tipo_acceso: "pago", codigo_promocional: null },
  ]
  const activosDePago = filas.filter((f) => f.status === "active" && tipoDeAcceso(f) === "pago").length
  comprobar("de cinco filas, solo una suma al MRR", activosDePago === 1)
}

console.log(`\n═══ ${pasadas} pasadas · ${fallos} fallos ═══\n`)
process.exit(fallos > 0 ? 1 : 0)
