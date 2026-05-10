// Dados das temporadas + helpers de progresso/desbloqueio.
// Episódios com vídeos + notas HTML ficam em ./episodes.ts; este arquivo
// só lida com metadata das 5 temporadas e regras de unlock/progresso.

export type Season = {
  num: number
  name: string
  episodes: number
  starter?: boolean
  external?: boolean
  redirectUrl?: string
  videoBg?: string
  // Visual fallback enquanto thumbnails reais não estão migradas
  gradient: string
  emoji: string
}

export const SEASONS: Season[] = [
  {
    num: 1,
    name: "Temporada 1",
    episodes: 0,
    starter: true,
    videoBg: "https://cdn.SEU_DOMINIO.com/video1.mp4",
    gradient: "linear-gradient(135deg, #1a1a24 0%, #7f1d1d 100%)",
    emoji: "🎬",
  },
  {
    num: 2,
    name: "Temporada 2",
    episodes: 0,
    videoBg: "https://cdn.SEU_DOMINIO.com/video2.mp4",
    gradient: "linear-gradient(135deg, #000000 0%, #1a1a24 100%)",
    emoji: "🎞️",
  },
  {
    num: 3,
    name: "Temporada 3",
    episodes: 0,
    videoBg: "https://cdn.SEU_DOMINIO.com/video3.mp4",
    gradient: "linear-gradient(135deg, #1a1a24 0%, #450a0a 100%)",
    emoji: "📽️",
  },
  {
    num: 4,
    name: "Temporada 4",
    episodes: 0,
    videoBg: "https://cdn.SEU_DOMINIO.com/video4.mp4",
    gradient: "linear-gradient(135deg, #000000 0%, #1a1a24 100%)",
    emoji: "🎥",
  },
  {
    num: 5,
    name: "Comunidad",
    episodes: 0,
    external: true,
    videoBg: "https://cdn.SEU_DOMINIO.com/video5.mp4",
    gradient: "linear-gradient(135deg, #000000 0%, #2a2a3a 100%)",
    emoji: "💬",
  },
]

// Progresso de episódios — chave: 's<num>_e<num>', valor: { watched_at }.
// Persiste em localStorage. Migrar pra Supabase server-side na Fase 5b
// (junto com videoplayer) é a evolução natural — por enquanto mantemos
// paridade com o behavior.

const PROGRESS_KEY = "app_episode_progress_v1"

export type EpisodeProgress = Record<string, { watched_at: string }>

export function getEpisodeProgress(): EpisodeProgress {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    return raw ? (JSON.parse(raw) as EpisodeProgress) : {}
  } catch {
    return {}
  }
}

/** Event name disparado em window quando o progresso de episódio muda.
 *  Permite que componentes irmãos (SeasonsCarousel, Hero, etc) re-leiam
 *  o localStorage sem precisar de refresh da página. */
export const PROGRESS_CHANGED_EVENT = "app:episode-progress-changed"

export function markEpisodeWatched(seasonNum: number, episodeNum: number): EpisodeProgress {
  const progress = getEpisodeProgress()
  const key = `s${seasonNum}_e${episodeNum}`
  // Idempotente: se já tava marcado, não dispara event de novo
  const wasAlreadyWatched = !!progress[key]
  progress[key] = { watched_at: new Date().toISOString() }
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // ignora — quota ou modo privado
  }
  // Avisa componentes irmãos (SeasonsCarousel, Hero etc) que progress mudou.
  // Necessário pra desbloquear próxima temporada sem reload quando user
  // termina último ep de T1/T2/T3.
  if (typeof window !== "undefined" && !wasAlreadyWatched) {
    window.dispatchEvent(new CustomEvent(PROGRESS_CHANGED_EVENT))
  }
  // Sincroniza pro servidor (fire-and-forget — UI não espera).
  // Idempotente: re-marcar mesmo (S, E) não dá erro server-side.
  if (typeof window !== "undefined") {
    fetch("/api/profile/episode-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ season_num: seasonNum, episode_num: episodeNum }),
    }).catch(() => {
      // Falha de rede: localStorage manteve o estado local; será re-sincronizado
      // no próximo syncProgressFromServer() via merge (envia pendentes).
    })
  }
  return progress
}

/**
 * Sincroniza progresso entre localStorage e servidor.
 *  - GET /api/profile/episode-progress: pega lista do banco
 *  - Merge bidirecional:
 *    a) Episódios no servidor mas não no localStorage → adiciona ao localStorage
 *    b) Episódios no localStorage mas não no servidor → POST pra subir
 *  - Server é fonte de verdade pra cross-device sync (PC, mobile, tablet)
 *
 * Chamar 1× no boot do shell (após login). Idempotente — pode ser chamado
 * múltiplas vezes, sempre converge pro mesmo estado.
 */
