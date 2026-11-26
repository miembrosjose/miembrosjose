// ═══════════════════════════════════════════════════════════════════════════
//  EL CORTE MENSUAL · la prueba
// ═══════════════════════════════════════════════════════════════════════════
//
//   npm run probar:meses
//
// POR QUÉ ESTA PRUEBA EXISTE
//   De esta tabla salen decisiones: si un mes se fue más gente de la que
//   entró, eso cambia lo que José hace la semana siguiente. Un número mal
//   agrupado no se nota —sale un número igual de creíble— y por eso tiene
//   que estar comprobado.
//
//   Los meses son terreno de errores tontos: el cambio de año, el día 1 a
//   medianoche, un mes sin ningún movimiento, una fecha que no es fecha.
//   Todos están aquí abajo.

import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, join } from "node:path"

const aqui = dirname(fileURLToPath(import.meta.url))
const ruta = join(aqui, "..", "lib", "admin", "meses.ts")
const { construirMeses, mesDe } = await import(pathToFileURL(ruta).href)

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

/** Un «hoy» fijo, para que la prueba no dependa del día en que se corra. */
const HOY = new Date("2026-11-25T23:00:00Z")

/** El mes de la tabla con esa clave. */
function mes(meses, clave) {
  return meses.find((m) => m.clave === clave)
}

console.log("\n═══ 1 · LA FORMA DE LA TABLA ═══\n")
{
  const t = construirMeses([], [], HOY)
  comprobar("son doce meses", t.length === 12)
  comprobar("el primero es el mes en curso", t[0].clave === "2026-11")
  comprobar("van del más nuevo al más viejo", t[1].clave === "2026-10")
  comprobar("el último es un año antes", t[11].clave === "2025-12")
  comprobar("sin datos, todo a cero", t.every((m) => m.altas === 0 && m.bajas === 0 && m.neto === 0))
}

console.log("\n═══ 2 · ALTAS Y BAJAS ═══\n")
{
  const filas = [
    { created_at: "2026-11-02T10:00:00Z" },
    { created_at: "2026-11-20T10:00:00Z" },
    { created_at: "2026-10-15T10:00:00Z" },
  ]
  const cancelaciones = [{ created_at: "2026-11-21T10:00:00Z" }]
  const t = construirMeses(filas, cancelaciones, HOY)

  comprobar("dos altas en noviembre", mes(t, "2026-11").altas === 2)
  comprobar("una baja en noviembre", mes(t, "2026-11").bajas === 1)
  comprobar("neto +1 en noviembre", mes(t, "2026-11").neto === 1)
  comprobar("una alta en octubre", mes(t, "2026-10").altas === 1)
  comprobar("sin bajas en octubre", mes(t, "2026-10").bajas === 0)
  comprobar("neto +1 en octubre", mes(t, "2026-10").neto === 1)
}

console.log("\n═══ 3 · UN MES QUE SE ENCOGE ═══\n")
// El caso que de verdad importa ver: más bajas que altas. Si el signo
// estuviera al revés, un mes malo parecería bueno.
{
  const t = construirMeses(
    [{ created_at: "2026-09-03T00:00:00Z" }],
    [
      { created_at: "2026-09-10T00:00:00Z" },
      { created_at: "2026-09-11T00:00:00Z" },
      { created_at: "2026-09-12T00:00:00Z" },
    ],
    HOY,
  )
  comprobar("neto negativo cuando se va más gente", mes(t, "2026-09").neto === -2)
}

console.log("\n═══ 4 · EL CAMBIO DE AÑO ═══\n")
// Doce meses hacia atrás desde noviembre cruzan a 2025. Si el mes se
// calculara restando a mano, aquí saldría «2026-00» o peor.
{
  const t = construirMeses(
    [{ created_at: "2025-12-31T23:59:59Z" }, { created_at: "2026-01-01T00:00:01Z" }],
    [],
    HOY,
  )
  comprobar("diciembre de 2025 existe en la tabla", !!mes(t, "2025-12"))
  comprobar("el 31 de diciembre cuenta en diciembre", mes(t, "2025-12").altas === 1)
  comprobar("el 1 de enero cuenta en enero", mes(t, "2026-01").altas === 1)
  comprobar("ninguna clave sale con mes 00 o 13", t.every((m) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m.clave)))
}

console.log("\n═══ 5 · LA MEDIANOCHE DEL DÍA 1 ═══\n")
// Agrupar con la hora del navegador haría que esto cayera en octubre para
// quien mira desde América. Va en UTC justamente por eso.
{
  const t = construirMeses([{ created_at: "2026-11-01T00:00:00Z" }], [], HOY)
  comprobar("el día 1 a medianoche es de ese mes", mes(t, "2026-11").altas === 1)
  comprobar("...y no del anterior", mes(t, "2026-10").altas === 0)
}

console.log("\n═══ 6 · LO QUE NO ES UNA FECHA ═══\n")
// Una fila rara no puede tumbar el informe entero ni inflar un mes.
{
  const t = construirMeses(
    [
      { created_at: null },
      { created_at: "" },
      { created_at: "ayer" },
      {},
      { created_at: "2026-11-05T00:00:00Z" },
    ],
    [{ created_at: null }, { created_at: "cuando sea" }],
    HOY,
  )
  comprobar("solo cuenta la fecha buena", mes(t, "2026-11").altas === 1)
  comprobar("las bajas inválidas no cuentan", mes(t, "2026-11").bajas === 0)
  comprobar("el total de altas de los doce meses es 1", t.reduce((s, m) => s + m.altas, 0) === 1)
}
comprobar("mesDe de null es null", mesDe(null) === null)
comprobar("mesDe de basura es null", mesDe("no soy una fecha") === null)
comprobar("mesDe rellena el cero del mes", mesDe("2026-03-09T00:00:00Z") === "2026-03")

console.log("\n═══ 7 · LO VIEJO NO SE CUELA ═══\n")
// Algo de hace dos años no debe aparecer en ningún mes de la tabla.
{
  const t = construirMeses([{ created_at: "2024-05-05T00:00:00Z" }], [], HOY)
  comprobar("una fecha fuera del tramo no suma en ningún mes", t.every((m) => m.altas === 0))
}

console.log(`\n═══ ${pasadas} pasadas · ${fallos} fallos ═══\n`)
process.exit(fallos > 0 ? 1 : 0)
