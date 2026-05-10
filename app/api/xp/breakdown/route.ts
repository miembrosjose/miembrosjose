// API — breakdown de XP do user agrupado por evento.
//
// GET /api/xp/breakdown
// Retorna { total_xp, by_event: [{ event_type, count, total_xp }], recent: [...] }

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"
import { ADMIN_TOTAL_XP } from "@/lib/xp"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data: events, error } = await supabase
    .from("xp_events")
    .select("event_type, xp_delta, level_delta, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    console.error("[/api/xp/breakdown]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  type Group = { event_type: string; count: number; total_xp: number; total_levels: number }
  const groups = new Map<string, Group>()
  let totalXp = 0
  let totalLevels = 0

  for (const e of events || []) {
    totalXp += e.xp_delta || 0
    totalLevels += e.level_delta || 0
    const g = groups.get(e.event_type) || { event_type: e.event_type, count: 0, total_xp: 0, total_levels: 0 }
    g.count += 1
    g.total_xp += e.xp_delta || 0
    g.total_levels += e.level_delta || 0
    groups.set(e.event_type, g)
  }

  const byEvent = Array.from(groups.values()).sort((a, b) =>
    (b.total_xp + b.total_levels * 100) - (a.total_xp + a.total_levels * 100)
  )

  const recent = (events || []).slice(0, 30)

  // Admin = figura simbólica fora do ranking; sobrescreve o total acumulado.
  // Mantém by_event/recent reais pra display histórico (se admin curiosamente
  // quiser ver de onde vieram os XP que ele de fato ganhou).
  const totalXpFinal = isAdmin(user) ? ADMIN_TOTAL_XP : totalXp

  return NextResponse.json({
    total_xp: totalXpFinal,
    total_levels: totalLevels,
    by_event: byEvent,
    recent,
  })
}
