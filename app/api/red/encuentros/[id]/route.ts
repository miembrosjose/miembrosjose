// PATCH  /api/red/encuentros/<id>  → editar, publicar o cancelar
// DELETE /api/red/encuentros/<id>  → eliminar (solo borradores)
// POST   /api/red/encuentros/<id>  → apuntarse o borrarse  {asistencia:'voy'|'quizas'|null}
//
// Todo con el cliente de sesión. Quien decide si se puede es la RLS:
//   · editar    → ser el autor Y conservar el rol de Organizador
//   · eliminar  → solo borradores; lo publicado se cancela, nunca desaparece
//   · apuntarse → a uno mismo, y solo a encuentros publicados
//
// ── MODERACIÓN ─────────────────────────────────────────────────────────────
// Un administrador puede cancelar o eliminar CUALQUIER encuentro, incluidos
// los ajenos y los ya cancelados. Eso no lo permite la RLS —sus policies son
// de autor—, así que para ese caso concreto se usa el cliente de servicio,
// SIEMPRE después de comprobar isAdmin() contra app_metadata, que solo puede
// escribirse desde el servidor. Sin esa comprobación previa no se toca.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

function leerId(raw: string): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/** La RLS rechazando no es un error del servidor: es el permiso funcionando. */
function esRechazoDePermiso(error: { code?: string; message: string }): boolean {
  return error.code === "42501" || /row-level security/i.test(error.message)
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const id = leerId((await ctx.params).id)
  if (!id) return NextResponse.json({ error: "Id inválido" }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const cambios: Record<string, unknown> = {}

  if (typeof body.titulo === "string") {
    const t = body.titulo.trim().slice(0, 160)
    if (!t) return NextResponse.json({ error: "El título no puede quedar vacío" }, { status: 400 })
    cambios.titulo = t
  }
  if (typeof body.descripcion === "string") cambios.descripcion = body.descripcion.trim().slice(0, 4000)
  if (typeof body.lugar === "string") cambios.lugar = body.lugar.trim().slice(0, 300)

  if (typeof body.starts_at === "string") {
    const d = new Date(body.starts_at)
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Fecha de inicio inválida" }, { status: 400 })
    }
    // Solo se comprueba cuando SE CAMBIA la fecha: corregir el título de un
    // encuentro ya pasado debe seguir siendo posible.
    const MARGEN_MS = 5 * 60 * 1000
    if (d.getTime() < Date.now() - MARGEN_MS) {
      return NextResponse.json(
        { error: "No se puede mover un encuentro a una fecha que ya pasó." },
        { status: 400 },
      )
    }
    cambios.starts_at = d.toISOString()
  }
  if (body.ends_at === null) cambios.ends_at = null
  else if (typeof body.ends_at === "string" && body.ends_at) {
    const d = new Date(body.ends_at)
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Fecha de fin inválida" }, { status: 400 })
    }
    cambios.ends_at = d.toISOString()
  }

  if (body.cupo === null || body.cupo === "") cambios.cupo = null
  else if (body.cupo !== undefined) {
    const c = Number(body.cupo)
    if (!Number.isInteger(c) || c <= 0) {
      return NextResponse.json({ error: "El cupo debe ser un número mayor que cero" }, { status: 400 })
    }
    cambios.cupo = c
  }

  if (typeof body.estado === "string") {
    if (!["borrador", "publicado", "cancelado"].includes(body.estado)) {
      return NextResponse.json({ error: "Estado desconocido" }, { status: 400 })
    }
    cambios.estado = body.estado
  }

  // La ciudad se revalida contra el catálogo, igual que al crear: el país se
  // deriva de ella y nunca del cuerpo de la petición.
  if (body.city_id !== undefined) {
    const cityId = Number(body.city_id)
    if (!Number.isInteger(cityId) || cityId <= 0) {
      return NextResponse.json({ error: "Ciudad inválida" }, { status: 400 })
    }
    const { data: ciudad } = await supabase
      .from("network_cities")
      .select("id, country_code")
      .eq("id", cityId)
      .eq("is_active", true)
      .maybeSingle()
    if (!ciudad) return NextResponse.json({ error: "Esa ciudad no está en el catálogo" }, { status: 400 })
    cambios.city_id = ciudad.id
    cambios.country_code = ciudad.country_code
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "Nada que cambiar" }, { status: 400 })
  }

  // El administrador modera cualquier encuentro; el resto pasa por la RLS.
  const escritor = isAdmin(user) ? getSupabaseAdmin() : supabase
  const { data, error } = await escritor
    .from("network_meetings")
    .update(cambios)
    .eq("id", id)
    .select("id, estado")
    .maybeSingle()

  if (error) {
    if (esRechazoDePermiso(error)) {
      return NextResponse.json(
        { error: "No puedes editar este encuentro. Hace falta ser quien lo convocó y conservar la función de Organizador." },
        { status: 403 },
      )
    }
    console.error("[/api/red/encuentros/:id] PATCH", error.message)
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 })
  }
  // Sin error y sin fila: la RLS lo filtró de la vista. Mismo significado.
  if (!data) return NextResponse.json({ error: "Encuentro no encontrado" }, { status: 404 })

  return NextResponse.json({ ok: true, id: data.id, estado: data.estado })
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const id = leerId((await ctx.params).id)
  if (!id) return NextResponse.json({ error: "Id inválido" }, { status: 400 })

  const moderando = isAdmin(user)
  const borrador = moderando ? getSupabaseAdmin() : supabase
  const { data, error } = await borrador
    .from("network_meetings")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) {
    if (esRechazoDePermiso(error)) {
      return NextResponse.json({ error: "No puedes eliminar este encuentro." }, { status: 403 })
    }
    console.error("[/api/red/encuentros/:id] DELETE", error.message)
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 })
  }
  if (!data) {
    // Para un administrador, no encontrarlo significa que ya no existe.
    if (moderando) {
      return NextResponse.json({ error: "Ese encuentro ya no existe." }, { status: 404 })
    }
    // El caso normal: ya está publicado. La policy solo permite borrar
    // borradores, a propósito.
    return NextResponse.json(
      { error: "Solo se pueden eliminar borradores. Un encuentro publicado se cancela." },
      { status: 409 },
    )
  }

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const id = leerId((await ctx.params).id)
  if (!id) return NextResponse.json({ error: "Id inválido" }, { status: 400 })

  let body: { asistencia?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const asistencia = body.asistencia

  // null = borrarse de la lista.
  if (asistencia === null) {
    const { error } = await supabase
      .from("network_meeting_participants")
      .delete()
      .eq("meeting_id", id)
      .eq("user_id", user.id)
    if (error) {
      console.error("[/api/red/encuentros/:id] salir", error.message)
      return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 })
    }
    return NextResponse.json({ ok: true, asistencia: null })
  }

  if (asistencia !== "voy" && asistencia !== "quizas") {
    return NextResponse.json({ error: "Asistencia inválida" }, { status: 400 })
  }

  const { error } = await supabase
    .from("network_meeting_participants")
    .upsert(
      { meeting_id: id, user_id: user.id, estado: asistencia },
      { onConflict: "meeting_id,user_id" },
    )

  if (error) {
    if (esRechazoDePermiso(error)) {
      return NextResponse.json(
        { error: "Solo puedes apuntarte a encuentros publicados." },
        { status: 403 },
      )
    }
    console.error("[/api/red/encuentros/:id] apuntarse", error.message)
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, asistencia })
}
