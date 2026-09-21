// GET  /api/red/encuentros  → encuentros próximos
// POST /api/red/encuentros  → convocar uno nuevo (exige rol de Organizador)
//
// Filtros del GET:
//   ?pais=EC        solo ese país
//   ?ciudad=12      solo esa ciudad
//   ?mios=1         los que yo convoqué, borradores incluidos
//   ?pasados=1      los que ya ocurrieron, del más reciente hacia atrás
//
// Se usa SIEMPRE el cliente de sesión, nunca service_role: así la RLS es la
// última palabra. Si alguien pierde el rol de Organizador, la base se lo
// impide aunque esta ruta se equivocara.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { nombrePais } from "@/lib/red/paises"
import { hasNetworkRole } from "@/lib/red/roles"

export const dynamic = "force-dynamic"

const MAX_POR_PAGINA = 50

type CityRef = { id: number; name: string; admin1: string | null; lat: number; lon: number }

type FilaEncuentro = {
  id: number
  created_by: string
  city_id: number
  country_code: string
  lugar: string
  titulo: string
  descripcion: string
  starts_at: string
  ends_at: string | null
  cupo: number | null
  estado: string
  network_cities: CityRef | null
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const pais = (sp.get("pais") || "").trim().toUpperCase()
  const ciudad = sp.get("ciudad") ? Number(sp.get("ciudad")) : null
  const mios = sp.get("mios") === "1"
  const pasados = sp.get("pasados") === "1"

  let q = supabase
    .from("network_meetings")
    .select("id, created_by, city_id, country_code, lugar, titulo, descripcion, starts_at, ends_at, cupo, estado, network_cities(id, name, admin1, lat, lon)")

  if (mios) {
    // Los propios incluyen borradores; la RLS ya los deja ver solo a su autor.
    q = q.eq("created_by", user.id)
  } else {
    q = q.in("estado", ["publicado", "cancelado"])
  }
  if (pais && /^[A-Z]{2}$/.test(pais)) q = q.eq("country_code", pais)
  if (ciudad && Number.isInteger(ciudad)) q = q.eq("city_id", ciudad)

  const ahora = new Date().toISOString()
  q = pasados
    ? q.lt("starts_at", ahora).order("starts_at", { ascending: false })
    : q.gte("starts_at", ahora).order("starts_at", { ascending: true })

  const { data, error } = await q.limit(MAX_POR_PAGINA)
  if (error) {
    console.error("[/api/red/encuentros] GET", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const filas = (data || []) as unknown as FilaEncuentro[]

  // Asistencia de todos los encuentros de la página, en una sola consulta: uno
  // por encuentro sería N+1.
  const ids = filas.map((f) => f.id)
  const asistentes = new Map<number, number>()
  const mia = new Map<number, string>()
  if (ids.length) {
    const { data: parts } = await supabase
      .from("network_meeting_participants")
      .select("meeting_id, user_id, estado")
      .in("meeting_id", ids)
    for (const p of (parts || []) as Array<{ meeting_id: number; user_id: string; estado: string }>) {
      asistentes.set(p.meeting_id, (asistentes.get(p.meeting_id) || 0) + 1)
      if (p.user_id === user.id) mia.set(p.meeting_id, p.estado)
    }
  }

  return NextResponse.json({
    encuentros: filas.map((f) => ({
      id: f.id,
      titulo: f.titulo,
      descripcion: f.descripcion,
      lugar: f.lugar,
      starts_at: f.starts_at,
      ends_at: f.ends_at,
      cupo: f.cupo,
      estado: f.estado,
      soy_organizador: f.created_by === user.id,
      ciudad: f.network_cities
        ? {
            id: f.network_cities.id,
            name: f.network_cities.name,
            admin1: f.network_cities.admin1,
            lat: f.network_cities.lat,
            lon: f.network_cities.lon,
          }
        : null,
      country_code: f.country_code,
      country: nombrePais(f.country_code),
      asistentes: asistentes.get(f.id) || 0,
      mi_asistencia: mia.get(f.id) || null,
    })),
    total: filas.length,
    // Para que la interfaz sepa si mostrar el botón de convocar. El permiso de
    // verdad no es este: es la policy de INSERT.
    puedo_convocar: await hasNetworkRole(user.id, "organizador"),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const titulo = typeof body.titulo === "string" ? body.titulo.trim().slice(0, 160) : ""
  const descripcion = typeof body.descripcion === "string" ? body.descripcion.trim().slice(0, 4000) : ""
  const lugar = typeof body.lugar === "string" ? body.lugar.trim().slice(0, 300) : ""
  const cityId = Number(body.city_id)
  const startsAt = typeof body.starts_at === "string" ? body.starts_at : ""
  const endsAt = typeof body.ends_at === "string" && body.ends_at ? body.ends_at : null
  const cupo = body.cupo === null || body.cupo === undefined || body.cupo === "" ? null : Number(body.cupo)
  const publicar = body.publicar === true

  if (!titulo) return NextResponse.json({ error: "Falta el título" }, { status: 400 })
  if (!Number.isInteger(cityId) || cityId <= 0) {
    return NextResponse.json({ error: "Falta la ciudad" }, { status: 400 })
  }
  const inicio = new Date(startsAt)
  if (Number.isNaN(inicio.getTime())) {
    return NextResponse.json({ error: "Fecha de inicio inválida" }, { status: 400 })
  }
  // Convocar en el pasado no tiene sentido. El navegador ya lo impide con el
  // atributo min del campo, pero eso es una comodidad, no una garantía: la
  // regla tiene que estar también aquí.
  //
  // Se conceden 5 minutos de margen para no rechazar por el desfase entre el
  // reloj de quien convoca y el del servidor.
  const MARGEN_MS = 5 * 60 * 1000
  if (inicio.getTime() < Date.now() - MARGEN_MS) {
    return NextResponse.json(
      { error: "No se puede convocar un encuentro en una fecha que ya pasó." },
      { status: 400 },
    )
  }
  if (endsAt && new Date(endsAt) < inicio) {
    return NextResponse.json({ error: "El fin no puede ser anterior al inicio" }, { status: 400 })
  }
  if (cupo !== null && (!Number.isInteger(cupo) || cupo <= 0)) {
    return NextResponse.json({ error: "El cupo debe ser un número mayor que cero" }, { status: 400 })
  }

  // El país se toma del catálogo, no del cuerpo: si viniera del cliente, un
  // encuentro podría declararse en un país que no corresponde a su ciudad.
  const { data: ciudad, error: cErr } = await supabase
    .from("network_cities")
    .select("id, country_code")
    .eq("id", cityId)
    .eq("is_active", true)
    .maybeSingle()
  if (cErr || !ciudad) {
    return NextResponse.json({ error: "Esa ciudad no está en el catálogo" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("network_meetings")
    .insert({
      created_by: user.id,
      city_id: ciudad.id,
      country_code: ciudad.country_code,
      lugar,
      titulo,
      descripcion,
      starts_at: inicio.toISOString(),
      ends_at: endsAt,
      cupo,
      estado: publicar ? "publicado" : "borrador",
    })
    .select("id, estado")
    .single()

  if (error) {
    // La RLS rechaza a quien no tiene el rol vigente. No es un fallo del
    // servidor: es el permiso haciendo su trabajo.
    if (error.code === "42501" || /row-level security/i.test(error.message)) {
      return NextResponse.json(
        { error: "Necesitas la función de Organizador para convocar encuentros." },
        { status: 403 },
      )
    }
    console.error("[/api/red/encuentros] POST", error.message)
    return NextResponse.json({ error: "No se pudo crear el encuentro" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id, estado: data.estado }, { status: 201 })
}
