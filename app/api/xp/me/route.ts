// API — XP/Level do user logado.
//
// GET /api/xp/me → { level, total_xp, percent, xp_in_level, xp_for_level, ... }

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { computeLevel, applyAdminLevelOverride } from "@/lib/xp"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data } = await supabase
    .from("user_xp")
    .select("total_xp, bonus_levels")
    .eq("user_id", user.id)
    .maybeSingle()

  const totalXp = data?.total_xp || 0
  const bonusLevels = data?.bonus_levels || 0
  const info = applyAdminLevelOverride(computeLevel(totalXp, bonusLevels), isAdmin(user))

  return NextResponse.json(info)
}
