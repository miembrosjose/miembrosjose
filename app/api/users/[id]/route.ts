// API — retorna perfil público de um membro.
//
// GET /api/users/[id]
//   id = user.id (uuid)
//   Retorna: nome, @username, bio, niche, instagram, avatar_url,
//            featured_badge_id, post_count, reply_count, unique_login_days,
//            community_rank (computado), is_following (se viewer segue esse user)
//   Auth: qualquer authenticated.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { computeCommunityRank, applyAdminRankOverride } from "@/lib/achievements"
import { computeLevel, applyAdminLevelOverride } from "@/lib/xp"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params
  if (!userId) return NextResponse.json({ error: "Invalid user id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user: viewer } } = await supabase.auth.getUser()
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // Busca o user via auth.admin.getUserById — NÃO usar `.schema("auth")` (falha
  // silencioso em prod, vide feedback_supabase_auth_admin_api.md).
  const admin = getSupabaseAdmin()
  const { data: gotUser, error: getErr } = await admin.auth.admin.getUserById(userId)
  if (getErr || !gotUser?.user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const target = {
    id: gotUser.user.id,
    email: gotUser.user.email || "",
    raw_user_meta_data: (gotUser.user.user_metadata || {}) as Record<string, unknown>,
    created_at: gotUser.user.created_at,
  }
  const targetIsAdmin = Boolean(
    (gotUser.user.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true,
  )

  const meta = (target.raw_user_meta_data || {}) as {
    full_name?: string
    username?: string
    bio?: string
    niche?: string
    instagram?: string
    avatar_url?: string
    featured_badge_id?: string | null
    unique_login_days?: number
    last_login_date?: string
  }

  // Conta posts + replies do user (counters do fórum)
  const [{ count: postCount }, { count: replyCount }] = await Promise.all([
    admin.from("forum_posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("forum_replies").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ])
  const totalContributions = (postCount || 0) + (replyCount || 0)
  // Admin sempre na última patente (Leyenda)
  const rank = applyAdminRankOverride(computeCommunityRank(totalContributions), targetIsAdmin)

  // Posts recentes do user (max 10)
  const { data: recentPosts } = await admin
    .from("forum_posts")
    .select("id, title, created_at, likes_count, replies_count, image_url")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)

  // XP/Level do user. Admin = LV 999 / 999.999 XP (figura simbólica).
  const { data: xpRow } = await admin.from("user_xp").select("total_xp, bonus_levels").eq("user_id", userId).maybeSingle()
  const xpInfo = applyAdminLevelOverride(
    computeLevel(xpRow?.total_xp || 0, xpRow?.bonus_levels || 0),
    targetIsAdmin,
  )

  // Viewer já segue esse user? + contadores
  let isFollowing = false
  if (viewer.id !== userId) {
    const { data: follow } = await admin
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", viewer.id)
      .eq("followed_id", userId)
      .limit(1)
      .maybeSingle()
    isFollowing = !!follow
  }
  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    admin.from("user_follows").select("follower_id", { count: "exact", head: true }).eq("followed_id", userId),
    admin.from("user_follows").select("follower_id", { count: "exact", head: true }).eq("follower_id", userId),
  ])

  return NextResponse.json({
    id: target.id,
    full_name: meta.full_name || "",
    username: meta.username || null,
    bio: meta.bio || null,
    niche: meta.niche || null,
    instagram: meta.instagram || null,
    avatar_url: meta.avatar_url || null,
    featured_badge_id: meta.featured_badge_id || null,
    post_count: postCount || 0,
    reply_count: replyCount || 0,
    total_contributions: totalContributions,
    unique_login_days: meta.unique_login_days || 0,
    member_since: target.created_at,
    rank,
    xp: xpInfo,
    recent_posts: recentPosts || [],
    is_self: viewer.id === userId,
    is_following: isFollowing,
    followers_count: followersCount || 0,
    following_count: followingCount || 0,
  })
}
