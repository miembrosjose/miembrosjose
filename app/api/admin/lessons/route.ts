// GET /api/admin/lessons?status=pending|approved|rejected — admin tab
// POST /api/admin/lessons/[id]/approve|reject

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const status = req.nextUrl.searchParams.get("status") || "pending"
  const admin = getSupabaseAdmin()

  let q = admin
    .from("member_lessons")
    .select("id, user_id, title, description, video_url, tags, approved, approved_at, rejected_at, rejected_reason, likes_count, views_count, created_at")
    .order("created_at", { ascending: status === "pending" })

  if (status === "pending") q = q.eq("approved", false).is("rejected_at", null)
  else if (status === "approved") q = q.eq("approved", true)
  else if (status === "rejected") q = q.not("rejected_at", "is", null)

  const { data, error } = await q.limit(200)
  if (error) {
    console.error("[/api/admin/lessons GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Enriquece com autor
  const userIds = Array.from(new Set((data || []).map((l) => l.user_id)))
  const userMap: Record<string, { full_name: string; username: string | null; avatar_url: string | null }> = {}
  if (userIds.length > 0) {
    try {
      const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      for (const u of listed?.users || []) {
        if (!userIds.includes(u.id)) continue
        const meta = (u.user_metadata || {}) as { full_name?: string; name?: string; username?: string; avatar_url?: string }
        userMap[u.id] = {
          full_name: meta.full_name || meta.name || u.email?.split("@")[0] || "Miembro",
          username: meta.username || null,
          avatar_url: meta.avatar_url || null,
        }
      }
    } catch {
      // ignora
    }
  }

  return NextResponse.json({
    lessons: (data || []).map((l) => ({
      ...l,
      author: userMap[l.user_id] || { full_name: "Miembro", username: null, avatar_url: null },
    })),
  })
}
