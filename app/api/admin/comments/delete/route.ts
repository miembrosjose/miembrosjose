// API — admin deleta qualquer comentário (de qualquer episódio, qualquer autor).
//
// POST /api/admin/comments/delete
//   Body: { id: string }
//
// Auth: user.app_metadata.is_admin === true. Usa service_role pra bypassar RLS
// (a policy normal só permite deletar comments do próprio user).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { id?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const id = body.id
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { error } = await admin.from("episode_comments").delete().eq("id", id)
  if (error) {
    console.error("[/api/admin/comments/delete]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
