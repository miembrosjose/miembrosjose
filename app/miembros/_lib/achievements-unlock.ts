// Helpers de desbloqueio de insignias client-side.
// Equivalente a unlockAchievement + isAchievementUnlocked + getUnlockedAchievements
//.
//
// Persistência: localStorage (chave "app_unlocked_achievements") espelha
// a lógica original. Cada call:
//   1. Checa se já tá desbloqueada — se sim, no-op (não despacha duas vezes)
//   2. Salva no localStorage
//   3. Despacha evento "app:achievement-unlock" — AchievementToast escuta
//   4. Hit /api/profile/insignia-unlocked em background pra conceder XP
//      server-side (dedup garantido por xp_events na server-side)
//
// As funções "checkX" abaixo varrem estado atual e desbloqueiam o que faltar.
// Idempotentes — chamar várias vezes não duplica.

import { getAchievementById } from "@/lib/achievements"
import { getEpisodeProgress as readEpisodeProgress, SEASONS } from "./seasons"
import type { OwnedProduct } from "./products"

const STORAGE_KEY = "app_unlocked_achievements"

/**
 * Insignias que SOLO concede el servidor: las da un administrador o una
 * compra, nunca el avance del propio usuario.
 *
 * Para estas, el servidor es la única autoridad. El resto se sincroniza en
 * los dos sentidos —lo que se ganó sin conexión se sube después— pero aquí
 * eso sería un agujero: al retirarle a alguien el Embajador Galáctico, su
 * navegador conservaba la copia local y el «catch-up» se la devolvía al
 * servidor en la siguiente sincronización. La retirada se deshacía sola.
 */
const SOLO_SERVIDOR = new Set([
  "admin_seal",
  "embajador_galactico",
  "practica_profunda",
  "rol_organizador",
  "rol_cartografo",
  "rol_colaborador",
  "rol_instructor",
  // Retiradas del catálogo, pero siguen concediéndose por compra:
  "el_topo",
  "el_estudio",
  "product_revisao",
  "product_creativos",
  "product_andromeda",
  "product_analytics",
  "product_minivsl",
  "product_bonus_ganchos",
])

type UnlockedMap = Record<string, { unlockedAt: string }>

function readUnlocked(): UnlockedMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UnlockedMap) : {}
  } catch {
    return {}
  }
}

function writeUnlocked(map: UnlockedMap) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Silent — quota exceeded é improvável e não vale crashar
  }
}

/**
 * Sincroniza lista de insignias desbloqueadas entre localStorage e servidor.
 *  - GET /api/profile/unlocked-achievements: lista do banco
 *  - Merge bidirecional:
 *    a) IDs no servidor mas não no localStorage → adiciona ao cache local
 *    b) IDs no localStorage mas não no servidor → POST /insignia-unlocked
 *       pra gravar no banco (catch-up)
 *  - Server é fonte de verdade pra cross-device sync (PC, mobile, tablet)
 *
 * Chamar 1× no boot do shell (após login). Idempotente — pode ser chamado
 * múltiplas vezes, sempre converge pro mesmo estado.
 */
export async function syncUnlockedAchievementsFromServer(): Promise<UnlockedMap> {
  if (typeof window === "undefined") return {}

  // 1. Lê estado local atual
  const local = readUnlocked()

  // 2. Busca estado do servidor
  type ServerRow = { achievement_id: string; unlocked_at: string }
  let serverRows: ServerRow[] = []
  try {
    const res = await fetch("/api/profile/unlocked-achievements", { credentials: "include" })
    if (res.ok) {
      const data = (await res.json()) as { unlocked: ServerRow[] }
      serverRows = data.unlocked || []
    }
  } catch {
    return local
  }

  // 3. Merge: adiciona ao localStorage o que veio do server
  const merged: UnlockedMap = { ...local }
  const serverIds = new Set<string>()
  for (const row of serverRows) {
    serverIds.add(row.achievement_id)
    if (!merged[row.achievement_id]) {
      merged[row.achievement_id] = { unlockedAt: row.unlocked_at }
    }
  }

  // 3b. Las que solo concede el servidor y YA NO están allí se borran de la
  // copia local. Es el otro lado de la autoridad: si se retiraron, se
  // retiraron de verdad y deben desaparecer también de este navegador.
  for (const id of Object.keys(merged)) {
    if (SOLO_SERVIDOR.has(id) && !serverIds.has(id)) delete merged[id]
  }

  writeUnlocked(merged)

  // 4. AQUÍ HABÍA UNA SUBIDA, Y SE HA QUITADO.
  //
  // Lo que estaba en el navegador y no en el servidor se subía "por si acaso",
  // para no perder el avance de quien hubiera trabajado sin conexión. En la
  // práctica hacía otra cosa: convertía el localStorage en la autoridad. Como
  // /api/profile/insignia-unlocked concedía cualquier insignia del catálogo a
  // quien la pidiera, este bucle le daba a cada persona todo lo que hubiera
  // en su cajón del navegador, y reiniciar el avance de alguien no servía de
  // nada porque al recargar se volvía a subir entero.
  //
  // Ya no hace falta para nada: el servidor DEDUCE las insignias de los
  // hechos que él mismo guarda —capítulos vistos, días de acceso,
  // aportaciones, compras— en lib/insignias-ganadas.ts. El avance sin
  // conexión sigue llegando por su propio camino, /api/profile/episode-
  // progress, y de ahí salen las insignias solas.

  return merged
}

