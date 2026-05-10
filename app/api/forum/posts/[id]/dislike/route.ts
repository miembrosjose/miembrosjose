// API — toggle de dislike em post do fórum.
//
// POST /api/forum/posts/[id]/dislike
//   Idempotente: se user já deu dislike → remove. Se não → adiciona.
//   Mutual exclusion: ao adicionar dislike, remove like se existir
//   (mesmo user não pode curtir e dislike simultaneamente).
//
// dislikes_count mantido por trigger no Postgres (recompute_post_dislikes_count).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params
  if (!postId) return NextResponse.json({ error: "Invalid post id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data: existing } = await supabase
    .from("forum_dislikes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  let disliked: boolean

  if (existing) {
    const { error: delErr } = await supabase
      .from("forum_dislikes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)
    if (delErr) {
      console.error("[/api/forum/posts/[id]/dislike DELETE]", delErr)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
    disliked = false
  } else {
    // Mutual exclusion: remove like se user já curtiu
    await supabase
      .from("forum_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)

    const { error: insErr } = await supabase
      .from("forum_dislikes")
      .insert({ post_id: postId, user_id: user.id })
    if (insErr) {
      console.error("[/api/forum/posts/[id]/dislike INSERT]", insErr)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
    disliked = true
  }

  // Lê os 2 contadores frescos pra response (UI usa pra reconciliar optimistic)
  const { data: post } = await supabase
    .from("forum_posts")
    .select("likes_count, dislikes_count")
    .eq("id", postId)
    .maybeSingle()

  return NextResponse.json({
    disliked,
    likes_count: post?.likes_count ?? 0,
    dislikes_count: post?.dislikes_count ?? 0,
  })
}
