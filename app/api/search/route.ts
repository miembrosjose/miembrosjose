// API — busca global na area de membros.
//
// GET /api/search?q=<query>
//   Retorna ate 5 resultados de cada categoria:
//     - forum_posts: title/body matching
//     - forum_replies: body matching (com title do post pai)
//     - feed_posts: title/body matching
//     - user_funnels: name/niche matching
//
// Auth: qualquer authenticated.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const PER_CATEGORY = 5

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const q = (new URL(req.url).searchParams.get("q") || "").trim()
  if (!q || q.length < 2) {
    return NextResponse.json({
      forum_posts: [], forum_replies: [], feed_posts: [], funnels: [],
    })
  }

  // Pattern pra ILIKE — escape apenas %, _ e \ que são especiais
  const pattern = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`

  const [forumPostsRes, forumRepliesRes, feedPostsRes, funnelsRes] = await Promise.all([
    supabase
      .from("forum_posts")
      .select("id, user_id, author_name, author_username, author_avatar_url, title, body, tags, created_at")
      .or(`title.ilike.${pattern},body.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(PER_CATEGORY),
    supabase
      .from("forum_replies")
      .select("id, post_id, user_id, author_name, author_username, author_avatar_url, body, created_at")
      .ilike("body", pattern)
      .order("created_at", { ascending: false })
      .limit(PER_CATEGORY),
    supabase
      .from("feed_posts")
      .select("id, author_name, type_emoji, type_label, title, body, created_at")
      .or(`title.ilike.${pattern},body.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(PER_CATEGORY),
    supabase
      .from("user_funnels")
      .select("id, user_id, author_name, name, niche, url, image_url, created_at")
      .or(`name.ilike.${pattern},niche.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(PER_CATEGORY)
      .then((r) => r, () => ({ data: [], error: null })), // funnels pode não existir ainda
  ])

  return NextResponse.json({
    forum_posts: forumPostsRes.data || [],
    forum_replies: forumRepliesRes.data || [],
    feed_posts: feedPostsRes.data || [],
    funnels: funnelsRes.data || [],
  })
}
