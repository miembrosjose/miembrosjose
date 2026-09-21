// POST   /api/admin/red/embajador  → conceder el Embajador Galáctico
// DELETE /api/admin/red/embajador  → retirarlo
// GET    /api/admin/red/embajador  → quiénes lo tienen, con su país
//
// Body de POST y DELETE: { user_id: string }
//
// A diferencia de los grados del Camino, que se desbloquean solos al avanzar,
// este lo concede el administrador persona por persona. Es la representación
// de la Red en un país.
//
// POR QUÉ TAMBIÉN SE DESTACA
//   Conceder la insignia no basta: el Mapa de la Red y el directorio pintan a
//   cada miembro por su featured_badge_id. Si solo se desbloqueara, el
//   Embajador seguiría viéndose igual que todos hasta que él mismo la eligiera
//   como destacada. Por eso al conceder se destaca, y al retirar se limpia
//   —pero solo si la destacada era justo esta, para no borrar la elección de
//   nadie sobre otra insignia.

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { nombrePais } from "@/lib/red/paises"

export const dynamic = "force-dynamic"

const EMBAJADOR_ID = "embajador_galactico"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from("user_unlocked_achievements")
    .select("user_id, unlocked_at")
    .eq("achievement_id", EMBAJADOR_ID)
    .order("unlocked_at", { ascending: false })

  if (error) {
    console.error("[/api/admin/red/embajador] GET", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const filas = (data || []) as Array<{ user_id: string; unlocked_at: string }>
  if (filas.length === 0) return NextResponse.json({ embajadores: [] })

  // El país sale del directorio de La Red, que ya lo tiene denormalizado.
  const { data: ubic } = await admin
    .from("member_location")
    .select("user_id, display_name, username, avatar_url, country_code, network_cities(name)")
    .in("user_id", filas.map((f) => f.user_id))

  const porUsuario = new Map(
    ((ubic || []) as unknown as Array<{
      user_id: string; display_name: string | null; username: string | null
      avatar_url: string | null; country_code: string; network_cities: { name: string } | null
    }>).map((u) => [u.user_id, u]),
  )

  return NextResponse.json({
    embajadores: filas.map((f) => {
      const u = porUsuario.get(f.user_id)
      return {
        user_id: f.user_id,
        desde: f.unlocked_at,
        full_name: u?.display_name || "Miembro",
        username: u?.username || null,
        avatar_url: u?.avatar_url || null,
        country_code: u?.country_code || null,
        country: u?.country_code ? nombrePais(u.country_code) : null,
        city: u?.network_cities?.name || null,
      }
    }),
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const userId = await leerUserId(req)
  if (!userId) return NextResponse.json({ error: "Falta user_id" }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data: target, error: targetErr } = await admin.auth.admin.getUserById(userId)
  if (targetErr || !target?.user) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 })
  }

  // Comprobar antes de insertar, igual que grant-topo: no se da por supuesta
  // una restricción única sobre (user_id, achievement_id) que quizá no exista.
  const { data: yaLaTiene } = await admin
    .from("user_unlocked_achievements")
    .select("achievement_id")
    .eq("user_id", userId)
    .eq("achievement_id", EMBAJADOR_ID)
    .limit(1)

  if (!yaLaTiene || yaLaTiene.length === 0) {
    const { error: insErr } = await admin
      .from("user_unlocked_achievements")
      .insert({ user_id: userId, achievement_id: EMBAJADOR_ID })
    if (insErr) {
      console.error("[/api/admin/red/embajador] POST unlock", insErr.message)
      return NextResponse.json({ error: "No se pudo conceder" }, { status: 500 })
    }
  }

  // Destacarla. El trigger de auth.users la propaga a member_location, que es
  // de donde beben el mapa y el directorio.
  const meta = (target.user.user_metadata || {}) as Record<string, unknown>
  const { error: metaErr } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...meta, featured_badge_id: EMBAJADOR_ID },
  })
  if (metaErr) {
    console.error("[/api/admin/red/embajador] POST featured", metaErr.message)
    // La insignia ya está concedida: no se deshace por no poder destacarla.
    return NextResponse.json({ ok: true, destacada: false })
  }

  return NextResponse.json({ ok: true, destacada: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const userId = await leerUserId(req)
  if (!userId) return NextResponse.json({ error: "Falta user_id" }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from("user_unlocked_achievements")
    .delete()
    .eq("user_id", userId)
    .eq("achievement_id", EMBAJADOR_ID)

  if (error) {
    console.error("[/api/admin/red/embajador] DELETE", error.message)
    return NextResponse.json({ error: "No se pudo retirar" }, { status: 500 })
  }

  // Limpiar la destacada SOLO si era esta. Si la persona había elegido otra,
  // su elección se respeta.
  const { data: target } = await admin.auth.admin.getUserById(userId)
  const meta = (target?.user?.user_metadata || {}) as Record<string, unknown>
  if (meta.featured_badge_id === EMBAJADOR_ID) {
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...meta, featured_badge_id: null },
    })
  }

  return NextResponse.json({ ok: true })
}

async function leerUserId(req: NextRequest): Promise<string | null> {
  try {
    const body = await req.json()
    const id = typeof body?.user_id === "string" ? body.user_id.trim() : ""
    return id || null
  } catch {
    return null
  }
}
