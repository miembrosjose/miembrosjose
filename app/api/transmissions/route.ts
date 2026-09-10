// GET /api/transmissions?category=&q=&featured=&limit=&offset=
//
// Lista de transmisiones publicadas. La búsqueda es 100% server-side (full-text
// de Postgres, config español) con expansión de sinónimos; nunca se descarga el
// corpus completo al navegador. Búsqueda y categoría se combinan.
//
// Devuelve solo campos PÚBLICOS (jamás source_basis/editorial_notes/etc).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { expandQuery } from "@/lib/transmissions-search"

export const dynamic = "force-dynamic"

const PUBLIC_COLS =
  "slug, title, excerpt, category_slug, tags, author_name, featured, featured_order, reading_time, image_url, related_season, related_episode_id, published_at"

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = (searchParams.get("category") || "").trim()
  const q = (searchParams.get("q") || "").trim()
  const featuredOnly = searchParams.get("featured") === "1"
  const limit = Math.min(parseInt(searchParams.get("limit") || "60", 10), 100)
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0)

  try {
    let query = supabase
      .from("transmissions")
      .select(PUBLIC_COLS)
      .eq("status", "published")

    if (category && category !== "all" && category !== "todos") {
      query = query.eq("category_slug", category)
    }
    if (featuredOnly) query = query.eq("featured", true)

    if (q) {
      // Full-text con sinónimos. Si no matchea nada, el resultado es [] y el
      // frontend muestra el estado vacío.
      query = query.textSearch("search", expandQuery(q), {
        type: "websearch",
        config: "spanish",
      })
    }

    // Orden: destacados primero (por featured_order), luego recientes.
    query = query
      .order("featured", { ascending: false })
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) {
      console.error("[/api/transmissions]", error)
      return NextResponse.json({ transmissions: [] })
    }
    return NextResponse.json({ transmissions: data || [] })
  } catch (e) {
    console.error("[/api/transmissions]", e)
    return NextResponse.json({ transmissions: [] })
  }
}
