// Helper — detecta se user cruzou um threshold de patente (community rank)
// e broadcasta notification global pra todos os outros members.
//
// Chamado após criar forum_post ou forum_reply (são os 2 eventos que aumentam
// o totalContributions usado por computeCommunityRank).
//
// Dedup via user_metadata.rank_broadcasted_levels (array de levels já avisados).

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { computeCommunityRank } from "@/lib/achievements"
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

    // Lista todos outros users via auth.admin.listUsers (não usa .schema("auth")
    // — falha silenciosamente em prod)
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const otherUsers = (listed?.users || []).filter((u) => u.id !== user.id)
    if (otherUsers.length === 0) return

    const tierEmoji = rank.tier === "platinum" ? "💎" : rank.tier === "gold" ? "🥇" : rank.tier === "silver" ? "🥈" : "🥉"
    const rows = otherUsers.map((u) => ({
      user_id: u.id,
      type: "rank_up",
      source_user_id: user.id,
      source_user_name: fullName,
      source_user_avatar_url: avatarUrl,
      title: `${fullName} ascendió a ${rank.label} ${tierEmoji}`,
      preview: `Nueva patente desbloqueada en la comunidad.`,
    }))

    // Batch de 100 pra evitar payload gigante
    for (let i = 0; i < rows.length; i += 100) {
      await admin.from("notifications").insert(rows.slice(i, i + 100))
    }

    // Notification pro próprio user (rank_up_self)
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "rank_up_self",
      source_user_id: user.id,
      source_user_name: fullName,
      source_user_avatar_url: avatarUrl,
      title: `¡Ascendiste a ${rank.label}! ${tierEmoji}`,
      preview: `Tu trabajo en la comunidad fue reconocido. Seguí así.`,
    })

    console.log(`[rank-broadcast] ${fullName} → ${rank.label} (level=${rank.level}, broadcasted to ${otherUsers.length})`)
  } catch (e) {
    console.warn("[maybeBroadcastRankUp] failed:", e)
  }
}
