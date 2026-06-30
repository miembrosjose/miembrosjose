// API — likes acumulados na série principal "Los 144000 Entrenamiento".
//
// GET  /api/series/likes  → { count, liked_by_me }
// POST /api/series/likes  → toggle (idempotente). Retorna { liked, count }
//
// Tabela series_likes (PRIMARY KEY = user_id) garante 1 like por user.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const [{ count }, { data: mine }] = await Promise.all([
    supabase.from("series_likes").select("user_id", { count: "exact", head: true }),
    supabase.from("series_likes").select("user_id").eq("user_id", user.id).maybeSingle(),
  ])

  return NextResponse.json({
    count: count ?? 0,
    liked_by_me: !!mine,
  })
}

export async function POST(_req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data: existing } = await supabase
    .from("series_likes")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  let liked: boolean
  if (existing) {
    const { error } = await supabase.from("series_likes").delete().eq("user_id", user.id)
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 })
    liked = false
  } else {
    const { error } = await supabase.from("series_likes").insert({ user_id: user.id })
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 })
    liked = true
  }

  const { count } = await supabase
    .from("series_likes")
    .select("user_id", { count: "exact", head: true })

  return NextResponse.json({ liked, count: count ?? 0 })
}
