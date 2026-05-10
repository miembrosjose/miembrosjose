// POST  /api/dm/block — bloqueia user
// DELETE /api/dm/block?user_id=<id> — desbloqueia
// GET    /api/dm/block — lista users bloqueados pelo current user

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { user_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const targetId = (body.user_id || "").trim()
  if (!targetId || targetId === user.id) {
    return NextResponse.json({ error: "Invalid user_id" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Idempotente — INSERT com onConflict ignora duplicado
  const { error } = await admin
    .from("direct_message_blocks")
    .upsert(
      { blocker_id: user.id, blocked_id: targetId },
      { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true },
    )

  if (error) {
    console.error("[/api/dm/block POST]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ blocked: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const targetId = (req.nextUrl.searchParams.get("user_id") || "").trim()
  if (!targetId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from("direct_message_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId)

  if (error) {
    console.error("[/api/dm/block DELETE]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ blocked: false })
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from("direct_message_blocks")
    .select("blocked_id, created_at")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[/api/dm/block GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ blocked_ids: (data || []).map((r) => r.blocked_id) })
}
