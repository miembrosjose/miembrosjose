// Cliente Resend centralizado.
// Cliente é instanciado lazy (só quando usado) — não falha em build se key não existir.

import { Resend } from "resend"

let resendClient: Resend | null = null

export function getResend(): Resend {
  if (resendClient) return resendClient
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY não configurado")
  resendClient = new Resend(key)
  return resendClient
}

/**
 * El remitente.
 *
 * ── POR QUÉ ESTO YA NO TIENE UN VALOR DE RELLENO ──────────────────────────
 * Tenía uno: "noreply@SEU_DOMINIO.com", del andamiaje original. Un remitente
 * de un dominio que no existe hace que el proveedor rechace el correo entero
 * —no llega a spam: no sale—, y como el rechazo ocurre dentro del proveedor,
 * desde fuera parecía que el envío se había intentado y ya.
 *
 * Es el peor fallo posible en un correo transaccional: alguien compra, no
 * recibe su acceso, y nada en la plataforma dice que haya pasado algo raro.
 *
 * Ahora, sin EMAIL_FROM configurado, esto lanza. Una excepción se ve en el
 * registro y en el panel de salud de correo; un correo que no sale, no.
 */
export function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM
  if (!from) throw new Error("EMAIL_FROM no configurado")
  return from
}
