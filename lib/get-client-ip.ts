/**
 * Resolve o IP real do cliente em rotas API.
 *
 * SEGURANÇA: x-forwarded-for é trivialmente forjável pelo cliente — usar como
 * fonte primária permite bypass de rate limits e contaminação de logs.
 * Cloudflare anexa cf-connecting-ip ANTES do cliente, então é confiável.
 *
 * Ordem de prioridade:
 *   1. cf-connecting-ip   (Cloudflare-anexado, NÃO forjável)
 *   2. x-real-ip          (alguns proxies setam)
 *   3. x-forwarded-for    (fallback final, pode ser falso)
 *   4. "unknown"
 */
export function getClientIp(req: { headers: Headers | { get(name: string): string | null } }): string {
  const h = req.headers
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  )
}
