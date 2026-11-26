// ═══════════════════════════════════════════════════════════════════════════
//  CÓMO ENTRÓ CADA PERSONA · las tres puertas
// ═══════════════════════════════════════════════════════════════════════════
//
//   pago    · paga su mensualidad.
//   regalo  · primer mes de regalo (código LLAMADO144), de los encuentros
//             presenciales. No paga nada todavía.
//   prueba  · invitado a las reuniones mensuales (código INVITACION). Tres
//             días de prueba y después la mensualidad.
//
// ── ESTO NO DECIDE NINGÚN ACCESO ──────────────────────────────────────────
// Es una etiqueta para contar y para enseñar en el panel. Quien entra y
// quién no lo sigue decidiendo la suscripción, como siempre. Un invitado en
// prueba tiene exactamente el mismo acceso que cualquier miembro.
//
// ── POR QUÉ ESTÁ EN UN SITIO COMPARTIDO ───────────────────────────────────
// Lo usan la API, que cuenta para las tarjetas, y la pantalla, que pinta la
// insignia de cada fila. Si cada una decidiera por su cuenta, acabarían
// discrepando: la tarjeta diría «3 en prueba» y en la tabla habría cuatro
// insignias de prueba. Una sola regla, y las dos la leen.

/** El código que el embudo manda para los invitados. Valor fijo. */
export const CODIGO_INVITACION = "INVITACION"

export type TipoDeAcceso = "pago" | "regalo" | "prueba"

/**
 * Qué puerta usó esta persona.
 *
 * El orden importa: primero se mira si ya pagó. Cuando Stripe cobra los
 * $14.99 del cuarto día, el embudo manda `acceso_regalo = false` y
 * `tipo_acceso` pasa a 'pago' — pero el código promocional SE QUEDA en la
 * fila, porque es el histórico de cómo llegó. Si se mirara el código antes
 * que el tipo, esa persona seguiría contando como «en prueba» para siempre
 * y el MRR nunca la recogería.
 */
export function tipoDeAcceso(fila: {
  tipo_acceso?: string | null
  codigo_promocional?: string | null
}): TipoDeAcceso | null {
  // Sin dato no se inventa: la migración puede no estar aplicada.
  if (fila.tipo_acceso == null) return null
  if (fila.tipo_acceso !== "regalo") return "pago"

  const codigo = (fila.codigo_promocional || "").trim().toUpperCase()
  return codigo === CODIGO_INVITACION ? "prueba" : "regalo"
}

/**
 * ¿Está en los tres días de prueba, según lo que dice Stripe?
 *
 * Es otra pregunta distinta de la de arriba. `tipoDeAcceso` dice por qué
 * puerta entró; esto dice en qué momento del ciclo está hoy. Casi siempre
 * coinciden, pero no tienen por qué: el estado lo manda Stripe y la
 * etiqueta la manda el embudo.
 */
export function estaEnPrueba(fila: {
  status?: string | null
  subscription_status?: string | null
}): boolean {
  return fila.subscription_status === "trialing" || fila.status === "trialing"
}
