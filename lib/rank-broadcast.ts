// Helper — detecta se user cruzou um threshold de patente (community rank)
// e broadcasta notification global pra todos os outros members.
//
// Chamado após criar forum_post ou forum_reply (são os 2 eventos que aumentam
// o totalContributions usado por computeCommunityRank).
//
// Dedup via user_metadata.rank_broadcasted_levels (array de levels já avisados).

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { computeCommunityRank } from "@/lib/achievements"
import { emitCommunityEvent } from "@/lib/notify"
import type { User } from "@supabase/supabase-js"

/**
 * Verifica se o user cruzou um novo nível de patente após este post/reply
 * e, se cruzou, broadcasta pra toda a comunidade.
 *
 * Idempotente: cada level só é broadcastado 1x (rastreado em user_metadata).
 *
 * Performance: faz 2 queries de count (head:true, barato) + 1 listUsers se
 * detectar cruzamento. Não bloqueia o fluxo principal — qualquer falha aqui
 * é só logada.
 */
export async function maybeBroadcastRankUp(user: User): Promise<void> {
  try {
    const admin = getSupabaseAdmin()

    // Conta total de contribuições (posts + replies)
    const [{ count: postCount }, { count: replyCount }] = await Promise.all([
      admin.from("forum_posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      admin.from("forum_replies").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ])
    const total = (postCount || 0) + (replyCount || 0)

    const rank = computeCommunityRank(total)
    // Civil (level 0) não merece broadcast — é o default.
    if (rank.level === 0 || !rank.label) return

    const meta = (user.user_metadata || {}) as {
      full_name?: string
      avatar_url?: string
      rank_broadcasted_levels?: number[]
    }
    const broadcastedLevels = Array.isArray(meta.rank_broadcasted_levels) ? meta.rank_broadcasted_levels : []
    if (broadcastedLevels.includes(rank.level)) return // já avisado

    // Marca que vai broadcastar este level (idempotência) ANTES de inserir notifications
    const newBroadcastedLevels = [...broadcastedLevels, rank.level]
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        rank_broadcasted_levels: newBroadcastedLevels,
      },
    })

    const fullName = meta.full_name || (user.email ? user.email.split("@")[0] : "Miembro")
    const avatarUrl = (typeof meta.avatar_url === "string" && meta.avatar_url) || null

    const tierEmoji = rank.tier === "platinum" ? "💎" : rank.tier === "gold" ? "🥇" : rank.tier === "silver" ? "🥈" : "🥉"

    // Notificación PERSONAL para el propio user (rank_up_self) — se conserva.
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "rank_up_self",
      source_user_id: user.id,
      source_user_name: fullName,
      source_user_avatar_url: avatarUrl,
      title: `¡Ascendiste a ${rank.label}! ${tierEmoji}`,
      preview: `Tu trabajo en la comunidad fue reconocido. Seguí así.`,
    })

    // Comunidad: UNA fila en community_events (antes: fan-out a todos).
    await emitCommunityEvent({
      type: "rank_up",
      actorUserId: user.id,
      actorName: fullName,
      actorAvatarUrl: avatarUrl,
      title: `${fullName} ascendió a ${rank.label} ${tierEmoji}`,
      preview: "Nueva patente desbloqueada en la comunidad.",
      category: "rank",
      visibility: "members",
      priority: rank.tier === "platinum" || rank.tier === "gold" ? "important" : "normal",
    })

    console.log(`[rank-broadcast] ${fullName} → ${rank.label} (level=${rank.level}) → community_event`)
  } catch (e) {
    console.warn("[maybeBroadcastRankUp] failed:", e)
  }
}
