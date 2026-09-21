// GET    /api/red/solicitudes  → mis solicitudes y qué puedo pedir
// POST   /api/red/solicitudes  → pedir una función  { role, mensaje }
// DELETE /api/red/solicitudes  → retirar la mía     { role }
//
// Con el cliente de sesión: la RLS decide. No se puede pedir a nombre de otro,
// ni pedir algo que ya se tiene, ni aprobarse a uno mismo — eso lo impiden las
// policies, no este código.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getNetworkRoles, isNetworkRole } from "@/lib/red/roles"

export const dynamic = "force-dynamic"

type Fila = {
  id: number
  role_code: string
  mensaje: string
  estado: string
  respuesta: string | null
  decided_at: string | null
  created_at: string
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const [{ data, error }, misRoles] = await Promise.all([
    supabase
      .from("network_role_requests")
      .select("id, role_code, mensaje, estado, respuesta, decided_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getNetworkRoles(user.id),
  ])

  if (error) {
    console.error("[/api/red/solicitudes] GET", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({
    solicitudes: (data || []) as Fila[],
    // Lo que ya se sostiene: la interfaz no debe ofrecer pedirlo otra vez.
    mis_roles: misRoles,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { role?: unknown; mensaje?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const role = body.role
  if (!isNetworkRole(role)) {
    return NextResponse.json({ error: "Función desconocida" }, { status: 400 })
  }
  const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, 2000) : ""

  const { error } = await supabase
    .from("network_role_requests")
    .insert({ user_id: user.id, role_code: role, mensaje })

  if (error) {
    // 23505 = el índice único parcial: ya hay una pendiente para esa función.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya tienes una solicitud pendiente para esta función." },
        { status: 409 },
      )
    }
    // La RLS rechaza si ya se sostiene la función, o si se intenta a nombre
    // de otro. No es un fallo del servidor.
    if (error.code === "42501" || /row-level security/i.test(error.message)) {
      return NextResponse.json(
        { error: "No puedes solicitar esta función ahora mismo." },
        { status: 403 },
      )
    }
    console.error("[/api/red/solicitudes] POST", error.message)
    return NextResponse.json({ error: "No se pudo enviar la solicitud" }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { role?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }
  if (!isNetworkRole(body.role)) {
    return NextResponse.json({ error: "Función desconocida" }, { status: 400 })
  }

  // Solo las pendientes: una decidida queda como histórico. Lo impone también
  // la policy, aquí se filtra para que el resultado sea claro.
  const { error } = await supabase
    .from("network_role_requests")
    .delete()
    .eq("user_id", user.id)
    .eq("role_code", body.role)
    .eq("estado", "pendiente")

  if (error) {
    console.error("[/api/red/solicitudes] DELETE", error.message)
    return NextResponse.json({ error: "No se pudo retirar" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
