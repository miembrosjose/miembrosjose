// API admin — gestão de funnels (lista pendentes + aprovar/rejeitar).
//
// GET    /api/admin/funnels?status=pending|all     → lista (admin only)
// POST   /api/admin/funnels?id=xxx&action=approve  → aprova (trigger SQL broadcasta)
// DELETE /api/admin/funnels?id=xxx                  → rejeita (deleta o row)

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

  const status = (req.nextUrl.searchParams.get("status") || "pending").toLowerCase()
  const admin = getSupabaseAdmin()

  let query = admin
    .from("user_funnels")
    .select("id, user_id, author_name, author_username, author_avatar_url, name, niche, url, image_url, created_at, approved, approved_at")
    .order("created_at", { ascending: false })
    .limit(200)
  if (status === "pending") query = query.eq("approved", false)

  const { data, error } = await query
  if (error) {
    console.error("[/api/admin/funnels GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
  return NextResponse.json({ funnels: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const id = req.nextUrl.searchParams.get("id")
  const action = req.nextUrl.searchParams.get("action") || "approve"
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const admin = getSupabaseAdmin()
  if (action === "approve") {
    const { error } = await admin
      .from("user_funnels")
      .update({ approved: true, approved_by: user.id })
      .eq("id", id)
    if (error) {
      console.error("[/api/admin/funnels approve]", error)
      return NextResponse.json({ error: "Failed to approve" }, { status: 500 })
    }
    return NextResponse.json({ ok: true, action: "approved" })
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin.from("user_funnels").delete().eq("id", id)
  if (error) {
    console.error("[/api/admin/funnels DELETE]", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
  return NextResponse.json({ ok: true, action: "deleted" })
}
