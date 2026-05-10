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

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM || "[BRAND_NAME] <noreply@SEU_DOMINIO.com>"
}
