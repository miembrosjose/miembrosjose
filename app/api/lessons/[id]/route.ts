// GET    /api/lessons/[id]      — detalhe (incrementa views_count)
// DELETE /api/lessons/[id]      — apaga (próprio user ou admin)

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: lesson, error } = await admin
    .from("member_lessons")
    .select("id, user_id, title, description, video_url, tags, likes_count, dislikes_count, views_count, approved, created_at")
    .eq("id", id)
    .maybeSingle()

  if (error || !lesson) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Visibilidade: aprovada (qualquer um vê) ou própria/admin (não-aprovada)
  const canSee = lesson.approved || lesson.user_id === user.id || isAdmin(user)
  if (!canSee) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Incrementa views (best-effort, ignora erro)
  if (lesson.user_id !== user.id) {
    admin
      .from("member_lessons")
      .update({ views_count: (lesson.views_count || 0) + 1 })
      .eq("id", id)
      .then(() => {})
  }

  // Viewer vote
  const { data: voteRow } = await admin
    .from("member_lesson_likes")
    .select("vote")
    .eq("user_id", user.id)
    .eq("lesson_id", id)
    .maybeSingle()

  const viewerVote = voteRow?.vote === "like" || voteRow?.vote === "dislike" ? voteRow.vote : null

  return NextResponse.json({
    lesson: { ...lesson, viewer_vote: viewerVote },
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: lesson } = await admin
    .from("member_lessons")
    .select("user_id")
    .eq("id", id)
    .maybeSingle()

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (lesson.user_id !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await admin.from("member_lessons").delete().eq("id", id)
  if (error) {
    console.error("[/api/lessons DELETE]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