export function isAchievementUnlocked(id: string): boolean {
  return !!readUnlocked()[id]
}

export function unlockAchievement(id: string): boolean {
  if (typeof window === "undefined") return false
  if (isAchievementUnlocked(id)) return false
  const ach = getAchievementById(id)
  if (!ach) return false

  const map = readUnlocked()
  map[id] = { unlockedAt: new Date().toISOString() }
  writeUnlocked(map)

  // Despacha pra UI mostrar toast
  window.dispatchEvent(
    new CustomEvent("app:achievement-unlock", { detail: { id } })
  )

  // Server-side: concede XP (dedup garantido por xp_events)
  fetch("/api/profile/insignia-unlocked", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ insignia_id: id }),
  }).catch(() => {})

  return true
}

// ─────────────────────────────────────────────────────────────────────────
// Triggers automáticos — chamados no fluxo da área de membros
// ─────────────────────────────────────────────────────────────────────────

// Boas-vindas: dispara na primeira vez que user entra na área de membros.
// Idempotente — só desbloqueia se ainda não foi.
export function checkWelcome() {
  unlockAchievement("welcome")
}

// «144» — la primera insignia de todos, al ver el capítulo 1 de la
// Temporada 1. Las de los capítulos 2 a 5 están retiradas del catálogo, así
// que ya no se conceden; quien las tenga las conserva sin verlas.
const AGENT_BY_EPISODE: Array<{ ep: number; id: string }> = [
  { ep: 1, id: "agent_estratega" },
]

export function checkAgentAchievements() {
  const progress = readEpisodeProgress()
  for (const { ep, id } of AGENT_BY_EPISODE) {
    if (progress[`s1_e${ep}`]) unlockAchievement(id)
  }
}

// Episódio assistido: 1ª aula → first_lesson, todas da temporada → season_X_complete
export function checkEpisodeAchievements(seasonNum: number, allEpisodesOfSeason: Array<{ num: number }>) {
  const progress = readEpisodeProgress()
  const totalWatched = Object.keys(progress).length

  if (totalWatched >= 1) unlockAchievement("first_lesson")

  if (allEpisodesOfSeason.length > 0) {
    const allWatched = allEpisodesOfSeason.every(
      (e) => progress[`s${seasonNum}_e${e.num}`]
    )
    if (allWatched) unlockAchievement(`season_${seasonNum}_complete`)
  }

  // Re-checa agents toda vez (são EP da T1)
  if (seasonNum === 1) checkAgentAchievements()

  // Re-checa training_complete — pode disparar quando user termina o último
  // episódio da última temporada não-externa. Idempotente.
  checkTrainingComplete()
}

/**
 * Insignia rara — desbloqueia quando user assistiu TODOS os episódios de
 * TODAS as temporadas não-externas (T1-T4). T5 (Comunidad VIP) é external
 * com episodes=0 e não conta. Tier gold = dispara FOMO pra outros users.
 */
export function checkTrainingComplete() {
  const progress = readEpisodeProgress()
  for (const season of SEASONS) {
    if (season.external || season.episodes === 0) continue
    for (let n = 1; n <= season.episodes; n++) {
      if (!progress[`s${season.num}_e${n}`]) return
    }
  }
  unlockAchievement("training_complete")
}

// Insignias de produto: chamado depois que owned-products é carregado
const PRODUCT_KEY_TO_ACHIEVEMENT: Record<string, string> = {
  "Producto 1": "product_creativos",
  "Producto 2": "product_andromeda",
  "Producto 3": "product_analytics",
  "Servicio Premium": "product_revisao",
  "Upsell 1": "product_minivsl",
  "Bonus 1": "product_bonus_ganchos",
}

export async function checkProductAchievements(owned: OwnedProduct[]) {
  if (owned.length === 0) return

  let anyNewUnlock = false
  for (const p of owned) {
    const id = PRODUCT_KEY_TO_ACHIEVEMENT[p.name]
    if (id && unlockAchievement(id)) anyNewUnlock = true
  }

  // Se houve unlock novo agora, aguarda ~1.5s pra os requests fire-and-forget
  // de /api/profile/insignia-unlocked completarem antes de rodar o sync.
  if (anyNewUnlock) {
    await new Promise<void>((r) => setTimeout(r, 1500))
  }

  // Sync retroativo: detecta achievements de produto sem product_level_grant
  // e concede o level faltante. Retorna quantos levels foram concedidos agora.
  try {
    const res = await fetch("/api/profile/product-level-sync", {
      method: "POST",
      credentials: "include",
    })
    if (res.ok) {
      const { levels_granted } = (await res.json()) as { levels_granted: number }
      if (levels_granted > 0 || anyNewUnlock) {
        // Força XpBadge a re-consultar o servidor agora — vai detectar o delta
        // de level e disparar app:level-up → LevelUpOverlay mostra a animação.
        window.dispatchEvent(new CustomEvent("app:xp-force-sync"))
      }
    }
  } catch {
    // Silent
  }
}
