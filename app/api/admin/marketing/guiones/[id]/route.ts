// API — un guion: cambiarlo, comentarlo o borrarlo.
//
//   PATCH  /api/admin/marketing/guiones/<id>   { campos…, comentario? }
//   DELETE /api/admin/marketing/guiones/<id>
//
// ── POR QUÉ COMENTAR VA EN EL MISMO PATCH ──────────────────────────────────
// Porque pedir cambios es UNA acción, no dos: devolver el guion a desarrollo
// Y decir por qué. Separarlas en dos peticiones significa que la segunda
// puede fallar, y entonces el guion vuelve a Regi sin ninguna observación —
// que es exactamente el caso que hay que evitar.
//
// Juntas, o pasa todo o no pasa nada.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { anadirComentario, exigirMarketing, limpiarGuion } from "@/lib/marketing/servidor"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const campos: Record<string, unknown> = {}

  // Los campos normales, si vienen. Una petición que solo trae comentario no
  // cambia nada más, y eso es válido.
  const soloComentario = Object.keys(body).every((k) => k === "comentario")
  if (!soloComentario) {
    const limpio = limpiarGuion(body, { parcial: true, esPropietario: g.esPropietario })
    if ("error" in limpio) return NextResponse.json({ error: limpio.error }, { status: 400 })
    Object.assign(campos, limpio.campos)
  }

  // ── LA OBSERVACIÓN ────────────────────────────────────────────────────
  if (typeof body.comentario === "string" && body.comentario.trim()) {
    // Se lee lo que ya había para añadir al final. Es una lectura más, y es
    // la forma de no perder lo escrito por el otro mientras tanto.
    const { data: antes } = await admin
      .from("mkt_guiones")
      .select("comentarios")
      .eq("id", id)
      .maybeSingle()

    if (!antes) return NextResponse.json({ error: "Ese guion ya no existe" }, { status: 404 })

    const meta = (g.user.user_metadata || {}) as { full_name?: string }
    const resultado = anadirComentario(antes.comentarios, {
      autorId: g.user.id,
      autor: meta.full_name || g.user.email || "Administración",
      texto: body.comentario,
    })
    if ("error" in resultado) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }
    campos.comentarios = resultado
  }

  if (Object.keys(campos).length === 0) {
    return NextResponse.json({ error: "No hay nada que cambiar." }, { status: 400 })
  }

  const { data, error } = await admin
    .from("mkt_guiones")
    .update(campos)
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (error) {
    console.error("[marketing] editar guion:", error.message)
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: "Ese guion ya no existe" }, { status: 404 })

  return NextResponse.json({ ok: true, guion: data })
}

/**
 * Borrar un guion.
 *
 * ── SOLO EL DUEÑO, Y SOLO SI NO ESTÁ APROBADO ─────────────────────────────
 * Un guion es trabajo escrito, a veces de horas. Que se pueda borrar de un
 * clic desde la misma pantalla donde se ordenan ideas es pedir un accidente.
 *
 * Para dejar de ver una idea que ya no vale está el estado: se queda en el
 * banco sin molestar. Borrar es para lo que se creó por error.
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  if (!g.esPropietario) {
    return NextResponse.json(
      { error: "Solo el propietario puede borrar un guion. Cámbialo de estado si ya no vale." },
      { status: 403 },
    )
  }

  const { id } = await ctx.params
  const admin = getSupabaseAdmin()

  const { data: actual } = await admin
    .from("mkt_guiones")
    .select("estado")
    .eq("id", id)
    .maybeSingle()

  if (actual && ["aprobado", "publicado"].includes(String(actual.estado))) {
    return NextResponse.json(
      { error: "Un guion aprobado o publicado no se borra: es el registro de lo que se dijo." },
      { status: 400 },
    )
  }

  const { error } = await admin.from("mkt_guiones").delete().eq("id", id)

  if (error) {
    console.error("[marketing] borrar guion:", error.message)
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
