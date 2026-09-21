// GET  /api/admin/red/roles?user_id=…  → roles vigentes de un miembro
// GET  /api/admin/red/roles?role=…     → quién tiene ese rol
// POST /api/admin/red/roles            → conceder o retirar
//
// Único punto por el que se conceden y retiran roles funcionales. Exige admin
// comprobado en servidor; la tabla no acepta escritura de `authenticated` bajo
// ninguna circunstancia, así que este endpoint es el cuello de botella real.

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { nombrePais } from "@/lib/red/paises"
import {
  getNetworkRoles,
  grantNetworkRole,
  revokeNetworkRole,
  isNetworkRole,
} from "@/lib/red/roles"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const userId = req.nextUrl.searchParams.get("user_id")
  const role = req.nextUrl.searchParams.get("role")

  if (userId) {
    const roles = await getNetworkRoles(userId)
    return NextResponse.json({ user_id: userId, roles })
  }

  if (role) {
    if (!isNetworkRole(role)) {
      return NextResponse.json({ error: "Rol desconocido" }, { status: 400 })
    }
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from("network_role_assignments")
      .select("user_id, granted_at, granted_by, note")
      .eq("role_code", role)
      .is("revoked_at", null)
      .order("granted_at", { ascending: false })
    if (error) {
      console.error("[/api/admin/red/roles] list", error.message)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const filas = (data || []) as Array<{
      user_id: string; granted_at: string; granted_by: string | null; note: string | null
    }>
    if (filas.length === 0) return NextResponse.json({ role, members: [] })

    // Sin nombre ni foto, la lista era una columna de uuids: inservible para
    // administrar. Se completa desde el directorio, que ya los tiene.
    const { data: dir } = await admin
      .from("member_location")
      .select("user_id, display_name, username, avatar_url, country_code")
      .in("user_id", filas.map((f) => f.user_id))

    const porUsuario = new Map(
      ((dir || []) as Array<{
        user_id: string; display_name: string | null; username: string | null
        avatar_url: string | null; country_code: string
      }>).map((d) => [d.user_id, d]),
    )

    return NextResponse.json({
      role,
      members: filas.map((f) => {
        const d = porUsuario.get(f.user_id)
        return {
          user_id: f.user_id,
          granted_at: f.granted_at,
          granted_by: f.granted_by,
          note: f.note,
          full_name: d?.display_name || "Miembro",
          username: d?.username || null,
          avatar_url: d?.avatar_url || null,
          country: d?.country_code ? nombrePais(d.country_code) : null,
        }
      }),
    })
  }

  // Sin filtros: recuento por rol, para el panel.
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from("network_role_assignments")
    .select("role_code")
    .is("revoked_at", null)
  if (error) {
    console.error("[/api/admin/red/roles] counts", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
  const counts: Record<string, number> = {}
  for (const r of data || []) {
    const code = (r as { role_code: string }).role_code
    counts[code] = (counts[code] || 0) + 1
  }
  return NextResponse.json({ counts })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: { user_id?: unknown; role?: unknown; action?: unknown; note?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const userId = typeof body.user_id === "string" ? body.user_id.trim() : ""
  const role = body.role
  const action = body.action === "revoke" ? "revoke" : "grant"
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : undefined

  if (!userId) return NextResponse.json({ error: "Falta user_id" }, { status: 400 })
  if (!isNetworkRole(role)) return NextResponse.json({ error: "Rol desconocido" }, { status: 400 })

  // El miembro debe existir: evita asignar roles a uuids inventados.
  const admin = getSupabaseAdmin()
  const { data: target, error: targetErr } = await admin.auth.admin.getUserById(userId)
  if (targetErr || !target?.user) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 })
  }

  const result =
    action === "revoke"
      ? await revokeNetworkRole({ userId, role, note })
      : await grantNetworkRole({ userId, role, grantedBy: auth.user.id, note })

  if (!result.ok) {
    console.error("[/api/admin/red/roles] POST", result.error)
    return NextResponse.json({ error: "No se pudo actualizar el rol" }, { status: 500 })
  }

  const roles = await getNetworkRoles(userId)
  return NextResponse.json({ ok: true, action, user_id: userId, roles })
}
