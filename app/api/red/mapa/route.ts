// GET /api/red/mapa
//   El Mapa de la Red, en tres niveles según el zoom.
//
//   ?nivel=pais        → un punto por país con su total          (zoom lejano)
//   ?nivel=ciudad      → un punto por ciudad con su total        (zoom medio)
//   ?nivel=miembros&ciudad=12 → los miembros de esa ciudad       (zoom cercano)
//
//   ?emblema=welcome   → filtra por emblema destacado (en cualquier nivel)
//
// Por qué tres niveles y no uno: con 200 miembros en una ciudad no se pueden
// pintar 200 círculos superpuestos. Lejos se ve el número; al acercarse se
// reparte; solo al final aparecen las personas.
//
// PRIVACIDAD — igual que siempre
//   Las coordenadas son las del CENTRO DE LA CIUDAD y son idénticas para todos
//   sus miembros. El nivel «miembros» devuelve personas, pero todas con el
//   mismo punto: el anillo que dibuja el mapa es una disposición visual para
//   que no se solapen, no un dato sobre dónde vive nadie.
//   Solo aparece quien activó «Mostrar mi ciudad».

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { nombrePais, banderaPais } from "@/lib/red/paises"
import { getNetworkRolesFor } from "@/lib/red/roles"

export const dynamic = "force-dynamic"

const MAX_MIEMBROS_CIUDAD = 300

type CityRef = { id: number; name: string; admin1: string | null; lat: number; lon: number }

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const nivel = sp.get("nivel") || "ciudad"
  const emblema = (sp.get("emblema") || "").trim()
  const ciudadId = sp.get("ciudad") ? Number(sp.get("ciudad")) : null

  // ── Nivel 3 · Miembros de una ciudad ────────────────────────────────────
  if (nivel === "miembros") {
    if (!ciudadId || !Number.isInteger(ciudadId)) {
      return NextResponse.json({ error: "Falta la ciudad" }, { status: 400 })
    }

    let q = supabase
      .from("member_location")
      .select("user_id, display_name, username, avatar_url, featured_badge_id, country_code, network_cities(id, name, admin1, lat, lon)")
      .eq("show_city", true)
      .eq("city_id", ciudadId)
    if (emblema) q = q.eq("featured_badge_id", emblema)

    const { data, error } = await q.order("member_since", { ascending: false }).limit(MAX_MIEMBROS_CIUDAD)
    if (error) {
      console.error("[/api/red/mapa] miembros", error.message)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const rows = (data || []) as unknown as Array<{
      user_id: string; display_name: string | null; username: string | null
      avatar_url: string | null; featured_badge_id: string | null; country_code: string
      network_cities: CityRef | null
    }>

    const roles = await getNetworkRolesFor(rows.map((r) => r.user_id))
    const city = rows[0]?.network_cities ?? null

    return NextResponse.json({
      nivel: "miembros",
      ciudad: city
        ? { id: city.id, name: city.name, admin1: city.admin1, lat: city.lat, lon: city.lon,
            country: nombrePais(rows[0].country_code), country_code: rows[0].country_code }
        : null,
      miembros: rows.map((r) => ({
        id: r.user_id,
        full_name: r.display_name || "Miembro",
        username: r.username,
        avatar_url: r.avatar_url,
        badge_id: r.featured_badge_id,
        roles: roles.get(r.user_id) || [],
        is_self: r.user_id === user.id,
      })),
      total: rows.length,
      truncado: rows.length >= MAX_MIEMBROS_CIUDAD,
    })
  }

  // ── Niveles 1 y 2 · Agregados ───────────────────────────────────────────
  // Se agrupa en el servidor: el número de CIUDADES es pequeño por naturaleza
  // (cientos), y así se evita mantener una vista materializada.
  let q = supabase
    .from("member_location")
    .select("city_id, country_code, featured_badge_id, network_cities(id, name, admin1, lat, lon)")
    .eq("show_city", true)
    .not("city_id", "is", null)
  if (emblema) q = q.eq("featured_badge_id", emblema)

  const { data, error } = await q
  if (error) {
    console.error("[/api/red/mapa] agregados", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const rows = (data || []) as unknown as Array<{
    city_id: number; country_code: string; featured_badge_id: string | null
    network_cities: CityRef | null
  }>

  const ciudades = new Map<number, {
    id: number; name: string; admin1: string | null; lat: number; lon: number
    country_code: string; country: string; members: number
  }>()
  const paises = new Map<string, { code: string; name: string; flag: string; lat: number; lon: number; members: number; cities: Set<number> }>()
  const emblemas = new Map<string, number>()

  for (const r of rows) {
    const c = r.network_cities
    if (!c || typeof c.lat !== "number" || typeof c.lon !== "number") continue

    const ec = ciudades.get(c.id)
    if (ec) ec.members += 1
    else ciudades.set(c.id, {
      id: c.id, name: c.name, admin1: c.admin1, lat: c.lat, lon: c.lon,
      country_code: r.country_code, country: nombrePais(r.country_code), members: 1,
    })

    const ep = paises.get(r.country_code)
    if (ep) { ep.members += 1; ep.cities.add(c.id); ep.lat += c.lat; ep.lon += c.lon }
    else paises.set(r.country_code, {
      code: r.country_code, name: nombrePais(r.country_code), flag: banderaPais(r.country_code),
      lat: c.lat, lon: c.lon, members: 1, cities: new Set([c.id]),
    })

    if (r.featured_badge_id) {
      emblemas.set(r.featured_badge_id, (emblemas.get(r.featured_badge_id) || 0) + 1)
    }
  }

  const listaCiudades = [...ciudades.values()].sort((a, b) => b.members - a.members)
  // El punto del país es el centroide de sus ciudades, ponderado por miembros.
  const listaPaises = [...paises.values()]
    .map((p) => ({
      code: p.code, name: p.name, flag: p.flag,
      lat: p.lat / p.members, lon: p.lon / p.members,
      members: p.members, cities: p.cities.size,
    }))
    .sort((a, b) => b.members - a.members)

  return NextResponse.json({
    nivel: nivel === "pais" ? "pais" : "ciudad",
    paises: listaPaises,
    ciudades: listaCiudades,
    emblemas: [...emblemas.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count),
    total_miembros: rows.length,
    total_ciudades: listaCiudades.length,
    total_paises: listaPaises.length,
  })
}
