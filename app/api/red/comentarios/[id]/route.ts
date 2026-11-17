// DELETE /api/red/comentarios/<id>  → borrar un comentario
//
// Quien lo escribió, o administración. Lo decide la RLS, no esta ruta: la
// política de borrado de `network_recording_comments` exige ser el autor o
// tener `profiles.is_admin`. Aquí solo se pide el borrado y se mira qué
// contestó la base.
//
// Borrar un comentario raíz se lleva sus respuestas (`on delete cascade`).
// Es lo que se espera: dejar respuestas colgando de algo que ya no está
// convierte el hilo en una conversación sin preguntas.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  if (!id) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // `select()` después del delete para saber si se borró ALGO. Sin esto, un
  // intento de borrar el comentario de otra persona devolvería «hecho» —la
  // RLS no da error, simplemente no afecta a ninguna fila— y la pantalla lo
  // quitaría de la lista hasta la siguiente recarga, en la que reaparecería.
  const { data, error } = await supabase
    .from("network_recording_comments")
    .delete()
    .eq("id", id)
    .select("id")

  if (error) {
    console.error("[red/comentarios] DELETE", error.message)
    return NextResponse.json({ error: "No se pudo borrar." }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "Ese comentario no es tuyo." },
      { status: 403 },
    )
  }

  return NextResponse.json({ ok: true })
}
