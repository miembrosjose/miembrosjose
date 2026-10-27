// API — una actividad: cambiarla o borrarla.
//
//   PATCH  /api/admin/marketing/actividades/<id>
//   DELETE /api/admin/marketing/actividades/<id>
//
// ── MARCAR UNA TAREA ES UN PATCH COMO OTRO CUALQUIERA ──────────────────────
// No hay una ruta aparte para «completar». Marcar algo es cambiarle el
// estado, igual que reprogramarlo es cambiarle la fecha. Una ruta por verbo
// acaba siendo seis rutas que hacen lo mismo y que se olvidan de validar en
// sitios distintos.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirMarketing, limpiarActividad } from "@/lib/marketing/servidor"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const limpio = limpiarActividad(body, { parcial: true })
  if ("error" in limpio) return NextResponse.json({ error: limpio.error }, { status: 400 })

  const { data, error } = await getSupabaseAdmin()
    .from("mkt_actividades")
    .update(limpio.campos)
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (error) {
    console.error("[marketing] editar:", error.message)
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: "Esa actividad ya no existe" }, { status: 404 })

  return NextResponse.json({ ok: true, actividad: data })
}

/**
 * Borrar de verdad, no archivar.
 *
 * ── POR QUÉ AQUÍ SÍ SE BORRA ──────────────────────────────────────────────
 * En las comunicaciones no se borra nada: una comunicación enviada es la
 * prueba de qué se dijo. Esto es lo contrario — un plan de trabajo, lleno de
 * cosas que se crean de prueba, se duplican o dejan de tener sentido.
 * Archivarlas dejaría el calendario lleno de ruido invisible que alguien
 * tendría que filtrar para siempre.
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params

  const { error } = await getSupabaseAdmin()
    .from("mkt_actividades")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("[marketing] borrar:", error.message)
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
