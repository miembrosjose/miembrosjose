// Helpers de formatação reutilizados em todos os components que renderizam
// posts/replies/comments. Equivalentes às funções timeAgoEs e renderRichBody
// do proyecto base.

const RICH_BODY_RULES: Array<[RegExp, string]> = [
  // Markdown básico — ordem importa (links primeiro, depois inline)
  [/\*\*(.+?)\*\*/g, "<strong>$1</strong>"],
  [/\*(.+?)\*/g, "<em>$1</em>"],
  [/`([^`]+)`/g, "<code>$1</code>"],
]

/**
 * Formata data ISO em "hace X" em espanhol.
 * Exemplos: "ahora", "hace 5 min", "hace 2 h", "hace 3 d", "hace 1 sem".
 */
export function timeAgoEs(iso: string): string {
  const now = Date.now()
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ""
  const diff = Math.max(0, Math.floor((now - t) / 1000))
  if (diff < 60) return "ahora"
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`
  if (diff < 2592000) return `hace ${Math.floor(diff / 604800)} sem`
  return `hace ${Math.floor(diff / 2592000)} mes`
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Renderiza body de post/comment com markdown básico (bold, em, code) +
 * preserva quebras de linha. Retorna HTML escapado seguro.
 *
 * Uso: <div dangerouslySetInnerHTML={{ __html: renderRichBody(post.body) }} />
 */
export function renderRichBody(raw: string): string {
  if (!raw) return ""
  // 1. Escape HTML primeiro (segurança)
  let html = escapeHtml(raw)
  // 2. Aplica regras de markdown sobre o texto escapado
  for (const [re, repl] of RICH_BODY_RULES) {
    html = html.replace(re, repl)
  }
  // 3. Quebra em parágrafos por linha vazia, e <br> dentro de cada
  return html
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("")
}

/**
 * Retorna iniciais do nome (até 2 letras) — fallback quando não tem avatar_url.
 */
export function buildAvatarLetters(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "??"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Detecta se uma URL é vídeo pela extensão (mp4, webm, mov).
 * Usado pra decidir entre <img> e <video> em post.image_url.
 */
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false
  return /\.(mp4|webm|mov)(\?|$)/i.test(url)
}
