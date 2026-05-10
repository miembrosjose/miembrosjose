// API — seguir/desseguir um user.
//
// POST /api/users/[id]/follow
//   Toggle: se já segue → unfollow. Senão → follow.
//   Retorna { following: boolean }
//
// Quando segue, futuros forum_posts desse user disparam notification (trigger SQL).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetId } = await params
  if (!targetId) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (user.id === targetId) return NextResponse.json({ error: "Can't follow self" }, { status: 400 })

  const { data: existing } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followed_id", targetId)
    .limit(1)
    .maybeSingle()

  let following: boolean
  if (existing) {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followed_id", targetId)
    if (error) {
      console.error("[/api/users/[id]/follow DELETE]", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
    following = false
  } else {
    const { error } = await supabase
      .from("user_follows")
      .insert({ follower_id: user.id, followed_id: targetId })
    if (error) {
      console.error("[/api/users/[id]/follow INSERT]", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
    following = true
  }

  return NextResponse.json({ following })
}
