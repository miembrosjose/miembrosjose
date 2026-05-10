// Rate limit genérico via Supabase. Sem dependência externa (Upstash etc).
// Janela deslizante simples: hits dentro da window_start; reseta quando window expira.

import { getSupabaseAdmin } from "./supabase/admin"

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

/**
 * Verifica se uma request pode prosseguir baseado em rate limit.
 *
 * @param bucket — nome do limite (ex: "track", "lead", "upsell")
 * @param ip — IP do cliente (de getClientIp)
 * @param maxHits — quantas requests permitidas por janela
 * @param windowSeconds — duração da janela em segundos
 *
 * Comportamento:
 *  - Se passar do limite, retorna allowed=false e tempo até reset
 *  - Janela é deslizante: reseta após windowSeconds desde a 1ª hit
 *  - Falha aberta: se Supabase falhar, deixa passar (não derruba o site)
 */
export async function checkRateLimit(
  bucket: string,
  ip: string,
  maxHits: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!ip || ip === "unknown") {
    // sem IP confiável → não dá pra rate limitar; deixa passar
    return { allowed: true, remaining: maxHits, resetInSeconds: 0 }
  }

  const supabase = getSupabaseAdmin()
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  try {
    // Busca registro existente
    const { data: existing } = await supabase
      .from("api_rate_limit")
      .select("hits, window_start")
      .eq("bucket", bucket)
      .eq("ip", ip)
      .maybeSingle()

    if (!existing) {
      // 1ª request nesse bucket+IP → cria
      await supabase
        .from("api_rate_limit")
        .insert({ bucket, ip, hits: 1, window_start: new Date(now).toISOString() })
      return { allowed: true, remaining: maxHits - 1, resetInSeconds: windowSeconds }
    }

    const windowStartMs = new Date(existing.window_start).getTime()
    const elapsedMs = now - windowStartMs

    if (elapsedMs >= windowMs) {
      // Janela expirou → reseta
      await supabase
        .from("api_rate_limit")
        .update({ hits: 1, window_start: new Date(now).toISOString() })
        .eq("bucket", bucket)
        .eq("ip", ip)
      return { allowed: true, remaining: maxHits - 1, resetInSeconds: windowSeconds }
    }

    // Dentro da janela → checa limite
    const newHits = existing.hits + 1
    const remaining = Math.max(0, maxHits - newHits)
    const resetInSeconds = Math.ceil((windowMs - elapsedMs) / 1000)

    if (existing.hits >= maxHits) {
      // Já passou do limite — NÃO incrementa (evita storage growth de spam)
      return { allowed: false, remaining: 0, resetInSeconds }
    }

    // Incrementa
    await supabase
      .from("api_rate_limit")
      .update({ hits: newHits })
      .eq("bucket", bucket)
      .eq("ip", ip)

    return { allowed: true, remaining, resetInSeconds }
  } catch {
    // Falha aberta — não bloqueia se Supabase tá fora do ar
    return { allowed: true, remaining: maxHits, resetInSeconds: 0 }
  }
}

/**
 * Helper pra retornar HTTP 429 com headers padrão.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos.",
      retryAfterSeconds: result.resetInSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.resetInSeconds),
        "X-RateLimit-Remaining": "0",
      },
    }
  )
}
