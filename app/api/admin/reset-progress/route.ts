// POST /api/admin/reset-progress
// Reinicia el avance de un usuario (por email): borra sus filas de progreso en
// el servidor Y marca su metadata (progress_reset_at) para que, en su próximo
// ingreso, su navegador limpie solo el avance local (episodios, bitácora,
// sellos, misiones). Pensado para pruebas.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TABLES = ["user_episode_progress", "user_meditation_progress", "user_unlocked_achievements", "user_xp"]

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: { email?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }
  const email = (body.email || "").trim().toLowerCase()
  if (!email || !email.includes("@")) return NextResponse.json({ error: "Email inválido" }, { status: 400 })

  const admin = getSupabaseAdmin()

  // Buscar el usuario por email.
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const target = listed?.users?.find((u) => u.email?.toLowerCase() === email)
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  // Borrar avance en el servidor.
  const results: Record<string, string> = {}
  for (const t of TABLES) {
    const { error } = await admin.from(t).delete().eq("user_id", target.id)
    results[t] = error ? `error: ${error.message}` : "ok"
  }

  // Marcar metadata → el navegador del usuario limpia el avance local en su
  // próximo ingreso (y recarga una vez).
  const resetAt = new Date().toISOString()
  const { error: metaErr } = await admin.auth.admin.updateUserById(target.id, {
    user_metadata: { ...(target.user_metadata || {}), progress_reset_at: resetAt },
  })

  return NextResponse.json({
    ok: true,
    email,
    reset_at: resetAt,
    server: results,
    metadata: metaErr ? `error: ${metaErr.message}` : "ok",
  })
}
