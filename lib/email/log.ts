// Helper centralizado pra registrar envio de email no email_send_log.
// Chamado por sendAccountInviteEmail, sendAccountExistsEmail e qualquer outro
// fluxo de email pós-compra.

import { getSupabaseAdmin } from "@/lib/supabase/admin"

export type EmailType = "invite" | "account_exists" | "recovery" | "manual"

export type EmailSource =
  | "stripe_front"
  | "stripe_installment"
  | "hotmart"
  | "manual_grant"
  | "admin_resend"

export type EmailLogEntry = {
  email: string
  email_type: EmailType
  source: EmailSource
  source_ref?: string | null
  status: "success" | "failed" | "error"
  error_message?: string | null
  resend_id?: string | null
  attempt?: number
  payload?: Record<string, unknown> | null
}

/**
 * Registra envio de email no log centralizado. Fail-open: erro aqui NÃO
 * bloqueia o fluxo principal (só warn no console).
 */
export async function logEmailSend(entry: EmailLogEntry): Promise<void> {
  try {
    const admin = getSupabaseAdmin()
    await admin.from("email_send_log").insert({
      email: entry.email.toLowerCase().trim(),
      email_type: entry.email_type,
      source: entry.source,
      source_ref: entry.source_ref || null,
      status: entry.status,
      error_message: entry.error_message || null,
      resend_id: entry.resend_id || null,
      attempt: entry.attempt || 1,
      payload: entry.payload || null,
    })
  } catch (e) {
    // Silent — log é debugging, não pode quebrar o fluxo de email
    console.warn("[logEmailSend] insert falhou:", e instanceof Error ? e.message : e)
  }
}
