// POST /api/red/comentarios/<id>/like  → poner o quitar el «me gusta»
//
// Un solo botón que alterna, como en el foro. Devuelve el estado resultante
// para que la pantalla no tenga que adivinarlo.
//
// El CONTADOR no se toca aquí: lo lleva un disparador de la base sobre la
// tabla de «me gusta». Si lo sumara esta ruta, bastaría un fallo a medio
// camino —o dos personas pulsando a la vez— para que el número dejara de
// coincidir con las filas, y nadie se enteraría hasta contarlas a mano.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  if (!id) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data: yaEsta } = await supabase
    .from("network_recording_comment_likes")
    .select("comment_id")
    .eq("comment_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  let miGusta: boolean
  if (yaEsta) {
    const { error } = await supabase
      .from("network_recording_comment_likes")
      .delete()
      .eq("comment_id", id)
      .eq("user_id", user.id)
    if (error) {
      console.error("[red/comentarios/like] quitar", error.message)
      return NextResponse.json({ error: "No se pudo quitar." }, { status: 500 })
    }
    miGusta = false
  } else {
    const { error } = await supabase
      .from("network_recording_comment_likes")
      .insert({ comment_id: id, user_id: user.id })
    if (error) {
      // La clave primaria doble hace imposible duplicarlo. Si dos pulsaciones
      // se cruzan, la segunda choca: no es un fallo, ya estaba puesto.
      if (error.code === "23505") {
        miGusta = true
      } else {
        console.error("[red/comentarios/like] poner", error.message)
        return NextResponse.json({ error: "No se pudo marcar." }, { status: 500 })
      }
    } else {
      miGusta = true
    }
  }

  // El número se lee DESPUÉS, ya actualizado por el disparador, para que la
  // pantalla enseñe el total de verdad y no una suma hecha en el navegador.
  const { data: fila } = await supabase
    .from("network_recording_comments")
    .select("likes_count")
    .eq("id", id)
    .maybeSingle<{ likes_count: number }>()

  return NextResponse.json({
    miGusta,
    cuantos: fila?.likes_count ?? 0,
  })
}
