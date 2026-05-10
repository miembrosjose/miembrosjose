// API — listagem e criação de funnels compartilhados pela comunidade.
//
// GET  /api/funnels             → lista paginada (mais recentes primeiro)
// POST /api/funnels             → cria { name, niche, url, image_url }

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const NAME_MAX = 80
const NICHE_MAX = 80
const URL_MAX = 500

// Throttle: máximo de funnels publicados por user em 30 dias
const MAX_FUNNELS_PER_30_DAYS = 2

// Blocklist de domínios suspeitos / encurtadores comuns
// (URL com host nessa lista é rejeitada — prevenção contra spam)
const BLOCKED_DOMAINS = new Set([
  "bit.ly", "tinyurl.com", "shorturl.at", "is.gd", "t.co", "ow.ly",
  "rb.gy", "cutt.ly", "rebrand.ly", "tiny.cc", "shorte.st",
  "linktr.ee", // permitir? linktree é comum em LATAM mas tbm vira spam fácil; deixei bloqueado por segurança
  "goo.gl", "buff.ly", "j.mp", "soo.gd", "v.gd",
])

function getDomain(urlStr: string): string | null {
  try {
    const u = new URL(urlStr)
    return u.hostname.toLowerCase().replace(/^www\./, "")
  } catch { return null }
}

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
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200)

  // Funnels visíveis: aprovados pra todos, OU não-aprovados se viewer = author OU admin
  const viewerIsAdmin = isAdmin(user)
  let query = supabase
    .from("user_funnels")
    .select("id, user_id, author_name, author_username, author_avatar, author_avatar_url, author_badge_id, author_star_id, author_flame_id, author_avatar_border, name, niche, url, image_url, likes_count, dislikes_count, feedbacks_count, created_at, approved")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (!viewerIsAdmin) {
    // Filtra: approved=true OU user_id=viewer (próprio author vê seus pendentes)
    query = query.or(`approved.eq.true,user_id.eq.${user.id}`)
  }
  const { data, error } = await query
  if (error) {
    console.error("[/api/funnels GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Pra cada funnel, marca se viewer já votou
  const ids = (data || []).map((f) => f.id)
  let voteMap = new Map<string, "like" | "dislike">()
  if (ids.length > 0) {
    const { data: votes } = await supabase
      .from("funnel_reactions")
      .select("funnel_id, vote")
      .eq("user_id", user.id)
      .in("funnel_id", ids)
    voteMap = new Map((votes || []).map((v) => [v.funnel_id, v.vote as "like" | "dislike"]))
  }
  const enriched = (data || []).map((f) => ({
    ...f,
    viewer_vote: voteMap.get(f.id) || null,
  }))

  return NextResponse.json({ funnels: enriched })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { name?: string; niche?: string; url?: string; image_url?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const name = (body.name || "").trim()
  const niche = (body.niche || "").trim()
  const url = (body.url || "").trim()
  const imageUrl = (body.image_url || "").trim()

  if (!name || name.length > NAME_MAX) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 })
  if (!niche || niche.length > NICHE_MAX) return NextResponse.json({ error: "Nicho inválido" }, { status: 400 })
  if (!url || url.length > URL_MAX) return NextResponse.json({ error: "URL inválida" }, { status: 400 })
  if (!imageUrl.startsWith("https://")) return NextResponse.json({ error: "Imagen requerida" }, { status: 400 })

  // Validação superficial de URL + blocklist
  let domain: string | null = null
  try { new URL(url) } catch { return NextResponse.json({ error: "URL no es una dirección válida" }, { status: 400 }) }
  domain = getDomain(url)
  if (!domain) return NextResponse.json({ error: "URL no válida" }, { status: 400 })
  if (BLOCKED_DOMAINS.has(domain)) {
    return NextResponse.json({
      error: `Dominio "${domain}" no permitido. Usa el link directo del funnel (no acortadores).`
    }, { status: 400 })
  }

  // Throttle: máx 2 funnels nos últimos 30 dias por user
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from("user_funnels")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo)
  if ((recentCount || 0) >= MAX_FUNNELS_PER_30_DAYS) {
    return NextResponse.json({
      error: `Máximo ${MAX_FUNNELS_PER_30_DAYS} funnels por mes. Esperá unas semanas pra compartir más.`
    }, { status: 429 })
  }

  const meta = (user.user_metadata || {}) as {
    full_name?: string
    name?: string
    avatar_url?: string
    username?: string
    featured_badge_id?: string | null
    featured_star_id?: string | null
    featured_flame_id?: string | null
    avatar_border_color?: string | null
  }
  const authorName = meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "Miembro")
  const authorUsername = (typeof meta.username === "string" && meta.username) || null
  const authorAvatar = buildAvatarLetters(authorName)
  const authorAvatarUrl = (typeof meta.avatar_url === "string" && meta.avatar_url) || null
  const authorAvatarBorder = (typeof meta.avatar_border_color === "string" && meta.avatar_border_color) || null
  // Respeita a escolha em /perfil. Fallback: admin → admin_seal, outros → welcome.
  const chosenBadge = (typeof meta.featured_badge_id === "string" && meta.featured_badge_id) || null
  const authorBadgeId = chosenBadge || (isAdmin(user) ? "admin_seal" : "welcome")
  const authorStarId =
    (typeof meta.featured_star_id === "string" && meta.featured_star_id) || null
  const authorFlameId =
    (typeof meta.featured_flame_id === "string" && meta.featured_flame_id) || null

  const { data, error } = await supabase
    .from("user_funnels")
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
      name,
      niche,
      url,
      image_url: imageUrl,
    })
    .select("id, user_id, author_name, author_username, author_avatar, author_avatar_url, author_badge_id, author_star_id, author_flame_id, author_avatar_border, name, niche, url, image_url, created_at")
    .single()

  if (error) {
    console.error("[/api/funnels POST]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ funnel: data })
}
