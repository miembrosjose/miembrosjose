// API admin — gestão de reports (lista + resolver/descartar).
//
// GET    /api/admin/reports?status=pending|resolved|dismissed|all
// POST   /api/admin/reports?id=xxx&action=resolve|dismiss   (body opcional: { note })

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

type ReportRow = {
  id: string
  reporter_id: string
  target_type: string
  target_id: string
  target_user_id: string | null
  reason_category: string
  message: string
  target_snapshot: Record<string, unknown> | null
  status: string
  created_at: string
  resolved_at: string | null
  resolution_note: string | null
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const status = (req.nextUrl.searchParams.get("status") || "pending").toLowerCase()
  const admin = getSupabaseAdmin()

  let query = admin
    .from("user_reports")
    .select("id, reporter_id, target_type, target_id, target_user_id, reason_category, message, target_snapshot, status, created_at, resolved_at, resolution_note")
    .order("created_at", { ascending: false })
    .limit(300)

  if (status !== "all") query = query.eq("status", status)

  const { data, error } = await query
  if (error) {
    console.error("[/api/admin/reports GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const reports = (data || []) as ReportRow[]

  // Hidrata reporter + target_user com full_name/avatar via auth.admin
  const userIds = new Set<string>()
  reports.forEach((r) => {
    if (r.reporter_id) userIds.add(r.reporter_id)
    if (r.target_user_id) userIds.add(r.target_user_id)
  })
  const userMetaMap = new Map<string, { full_name: string; avatar_url: string | null }>()
  for (const id of userIds) {
    try {
      const { data: u } = await admin.auth.admin.getUserById(id)
      const meta = (u?.user?.user_metadata || {}) as { full_name?: string; avatar_url?: string }
      userMetaMap.set(id, {
        full_name: meta.full_name || (u?.user?.email ? u.user.email.split("@")[0] : "Miembro"),
        avatar_url: typeof meta.avatar_url === "string" && meta.avatar_url ? meta.avatar_url : null,
      })
    } catch {}
  }

  const enriched = reports.map((r) => ({
    ...r,
    reporter: userMetaMap.get(r.reporter_id) || null,
    target_user: r.target_user_id ? userMetaMap.get(r.target_user_id) || null : null,
  }))

  return NextResponse.json({ reports: enriched })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const id = req.nextUrl.searchParams.get("id")
  const action = (req.nextUrl.searchParams.get("action") || "").toLowerCase()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  if (action !== "resolve" && action !== "dismiss") {
    return NextResponse.json({ error: "action must be resolve or dismiss" }, { status: 400 })
  }

  let body: { note?: string } = {}
  try { body = await req.json() } catch {}

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from("user_reports")
    .update({
      status: action === "resolve" ? "resolved" : "dismissed",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      resolution_note: body.note || null,
    })
    .eq("id", id)

  if (error) {
    console.error("[/api/admin/reports POST]", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
  return NextResponse.json({ ok: true, status: action === "resolve" ? "resolved" : "dismissed" })
}
