// ═══════════════════════════════════════════════════════════════════════════
//  ACCESO DE REGALO · los campos que el embudo añade al aviso de sincronización
// ═══════════════════════════════════════════════════════════════════════════
//
// El embudo empieza a regalar el primer mes con un código promocional de
// Stripe a quien asiste a los encuentros presenciales. Esas personas se
// activan EXACTAMENTE igual que quien paga: mismo aviso, mismo
// `subscription_status`, mismo mes de `current_period_end`, mismo acceso.
//
// Lo único que cambia es que queremos poder distinguirlas en el panel y no
// contarlas como ingresos.
//
// ── ESTO NO DECIDE NADA SOBRE EL ACCESO ───────────────────────────────────
// A propósito. El acceso sigue dependiendo de la suscripción, como siempre,
// y eso vive en otro sitio. Aquí solo se lee una etiqueta. Si este módulo
// devolviera basura, el acceso de nadie cambiaría.
//
// ── POR QUÉ ESTÁ EN SU PROPIO FICHERO ─────────────────────────────────────
// Porque `route.ts` necesita Next y Supabase para arrancar, así que no se
// puede probar a pelo con Node. Esto sí: no importa nada. Las pruebas de
// `scripts/probar-regalo.mjs` entran por aquí.

/** Lo que el embudo cuenta sobre cómo entró esta persona. */
export type CamposDeRegalo = {
  /**
   * 'regalo' | 'pago' | null
   *
   * `null` significa «el embudo no ha dicho nada», que es lo que pasa HOY y
   * lo que pasará siempre con los avisos antiguos. En ese caso no se escribe
   * la columna: quien ya estaba marcado se queda como estaba.
   */
  tipoAcceso: "regalo" | "pago" | null
  /** El código con el que entró, p. ej. "LLAMADO144". */
  codigoPromocional: string | null
  /**
   * Lo que se le cobró al entrar. En unidades de la moneda, NO en centavos
   * —igual que `LEGAL.monthlyPrice`, que vale "14.99"—. Con el regalo es 0.
   */
  primerPago: number | null
  /** Cuándo llegó el primer cobro de verdad. ISO, o null si aún no pagó. */
  pagoRealAt: string | null
  /** Qué claves de las cuatro traía el aviso. Las que no, no se escriben. */
  presentes: {
    tipoAcceso: boolean
    codigoPromocional: boolean
    primerPago: boolean
    pagoRealAt: boolean
  }
}

const LARGO_MAXIMO_CODIGO = 64

/**
 * Lee los cuatro campos del aviso del embudo.
 *
 * ── NO RECHAZA NADA ───────────────────────────────────────────────────────
 * Ni un campo con el tipo equivocado tira la petición. Un código que viene
 * como número se ignora y el resto del aviso sigue su camino, porque el
 * precio de ser estricto aquí sería que alguien no pudiera entrar en la
 * plataforma por un campo decorativo. La etiqueta se pierde; el acceso, no.
 */
export function leerCamposDeRegalo(payload: Record<string, unknown>): CamposDeRegalo {
  // ── tipo de acceso ──────────────────────────────────────────────────────
  // Solo un booleano de verdad cuenta. Ni "true" ni 1 ni null: si no es
  // booleano, el embudo no ha dicho nada que podamos creer.
  const bruto = payload.acceso_regalo
  const tipoAcceso =
    bruto === true ? "regalo" : bruto === false ? ("pago" as const) : null

  // ── código promocional ──────────────────────────────────────────────────
  let codigoPromocional: string | null = null
  let traeCodigo = false
  if ("codigo_promocional" in payload) {
    const v = payload.codigo_promocional
    if (typeof v === "string") {
      const limpio = v.trim().slice(0, LARGO_MAXIMO_CODIGO)
      codigoPromocional = limpio.length > 0 ? limpio : null
      traeCodigo = true
    } else if (v === null) {
      traeCodigo = true // el embudo dice explícitamente «sin código»
    }
  }

  // ── primer pago ─────────────────────────────────────────────────────────
  let primerPago: number | null = null
  let traePrimerPago = false
  if ("primer_pago" in payload) {
    const v = payload.primer_pago
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      primerPago = v
      traePrimerPago = true
    } else if (v === null) {
      traePrimerPago = true
    }
  }

  // ── fecha del primer cobro real ─────────────────────────────────────────
  let pagoRealAt: string | null = null
  let traePagoReal = false
  if ("pago_real_at" in payload) {
    const v = payload.pago_real_at
    if (typeof v === "string" && v.trim().length > 0) {
      const d = new Date(v)
      if (!Number.isNaN(d.getTime())) {
        pagoRealAt = d.toISOString()
        traePagoReal = true
      }
    } else if (v === null) {
      traePagoReal = true
    }
  }

  return {
    tipoAcceso,
    codigoPromocional,
    primerPago,
    pagoRealAt,
    presentes: {
      tipoAcceso: tipoAcceso !== null,
      codigoPromocional: traeCodigo,
      primerPago: traePrimerPago,
      pagoRealAt: traePagoReal,
    },
  }
}

