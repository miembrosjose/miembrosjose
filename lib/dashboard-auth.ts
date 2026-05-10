// Auth do dashboard — comparação timing-safe + rate limit unificado.
//
// Substitui o padrão `if (pwd !== process.env.SLUG_PASSWORD)` que aparecia
// em 12 rotas, vulnerável a:
//   - Timing attacks (comparação `!==` é variável no tempo)
//   - Brute-force (8 das 12 rotas não tinham rate limit)
//
// Usa Web Crypto API (compatível com edge runtime) pra timing-safe equal.

import { NextResponse } from "next/server"
import { checkRateLimit } from "./rate-limit"

function getClientIp(req: Request | { headers: Headers }): string {
  const h = req.headers
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "0.0.0.0"
  )
}

const PWD = process.env.SLUG_PASSWORD ?? ""

/**
 * Comparação string timing-safe usando Web Crypto.
 * Constante no tempo: gasta o mesmo tempo independente de quando os caracteres divergem.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  // Strings de tamanho diferente — retorna false sem leak de tempo
  // (mas a comparação de length em si já é timing-safe pra strings curtas)
  if (a.length !== b.length) {
    // Faz uma comparação dummy pra evitar early-return revelar diferença de tamanho
    const enc = new TextEncoder()
    const aBuf = enc.encode(a)
    const bBuf = enc.encode(b.padEnd(a.length, "\0"))
    let diff = 1 // já começa diferente porque length difere
    for (let i = 0; i < aBuf.length; i++) {
      diff |= aBuf[i] ^ (bBuf[i] ?? 0)
    }
    return diff === 0 && false // sempre false (length diff)
  }

  const enc = new TextEncoder()
  const aBuf = enc.encode(a)
  const bBuf = enc.encode(b)
  let diff = 0
  for (let i = 0; i < aBuf.length; i++) {
    diff |= aBuf[i] ^ bBuf[i]
  }
  return diff === 0
}

/**
 * Verifica auth + rate limit em uma rota do dashboard.
 *
 * Retorna `null` se auth OK (rota pode prosseguir) ou um NextResponse com erro
 * (401 senha inválida, 429 rate-limited, 500 config faltando).
 *
 * Uso:
 *   const authError = await verifyDashboardAuth(req)
 *   if (authError) return authError
 *   // resto da rota
 */
export async function verifyDashboardAuth(
  req: Request | { headers: Headers }
): Promise<NextResponse | null> {
  if (!PWD) {
    return NextResponse.json({ error: "Server config missing" }, { status: 500 })
  }

  const ip = getClientIp(req)

  // Rate limit ANTES da verificação de senha — previne brute-force.
  // 10 tentativas/IP/15min é suficiente pra uso legítimo (recarregar dashboard, etc)
  // e bloqueia bots de força bruta.
  const rl = await checkRateLimit("dashboard-auth", ip, 10, 15 * 60)
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "Demasiados intentos. Espera unos minutos.",
        retryAfterSeconds: rl.resetInSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.resetInSeconds) },
      }
    )
  }

  const provided = req.headers.get("x-slug-password") ?? ""
  const ok = await timingSafeEqual(provided, PWD)

  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 401 })
  }

  return null // auth OK, rota pode prosseguir
}
