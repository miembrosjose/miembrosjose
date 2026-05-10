// Helper único pra leitura de cookies no browser.
// Antes existiam 3 implementações divergentes em:
//   - components/purchase-webhook-relay.tsx (regex sem escape)
//   - components/stripe-payment-form.tsx (regex sem escape)
//   - lib/tracker.ts (regex com escape)
//
// Cookies lidos: _fbp, _fbc (Meta Pixel/CAPI dedup + atribuição), _ga (GA4),
// utmify_*, sckcfm_*, sck_* (UTMs persistidos pra Stripe/CAPI server-side).
//
// Versão unificada combina o melhor das 3:
//   - Separador `;\s*` (flexível, funciona com tabs/múltiplos espaços)
//   - Escape de caracteres especiais regex no name (protege contra _fbp.legacy
//     ou nomes com pontos/pipes interpretados como regex meta-chars)
//   - Aceita valor vazio `[^;]*` (cookie tipo `name=` retorna "")

export function readCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const escaped = name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&")
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ""
}
