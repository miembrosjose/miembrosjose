// API — toggle de like em post do fórum.
//
// POST /api/forum/posts/[id]/like
//   Idempotente: se user já curtiu → remove. Se não → adiciona.
//   Retorna { liked: boolean, likes_count: number }
//
// likes_count é mantido por trigger no Postgres (recompute_post_counts).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params
  if (!postId) return NextResponse.json({ error: "Invalid post id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // Confere se user já curtiu esse post
  const { data: existing } = await supabase
    .from("forum_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  let liked: boolean

  if (existing) {
    const { error: delErr } = await supabase
      .from("forum_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)
    if (delErr) {
      console.error("[/api/forum/posts/[id]/like DELETE]", delErr)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
    liked = false
  } else {
    // Mutual exclusion: remove dislike se user já tinha dado dislike
    await supabase
      .from("forum_dislikes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)

    const { error: insErr } = await supabase
      .from("forum_likes")
      .insert({ post_id: postId, user_id: user.id })
    if (insErr) {
      console.error("[/api/forum/posts/[id]/like INSERT]", insErr)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
    liked = true
  }

  // Lê counts atualizados (trigger já rodou)
  const { data: post } = await supabase
    .from("forum_posts")
    .select("likes_count, dislikes_count, hot")
    .eq("id", postId)
    .single()

  return NextResponse.json({
    liked,
    likes_count: post?.likes_count ?? 0,
    dislikes_count: post?.dislikes_count ?? 0,
    hot: post?.hot ?? false,
  })
}