export async function syncProgressFromServer(): Promise<EpisodeProgress> {
  if (typeof window === "undefined") return {}

  // 1. Lê estado local atual
  const local = getEpisodeProgress()

  // 2. Busca estado do servidor
  type ServerRow = { season_num: number; episode_num: number; watched_at: string }
  let serverRows: ServerRow[] = []
  try {
    const res = await fetch("/api/profile/episode-progress", { credentials: "include" })
    if (res.ok) {
      const data = (await res.json()) as { progress: ServerRow[] }
      serverRows = data.progress || []
    }
  } catch {
    // Sem rede / não logado: mantém só local
    return local
  }

  // 3. Merge: adiciona ao localStorage o que veio do server
  const merged: EpisodeProgress = { ...local }
  const serverKeys = new Set<string>()
  for (const row of serverRows) {
    const key = `s${row.season_num}_e${row.episode_num}`
    serverKeys.add(key)
    if (!merged[key]) {
      merged[key] = { watched_at: row.watched_at }
    }
  }

  // 4. Salva merge no localStorage
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged))
  } catch {
    // ignora
  }

  // 5. Pega o que está no localStorage MAS NÃO no server e envia (catch-up)
  // Isso cobre o caso "user assistia no PC ofline antes de logar e agora
  // logou pela 1ª vez no celular — manda pra fonte de verdade".
  const localOnly = Object.keys(local).filter((k) => !serverKeys.has(k))
  if (localOnly.length > 0) {
    await Promise.all(
      localOnly.map((key) => {
        // key = "s2_e3" → season=2, episode=3
        const match = key.match(/^s(\d+)_e(\d+)$/)
        if (!match) return Promise.resolve()
        const seasonNum = parseInt(match[1], 10)
        const episodeNum = parseInt(match[2], 10)
        return fetch("/api/profile/episode-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ season_num: seasonNum, episode_num: episodeNum }),
        }).catch(() => null)
      })
    )
  }

  return merged
}

export function isSeasonComplete(season: Season, progress: EpisodeProgress): boolean {
  if (season.episodes === 0) return false
  for (let n = 1; n <= season.episodes; n++) {
    if (!progress[`s${season.num}_e${n}`]) return false
  }
  return true
}

export function isSeasonUnlocked(season: Season, progress: EpisodeProgress): boolean {
  if (season.num === 1) return true // T1 sempre destrava
  if (season.external) return true // Comunidad VIP sem progressão
  const previous = SEASONS.find((s) => s.num === season.num - 1)
  if (!previous) return false
  return isSeasonComplete(previous, progress)
}

export function isEpisodeUnlocked(seasonNum: number, episodeNum: number, progress: EpisodeProgress): boolean {
  const season = SEASONS.find((s) => s.num === seasonNum)
  if (!season) return false
  if (!isSeasonUnlocked(season, progress)) return false
  if (episodeNum === 1) return true
  return !!progress[`s${seasonNum}_e${episodeNum - 1}`]
}

export function getWatchedCount(season: Season, progress: EpisodeProgress): number {
  let count = 0
  for (let n = 1; n <= season.episodes; n++) {
    if (progress[`s${season.num}_e${n}`]) count++
  }
  return count
}

/** Onde o user vai retomar (próximo ep não-assistido) baseado no progress
 *  localStorage. Se nada assistido → (1, 1) + hasStarted=false.
 *  Se tudo assistido → último ep + hasStarted=true.
 *  Usado em Hero principal + SeriesInfoModal pra mostrar "Continuar/Asistir". */
export type ResumePoint = {
  season: number
  episode: number
  hasStarted: boolean
}

export function computeResumePoint(): ResumePoint {
  if (typeof window === "undefined") {
    return { season: 1, episode: 1, hasStarted: false }
  }
  const progress = getEpisodeProgress()
  const hasStarted = Object.keys(progress).length > 0
  if (!hasStarted) return { season: 1, episode: 1, hasStarted: false }

  let lastS = 1
  let lastE = 1
  for (const s of SEASONS) {
    if (s.external || s.episodes === 0) continue
    for (let n = 1; n <= s.episodes; n++) {
      if (!progress[`s${s.num}_e${n}`]) {
        return { season: s.num, episode: n, hasStarted: true }
      }
      lastS = s.num
      lastE = n
    }
  }
  return { season: lastS, episode: lastE, hasStarted: true }
}

/** % total assistido considerando todas as temporadas não-externas. */
export function computeOverallProgressPct(): number {
  if (typeof window === "undefined") return 0
  const progress = getEpisodeProgress()
  let total = 0
  let watched = 0
  for (const s of SEASONS) {
    if (s.external || s.episodes === 0) continue
    total += s.episodes
    for (let n = 1; n <= s.episodes; n++) {
      if (progress[`s${s.num}_e${n}`]) watched++
    }
  }
  return total > 0 ? Math.round((watched / total) * 100) : 0
}
