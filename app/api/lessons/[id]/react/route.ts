// POST /api/lessons/[id]/react
//   Body: { vote: 'like' | 'dislike' | null }
//   - like/dislike: insere ou atualiza voto. Toggle se já era o mesmo.
//   - null: remove voto (clicou no botão ativo).
//   Retorna { vote, likes_count, dislikes_count }
//
// Trigger SQL atualiza counters automaticamente em member_lessons.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { vote?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const vote = body.vote === "like" || body.vote === "dislike" ? body.vote : null
  const admin = getSupabaseAdmin()

  // Confirma que lesson existe + aprovada
  const { data: lesson } = await admin
    .from("member_lessons")
    .select("id, approved")
    .eq("id", lessonId)
    .maybeSingle()
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!lesson.approved) return NextResponse.json({ error: "Lesson not published yet" }, { status: 400 })

  // Estado atual
  const { data: existing } = await admin
    .from("member_lesson_likes")
    .select("vote")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle()

  let finalVote: "like" | "dislike" | null = null

  if (vote === null) {
    // Remove voto atual (se existe)
    if (existing) {
      await admin
        .from("member_lesson_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
    }
    finalVote = null
  } else if (existing && existing.vote === vote) {
    // Toggle: clicou no mesmo voto → remove
    await admin
      .from("member_lesson_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
    finalVote = null
  } else {
    // Insere ou atualiza
    await admin
      .from("member_lesson_likes")
      .upsert(
        { user_id: user.id, lesson_id: lessonId, vote },
        { onConflict: "user_id,lesson_id" },
      )
    finalVote = vote
  }

  // Lê counters atualizados (trigger já rodou)
  const { data: refreshed } = await admin
    .from("member_lessons")
    .select("likes_count, dislikes_count")
    .eq("id", lessonId)
    .maybeSingle()

  return NextResponse.json({
    vote: finalVote,
    likes_count: refreshed?.likes_count ?? 0,
    dislikes_count: refreshed?.dislikes_count ?? 0,
  })
}
