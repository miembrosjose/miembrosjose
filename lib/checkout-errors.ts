// Logger central de erros do checkout — server-side.
// Toda falha que o cliente percebe (form não carrega, timeout, rate limit) é
// registrada aqui pra você descobrir problemas em minutos no dashboard.
//
// Falha aberta: se Supabase tá fora, NÃO derruba a request — só não loga.

import { getSupabaseAdmin } from "./supabase/admin"

export type CheckoutErrorSource =
  | "create_pi"            // /api/stripe/payment-intent
  | "create_subscription"  // /api/stripe/subscription
  | "update_pi"            // /api/stripe/payment-intent/update
  | "update_subscription"  // /api/stripe/subscription/update
  | "downsell"             // /api/stripe/downsell
  | "upsell"               // /api/stripe/upsell
  | "client_fetch"         // erro de rede no client
  | "client_timeout"       // AbortController timeout no client
  | "client_confirm"       // erro no stripe.confirmPayment do client

export type CheckoutErrorCode =
  | "rate_limit"          // 429 — IP ou email rate-limited
  | "stripe_api"          // erro retornado pelo Stripe SDK
  | "network"             // falha de rede entre Cloudflare ↔ Stripe ou client ↔ server
  | "timeout"             // request demorou demais
  | "invalid_email"       // validação falhou
  | "invalid_input"       // validação genérica falhou
  | "missing_price_id"    // config sem stripePriceId
  | "missing_secret"      // client_secret não veio do Stripe
  | "card_declined"       // cartão recusado
  | "auth_required"       // 3DS pendente
  | "unknown"             // outros

type LogPayload = {
  source: CheckoutErrorSource
  errorCode: CheckoutErrorCode
  errorMessage?: string | null
  ip?: string | null
  email?: string | null
  region?: string | null
  currency?: string | null
  userAgent?: string | null
  context?: Record<string, unknown>
}

/**
 * Loga um erro de checkout no Supabase. Falha aberta — nunca derruba a request.
 *
 * Use em todos os catch() das API routes do Stripe e nos paths de erro do client.
 */
export async function logCheckoutError(payload: LogPayload): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()
    await supabase.from("checkout_errors").insert({
      source: payload.source,
      error_code: payload.errorCode,
      error_message: payload.errorMessage?.slice(0, 1000) || null,
      ip: payload.ip || null,
      email: payload.email?.slice(0, 200) || null,
      region: payload.region || null,
      currency: payload.currency || null,
      user_agent: payload.userAgent?.slice(0, 200) || null,
      context: payload.context || null,
    })
  } catch {
    // Silent — não derruba checkout por causa de log
  }
}
