// API admin — deleta qualquer post do fórum.
// Replies + likes são deletados em cascade (FK ON DELETE CASCADE).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin.from("forum_posts").delete().eq("id", id)
  if (error) {
    console.error("[/api/admin/forum/posts DELETE]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
