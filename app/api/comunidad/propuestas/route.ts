// API — proponer una temática para la comunidad.
//
//   POST  /api/comunidad/propuestas   un miembro propone
//   GET   /api/comunidad/propuestas   administración las lee todas
//   PATCH /api/comunidad/propuestas   administración resuelve una
//
// ── POR QUÉ ESTO NO CREA NADA ──────────────────────────────────────────────
// Un miembro no crea espacios. Si pudiera, en un año habría cuarenta salas con
// dos conversaciones cada una y la comunidad parecería un pueblo abandonado.
//
// Pero tampoco se le puede decir que no cabe lo que necesita. Esto es la
// tercera vía: se propone, administración decide, y si se aprueba, el espacio
// lo crea administración con su nombre y su descripción cuidados. Aprobar una
// propuesta NO crea la categoría sola, a propósito: primero se lee, después se
// escribe bien.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { papelDe } from "@/lib/comunidad/acceso"

export const dynamic = "force-dynamic"

const ESTADOS = ["pendiente", "aprobada", "rechazada", "fusionada", "archivada"]

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  let body: { nombre?: string; descripcion?: string; motivo?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const nombre = (body.nombre || "").trim().slice(0, 120)
  const descripcion = (body.descripcion || "").trim().slice(0, 600)
  const motivo = (body.motivo || "").trim().slice(0, 900)

  if (nombre.length < 3) return NextResponse.json({ error: "Ponle un nombre" }, { status: 400 })
  if (descripcion.length < 10) {
    return NextResponse.json({ error: "Cuenta en una línea de qué trataría" }, { status: 400 })
  }

  const { error } = await getSupabaseAdmin()
    .from("community_space_proposals")
    .insert({ user_id: user.id, nombre, descripcion, motivo })

  if (error) {
    console.error("[comunidad/propuestas] alta", error.message)
    return NextResponse.json({ error: "No se pudo enviar" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if ((await papelDe(user)) !== "administracion") {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 })
  }

  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from("community_space_proposals")
    .select("id, user_id, nombre, descripcion, motivo, estado, nota_admin, creado_en, resuelto_en")
    .order("creado_en", { ascending: false })
    .limit(200)

  const propuestas = (data || []) as Array<{ user_id: string } & Record<string, unknown>>

  // Quién la propuso, para poder responderle. Una sola consulta para todas.
  const ids = [...new Set(propuestas.map((p) => p.user_id))]
  const nombres = new Map<string, string>()
  if (ids.length > 0) {
    const listado = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    for (const u of listado?.data?.users || []) {
      if (!ids.includes(u.id)) continue
      const meta = (u.user_metadata || {}) as { full_name?: string; name?: string }
      nombres.set(u.id, meta.full_name || meta.name || u.email || "Miembro")
    }
  }

  return NextResponse.json({
    propuestas: propuestas.map((p) => ({ ...p, autor: nombres.get(p.user_id) ?? "Miembro" })),
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if ((await papelDe(user)) !== "administracion") {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 })
  }

  let body: { id?: string; estado?: string; nota?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const id = (body.id || "").trim()
  const estado = (body.estado || "").trim()
  if (!id) return NextResponse.json({ error: "Falta la propuesta" }, { status: 400 })
  if (!ESTADOS.includes(estado)) return NextResponse.json({ error: "Estado desconocido" }, { status: 400 })

  const { error } = await getSupabaseAdmin()
    .from("community_space_proposals")
    .update({
      estado,
      nota_admin: (body.nota || "").trim().slice(0, 600),
      resuelto_en: estado === "pendiente" ? null : new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("[comunidad/propuestas] resolver", error.message)
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
