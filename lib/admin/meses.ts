// ═══════════════════════════════════════════════════════════════════════════
//  EL CORTE MENSUAL · quién entró y quién se fue, mes a mes
// ═══════════════════════════════════════════════════════════════════════════
//
// ── DE DÓNDE SALE CADA NÚMERO ─────────────────────────────────────────────
// Las ALTAS salen de `created_at` de la fila del miembro: el día que esa
// persona apareció por primera vez. Es un dato que no se mueve nunca.
//
// Las BAJAS no se pueden sacar de la fila, porque la fila solo guarda su
// estado de HOY: si alguien se fue en marzo, dice «cancelado» sin decir
// cuándo. Por eso se cuentan los eventos de cancelación, que sí llevan
// fecha. Consecuencia al leer la tabla: en los meses anteriores a que
// existiera esa sincronización no hay bajas que contar, y saldrán a cero
// aunque las hubiera.
//
// ── POR QUÉ ESTÁ FUERA DE LA RUTA ─────────────────────────────────────────
// Para poder probarlo. Los meses son terreno de errores tontos —el cambio
// de año, el día 1 a medianoche, un mes sin movimiento— y de esta tabla
// salen decisiones. Las pruebas están en scripts/probar-meses.mjs.
//
// ── TODO EN UTC, A PROPÓSITO ──────────────────────────────────────────────
// Las fechas llegan en UTC desde Postgres. Si se agruparan con la hora del
// navegador, una alta del día 1 a las 00:30 UTC caería en el mes anterior
// para quien mira desde América, y los totales de dos personas mirando la
// misma pantalla no cuadrarían.

export type Mes = {
  /** "2026-11" */
  clave: string
  altas: number
  bajas: number
  neto: number
}

/** El mes de una fecha ISO, en UTC: "2026-11". Null si no es una fecha. */
export function mesDe(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `${d.getUTCFullYear()}-${mm}`
}

/**
 * Los últimos 12 meses, del más reciente al más antiguo.
 *
 * Se devuelven TODOS los meses del tramo, incluso los que no tuvieron
 * movimiento: un mes que falta en la lista se lee como un hueco en los
 * datos, y un mes a cero se lee como lo que es — un mes a cero.
 */
export function construirMeses(
  filas: Array<{ created_at?: string | null }>,
  cancelaciones: Array<{ created_at?: string | null }>,
  ahora: Date = new Date(),
): Mes[] {
  const altas = new Map<string, number>()
  for (const f of filas) {
    const m = mesDe(f.created_at)
    if (m) altas.set(m, (altas.get(m) || 0) + 1)
  }

  const bajas = new Map<string, number>()
  for (const c of cancelaciones) {
    const m = mesDe(c.created_at)
    if (m) bajas.set(m, (bajas.get(m) || 0) + 1)
  }

  const salida: Mes[] = []
  for (let i = 0; i < 12; i++) {
    // Date.UTC normaliza los meses negativos solo: el mes -1 de 2027 es
    // diciembre de 2026. De ahí que el cambio de año no necesite nada.
    const d = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - i, 1))
    const clave = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    const a = altas.get(clave) || 0
    const b = bajas.get(clave) || 0
    salida.push({ clave, altas: a, bajas: b, neto: a - b })
  }
  return salida
}
