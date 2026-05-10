// POST /api/dm/read
//
// Marca como lida todas as mensagens não lidas de uma thread (com user específico).
// Body: { with_user_id }
//
// Idempotente. Se nada estava unread, retorna { marked: 0 }.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { with_user_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const otherId = (body.with_user_id || "").trim()
  if (!otherId || otherId === user.id) {
    return NextResponse.json({ error: "Invalid with_user_id" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Marca todas as msgs não lidas dessa thread (onde EU sou recipient) como lidas
  const { data, error } = await admin
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .eq("sender_id", otherId)
    .is("read_at", null)
    .is("deleted_at", null)
    .select("id")

  if (error) {
    console.error("[/api/dm/read] update", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ marked: data?.length || 0 })
}
