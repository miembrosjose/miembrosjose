// API — retorna dados públicos de perfil pra view ViewUserProfile.
// Substitui as queries server-side que estavam em app/miembros/u/[id]/page.tsx.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { ACHIEVEMENTS, computeCommunityRank, applyAdminRankOverride, getAchievementById, getTierColor } from "@/lib/achievements"
import { computeLevel, applyAdminLevelOverride } from "@/lib/xp"

export const dynamic = "force-dynamic"

type RecentPost = {
  id: string
  title: string
  created_at: string
  likes_count: number
  dislikes_count?: number
  replies_count: number
  image_url: string | null
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params

  const supabase = await getSupabaseServer()
  const { data: { user: viewer } } = await supabase.auth.getUser()
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: gotUser, error: getErr } = await admin.auth.admin.getUserById(id)
  if (getErr || !gotUser?.user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const target = {
    id: gotUser.user.id,
    email: gotUser.user.email || "",
    raw_user_meta_data: (gotUser.user.user_metadata || {}) as Record<string, unknown>,
    created_at: gotUser.user.created_at,
  }

  const meta = (target.raw_user_meta_data || {}) as {
    full_name?: string
    username?: string
    bio?: string
    niche?: string
    instagram?: string
    instagram_url?: string
    avatar_url?: string
    featured_badge_id?: string | null
    featured_star_id?: string | null
    featured_flame_id?: string | null
    avatar_border_color?: string | null
    unique_login_days?: number
  }

  const [{ count: postCount }, { count: replyCount }, xpResult] = await Promise.all([
    admin.from("forum_posts").select("id", { count: "exact", head: true }).eq("user_id", id),
    admin.from("forum_replies").select("id", { count: "exact", head: true }).eq("user_id", id),
    admin.from("user_xp").select("total_xp, bonus_levels").eq("user_id", id).maybeSingle(),
  ])

  const totalContributions = (postCount || 0) + (replyCount || 0)
  // Admin = LV 999 + última patente (Leyenda) — figura simbólica, fora do ranking
  const targetIsAdmin = Boolean(
    (gotUser.user.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true,
  )
  const rank = applyAdminRankOverride(computeCommunityRank(totalContributions), targetIsAdmin)
  const xpInfo = applyAdminLevelOverride(
    computeLevel(xpResult.data?.total_xp || 0, xpResult.data?.bonus_levels || 0),
    targetIsAdmin,
  )

  const { data: recentPostsRaw } = await admin
    .from("forum_posts")
    .select("id, title, created_at, likes_count, dislikes_count, replies_count, image_url")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(10)
  const recentPosts: RecentPost[] = (recentPostsRaw as RecentPost[] | null) || []

  let isFollowing = false
  if (viewer.id !== id) {
    const { data: follow } = await admin
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", viewer.id)
      .eq("followed_id", id)
      .limit(1)
      .maybeSingle()
    isFollowing = !!follow
  }

  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    admin.from("user_follows").select("follower_id", { count: "exact", head: true }).eq("followed_id", id),
    admin.from("user_follows").select("follower_id", { count: "exact", head: true }).eq("follower_id", id),
  ])

  const featuredAch = meta.featured_badge_id ? getAchievementById(meta.featured_badge_id) : undefined
  const rankAch = rank.badge_id ? getAchievementById(rank.badge_id) : undefined
  const starAch = meta.featured_star_id ? getAchievementById(meta.featured_star_id) : undefined
  const flameAch = meta.featured_flame_id ? getAchievementById(meta.featured_flame_id) : undefined

  // Lista completa de insignias desbloqueadas (pro perfil público mostrar
  // todas as conquistas — não só a featured). Ordenadas pela posição no
  // array ACHIEVEMENTS (mesma sequência do /perfil → BadgeSection),
  // não pela ordem cronológica de unlock.
  const { data: unlockedRows } = await admin
    .from("user_unlocked_achievements")
    .select("achievement_id, unlocked_at")
    .eq("user_id", id)

  const unlockedSet = new Map(
    (unlockedRows || []).map((r) => [r.achievement_id, r.unlocked_at]),
  )

  const unlockedBadges = ACHIEVEMENTS.filter((ach) => unlockedSet.has(ach.id)).map((ach) => ({
    id: ach.id,
    name: ach.name,
    desc: ach.desc,
    tier: ach.tier,
    category: ach.category,
    svg: ach.svg,
    color: getTierColor(ach.tier),
    unlocked_at: unlockedSet.get(ach.id) as string,
  }))

  // Admin recebe admin_seal automaticamente (não precisa estar em
  // user_unlocked_achievements — tratamento especial igual no profile-form)
  if (targetIsAdmin && !unlockedBadges.find((b) => b.id === "admin_seal")) {
    const adm = getAchievementById("admin_seal")
    if (adm) {
      unlockedBadges.unshift({
        id: adm.id,
        name: adm.name,
        desc: adm.desc,
        tier: adm.tier,
        category: adm.category,
        svg: adm.svg,
        color: getTierColor(adm.tier),
        unlocked_at: target.created_at,
      })
    }
  }

  return NextResponse.json({
    user: {
      id: target.id,
      email: target.email,
      created_at: target.created_at,
      full_name: meta.full_name || null,
      username: meta.username || null,
      bio: meta.bio || null,
      niche: meta.niche || null,
      instagram: meta.instagram || null,
      instagram_url: meta.instagram_url || null,
      avatar_url: meta.avatar_url || null,
      featured_badge_id: meta.featured_badge_id || null,
      // avatar_border_color foi removido — feature de borda colorida descontinuada.
      // Admin recebe border branca via is_admin (frontend renderiza condicional).
      is_admin: targetIsAdmin,
      unique_login_days: meta.unique_login_days || 0,
    },
    isSelf: viewer.id === id,
    counts: {
      posts: postCount || 0,
      replies: replyCount || 0,
      followers: followersCount || 0,
      following: followingCount || 0,
    },
    xp: {
      level: xpInfo.level,
      total_xp: xpInfo.total_xp,
      xp_in_level: xpInfo.xp_in_level,
      xp_for_level: xpInfo.xp_for_level,
      percent: xpInfo.percent,
    },
    rank: {
      label: rank.label,
      badge_id: rank.badge_id,
    },
    badges: {
      rank_ach: rankAch
        ? { id: rankAch.id, name: rankAch.name, tier: rankAch.tier, svg: rankAch.svg, color: getTierColor(rankAch.tier) }
        : null,
      featured_ach: featuredAch
        ? { id: featuredAch.id, name: featuredAch.name, tier: featuredAch.tier, svg: featuredAch.svg, color: getTierColor(featuredAch.tier) }
        : null,
      star_ach: starAch && starAch.category === "community"
        ? { id: starAch.id, name: starAch.name, tier: starAch.tier, svg: starAch.svg, color: getTierColor(starAch.tier) }
        : null,
      flame_ach: flameAch && flameAch.category === "time"
        ? { id: flameAch.id, name: flameAch.name, tier: flameAch.tier, svg: flameAch.svg, color: getTierColor(flameAch.tier) }
        : null,
      unlocked: unlockedBadges,
    },
    isFollowing,
    recentPosts,
  })
}
