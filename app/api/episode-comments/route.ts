// API route — comentários por episódio na area de membros.
//
// GET  /api/episode-comments?season=1&episode=3
//      Lista comentários de um episódio. Exige user autenticado (RLS bloqueia).
//      Retorna: { comments: [{ id, author_name, author_avatar, text, created_at }] }
//
// POST /api/episode-comments
//      Body: { season: 1, episode: 3, text: "..." }
//      Cria comentário. user_id é injetado pelo server (auth.uid()), não vem
//      do body — RLS garante que cada user só pode inserir com seu próprio id.
//      Retorna: { comment: { ... } }

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const MAX_TEXT_LENGTH = 500

function buildAvatarLetters(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "??"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const season = parseInt(searchParams.get("season") || "", 10)
  const episode = parseInt(searchParams.get("episode") || "", 10)

  if (!Number.isInteger(season) || !Number.isInteger(episode) || season < 1 || episode < 1) {
    return NextResponse.json({ error: "Invalid season/episode" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data, error } = await supabase
    .from("episode_comments")
    .select("id, user_id, author_name, author_username, author_avatar, author_avatar_url, author_badge_id, author_star_id, author_flame_id, author_avatar_border, author_is_admin, text, parent_comment_id, created_at, edited_at")
    .eq("season_num", season)
    .eq("episode_num", episode)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    console.error("[/api/episode-comments] GET error:", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ comments: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { season?: number; episode?: number; text?: string; parent_comment_id?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const season = Number(body.season)
  const episode = Number(body.episode)
  const text = (body.text || "").trim()
  const parentId = (typeof body.parent_comment_id === "string" && body.parent_comment_id) || null

  if (!Number.isInteger(season) || !Number.isInteger(episode) || season < 1 || episode < 1) {
    return NextResponse.json({ error: "Invalid season/episode" }, { status: 400 })
  }
  if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 })
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: `Text exceeds ${MAX_TEXT_LENGTH} chars` }, { status: 400 })
  }

  // Snapshot de identidade do user na hora do post.
  // - author_name      : full_name | name | parte local do email
  // - author_avatar    : iniciais (fallback se nao tiver foto)
  // - author_avatar_url: URL absoluta da foto em R2 (se existe)
  // - author_badge_id  : insignia destacada (validade lib/achievements.ts)
  const meta = (user.user_metadata || {}) as {
    full_name?: string
    name?: string
    avatar_url?: string
    featured_badge_id?: string | null
    featured_star_id?: string | null
    featured_flame_id?: string | null
    avatar_border_color?: string | null
    username?: string
  }
  const authorName = meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "Miembro")
  const authorUsername = (typeof meta.username === "string" && meta.username) || null
  const authorAvatar = buildAvatarLetters(authorName)
  const authorAvatarUrl = typeof meta.avatar_url === "string" && meta.avatar_url ? meta.avatar_url : null
  const authorAvatarBorder = (typeof meta.avatar_border_color === "string" && meta.avatar_border_color) || null
  // Respeita a escolha em /perfil. Fallback: admin → admin_seal, outros → welcome.
  const chosenBadge = (typeof meta.featured_badge_id === "string" && meta.featured_badge_id) || null
  const authorBadgeId = chosenBadge || (isAdmin(user) ? "admin_seal" : "welcome")
  const authorStarId =
    (typeof meta.featured_star_id === "string" && meta.featured_star_id) || null
  const authorFlameId =
    (typeof meta.featured_flame_id === "string" && meta.featured_flame_id) || null

  const { data, error } = await supabase
    .from("episode_comments")
    .insert({
      user_id: user.id,
      season_num: season,
      episode_num: episode,
      author_name: authorName,
      author_username: authorUsername,
      author_avatar: authorAvatar,
      author_avatar_url: authorAvatarUrl,
      author_badge_id: authorBadgeId,
      author_star_id: authorStarId,
      author_flame_id: authorFlameId,
      author_avatar_border: authorAvatarBorder,
      author_is_admin: isAdmin(user),
      text,
      parent_comment_id: parentId,
    })
    .select("id, user_id, author_name, author_username, author_avatar, author_avatar_url, author_badge_id, author_star_id, author_flame_id, author_avatar_border, author_is_admin, text, created_at")
    .single()

  if (error) {
    console.error("[/api/episode-comments] POST error:", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ comment: data })
}
