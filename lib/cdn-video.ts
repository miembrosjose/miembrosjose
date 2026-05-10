// URLs centralizadas dos vídeos no CDN R2.
// Quando trocar um vídeo, atualiza só aqui — todas as páginas/componentes
// e o sistema de prefetch (lib/funnel-prefetch.ts) usam essas constantes.

const CDN_BASE = "https://cdn.SEU_DOMINIO.com"

/**
 * Vídeo cinematográfico de transição da home (e /direct) → /call.
 * Toca fullscreen quando o user clica em "Entrar en la experiencia".
 * Pre-loadado no head da home/direct pra começar instantâneo no click.
 */
export const VIDEO_HOME_TRANSITION = `${CDN_BASE}/inicio.mp4`

/**
 * Vídeo de fundo da página /quiz (loop muted enquanto user responde).
 * Pre-loadado em /call.
 */
export const VIDEO_QUIZ = `${CDN_BASE}/quiz.mp4`

/**
 * Vídeo cinematográfico da página /payaso ("palhaço" — momento dramático
 * antes do salespage). Pre-loadado em /pantalla ou rota anterior.
 */
export const VIDEO_PAYASO = `${CDN_BASE}/palha%C3%A7o.mp4`
