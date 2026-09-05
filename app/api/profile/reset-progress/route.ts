// POST /api/profile/reset-progress
// Borra el avance del PROPIO usuario en el servidor. Lo llama el cliente cuando
// detecta un reset pedido por admin (metadata progress_reset_at), como red de
// seguridad contra la re-subida por sincronización. Usa service role para
// evitar problemas de RLS, pero solo sobre el user autenticado.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TABLES = ["user_episode_progress", "user_meditation_progress", "user_unlocked_achievements", "user_xp"]

export async function POST() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const admin = getSupabaseAdmin()
  for (const t of TABLES) {
    await admin.from(t).delete().eq("user_id", user.id)
  }
  return NextResponse.json({ ok: true })
}
