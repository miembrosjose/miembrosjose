// API — toggle de dislike em reply do fórum.
// Idempotente + mutual exclusion (remove like se user já curtiu).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: replyId } = await params
  if (!replyId) return NextResponse.json({ error: "Invalid reply id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data: existing } = await supabase
    .from("forum_reply_dislikes")
    .select("reply_id")
    .eq("reply_id", replyId)
    .eq("user_id", user.id)
    .maybeSingle()

  let disliked: boolean
  if (existing) {
    await supabase
      .from("forum_reply_dislikes")
      .delete()
      .eq("reply_id", replyId)
      .eq("user_id", user.id)
    disliked = false
  } else {
    // Mutual exclusion: remove like se existir
    await supabase
      .from("forum_reply_likes")
      .delete()
      .eq("reply_id", replyId)
      .eq("user_id", user.id)

    const { error } = await supabase
      .from("forum_reply_dislikes")
      .insert({ reply_id: replyId, user_id: user.id })
    if (error) {
      console.error("[/api/forum/replies/[id]/dislike]", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
    disliked = true
  }

  const { data: r } = await supabase
    .from("forum_replies")
    .select("likes_count, dislikes_count")
    .eq("id", replyId)
    .maybeSingle()

  return NextResponse.json({
    disliked,
    likes_count: r?.likes_count ?? 0,
    dislikes_count: r?.dislikes_count ?? 0,
  })
}
