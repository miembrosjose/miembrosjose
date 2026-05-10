// GET /api/dm/messages?with=<userId>&before=<timestamp>
//
// Retorna mensagens da thread entre o user atual e <userId>, mais novas primeiro.
// `before`: timestamp ISO opcional pra paginação (msgs anteriores a esse).
// Limite 50 por página.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const otherId = req.nextUrl.searchParams.get("with") || ""
  const before = req.nextUrl.searchParams.get("before") || ""

  if (!otherId || otherId === user.id) {
    return NextResponse.json({ error: "Invalid 'with' param" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  let query = admin
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, media_url, media_type, created_at, read_at, edited_at")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),` +
        `and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)

  if (before) {
    query = query.lt("created_at", before)
  }

  const { data, error } = await query

  if (error) {
    console.error("[/api/dm/messages] query", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({
    messages: data || [],
    has_more: (data?.length || 0) === PAGE_SIZE,
  })
}
