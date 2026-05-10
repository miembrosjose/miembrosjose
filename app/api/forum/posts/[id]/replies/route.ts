// API — listagem e criação de respostas a um post do fórum.
//
// GET  /api/forum/posts/[id]/replies      → lista de respostas, ordem cronológica
// POST /api/forum/posts/[id]/replies      → cria reply { body }

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { maybeBroadcastRankUp } from "@/lib/rank-broadcast"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const BODY_MAX = 2000

function buildAvatarLetters(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "??"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Invalid post id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data, error } = await supabase
    .from("forum_replies")
    .select("id, user_id, author_name, author_username, author_avatar, author_avatar_url, author_badge_id, author_star_id, author_flame_id, author_avatar_border, author_is_admin, body, created_at, edited_at, likes_count, dislikes_count")
    .eq("post_id", id)
    .order("created_at", { ascending: true })
    .limit(200)

  if (error) {
    console.error("[/api/forum/posts/[id]/replies GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Batch: descobre quais replies o user curtiu E quais deu dislike (2 queries)
  const replyIds = (data || []).map((r) => r.id)
  let likedSet = new Set<string>()
  let dislikedSet = new Set<string>()
  if (replyIds.length > 0) {
    const [{ data: likes }, { data: dislikes }] = await Promise.all([
      supabase
        .from("forum_reply_likes")
        .select("reply_id")
        .eq("user_id", user.id)
        .in("reply_id", replyIds),
      supabase
        .from("forum_reply_dislikes")
        .select("reply_id")
        .eq("user_id", user.id)
        .in("reply_id", replyIds),
    ])
    likedSet = new Set((likes || []).map((l) => l.reply_id))
    dislikedSet = new Set((dislikes || []).map((l) => l.reply_id))
  }

  const replies = (data || []).map((r) => ({
    ...r,
    liked_by_me: likedSet.has(r.id),
    disliked_by_me: dislikedSet.has(r.id),
  }))

  return NextResponse.json({ replies })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Invalid post id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { body?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const text = (body.body || "").trim()
  if (!text) return NextResponse.json({ error: "Cuerpo obrigatorio" }, { status: 400 })
  if (text.length > BODY_MAX) return NextResponse.json({ error: `Cuerpo mayor a ${BODY_MAX} chars` }, { status: 400 })

  // Verifica que post existe e pega tags (auto-grant bono)
  const { data: post } = await supabase.from("forum_posts").select("id, tags").eq("id", id).limit(1).single()
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

  const meta = (user.user_metadata || {}) as {
    full_name?: string
    name?: string
    avatar_url?: string
    featured_badge_id?: string | null
    featured_star_id?: string | null
    featured_flame_id?: string | null
    avatar_border_color?: string | null
  }
  const authorName = meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "Miembro")
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
    .from("forum_replies")
    .insert({
      post_id: id,
      user_id: user.id,
      author_name: authorName,
      author_avatar: authorAvatar,
      author_avatar_url: authorAvatarUrl,
      author_badge_id: authorBadgeId,
      author_star_id: authorStarId,
      author_flame_id: authorFlameId,
      author_avatar_border: authorAvatarBorder,
      author_is_admin: isAdmin(user),
      body: text,
    })
    .select("id, user_id, author_name, author_avatar, author_avatar_url, author_badge_id, author_star_id, author_flame_id, author_avatar_border, author_is_admin, body, created_at")
    .single()

  if (error) {
    console.error("[/api/forum/posts/[id]/replies POST]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Detecta cruzamento de patente após reply (não bloqueia resposta)
  maybeBroadcastRankUp(user).catch(() => {})

  // Auto-grant bonus-ganchos quando o post tem tag "bono".
  // SÍNCRONO (await) — em edge runtime fire-and-forget IIFE é abortada
  // antes de completar quando o handler retorna a resposta.
  const postTags: string[] = Array.isArray((post as { tags?: unknown }).tags) ? (post as { tags: string[] }).tags : []
  const hasBono = postTags.some((t) => t.toLowerCase() === "bono")
  // bonoGranted: true SE acabamos de criar o stripe_sale agora (1ª vez).
  // Front-end usa isso pra disparar refetch do owned-products + toast da insignia.
  let bonoGranted = false
  if (hasBono && user.email) {
    try {
      const adminClient = getSupabaseAdmin()
      const userEmailLower = user.email.toLowerCase()
      // Checa por user_id E email (case-insensitive) — mais robusto que só email exato
      const { data: existing, error: existingErr } = await adminClient
        .from("stripe_sales")
        .select("id")
        .or(`user_id.eq.${user.id},customer_email.ilike.${userEmailLower}`)
        .filter("items", "cs", '[{"key":"bonus-ganchos"}]')
        .limit(1)
      if (existingErr) {
        console.error("[bono-grant] check existing failed:", existingErr.message, "user:", userEmailLower)
      }
      if (!existing?.length) {
        const fakePiId = `auto_bono_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        const { error: insertErr } = await adminClient.from("stripe_sales").insert({
          stripe_session_id: null,
          stripe_payment_intent_id: fakePiId,
          stripe_customer_id: null,
          sale_type: "manual",
          region: "AUTO_BONO",
          items: [{ key: "bonus-ganchos", name: "Bonus 1", price: 0, qty: 1 }],
          amount_total: 0,
          currency: "usd",
          customer_email: userEmailLower,
          customer_name: null,
          customer_phone: null,
          customer_country: null,
          utm: { source: "bono_comment", post_id: id },
          status: "paid",
          user_id: user.id,
        })
        if (insertErr) {
          console.error("[bono-grant] insert failed:", insertErr.message, "user:", userEmailLower)
        } else {
          console.log("[bono-grant] granted bonus-ganchos to:", userEmailLower)
          bonoGranted = true
        }
      }
    } catch (e) {
      console.error("[bono-grant] unexpected error:", e instanceof Error ? e.message : e)
    }
  }

  return NextResponse.json({ reply: data, bono_granted: bonoGranted })
}
