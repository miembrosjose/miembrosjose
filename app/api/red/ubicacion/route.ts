// GET  /api/red/ubicacion  → mi ubicación y su privacidad
// PUT  /api/red/ubicacion  → guardar país + ciudad + visibilidad
//
// Solo la fila propia, siempre. Se escribe con el cliente de sesión (rol
// authenticated), de modo que la RLS de member_location es la que manda: aunque
// alguien manipulase el cuerpo de la petición, no puede escribir la fila de
// otro. No se usa service_role aquí a propósito.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { nombrePais } from "@/lib/red/paises"

export const dynamic = "force-dynamic"

type CityRow = {
  id: number
  name: string
  admin1: string | null
  country_code: string
  lat: number
  lon: number
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data, error } = await supabase
    .from("member_location")
    .select("country_code, city_id, show_city, network_cities(id, name, admin1, country_code, lat, lon)")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("[/api/red/ubicacion] GET", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
  if (!data) return NextResponse.json({ location: null })

  const city = (data.network_cities as unknown as CityRow | null) || null
  return NextResponse.json({
    location: {
      country_code: data.country_code,
      country_name: nombrePais(data.country_code),
      city_id: data.city_id,
      city_name: city?.name ?? null,
      city_admin1: city?.admin1 ?? null,
      show_city: data.show_city,
    },
  })
}

export async function PUT(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { country_code?: unknown; city_id?: unknown; show_city?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const countryCode = typeof body.country_code === "string" ? body.country_code.toUpperCase().trim() : ""
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return NextResponse.json({ error: "País inválido" }, { status: 400 })
  }

  const cityId =
    body.city_id === null || body.city_id === undefined || body.city_id === ""
      ? null
      : Number(body.city_id)
  if (cityId !== null && (!Number.isInteger(cityId) || cityId <= 0)) {
    return NextResponse.json({ error: "Ciudad inválida" }, { status: 400 })
  }

  const showCity = body.show_city === true

  // La ciudad debe existir y pertenecer al país indicado. Sin esto se podría
  // guardar «Cuenca» declarando país España y romper los recuentos.
  if (cityId !== null) {
    const { data: city, error: cityErr } = await supabase
      .from("network_cities")
      .select("id, country_code")
      .eq("id", cityId)
      .maybeSingle()
    if (cityErr) {
      console.error("[/api/red/ubicacion] city lookup", cityErr.message)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
    if (!city) return NextResponse.json({ error: "Ciudad no encontrada" }, { status: 400 })
    if ((city as { country_code: string }).country_code !== countryCode) {
      return NextResponse.json({ error: "La ciudad no pertenece al país elegido" }, { status: 400 })
    }
  }

  // Sin ciudad no hay nada que mostrar en el directorio.
  const effectiveShowCity = cityId === null ? false : showCity

  const { error } = await supabase.from("member_location").upsert(
    {
      user_id: user.id,
      country_code: countryCode,
      city_id: cityId,
      show_city: effectiveShowCity,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )

  if (error) {
    console.error("[/api/red/ubicacion] PUT", error.message)
    return NextResponse.json({ error: "No se pudo guardar la ubicación" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, show_city: effectiveShowCity })
}
