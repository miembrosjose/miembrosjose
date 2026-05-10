// API — edição/deleção do próprio forum_reply.
// PATCH /api/forum/replies/[id]   Body: { body }
// DELETE /api/forum/replies/[id]  — autor ou admin

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const BODY_MAX = 2000

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { body?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const text = (body.body || "").trim()
  if (!text || text.length > BODY_MAX) return NextResponse.json({ error: "Texto inválido" }, { status: 400 })

  // Admin edita sem deixar marca "(editado)" — ZERA se já tinha.
  const updates: Record<string, unknown> = { body: text }
  updates.edited_at = isAdmin(user) ? null : new Date().toISOString()

  const { data, error } = await supabase
    .from("forum_replies")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, body, edited_at")
    .single()

  if (error || !data) return NextResponse.json({ error: "Forbidden or not found" }, { status: 403 })
  return NextResponse.json({ reply: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  if (isAdmin(user)) {
    const admin = getSupabaseAdmin()
    const { error } = await admin.from("forum_replies").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const { data, error } = await supabase
    .from("forum_replies")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single()
  if (error || !data) return NextResponse.json({ error: "Forbidden or not found" }, { status: 403 })
  return NextResponse.json({ ok: true })
}
