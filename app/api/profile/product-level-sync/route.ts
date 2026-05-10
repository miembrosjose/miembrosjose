// Concede retroativamente +1 level por insignia de produto desbloqueada
// que ainda não tem um evento product_level_grant em xp_events.
//
// Cenário: usuários que compraram antes de a feature de level existir já
// têm achievements em user_unlocked_achievements mas nunca receberam o level.
// Esse endpoint preenche o gap de forma idempotente.
//
// POST /api/profile/product-level-sync
//   → { levels_granted: number }

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { ACHIEVEMENTS } from "@/lib/achievements"

export const dynamic = "force-dynamic"

const PRODUCT_ACHIEVEMENT_IDS = ACHIEVEMENTS
  .filter((a) => a.category === "products")
  .map((a) => a.id)

export async function POST(_req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const admin = getSupabaseAdmin()

  // Achievements de produto confirmados no servidor
  const { data: unlocked } = await admin
    .from("user_unlocked_achievements")
    .select("achievement_id")
    .eq("user_id", user.id)
    .in("achievement_id", PRODUCT_ACHIEVEMENT_IDS)

  if (!unlocked || unlocked.length === 0) {
    return NextResponse.json({ levels_granted: 0 })
  }

  const unlockedIds = unlocked.map((r) => r.achievement_id as string)

  // Quais já têm product_level_grant?
  const { data: existing } = await admin
    .from("xp_events")
    .select("source_id")
    .eq("user_id", user.id)
    .eq("event_type", "product_level_grant")
    .in("source_id", unlockedIds)

  const alreadyGranted = new Set((existing || []).map((r) => r.source_id as string))
  const missing = unlockedIds.filter((id) => !alreadyGranted.has(id))

  if (missing.length === 0) {
    return NextResponse.json({ levels_granted: 0 })
  }

  let granted = 0
  for (const id of missing) {
    const { error } = await admin.rpc("apply_xp_delta", {
      p_user_id: user.id,
      p_event_type: "product_level_grant",
      p_xp_delta: 0,
      p_level_delta: 1,
      p_source_table: "achievements",
      p_source_id: id,
    })
    if (!error) granted++
  }

  return NextResponse.json({ levels_granted: granted })
}
