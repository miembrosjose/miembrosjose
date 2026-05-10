// API — edição/deleção do próprio forum_post.
//
// PATCH /api/forum/posts/[id]   Body: { title?, body?, tags? }
//   Apenas autor (user_id == auth.uid()) pode editar. Admin tem rota separada.
//
// DELETE /api/forum/posts/[id]
//   Autor pode deletar próprio post. Admin pode deletar qualquer post.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const TITLE_MAX = 200
const BODY_MAX = 5000

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { title?: string; body?: string; tags?: string[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  // Admin edita sem deixar marca "(editado)" — pra correções silenciosas em
  // posts oficiais. ZERA edited_at se já tinha (ex: post foi editado antes).
  // Outros users sempre marcam edited_at.
  const updates: Record<string, unknown> = isAdmin(user)
    ? { edited_at: null }
    : { edited_at: new Date().toISOString() }
  if (typeof body.title === "string") {
    const t = body.title.trim()
    if (!t || t.length > TITLE_MAX) return NextResponse.json({ error: "Título inválido" }, { status: 400 })
    updates.title = t
  }
  if (typeof body.body === "string") {
    const b = body.body.trim()
    if (!b || b.length > BODY_MAX) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
    updates.body = b
  }
  if (Array.isArray(body.tags)) {
    updates.tags = body.tags.slice(0, 10).map(String)
  }

  // RLS já bloqueia user diferente do owner — mas filtra explícito por
  // segurança (se RLS estiver desabilitada no futuro)
  const { data, error } = await supabase
    .from("forum_posts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, body, tags, edited_at")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Forbidden or not found" }, { status: 403 })
  }
  return NextResponse.json({ post: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // Admin usa service_role pra bypassar RLS (qualquer post).
  // User comum filtra por user_id pra só deletar o próprio.
  if (isAdmin(user)) {
    const admin = getSupabaseAdmin()
    const { error } = await admin.from("forum_posts").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const { data, error } = await supabase
    .from("forum_posts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single()
  if (error || !data) return NextResponse.json({ error: "Forbidden or not found" }, { status: 403 })
  return NextResponse.json({ ok: true })
}
