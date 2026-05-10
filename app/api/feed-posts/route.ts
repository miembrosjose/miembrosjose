// API pública (autenticada) — lista posts do feed.
// Usada pelo prototipo HTML pra renderizar a aba Feed.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // pinned primeiro, depois mais recentes
  const { data, error } = await supabase
    .from("feed_posts")
    .select("id, author_name, author_avatar, type_emoji, type_label, type_key, title, body, pinned, reactions, created_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[/api/feed-posts]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ posts: data || [] })
}
