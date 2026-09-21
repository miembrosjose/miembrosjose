// GET /api/admin/red/buscar?q=…  → buscar CUALQUIER miembro de la plataforma
//
// POR QUÉ EXISTE ESTA RUTA
//   El panel usaba /api/red/miembros, que es el directorio PÚBLICO de La Red y
//   filtra por show_city = true. Es lo correcto allí —solo aparece quien quiso
//   aparecer— pero convertía el panel en inservible: el administrador no podía
//   encontrar ni a sí mismo si no había publicado su ciudad, ni a ninguna
//   cuenta que no lo hubiera hecho. Y conceder una insignia no debe depender
//   de que esa persona haya decidido salir en un mapa.
//
//   Aquí se busca sobre todo el padrón, con service_role y sin ese filtro.
//
// SE BUSCA POR DOS CAMINOS
//   · nombre y usuario → member_location, que ya los tiene denormalizados e
//     indexados para esto.
//   · correo → profiles, que tiene una fila por cuenta desde el registro. Es
//     la única forma de alcanzar a quien todavía no tiene ficha en el
//     directorio.

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { nombrePais, normalizar } from "@/lib/red/paises"
import { getNetworkRolesFor } from "@/lib/red/roles"

export const dynamic = "force-dynamic"

const EMBAJADOR_ID = "embajador_galactico"
const MAX = 25

type Resultado = {
  id: string
  full_name: string
  username: string | null
  avatar_url: string | null
  email: string | null
  country_code: string | null
  location_label: string
  en_directorio: boolean
  visible_en_mapa: boolean
  roles: string[]
  es_embajador: boolean
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const q = (req.nextUrl.searchParams.get("q") || "").trim()
  if (q.length < 2) return NextResponse.json({ miembros: [] })

  const admin = getSupabaseAdmin()
  const qNorm = normalizar(q)
  const patron = `%${q.replace(/[%_]/g, "\\$&")}%`
  const patronNorm = `%${qNorm.replace(/[%_]/g, "\\$&")}%`

  // ── Por nombre o usuario, en el directorio ──────────────────────────────
  const porNombre = admin
    .from("member_location")
    .select("user_id, display_name, username, avatar_url, country_code, show_city, network_cities(name, admin1)")
    .or(`display_name_norm.ilike.${patronNorm},username.ilike.${patron}`)
    .limit(MAX)

  // ── Por correo, en el padrón completo ───────────────────────────────────
  const porCorreo = admin
    .from("profiles")
    .select("id, email")
    .ilike("email", patron)
    .limit(MAX)

  const [rNombre, rCorreo] = await Promise.all([porNombre, porCorreo])

  if (rNombre.error) {
    console.error("[/api/admin/red/buscar] nombre", rNombre.error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
  if (rCorreo.error) {
    console.error("[/api/admin/red/buscar] correo", rCorreo.error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  type FilaDir = {
    user_id: string; display_name: string | null; username: string | null
    avatar_url: string | null; country_code: string; show_city: boolean
    network_cities: { name: string; admin1: string | null } | null
  }

  const porUsuario = new Map<string, Resultado>()

  for (const r of (rNombre.data || []) as unknown as FilaDir[]) {
    porUsuario.set(r.user_id, {
      id: r.user_id,
      full_name: r.display_name || "Miembro",
      username: r.username,
      avatar_url: r.avatar_url,
      email: null,
      country_code: r.country_code,
      location_label: r.network_cities
        ? `${r.network_cities.name}, ${nombrePais(r.country_code)}`
        : nombrePais(r.country_code),
      en_directorio: true,
      visible_en_mapa: r.show_city,
      roles: [],
      es_embajador: false,
    })
  }

  // Los encontrados por correo pueden no tener ficha: se completan con lo que
  // haya en auth.users.
  const idsCorreo = ((rCorreo.data || []) as Array<{ id: string; email: string | null }>)
    .filter((p) => !porUsuario.has(p.id))
    .slice(0, MAX)

  for (const p of idsCorreo) {
    const { data: u } = await admin.auth.admin.getUserById(p.id)
    const meta = (u?.user?.user_metadata || {}) as Record<string, unknown>
    porUsuario.set(p.id, {
      id: p.id,
      full_name:
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        (p.email ? p.email.split("@")[0] : "Miembro"),
      username: typeof meta.username === "string" ? meta.username : null,
      avatar_url: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
      email: p.email,
      country_code: null,
      location_label: "Sin ubicación declarada",
      en_directorio: false,
      visible_en_mapa: false,
      roles: [],
      es_embajador: false,
    })
  }

  // Completar el correo de los que vinieron por nombre.
  const sinCorreo = [...porUsuario.values()].filter((m) => m.email === null).map((m) => m.id)
  if (sinCorreo.length) {
    const { data: perfiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", sinCorreo)
    for (const p of (perfiles || []) as Array<{ id: string; email: string | null }>) {
      const m = porUsuario.get(p.id)
      if (m) m.email = p.email
    }
  }

  const ids = [...porUsuario.keys()]
  if (ids.length === 0) return NextResponse.json({ miembros: [] })

  // Roles vigentes y embajadores, en dos consultas para todos a la vez.
  const [roles, { data: emb }] = await Promise.all([
    getNetworkRolesFor(ids),
    admin
      .from("user_unlocked_achievements")
      .select("user_id")
      .eq("achievement_id", EMBAJADOR_ID)
      .in("user_id", ids),
  ])

  const embSet = new Set(((emb || []) as Array<{ user_id: string }>).map((e) => e.user_id))
  for (const m of porUsuario.values()) {
    m.roles = roles.get(m.id) || []
    m.es_embajador = embSet.has(m.id)
  }

  return NextResponse.json({ miembros: [...porUsuario.values()].slice(0, MAX) })
}
