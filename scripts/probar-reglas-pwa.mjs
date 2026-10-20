// ═══════════════════════════════════════════════════════════════════════════
//  CUÁNDO SE INVITA Y CUÁNDO SE CALLA · la prueba de los plazos
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:pwa
//
// Lo que aquí se comprueba son PLAZOS: veintiún días, noventa, catorce. Eso no
// se puede probar a mano sin esperar tres semanas, y es justo lo que se rompe
// en silencio el día que alguien cambie un número sin mirar los otros.
//
// El reloj y el almacenamiento van fingidos, así que un plazo de noventa días
// se comprueba en un milisegundo y la prueba no deja nada escrito en ningún
// sitio.
//
// Lo que esto NO prueba —y hay que mirar en un teléfono de verdad— es la
// detección del aparato, el permiso del sistema y cómo se ve la hoja.

import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const almacen = new Map()
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => almacen.set(k, String(v)),
}

let ahora = Date.UTC(2026, 9, 20, 12, 0, 0)
const RealDate = Date
globalThis.Date = class extends RealDate {
  static now() { return ahora }
}

const aqui = dirname(fileURLToPath(import.meta.url))
const R = await import(
  "file:///" + join(aqui, "..", "lib", "pwa", "reglas.ts").replace(/\\/g, "/")
)

const DIA = 24 * 60 * 60 * 1000
let fallos = 0
const comprobar = (titulo, real, esperado) => {
  const bien = real === esperado
  if (!bien) fallos++
  console.log(`${bien ? "  ok" : "FALLA"}  ${titulo}${bien ? "" : `  (esperaba ${esperado}, salió ${real})`}`)
}

const ANA = "ana", LUIS = "luis"

console.log("\n— Las visitas —")
comprobar("1ª visita: todavía no se invita", R.contarVisita(ANA) >= 2, false)
comprobar("2ª visita: ya se puede", R.contarVisita(ANA) >= 2, true)

console.log("\n— Prioridad: instalar va antes que los avisos —")
comprobar(
  "las dos posibles → gana instalar",
  R.inviteQueToca({ userId: ANA, puedeInstalar: true, puedeActivarAvisos: true }),
  "instalar",
)
comprobar(
  "ya instalada → le toca a la tarjeta",
  R.inviteQueToca({ userId: ANA, puedeInstalar: false, puedeActivarAvisos: true }),
  "notificaciones",
)
comprobar(
  "nada que ofrecer → ninguna",
  R.inviteQueToca({ userId: ANA, puedeInstalar: false, puedeActivarAvisos: false }),
  "ninguna",
)

console.log("\n— Primera negativa: 21 días —")
R.aplazarInstalacion(ANA)
comprobar("justo después, callada", R.instalacionSilenciada(ANA), true)
ahora += 20 * DIA
comprobar("a los 20 días, sigue callada", R.instalacionSilenciada(ANA), true)
comprobar(
  "y mientras tanto le toca a la tarjeta",
  R.inviteQueToca({ userId: ANA, puedeInstalar: true, puedeActivarAvisos: true }),
  "notificaciones",
)
ahora += 2 * DIA
comprobar("a los 22, vuelve a tocar", R.instalacionSilenciada(ANA), false)

console.log("\n— Segunda negativa: 90 días —")
R.aplazarInstalacion(ANA)
ahora += 30 * DIA
comprobar("a los 30 días, callada", R.instalacionSilenciada(ANA), true)
ahora += 61 * DIA
comprobar("a los 91, vuelve", R.instalacionSilenciada(ANA), false)

console.log("\n— Instalada: nunca más —")
R.instalacionHecha(ANA)
ahora += 3650 * DIA
comprobar("diez años después, sigue callada", R.instalacionSilenciada(ANA), true)

console.log("\n— La tarjeta de avisos: 14 días —")
R.contarVisita(LUIS); R.contarVisita(LUIS)
R.aplazarTarjeta(LUIS)
comprobar("recién cerrada", R.tarjetaSilenciada(LUIS), true)
comprobar(
  "y no se dibuja",
  R.inviteQueToca({ userId: LUIS, puedeInstalar: false, puedeActivarAvisos: true }),
  "ninguna",
)
ahora += 13 * DIA
comprobar("a los 13 días, callada", R.tarjetaSilenciada(LUIS), true)
ahora += 2 * DIA
comprobar("a los 15, vuelve", R.tarjetaSilenciada(LUIS), false)

console.log("\n— Apagó los avisos a propósito —")
R.marcarApagadoAdrede(LUIS)
comprobar("queda constancia", R.apagadoAdrede(LUIS), true)
R.olvidarApagado(LUIS)
comprobar("y al reactivar se olvida", R.apagadoAdrede(LUIS), false)

console.log("\n— Dos cuentas en el mismo teléfono —")
const CARLA = "carla"
comprobar("Carla no hereda las visitas de Ana", R.visitasSuficientes(CARLA), false)
comprobar("ni el silencio de Ana", R.instalacionSilenciada(CARLA), false)

console.log("\n— Sin almacenamiento (ventana privada) —")
globalThis.localStorage = {
  getItem: () => { throw new Error("bloqueado") },
  setItem: () => { throw new Error("bloqueado") },
}
let lanzo = false
try {
  R.contarVisita(ANA)
  R.instalacionSilenciada(ANA)
  R.aplazarInstalacion(ANA)
  R.inviteQueToca({ userId: ANA, puedeInstalar: true, puedeActivarAvisos: true })
} catch { lanzo = true }
comprobar("nada lanza", lanzo, false)

console.log(fallos === 0 ? "\nTODO BIEN\n" : `\n${fallos} FALLOS\n`)
process.exit(fallos === 0 ? 0 : 1)
