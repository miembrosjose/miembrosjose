// API — seguir y dejar de seguir una conversación.
//
//   POST   /api/comunidad/hilos/<id>/seguir
//   DELETE /api/comunidad/hilos/<id>/seguir
//
// Seguir es la forma de enterarse de lo que se responde sin tener que volver a
// mirar. Quien abre una conversación la sigue sola; el resto decide.
//
// No se crea ningún sistema de avisos nuevo: cuando alguien responde, el aviso
// sale por la campana que ya existe. Esto solo dice a quién hay que avisar.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { contextoDe } from "@/lib/comunidad/acceso"

export const dynamic = "force-dynamic"

/**
 * Seguir algo que no se puede leer no tiene sentido, y además filtraría por la
 * puerta de atrás: recibir avisos de una temporada cerrada es enterarse de lo
 * que pasa dentro.
 */
async function puedoVerla(userId: string, postId: string, legibles: string[]) {
  if (legibles.length === 0) return false
  const { data } = await getSupabaseAdmin()
    .from("forum_posts")
    .select("space_id")
    .eq("id", postId)
    .maybeSingle()
  const space = (data as { space_id?: string } | null)?.space_id
  return Boolean(space && legibles.includes(space))
}

export async function POST(_req: NextRequest, ctxRuta: { params: Promise<{ id: string }> }) {
  const { id } = await ctxRuta.params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const ctx = await contextoDe(user)
  if (!(await puedoVerla(user.id, id, ctx.legibles))) {
    return NextResponse.json({ error: "No puedes seguir esa conversación." }, { status: 403 })
  }

  const { error } = await getSupabaseAdmin()
    .from("community_thread_follows")
    .upsert({ post_id: id, user_id: user.id }, { onConflict: "post_id,user_id", ignoreDuplicates: true })

  if (error) {
    console.error("[comunidad/seguir] alta", error.message)
    return NextResponse.json({ error: "No se pudo" }, { status: 500 })
  }
  return NextResponse.json({ ok: true, siguiendo: true })
}

export async function DELETE(_req: NextRequest, ctxRuta: { params: Promise<{ id: string }> }) {
  const { id } = await ctxRuta.params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  // Dejar de seguir no necesita comprobar acceso: si perdió el acceso, con más
  // razón hay que dejarle quitarse de en medio.
  const { error } = await getSupabaseAdmin()
    .from("community_thread_follows")
    .delete()
    .eq("post_id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[comunidad/seguir] baja", error.message)
    return NextResponse.json({ error: "No se pudo" }, { status: 500 })
  }
  return NextResponse.json({ ok: true, siguiendo: false })
}
