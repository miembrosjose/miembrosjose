// Helpers de URL pra normalizar inputs do admin.
// Admin pode digitar "hotmart.com/produto" sem protocolo — sem normalização
// window.open trata como path relativo (localhost:3000/hotmart.com/...).

/** Garante que a URL começa com http(s)://. Se já tem protocolo, retorna como está.
 *  Se vier vazia ou null, retorna string vazia. */
export function ensureProtocol(url: string | null | undefined): string {
  if (!url) return ""
  const trimmed = url.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  // Sem protocolo → assume https
  return `https://${trimmed}`
}

/** Abre URL externa em nova aba garantindo protocolo. */
export function openExternal(url: string | null | undefined): void {
  const safe = ensureProtocol(url)
  if (!safe) return
  window.open(safe, "_blank", "noopener,noreferrer")
}
