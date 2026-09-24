// Sistema de XP e Level — gamificação geral (engloba posts, insignias, etc).
//
// Curva de dificuldade:
//   XP necessário pra subir do level N → N+1 = round(100 * N^1.35)
//
// Exemplo:
//   1 → 2:  100 XP    (super fácil pra começar)
//   2 → 3:  256 XP
//   3 → 4:  431 XP
//   5 → 6:  825 XP
//   10 → 11: 2.232 XP
//   20 → 21: 5.612 XP
//   50 → 51: 19.038 XP
//   100 → 101: 49.770 XP
//
// XP cumulativa total aproximada:
//   level 5  ≈ 1.760 XP
//   level 10 ≈ 6.860 XP
//   level 20 ≈ 28.700 XP
//   level 50 ≈ 230.200 XP
//
// Compra de produto → +1 level direto (independente do XP).

const XP_BASE = 100
const XP_EXPONENT = 1.35
const MAX_LEVEL = 200

// XP total cumulativa pra alcançar o início do level N (level 1 = 0 XP).
// XP do level 1 → 2 fica nos primeiros 100 pontos. XP do level 2 → 3 nos
// próximos 256 pontos, etc.
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0
  let total = 0
  for (let n = 1; n < level; n++) {
    total += Math.round(XP_BASE * Math.pow(n, XP_EXPONENT))
  }
  return total
}

export function xpToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0
  return Math.round(XP_BASE * Math.pow(level, XP_EXPONENT))
}

export type LevelInfo = {
  level: number              // 1..MAX_LEVEL
  total_xp: number           // XP acumulado total
  level_start_xp: number     // XP onde o level atual começa
  level_end_xp: number       // XP onde o próximo level começa
  xp_in_level: number        // XP ganhada DENTRO do level atual
  xp_for_level: number       // XP necessária pra completar o level atual
  percent: number            // 0-100% progresso dentro do level
}

export function computeLevel(totalXp: number, bonusLevels = 0): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp))
  // Calcula level baseado em XP (sem bônus de produtos)
  let level = 1
  let acc = 0
  while (level < MAX_LEVEL) {
    const need = Math.round(XP_BASE * Math.pow(level, XP_EXPONENT))
    if (acc + need > xp) break
    acc += need
    level++
  }
  // Aplica bônus de levels comprados (ex: cada produto = +1 level direto)
  const finalLevel = Math.min(MAX_LEVEL, level + Math.max(0, bonusLevels))

  // XP boundaries pro level FINAL (incluindo bonusLevels)
  // Quando há bonusLevels, o "início do level final" é o XP necessário
  // pra alcançar level atual (sem bônus) + qualquer XP além disso fica no level final.
  const levelStartXp = acc                                  // início do level natural (sem bônus)
  const xpForLevel = xpToNextLevel(level)                   // XP pra completar level natural
  const xpInLevel = xp - levelStartXp
  const percent = xpForLevel === 0 ? 100 : Math.min(100, Math.round((xpInLevel / xpForLevel) * 100))

  return {
    level: finalLevel,
    total_xp: xp,
    level_start_xp: levelStartXp,
    level_end_xp: levelStartXp + xpForLevel,
    xp_in_level: xpInLevel,
    xp_for_level: xpForLevel,
    percent,
  }
}

/**
 * Override pra admin: nível 999 + XP total 999.999 (figura simbólica,
 * fora do ranking competitivo). Aplicar nos callsites que sabem se o user
 * é admin (ex: /api/xp/me, /api/profile/public/[id]).
 */
export const ADMIN_LEVEL = 999
export const ADMIN_TOTAL_XP = 999_999

export function applyAdminLevelOverride(info: LevelInfo, isAdmin: boolean): LevelInfo {
  if (!isAdmin) return info
  return {
    ...info,
    level: ADMIN_LEVEL,
    total_xp: ADMIN_TOTAL_XP,
    xp_in_level: 0,
    xp_for_level: 0,
    percent: 100,
    level_start_xp: ADMIN_TOTAL_XP,
    level_end_xp: ADMIN_TOTAL_XP,
  }
}

// ── LO QUE DA EXPERIENCIA, Y POR QUÉ ESTAS CIFRAS ──────────────────────────
//
// El sistema venía de otro proyecto —uno de embudos de venta— y premiaba cosas
// que aquí no existen: publicar un embudo, recibir tres «me gusta» en él, dar
// feedback sobre el embudo de otro. Nada de eso tiene que ver con Los 144.000,
// y quien abría el detalle de su nivel leía un idioma ajeno.
//
// Esto premia lo que SÍ es esta plataforma: recorrer el Camino, escribir en la
// comunidad, practicar y volver.
//
// EL CRITERIO DE LAS CIFRAS. Subir de nivel tiene que notarse pronto y sin
// trucos. Del nivel 1 al 2 hacen falta 100 puntos: ver dos capítulos, o abrir
// una conversación y responder a un par. Un rato de uso honesto, no una tarde
// de clics.
//
// Y lo que más vale es lo que más cuesta hacer. Ver un capítulo entero vale
// diez veces más que dar un «me gusta», porque lleva diez veces más. Recibir
// respuesta vale más que darla, porque significa que lo que escribiste le
// importó a alguien. Nada de esto se puede farmear repitiendo un gesto: cada
// evento cuenta una sola vez por su origen.
export const XP_REWARDS = {
  // ── El Camino ──
  /** Un capítulo visto entero. Es el corazón de la plataforma. */
  episode_complete: 100,
  /** Terminar una temporada. Se suma a lo de cada capítulo. */
  season_complete: 400,
  /** Una meditación o práctica completada. */
  meditation_complete: 60,

  // ── La comunidad ──
  /** Abrir una conversación: cuesta más que responder, y vale más. */
  forum_post: 50,
  /** Responder a alguien. */
  forum_reply: 20,
  /** Comentar en un capítulo. */
  episode_comment: 10,
  /** Que respondan a lo tuyo: alguien se tomó el tiempo. */
  forum_reply_received: 15,
  /** Un «me gusta» en algo tuyo. */
  forum_like_received: 5,
  /** Dar un «me gusta». Vale poco, y debe: es el gesto más barato que hay. */
  forum_like_given: 1,

  // ── La Red ──
  /** Marcar tu lugar en el mapa. Una vez. */
  ubicacion_puesta: 40,
  /** Confirmar asistencia a un encuentro. */
  encuentro_confirmado: 30,
  /** Responder al Pulso de la semana. */
  pulso_respondido: 25,

  // ── Volver ──
  /** Primera entrada del día. Premia la constancia, no el tiempo pegado. */
  login_day: 10,
  /** Desbloquear una insignia. El resto lo pone su propia categoría. */
  insignia_unlocked: 200,

  // Comprar un producto NO da experiencia: da un nivel directo.
  // Ver lib/xp-grant.ts.
} as const

export type XpEventType = keyof typeof XP_REWARDS
