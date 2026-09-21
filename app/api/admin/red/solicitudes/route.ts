// GET  /api/admin/red/solicitudes            → la bandeja
// POST /api/admin/red/solicitudes            → decidir
//        { id, decision: 'aprobar' | 'rechazar', respuesta? }
//
// Aprobar CONCEDE la función por el mismo camino de siempre —grantNetworkRole,
// el que usa el panel— en vez de escribir directamente en la tabla de
// asignaciones. El permiso tiene una sola puerta, y esta no es otra.

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { nombrePais } from "@/lib/red/paises"
import { grantNetworkRole, isNetworkRole } from "@/lib/red/roles"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  // Por defecto, lo que hay que atender.
  const estado = (req.nextUrl.searchParams.get("estado") || "pendiente").trim()
  if (!["pendiente", "aprobada", "rechazada", "todas"].includes(estado)) {
    return NextResponse.json({ error: "Estado desconocido" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  let q = admin
    .from("network_role_requests")
    .select("id, user_id, role_code, mensaje, estado, respuesta, decided_at, created_at")
  if (estado !== "todas") q = q.eq("estado", estado)

  // Las pendientes, las más antiguas primero: quien lleva más esperando, antes.
  const { data, error } = await q.order("created_at", { ascending: estado === "pendiente" })

  if (error) {
    console.error("[/api/admin/red/solicitudes] GET", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const filas = (data || []) as Array<{
    id: number; user_id: string; role_code: string; mensaje: string
    estado: string; respuesta: string | null; decided_at: string | null; created_at: string
  }>
  if (filas.length === 0) return NextResponse.json({ solicitudes: [] })

  // Quién es cada uno, desde el directorio, en una sola consulta.
  const { data: dir } = await admin
    .from("member_location")
    .select("user_id, display_name, username, avatar_url, country_code, network_cities(name)")
    .in("user_id", filas.map((f) => f.user_id))

  const porUsuario = new Map(
    ((dir || []) as unknown as Array<{
      user_id: string; display_name: string | null; username: string | null
      avatar_url: string | null; country_code: string; network_cities: { name: string } | null
    }>).map((d) => [d.user_id, d]),
  )

  return NextResponse.json({
    solicitudes: filas.map((f) => {
      const d = porUsuario.get(f.user_id)
      return {
        ...f,
        full_name: d?.display_name || "Miembro",
        username: d?.username || null,
        avatar_url: d?.avatar_url || null,
        lugar: d
          ? `${d.network_cities?.name ? d.network_cities.name + ", " : ""}${nombrePais(d.country_code)}`
          : "Sin ubicación declarada",
      }
    }),
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: { id?: unknown; decision?: unknown; respuesta?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const id = Number(body.id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 })
  }
  const aprobar = body.decision === "aprobar"
  if (!aprobar && body.decision !== "rechazar") {
    return NextResponse.json({ error: "Decisión desconocida" }, { status: 400 })
  }
  const respuesta = typeof body.respuesta === "string" ? body.respuesta.trim().slice(0, 2000) : null

  const admin = getSupabaseAdmin()
  const { data: sol, error: solErr } = await admin
    .from("network_role_requests")
    .select("id, user_id, role_code, estado")
    .eq("id", id)
    .maybeSingle()

  if (solErr || !sol) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }
  if (sol.estado !== "pendiente") {
    return NextResponse.json({ error: "Esta solicitud ya fue decidida." }, { status: 409 })
  }
  if (!isNetworkRole(sol.role_code)) {
    return NextResponse.json({ error: "La función ya no existe" }, { status: 400 })
  }

  // Se concede ANTES de marcar la solicitud: si conceder falla, la solicitud
  // sigue pendiente y se puede reintentar. Al revés quedaría una aprobación
  // sin función detrás.
  if (aprobar) {
    const r = await grantNetworkRole({
      userId: sol.user_id,
      role: sol.role_code,
      grantedBy: auth.user.id,
      note: `Aprobada la solicitud #${sol.id}`,
    })
    if (!r.ok) {
      console.error("[/api/admin/red/solicitudes] grant", r.error)
      return NextResponse.json({ error: "No se pudo conceder la función" }, { status: 500 })
    }
  }

  const { error: updErr } = await admin
    .from("network_role_requests")
    .update({
      estado: aprobar ? "aprobada" : "rechazada",
      decided_by: auth.user.id,
      decided_at: new Date().toISOString(),
      respuesta,
    })
    .eq("id", id)

  if (updErr) {
    console.error("[/api/admin/red/solicitudes] update", updErr.message)
    return NextResponse.json({ error: "No se pudo registrar la decisión" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, estado: aprobar ? "aprobada" : "rechazada" })
}
