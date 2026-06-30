// Catálogo de episódios das temporadas.
// Cada cliente preenche os arrays com seus próprios vídeos hospedados no ConverteAI.

export const CONVERTEAI_ACCOUNT = "SEU_CONVERTEAI_ACCOUNT"

export type Episode = {
  /** UUID quando o episodio vem do banco (Supabase). Ausente no fallback estático. */
  id?: string
  num: number
  videoId: string
  title: string
  desc: string
  duration: string
  thumb?: string
  isNew?: boolean
  intro?: string
  notes?: string
  /** Chave do produto (KEY_TO_PRODUCT_NAME) pra renderizar checkout inline na página */
  inlineCheckoutKey?: string
  /** URL do agente GPT — botão "Abrir Agente" aparece só se user tem agentProductName */
  agentUrl?: string
  /** Nome do produto (igual ao KEY_TO_PRODUCT_NAME value) necessário pra ver o botão */
  agentProductName?: string
}

export const EPISODES_T1: Episode[] = []
export const EPISODES_T2: Episode[] = []
export const EPISODES_T3: Episode[] = []
export const EPISODES_T4: Episode[] = []

export function getEpisodesBySeason(num: number): Episode[] {
  switch (num) {
    case 1: return EPISODES_T1
    case 2: return EPISODES_T2
    case 3: return EPISODES_T3
    case 4: return EPISODES_T4
    default: return []
  }
}

export function buildConverteaiEmbedUrl(videoId: string): string {
  return `https://scripts.converteai.net/${CONVERTEAI_ACCOUNT}/players/${videoId}/v4/embed.html`
}
