// API — lista followers ou following de um user.
//
// GET /api/users/[id]/follows?type=followers   → quem segue esse user
// GET /api/users/[id]/follows?type=following   → quem esse user segue
//
// Retorna: { type, total, users: [{ id, full_name, username, avatar_url, followed_at }] }
// Auth: qualquer authenticated.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 100

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params
  if (!userId) return NextResponse.json({ error: "Invalid user id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user: viewer } } = await supabase.auth.getUser()
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const type = (req.nextUrl.searchParams.get("type") || "followers").toLowerCase()
  if (type !== "followers" && type !== "following") {
    return NextResponse.json({ error: "type must be 'followers' or 'following'" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Busca user_follows na coluna apropriada
  const { data: rows, error: followsErr } = type === "followers"
    ? await admin.from("user_follows").select("follower_id, created_at").eq("followed_id", userId).order("created_at", { ascending: false }).limit(PAGE_SIZE)
    : await admin.from("user_follows").select("followed_id, created_at").eq("follower_id", userId).order("created_at", { ascending: false }).limit(PAGE_SIZE)

  if (followsErr) {
    console.error("[/api/users/[id]/follows]", followsErr)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const ids = (rows || []).map((r) => (type === "followers" ? (r as { follower_id: string }).follower_id : (r as { followed_id: string }).followed_id))
  const dateById: Record<string, string> = {}
  ;(rows || []).forEach((r) => {
    const id = type === "followers" ? (r as { follower_id: string }).follower_id : (r as { followed_id: string }).followed_id
    dateById[id] = (r as { created_at: string }).created_at
  })

  if (ids.length === 0) {
    return NextResponse.json({ type, total: 0, users: [] })
  }

  // Busca dados básicos via auth.users
  const { data: usersRows } = await admin
    .schema("auth" as "public")
    .from("users")
    .select("id, raw_user_meta_data")
    .in("id", ids)

  const usersMap = new Map<string, { id: string; raw_user_meta_data: Record<string, unknown> }>()
  ;(usersRows || []).forEach((u) => usersMap.set((u as { id: string }).id, u as { id: string; raw_user_meta_data: Record<string, unknown> }))

  // Mantém ordem original dos follows (mais recente primeiro)
  const users = ids.map((id) => {
    const u = usersMap.get(id)
    const meta = (u?.raw_user_meta_data || {}) as { full_name?: string; username?: string; avatar_url?: string }
    return {
      id,
      full_name: meta.full_name || "Miembro",
      username: meta.username || null,
      avatar_url: meta.avatar_url || null,
      followed_at: dateById[id] || null,
    }
  })

  return NextResponse.json({ type, total: users.length, users })
}
