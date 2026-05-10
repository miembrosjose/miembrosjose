// API — marca notificação(s) como lidas.
//
// POST /api/notifications/mark-read
//   Body: { id: string } → marca uma específica
//        | { all: true }  → marca todas como lidas

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { id?: string; all?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const now = new Date().toISOString()
  let q = supabase.from("notifications").update({ read_at: now }).eq("user_id", user.id).is("read_at", null)
  if (body.id) q = q.eq("id", body.id)
  else if (!body.all) return NextResponse.json({ error: "id or all required" }, { status: 400 })

  const { error } = await q
  if (error) {
    console.error("[/api/notifications/mark-read]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
