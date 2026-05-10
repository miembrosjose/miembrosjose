// POST   /api/admin/lessons/[id] — body: { action: 'approve' | 'reject', reason? }
// DELETE /api/admin/lessons/[id] — apaga (delegate pro endpoint principal)

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { action?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const action = body.action
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action (approve | reject)" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  if (action === "approve") {
    const { error } = await admin
      .from("member_lessons")
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        rejected_at: null,
        rejected_reason: null,
      })
      .eq("id", id)
    if (error) {
      console.error("[/api/admin/lessons approve]", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
    return NextResponse.json({ ok: true, approved: true })
  }

  // reject
  const { error } = await admin
    .from("member_lessons")
    .update({
      approved: false,
      rejected_at: new Date().toISOString(),
      rejected_reason: (body.reason || "").trim() || null,
    })
    .eq("id", id)
  if (error) {
    console.error("[/api/admin/lessons reject]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
  return NextResponse.json({ ok: true, rejected: true })
}
