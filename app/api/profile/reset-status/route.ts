// GET /api/profile/reset-status
// Devuelve la marca de reinicio de avance (progress_reset_at) del usuario
// autenticado, leída FRESCA del servidor (no del JWT del cliente, que puede
// estar desactualizado tras un cambio de metadata por admin).

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  let resetAt = ""
  try {
    const admin = getSupabaseAdmin()
    const { data } = await admin.auth.admin.getUserById(user.id)
    const meta = (data?.user?.user_metadata as Record<string, unknown> | undefined) || {}
    if (typeof meta.progress_reset_at === "string") resetAt = meta.progress_reset_at
  } catch { /* si falla, no hay reset */ }

  return NextResponse.json({ reset_at: resetAt })
}