/**
 * Las columnas que esto escribe. Sirven para quitarlas de golpe cuando la
 * base de datos todavía no las tiene.
 */
export const COLUMNAS_DE_REGALO = [
  "tipo_acceso",
  "codigo_promocional",
  "primer_pago",
  "pago_real_at",
] as const

/**
 * Lo que se va a escribir en la fila del miembro, a partir de lo que dijo el
 * embudo y de lo que ya había guardado.
 *
 * ── LA REGLA QUE PROTEGE LA CONTABILIDAD ──────────────────────────────────
 * A quien ya pagó de verdad no se le vuelve a llamar «regalo». Si existe
 * `pago_real_at` en la fila, ese hecho ya ocurrió y no se deshace: un aviso
 * posterior con `acceso_regalo = true` —un reintento raro, un evento que
 * llega tarde— no puede sacarlo de la cuenta de ingresos.
 *
 * Y `pago_real_at` nunca se borra por la misma razón: es una fecha que pasó.
 */
export function cambiosDeRegalo(
  campos: CamposDeRegalo,
  filaActual: { tipo_acceso?: string | null; pago_real_at?: string | null } | null,
): Record<string, unknown> {
  const cambios: Record<string, unknown> = {}
  const yaPagoDeVerdad = !!filaActual?.pago_real_at

  if (campos.presentes.tipoAcceso && campos.tipoAcceso) {
    if (!(campos.tipoAcceso === "regalo" && yaPagoDeVerdad)) {
      cambios.tipo_acceso = campos.tipoAcceso
    }
  }
  if (campos.presentes.codigoPromocional) {
    cambios.codigo_promocional = campos.codigoPromocional
  }
  if (campos.presentes.primerPago) {
    cambios.primer_pago = campos.primerPago
  }
  // Solo se escribe una fecha de verdad; nunca se vacía la que ya hubiera.
  if (campos.presentes.pagoRealAt && campos.pagoRealAt) {
    cambios.pago_real_at = campos.pagoRealAt
  }

  return cambios
}

/**
 * ¿Este error de Supabase es «esa columna no existe»?
 *
 * ── POR QUÉ IMPORTA TANTO ─────────────────────────────────────────────────
 * El código se publica empujando a `main`, pero las migraciones las corre
 * José a mano, cuando puede. Entre lo uno y lo otro hay una ventana en la
 * que el código nuevo habla con la base de datos vieja.
 *
 * Si en esa ventana el INSERT llevara `tipo_acceso` y la columna no
 * existiera, la petición fallaría entera y NADIE PODRÍA ACTIVARSE. Así que
 * cuando pasa esto se reintenta sin las columnas nuevas: se pierde la
 * etiqueta y se gana que la persona entre.
 */
export function esColumnaQueNoExiste(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  // PGRST204: PostgREST no encuentra la columna al escribir.
  // 42703: Postgres, undefined_column, al leer.
  if (error.code === "PGRST204" || error.code === "42703") return true
  const m = (error.message || "").toLowerCase()
  if (!m) return false
  return COLUMNAS_DE_REGALO.some((c) => m.includes(c)) && m.includes("does not exist")
}
