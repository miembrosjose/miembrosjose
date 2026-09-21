// GET /api/red/ciudades            → países disponibles (los que tienen ciudades)
// GET /api/red/ciudades?pais=EC    → ciudades de un país
// GET /api/red/ciudades?pais=EC&q=cue → autocompletado dentro del país
//
// El catálogo es público para miembros con sesión. La búsqueda se hace en la
// base contra name_norm (sin tildes) usando el índice
// idx_network_cities_search, nunca trayendo el catálogo entero al navegador.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { nombrePais, banderaPais, normalizar } from "@/lib/red/paises"

export const dynamic = "force-dynamic"

const MAX_RESULTS = 40

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const pais = (req.nextUrl.searchParams.get("pais") || "").toUpperCase().trim()
  const q = (req.nextUrl.searchParams.get("q") || "").trim()

  // ── Sin país: devuelve la lista de países que TIENEN ciudades ────────────
  // Así el selector nunca ofrece un país donde después no haya nada que elegir.
  if (!pais) {
    const { data, error } = await supabase
      .from("network_cities")
      .select("country_code")
      .eq("is_active", true)

    if (error) {
      console.error("[/api/red/ciudades] paises", error.message)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const counts = new Map<string, number>()
    for (const row of data || []) {
      const c = (row as { country_code: string }).country_code
      counts.set(c, (counts.get(c) || 0) + 1)
    }

    const paises = [...counts.entries()]
      .map(([code, cities]) => ({
        code,
        name: nombrePais(code),
        flag: banderaPais(code),
        cities,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es-419"))

    return NextResponse.json({ paises })
  }

  if (!/^[A-Z]{2}$/.test(pais)) {
    return NextResponse.json({ error: "País inválido" }, { status: 400 })
  }

  // ── Ciudades del país, con búsqueda opcional ─────────────────────────────
  let query = supabase
    .from("network_cities")
    .select("id, name, admin1, lat, lon")
    .eq("country_code", pais)
    .eq("is_active", true)

  if (q) {
    // name_norm ya está sin tildes y en minúsculas; normalizamos la consulta
    // igual para que «Cuenca», «cuenca» y «cuencá» encuentren lo mismo.
    query = query.ilike("name_norm", `%${normalizar(q)}%`)
  }

  const { data, error } = await query.order("name").limit(MAX_RESULTS)

  if (error) {
    console.error("[/api/red/ciudades] ciudades", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({
    pais: { code: pais, name: nombrePais(pais), flag: banderaPais(pais) },
    ciudades: (data || []).map((c) => {
      const row = c as { id: number; name: string; admin1: string | null; lat: number; lon: number }
      return {
        id: row.id,
        name: row.name,
        admin1: row.admin1,
        label: row.admin1 && row.admin1 !== row.name ? `${row.name} · ${row.admin1}` : row.name,
      }
    }),
  })
}
