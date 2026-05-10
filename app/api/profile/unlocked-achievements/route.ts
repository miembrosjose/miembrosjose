// API — lista de insignias desbloqueadas pelo user (sincroniza entre devices).
//
// GET /api/profile/unlocked-achievements
//   Retorna [{ achievement_id, unlocked_at }] do user logado
//
// POST não fica aqui — o client chama /api/profile/insignia-unlocked
// que registra XP + grava em user_unlocked_achievements numa só chamada.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data, error } = await supabase
    .from("user_unlocked_achievements")
    .select("achievement_id, unlocked_at")
    .eq("user_id", user.id)
    .order("unlocked_at", { ascending: true })

  if (error) {
    console.error("[/api/profile/unlocked-achievements GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ unlocked: data || [] })
}
