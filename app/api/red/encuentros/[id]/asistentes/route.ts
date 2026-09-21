// GET /api/red/encuentros/<id>/asistentes  → quién va a un encuentro
//
// Lo usa sobre todo quien organiza, para poder escribir a su gente. Se sirve
// con el cliente de sesión: la policy de lectura de participantes ya limita
// qué encuentros se pueden mirar, así que nadie ve la lista de un borrador
// ajeno.
//
// Devuelve nombre y usuario, no correos: para hablar con alguien está la
// mensajería interna, que es donde esa conversación debe ocurrir.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("network_meeting_participants")
    .select("user_id, estado, created_at")
    .eq("meeting_id", id)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[/api/red/encuentros/:id/asistentes]", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const filas = (data || []) as Array<{ user_id: string; estado: string; created_at: string }>
  if (filas.length === 0) return NextResponse.json({ asistentes: [] })

  // Nombres desde el directorio, en una sola consulta.
  const { data: dir } = await supabase
    .from("member_location")
    .select("user_id, display_name, username, avatar_url, featured_badge_id")
    .in("user_id", filas.map((f) => f.user_id))

  const porUsuario = new Map(
    ((dir || []) as Array<{
      user_id: string; display_name: string | null; username: string | null
      avatar_url: string | null; featured_badge_id: string | null
    }>).map((d) => [d.user_id, d]),
  )

  return NextResponse.json({
    asistentes: filas.map((f) => {
      const d = porUsuario.get(f.user_id)
      return {
        id: f.user_id,
        estado: f.estado,
        full_name: d?.display_name || "Miembro",
        username: d?.username || null,
        avatar_url: d?.avatar_url || null,
        badge_id: d?.featured_badge_id || null,
        is_self: f.user_id === user.id,
      }
    }),
  })
}
