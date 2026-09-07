// GET /api/geocode?q=... → proxy a Nominatim (OpenStreetMap), sin key.
// Se hace desde el servidor para respetar la CSP (connect-src) y la política de
// uso de Nominatim (User-Agent). Devuelve resultados normalizados y ligeros.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  // Solo miembros autenticados (evita abuso del proxy).
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const q = new URL(req.url).searchParams.get("q")?.trim() || ""
  if (q.length < 3) return NextResponse.json({ results: [] })

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=es&q=${encodeURIComponent(q)}`
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Los144000/1.0 (miembros)", "Accept": "application/json" },
      // cache moderado
      next: { revalidate: 3600 },
    })
    if (!r.ok) return NextResponse.json({ results: [] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await r.json()) as any[]
    const results = (data || []).map((d) => {
      const a = d.address || {}
      return {
        label: d.display_name as string,
        lat: parseFloat(d.lat), lon: parseFloat(d.lon),
        country: (a.country as string) || "",
        region: (a.state || a.region || a.province || "") as string,
        city: (a.city || a.town || a.village || a.municipality || a.county || "") as string,
      }
    })
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
