// API — progreso de meditaciones (posición, %, completado) por usuario.
//
// Mismo patrón que /api/profile/episode-progress, pero en la tabla
// user_meditation_progress (RLS: cada usuario solo lee/escribe lo suyo).
//
// GET  → [{ meditation_id, position_seconds, duration_seconds, percent, completed, updated_at }]
// POST → upsert { meditation_id, position_seconds, duration_seconds, percent, completed }
//
// Degrada con elegancia: si la tabla aún no existe, GET devuelve [] y POST
// responde ok:false sin romper el reproductor (log en servidor).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data, error } = await supabase
    .from("user_meditation_progress")
    .select("meditation_id, position_seconds, duration_seconds, percent, completed, updated_at")
    .eq("user_id", user.id)

  if (error) {
    // Tabla ausente u otro error → no rompe el reproductor.
    console.error("[/api/profile/meditation-progress GET]", error.message)
    return NextResponse.json({ progress: [] })
  }
  return NextResponse.json({ progress: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: {
    meditation_id?: string
    position_seconds?: number
    duration_seconds?: number
    percent?: number
    completed?: boolean
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const meditationId = typeof body.meditation_id === "string" ? body.meditation_id.trim() : ""
  if (!meditationId || meditationId.length > 200) {
    return NextResponse.json({ error: "Invalid meditation_id" }, { status: 400 })
  }
  const clampInt = (v: unknown, min: number, max: number) => {
    const n = Math.round(Number(v))
    if (!Number.isFinite(n)) return min
    return Math.max(min, Math.min(max, n))
  }
  const position = clampInt(body.position_seconds, 0, 100000)
  const duration = clampInt(body.duration_seconds, 0, 100000)
  const percent = clampInt(body.percent, 0, 100)
  const completed = body.completed === true

  const { error } = await supabase
    .from("user_meditation_progress")
    .upsert(
      {
        user_id: user.id,
        meditation_id: meditationId,
        position_seconds: position,
        duration_seconds: duration,
        percent,
        completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,meditation_id" },
    )

  if (error) {
    console.error("[/api/profile/meditation-progress POST]", error.message)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
  return NextResponse.json({ ok: true })
}
