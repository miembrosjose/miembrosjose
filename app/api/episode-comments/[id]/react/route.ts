// API — like/dislike em comentário de aula.
//
// POST /api/episode-comments/[id]/react
//   Body: { vote: 'like' | 'dislike' | null }
//   Toggle se ja era o mesmo voto. Null remove.
//   Retorna { vote, likes_count, dislikes_count }

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params
  if (!commentId) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { vote?: string | null }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const vote = body.vote === "like" || body.vote === "dislike" ? body.vote : null

  const { data: existing } = await supabase
    .from("episode_comment_reactions")
    .select("vote")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle()

  let finalVote: "like" | "dislike" | null = null
  if (vote === null) {
    if (existing) await supabase.from("episode_comment_reactions").delete().eq("comment_id", commentId).eq("user_id", user.id)
    finalVote = null
  } else if (existing && existing.vote === vote) {
    await supabase.from("episode_comment_reactions").delete().eq("comment_id", commentId).eq("user_id", user.id)
    finalVote = null
  } else {
    await supabase.from("episode_comment_reactions").upsert(
      { comment_id: commentId, user_id: user.id, vote },
      { onConflict: "comment_id,user_id" }
    )
    finalVote = vote
  }

  const { data: c } = await supabase.from("episode_comments").select("likes_count, dislikes_count").eq("id", commentId).maybeSingle()

  return NextResponse.json({
    vote: finalVote,
    likes_count: c?.likes_count ?? 0,
    dislikes_count: c?.dislikes_count ?? 0,
  })
}
