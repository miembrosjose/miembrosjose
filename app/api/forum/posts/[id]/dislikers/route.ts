// API — lista de users que deram dislike num post do fórum.
// GET /api/forum/posts/[id]/dislikers → { likers: [{ user_id, name, avatar_url }] }
// Mantém shape "likers" pra LikersHoverCard ser reutilizado sem modificação.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const LIMIT = 50

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params
  if (!postId) return NextResponse.json({ error: "Invalid post id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data: rows, error } = await supabase
    .from("forum_dislikes")
    .select("user_id, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(LIMIT)

  if (error) {
    console.error("[/api/forum/posts/[id]/dislikers]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const userIds = (rows || []).map((r) => r.user_id)
  if (userIds.length === 0) return NextResponse.json({ likers: [] })

  const admin = getSupabaseAdmin()
  const likers = await Promise.all(
    userIds.map(async (uid) => {
      try {
        const { data } = await admin.auth.admin.getUserById(uid)
        const u = data?.user
        if (!u) return { user_id: uid, name: "Miembro", avatar_url: null as string | null }
        const meta = (u.user_metadata || {}) as { full_name?: string; name?: string; avatar_url?: string }
        const name = meta.full_name || meta.name || (u.email ? u.email.split("@")[0] : "Miembro")
        const avatar_url = (typeof meta.avatar_url === "string" && meta.avatar_url) || null
        return { user_id: uid, name, avatar_url }
      } catch {
        return { user_id: uid, name: "Miembro", avatar_url: null as string | null }
      }
    })
  )

  return NextResponse.json({ likers })
}
