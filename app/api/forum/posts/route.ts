// API — listagem e criação de posts do fórum.
//
// GET /api/forum/posts?limit=20&before=<created_at_iso>
//   Lista posts ordenados por mais recente. Suporta cursor (before).
//   Retorna posts + flag liked_by_me pra UI exibir botão de like correto.
//   Resposta inclui nextCursor (created_at do último post) quando há mais
//   resultados; null quando alcançou o fim.
//
// POST /api/forum/posts
//   Body: { title, body, tags?: string[], image_url?: string }
//   Cria post com snapshot de identidade do user (nome, avatar, badge).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { maybeBroadcastRankUp } from "@/lib/rank-broadcast"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const TITLE_MAX = 200
const BODY_MAX = 5000
const TAG_MAX_LEN = 30
const MAX_TAGS = 5

function buildAvatarLetters(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "??"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100)
  const before = searchParams.get("before")
  // Búsqueda (q) y filtro por categoría/tag. Sanitiza para no romper el
  // filtro PostgREST `.or` (comas, paréntesis y comodines rompen la sintaxis).
  const rawQ = (searchParams.get("q") || "").trim().slice(0, 80)
  const q = rawQ.replace(/[,()%*\\]/g, " ").replace(/\s+/g, " ").trim()
  const tag = (searchParams.get("tag") || "").trim().slice(0, 30).toUpperCase()

  let query = supabase
    .from("forum_posts")
    .select("id, user_id, author_name, author_username, author_avatar, author_avatar_url, author_badge_id, author_star_id, author_flame_id, author_avatar_border, author_is_admin, title, body, image_url, tags, likes_count, dislikes_count, replies_count, hot, created_at, pinned, pin_order, edited_at")
    .order("pinned", { ascending: false })
    .order("pin_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit)
  if (before) {
    // Em paginação, exclui pinneds — eles vieram no batch inicial e
    // duplicariam aqui (created_at antigo poderia bater no cursor).
    query = query.lt("created_at", before).eq("pinned", false)
  }
  // Filtros: buscan en título + cuerpo (q) y por tag exacto (categoría).
  if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`)
  if (tag) query = query.contains("tags", [tag])

  const { data: posts, error } = await query
  if (error) {
    console.error("[/api/forum/posts GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Batch: descobre quais posts o user curtiu E quais deu dislike (2 queries paralelas)
  const postIds = (posts || []).map((p) => p.id)
  let likedSet = new Set<string>()
  let dislikedSet = new Set<string>()
  if (postIds.length > 0) {
    const [{ data: likes }, { data: dislikes }] = await Promise.all([
      supabase
        .from("forum_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds),
      supabase
        .from("forum_dislikes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds),
    ])
    likedSet = new Set((likes || []).map((l) => l.post_id))
    dislikedSet = new Set((dislikes || []).map((l) => l.post_id))
  }

  const enriched = (posts || []).map((p) => ({
    ...p,
    liked_by_me: likedSet.has(p.id),
    disliked_by_me: dislikedSet.has(p.id),
  }))

  // nextCursor: created_at do ÚLTIMO POST NÃO-PINNED do batch.
  // Pinneds têm prioridade no ORDER BY mas podem ter created_at antigo —
  // se usássemos eles como cursor, o próximo batch pularia posts recentes.
  // Quando o batch retorna < limit, alcançamos o fim (nextCursor=null).
  const lastNonPinned = [...enriched].reverse().find((p) => !p.pinned)
  const nextCursor =
    enriched.length === limit && lastNonPinned ? lastNonPinned.created_at : null

  return NextResponse.json({ posts: enriched, nextCursor })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: {
    title?: string
    body?: string
    tags?: string[]
    image_url?: string
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const title = (body.title || "").trim()
  const text = (body.body || "").trim()
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim().toUpperCase()).filter((t) => t.length > 0 && t.length <= TAG_MAX_LEN).slice(0, MAX_TAGS)
    : []
  const imageUrl = (body.image_url && body.image_url.startsWith("https://")) ? body.image_url : null

  if (!title) return NextResponse.json({ error: "Título obrigatorio" }, { status: 400 })
  if (title.length > TITLE_MAX) return NextResponse.json({ error: `Título mayor a ${TITLE_MAX} chars` }, { status: 400 })
  if (!text) return NextResponse.json({ error: "Cuerpo obrigatorio" }, { status: 400 })
  if (text.length > BODY_MAX) return NextResponse.json({ error: `Cuerpo mayor a ${BODY_MAX} chars` }, { status: 400 })

  // Snapshot de identidade — segue padrão do episode_comments
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
  const authorAvatarUrl = (typeof meta.avatar_url === "string" && meta.avatar_url) || null
  const authorAvatarBorder = (typeof meta.avatar_border_color === "string" && meta.avatar_border_color) || null
  // Respeita a escolha do user em /perfil. Fallback: admin → admin_seal,
  // outros → welcome (insignia default que todo user tem).
  const chosenBadge = (typeof meta.featured_badge_id === "string" && meta.featured_badge_id) || null
  const authorBadgeId = chosenBadge || (isAdmin(user) ? "admin_seal" : "welcome")
  const authorStarId =
    (typeof meta.featured_star_id === "string" && meta.featured_star_id) || null
  const authorFlameId =
    (typeof meta.featured_flame_id === "string" && meta.featured_flame_id) || null

  const { data, error } = await supabase
    .from("forum_posts")
    .insert({
      user_id: user.id,
      author_name: authorName,
      author_username: authorUsername,
      author_avatar: authorAvatar,
      author_avatar_url: authorAvatarUrl,
      author_badge_id: authorBadgeId,
      author_star_id: authorStarId,
      author_flame_id: authorFlameId,
      author_avatar_border: authorAvatarBorder,
      author_is_admin: isAdmin(user),
      title,
      body: text,
      image_url: imageUrl,
      tags,
    })
    .select("id, user_id, author_name, author_username, author_avatar, author_avatar_url, author_badge_id, author_star_id, author_flame_id, author_avatar_border, author_is_admin, title, body, image_url, tags, likes_count, dislikes_count, replies_count, hot, created_at")
    .single()

  if (error) {
    console.error("[/api/forum/posts POST]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Detecta cruzamento de patente após criar post (não bloqueia resposta)
  maybeBroadcastRankUp(user).catch(() => {})

  return NextResponse.json({
    post: { ...data, liked_by_me: false, disliked_by_me: false },
  })
}
