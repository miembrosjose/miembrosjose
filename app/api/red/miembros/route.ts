// GET /api/red/miembros
//   Explorar la Red: miembros visibles, filtrados y paginados EN SQL.
//
//   ?pais=EC        filtra por país
//   ?ciudad=12      filtra por ciudad (id de network_cities)
//   ?q=ana          busca por nombre (sin tildes)
//   ?cursor=…       paginación por cursor
//   ?limit=24       máximo 48
//
// Diferencia con /api/members (la lista general de Miembros, que se conserva):
// aquí NO se traen todos los usuarios a memoria. Se consulta member_location,
// que ya tiene nombre y avatar copiados, con índices parciales sobre show_city.
// El navegador recibe una página, nunca el directorio entero.
//
// PRIVACIDAD: solo aparecen quienes activaron «Mostrar mi ciudad». No se hace
// con service_role a propósito — se usa el cliente de sesión para que la RLS
// de member_location sea la última palabra aunque este código se equivoque.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { nombrePais, normalizar } from "@/lib/red/paises"
import { getNetworkRolesFor } from "@/lib/red/roles"
import { esGradoDelCamino, rangoMasAlto } from "@/lib/achievements"

export const dynamic = "force-dynamic"

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 48

type Row = {
  user_id: string
  country_code: string
  city_id: number | null
  display_name: string | null
  avatar_url: string | null
  username: string | null
  featured_badge_id: string | null
  member_since: string | null
  network_cities: { name: string; admin1: string | null } | null
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const pais = (sp.get("pais") || "").toUpperCase().trim()
  const ciudadRaw = sp.get("ciudad")
  const q = (sp.get("q") || "").trim()
  const cursor = sp.get("cursor")
  const limit = Math.min(Math.max(parseInt(sp.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1), MAX_LIMIT)

  if (pais && !/^[A-Z]{2}$/.test(pais)) {
    return NextResponse.json({ error: "País inválido" }, { status: 400 })
  }
  const ciudad = ciudadRaw ? Number(ciudadRaw) : null
  if (ciudad !== null && (!Number.isInteger(ciudad) || ciudad <= 0)) {
    return NextResponse.json({ error: "Ciudad inválida" }, { status: 400 })
  }

  // ── Consulta del directorio ─────────────────────────────────────────────
  let query = supabase
    .from("member_location")
    .select(
      "user_id, country_code, city_id, display_name, avatar_url, username, featured_badge_id, member_since, network_cities(name, admin1)",
      { count: "exact" },
    )
    .eq("show_city", true)

  // Filtro por emblema, el mismo criterio que el mapa: por la insignia que
  // se TIENE, no por la que se lleva destacada. Ser Embajador o haber
  // completado una temporada es un hecho, no una eleccion de vitrina.
  const emblema = (sp.get("emblema") || "").trim()
  if (emblema) {
    // service_role a proposito: user_unlocked_achievements no expone las
    // insignias ajenas por RLS, y aqui hacen falta para filtrar. Solo se
    // pregunta por insignias que ya se muestran en los perfiles.
    let ids: string[]
    if (esGradoDelCamino(emblema)) {
      // Un grado del Camino identifica a quien se QUEDÓ ahí, no a quien pasó.
      // Hace falta traer todos sus grados para saber cuál es el más alto: con
      // un .eq() saldría también quien ya lo superó, y el mismo miembro
      // aparecería bajo varias temporadas.
      const { data: todosLosGrados } = await getSupabaseAdmin()
        .from("user_unlocked_achievements")
        .select("user_id, achievement_id")
      const porMiembro = new Map<string, string[]>()
      for (const r of (todosLosGrados || []) as Array<{ user_id: string; achievement_id: string }>) {
        if (!esGradoDelCamino(r.achievement_id)) continue
        const lista = porMiembro.get(r.user_id) ?? []
        lista.push(r.achievement_id)
        porMiembro.set(r.user_id, lista)
      }
      ids = [...porMiembro.entries()]
        .filter(([, grados]) => rangoMasAlto(grados) === emblema)
        .map(([uid]) => uid)
    } else {
      const { data: conLaInsignia } = await getSupabaseAdmin()
        .from("user_unlocked_achievements")
        .select("user_id")
        .eq("achievement_id", emblema)
      ids = (conLaInsignia || []).map((r) => (r as { user_id: string }).user_id)
    }
    // Sin nadie con esa insignia, un uuid imposible deja la lista vacia sin
    // tener que ramificar el resto de la consulta.
    query = query.in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
  }

  if (ciudad !== null) query = query.eq("city_id", ciudad)
  else if (pais) query = query.eq("country_code", pais)

  if (q) query = query.ilike("display_name_norm", `%${normalizar(q)}%`)

  // Paginación por cursor sobre member_since: estable aunque entren miembros
  // nuevos mientras alguien navega, cosa que el offset no garantiza.
  if (cursor) query = query.lt("member_since", cursor)

  // Se pide uno de más para saber si hay página siguiente sin contar de nuevo.
  const { data, error, count } = await query
    .order("member_since", { ascending: false, nullsFirst: false })
    .limit(limit + 1)

  if (error) {
    console.error("[/api/red/miembros]", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const rows = (data || []) as unknown as Row[]
  const hayMas = rows.length > limit
  const pagina = hayMas ? rows.slice(0, limit) : rows

  // Roles funcionales de los miembros de ESTA página — una sola consulta.
  const rolesPorMiembro = await getNetworkRolesFor(pagina.map((r) => r.user_id))

  const miembros = pagina.map((r) => {
    const city = r.network_cities
    return {
      id: r.user_id,
      full_name: r.display_name || "Miembro",
      username: r.username,
      avatar_url: r.avatar_url,
      // De aquí salen el aura y la etiqueta del grado en el listado.
      badge_id: r.featured_badge_id,
      city: city?.name ?? null,
      country_code: r.country_code,
      country: nombrePais(r.country_code),
      location_label: city ? `${city.name}, ${nombrePais(r.country_code)}` : nombrePais(r.country_code),
      roles: rolesPorMiembro.get(r.user_id) || [],
      member_since: r.member_since,
      // Es el propio usuario: la tarjeta oculta el botón de mensaje.
      is_self: r.user_id === user.id,
    }
  })

  return NextResponse.json({
    miembros,
    total: count ?? miembros.length,
    next_cursor: hayMas ? pagina[pagina.length - 1]?.member_since ?? null : null,
    filtros: {
      pais: pais || null,
      pais_nombre: pais ? nombrePais(pais) : null,
      ciudad,
      q: q || null,
    },
  })
}

// ── Resumen de la Red ───────────────────────────────────────────────────────
// Se expone en la misma ruta con ?resumen=1 para no multiplicar endpoints.
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // Los recuentos agregados usan service_role a propósito: cuentan también a
  // quienes ocultan su ciudad (el país siempre se guarda). Nunca devuelve
  // identidades, solo números — no revela a nadie.
  const admin = getSupabaseAdmin()

  const [{ count: conUbicacion }, { data: paisesRows }, { data: ciudadesRows }, listado] =
    await Promise.all([
      admin.from("member_location").select("user_id", { count: "exact", head: true }),
      admin.from("member_location").select("country_code"),
      admin.from("member_location").select("city_id").eq("show_city", true).not("city_id", "is", null),
      // Cuántos miembros hay EN TOTAL, hayan puesto ubicación o no.
      //
      // Sin este dato la cabecera mentía por omisión: enseñaba solo a quienes
      // tienen fila en member_location y parecía que la plataforma tenía un
      // miembro cuando había dos. Quien acaba de registrarse todavía no ha
      // elegido ciudad, así que no está en esa tabla — y eso es correcto.
      //
      // auth.users no tiene contador: listUsers es la única vía. Mil cabe de
      // sobra hoy; cuando no quepa, el sitio para arreglarlo es este.
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ])

  const paises = new Set((paisesRows || []).map((r) => (r as { country_code: string }).country_code))
  const ciudades = new Set((ciudadesRows || []).map((r) => (r as { city_id: number }).city_id))

  // Mismo criterio que /api/members, para que los dos sitios den el mismo
  // número: cuenta como miembro quien tiene correo y no está revocado.
  const total = (listado?.data?.users || []).filter((u) => {
    if (!u.email) return false
    return (u.app_metadata as { access_revoked?: boolean } | undefined)?.access_revoked !== true
  }).length

  return NextResponse.json({
    resumen: {
      miembros_total: total,
      miembros_con_ubicacion: conUbicacion ?? 0,
      paises: paises.size,
      ciudades: ciudades.size,
    },
  })
}
