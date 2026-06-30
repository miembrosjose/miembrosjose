// API admin — criar / deletar posts do feed.
//
// POST /api/admin/feed-posts
//   Body: { title, body, type_key, type_emoji, type_label, pinned? }
//   Cria post do creador no feed. Só admin.
//
// DELETE /api/admin/feed-posts?id=...
//   Deleta post. Só admin.
//
// (Listagem é via /api/feed-posts — público autenticado.)

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

function buildAvatarLetters(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "M"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: {
    title?: string
    body?: string
    type_key?: string
    type_emoji?: string
    type_label?: string
    pinned?: boolean
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const title = (body.title || "").trim()
  const text = (body.body || "").trim()
  const typeKey = (body.type_key || "custom").trim().slice(0, 40)
  const typeEmoji = (body.type_emoji || "").trim().slice(0, 8)
  const typeLabel = (body.type_label || "").trim().slice(0, 40)
  const pinned = body.pinned === true

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 })
  if (title.length > 200) return NextResponse.json({ error: "Title too long" }, { status: 400 })
  if (!text) return NextResponse.json({ error: "Body required" }, { status: 400 })
  if (text.length > 5000) return NextResponse.json({ error: "Body too long" }, { status: 400 })

  const meta = (user.user_metadata || {}) as { full_name?: string; name?: string; avatar_url?: string }
  const authorName = meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "Creador")
  const authorAvatar = (typeof meta.avatar_url === "string" && meta.avatar_url) || buildAvatarLetters(authorName)

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from("feed_posts")
    .insert({
      author_id: user.id,
      author_name: authorName,
      author_avatar: authorAvatar,
      type_emoji: typeEmoji,
      type_label: typeLabel,
      type_key: typeKey,
      title,
      body: text,
      pinned,
      reactions: [],
    })
    .select("*")
    .single()

  if (error) {
    console.error("[/api/admin/feed-posts POST]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ post: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin.from("feed_posts").delete().eq("id", id)
  if (error) {
    console.error("[/api/admin/feed-posts DELETE]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
