// GET    /api/transmissions/[slug]/comments        → { comments: [...] } (recientes primero)
// POST   /api/transmissions/[slug]/comments         → body { body }; crea comentario
// DELETE /api/transmissions/[slug]/comments?id=xxx  → borra propio (o admin)
//
// Comentarios de miembros sobre una transmisión. RLS controla permisos; aquí
// snapshot de nombre/avatar del autor al momento de comentar (como feed_posts).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const MAX_LEN = 2000

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from("transmission_comments")
      .select("id, user_id, author_name, author_avatar, body, created_at")
      .eq("transmission_slug", slug)
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) return NextResponse.json({ comments: [], me: user.id })
    return NextResponse.json({ comments: data || [], me: user.id })
  } catch {
    return NextResponse.json({ comments: [], me: user.id })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let payload: { body?: string }
  try { payload = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const text = (payload.body || "").trim()
  if (!text) return NextResponse.json({ error: "Comentario vacío" }, { status: 400 })
  if (text.length > MAX_LEN) return NextResponse.json({ error: "Comentario demasiado largo" }, { status: 400 })

  const meta = (user.user_metadata || {}) as { full_name?: string; username?: string; avatar_url?: string }
  const authorName = meta.full_name || meta.username || (user.email ? user.email.split("@")[0] : "Miembro")
  const authorAvatar = typeof meta.avatar_url === "string" ? meta.avatar_url : null

  const { data, error } = await supabase
    .from("transmission_comments")
    .insert({
      transmission_slug: slug,
      user_id: user.id,
      author_name: authorName,
      author_avatar: authorAvatar,
      body: text,
    })
    .select("id, user_id, author_name, author_avatar, body, created_at")
    .single()
  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json({ comment: data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  await params // slug no se usa: el id identifica el comentario; RLS valida permiso
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  // RLS "delete own or admin" garantiza que solo se borre lo permitido.
  const { error } = await supabase.from("transmission_comments").delete().eq("id", id)
  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
