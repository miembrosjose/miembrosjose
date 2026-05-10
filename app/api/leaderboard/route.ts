// API — ranking top N de members por level (e total_xp como tiebreaker).
//
// GET /api/leaderboard?limit=100
//
// Retorna lista ordenada com stats agregadas de cada user:
//   - level, total_xp, bonus_levels
//   - stats: count de cada event_type em xp_events (posts, replies, likes given/received,
//            insignias, comments, follows recebidos, streak — tudo que gera XP)
//   - meta básico: full_name, username, avatar_url

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { computeLevel } from "@/lib/xp"
import { computeCommunityRank, getAchievementById } from "@/lib/achievements"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user: viewer } } = await supabase.auth.getUser()
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const limitRaw = parseInt(req.nextUrl.searchParams.get("limit") || "100", 10)
  const limit = Math.min(Math.max(limitRaw || 100, 1), 200)

  const admin = getSupabaseAdmin()

  // 1) Lista TODOS os auth.users via API oficial (NÃO usar .schema("auth")
  //    que falha silenciosamente em prod). Filtramos admins e cruzamos com
  //    user_xp depois.
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listErr) {
    console.error("[/api/leaderboard] listUsers", listErr)
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 })
  }

  type UserMeta = { full_name?: string; username?: string; avatar_url?: string; unique_login_days?: number; featured_badge_id?: string | null }
  type AppMeta = { is_admin?: boolean; access_revoked?: boolean; is_test_account?: boolean }
  type AuthUserLite = { id: string; meta: UserMeta }
  const authUsersById = new Map<string, AuthUserLite>()
  for (const u of listed?.users || []) {
    const appMeta = (u.app_metadata || {}) as AppMeta
    if (appMeta.is_admin === true) continue          // Filtra admins do ranking
    if (appMeta.access_revoked === true) continue    // Filtra users com acesso revogado (refund/dispute/manual)
    if (appMeta.is_test_account === true) continue   // Filtra contas de teste (biel_gfk etc)
    authUsersById.set(u.id, {
      id: u.id,
      meta: (u.user_metadata || {}) as UserMeta,
    })
  }

  // 2) user_xp ordenado por current_level DESC, total_xp DESC (tiebreaker)
  // Pega mais que limit pra compensar admins filtrados; corta depois
  const { data: xpRows, error: xpErr } = await admin
    .from("user_xp")
    .select("user_id, total_xp, bonus_levels, current_level")
    .order("current_level", { ascending: false })
    .order("total_xp", { ascending: false })
    .limit(limit + 20)
  if (xpErr) {
    console.error("[/api/leaderboard] user_xp", xpErr)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
  // Filtra users que não estão em authUsersById (admins ou deletados)
  const filteredXp = (xpRows || [])
    .filter((r) => authUsersById.has((r as { user_id: string }).user_id))
    .slice(0, limit) as { user_id: string; total_xp: number; bonus_levels: number; current_level: number }[]

  if (filteredXp.length === 0) return NextResponse.json({ users: [] })

  const ids = filteredXp.map((r) => r.user_id)

  // 3) Stats via xp_events (group by user_id + event_type)
  const { data: eventsRows } = await admin
    .from("xp_events")
    .select("user_id, event_type")
    .in("user_id", ids)
    .limit(50000)

  const statsByUser = new Map<string, Record<string, number>>()
  ;(eventsRows || []).forEach((e) => {
    const ev = e as { user_id: string; event_type: string }
    if (!statsByUser.has(ev.user_id)) statsByUser.set(ev.user_id, {})
    const m = statsByUser.get(ev.user_id)!
    m[ev.event_type] = (m[ev.event_type] || 0) + 1
  })

  // 4) Counts forum_posts + forum_replies pra cada user (pra computar patente)
  const [{ data: postCounts }, { data: replyCounts }] = await Promise.all([
    admin.from("forum_posts").select("user_id").in("user_id", ids),
    admin.from("forum_replies").select("user_id").in("user_id", ids),
  ])
  const postCountByUser = new Map<string, number>()
  ;(postCounts || []).forEach((p) => {
    const uid = (p as { user_id: string }).user_id
    postCountByUser.set(uid, (postCountByUser.get(uid) || 0) + 1)
  })
  ;(replyCounts || []).forEach((r) => {
    const uid = (r as { user_id: string }).user_id
    postCountByUser.set(uid, (postCountByUser.get(uid) || 0) + 1)
  })

  // 5) Monta resposta enriquecida
  const users = filteredXp.map((r) => {
    const authUser = authUsersById.get(r.user_id)!
    const meta = authUser.meta
    const stats = statsByUser.get(r.user_id) || {}
    const xpInfo = computeLevel(r.total_xp || 0, r.bonus_levels || 0)
    const totalContribs = postCountByUser.get(r.user_id) || 0
    const rank = computeCommunityRank(totalContribs)
    const featuredAch = meta.featured_badge_id ? getAchievementById(meta.featured_badge_id) : null
    return {
      id: r.user_id,
      full_name: meta.full_name || "Miembro",
      username: meta.username || null,
      avatar_url: typeof meta.avatar_url === "string" && meta.avatar_url ? meta.avatar_url : null,
      level: xpInfo.level,
      total_xp: r.total_xp,
      bonus_levels: r.bonus_levels,
      // Patente engraçada (Civil → Recluta → Agente → Operador → Estratega → Capo → Padrino → Leyenda)
      rank_label: rank.label,
      rank_tier: rank.tier,
      rank_badge_id: rank.badge_id,
      // Insignia destacada (escolhida pelo user no perfil)
      featured_badge: featuredAch
        ? { id: featuredAch.id, name: featuredAch.name, tier: featuredAch.tier }
        : null,
      stats: {
        forum_post: stats.forum_post || 0,
        forum_reply: stats.forum_reply || 0,
        episode_comment: stats.episode_comment || 0,
        forum_like_given: (stats.forum_like_given || 0) + (stats.forum_reply_like_given || 0),
        forum_like_received: (stats.forum_like_received || 0) + (stats.forum_reply_like_received || 0),
        funnel_like_given: stats.funnel_like_given || 0,
        funnel_like_received: stats.funnel_like_received || 0,
        funnel_feedback_given: stats.funnel_feedback_given || 0,
        funnel_feedback_received: stats.funnel_feedback_received || 0,
        funnel_created: stats.funnel_created || 0,
        insignia_aula: stats.insignia_aula || 0,
        insignia_unlocked: stats.insignia_unlocked || 0,
        insignia_total: (stats.insignia_aula || 0) + (stats.insignia_unlocked || 0),
        login_day: stats.login_day || (meta.unique_login_days || 0),
      },
    }
  })

  return NextResponse.json({ users, limit, viewer_id: viewer.id })
}
