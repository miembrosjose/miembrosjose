// GET /api/community-events?category=&limit=
// Actividad de la Red: eventos comunitarios (1 fila por evento). Lectura por RLS
// (autenticado ve public/members; admin ve todo). Eventos anónimos: se ocultan
// nombre y avatar del actor antes de responder. Degrada a [] si la tabla no existe.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function strip(row: any) {
  const anon = row.visibility === "anonymous" || row.actor_display_mode === "anonymous"
  return {
    id: row.id,
    type: row.type,
    actor_name: anon ? "Un miembro" : row.actor_name,
    actor_avatar_url: anon ? null : row.actor_avatar_url,
    title: row.title,
    preview: row.preview,
    link: row.link,
    category: row.category,
    priority: row.priority,
    country: row.country,
    city: row.city,
    created_at: row.created_at,
  }
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const limit = Math.min(parseInt(searchParams.get("limit") || "60", 10), 100)

  try {
    let query = supabase
      .from("community_events")
      .select("id, type, actor_name, actor_avatar_url, actor_display_mode, title, preview, link, visibility, category, priority, country, city, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (category && category !== "all") query = query.eq("category", category)

    const { data, error } = await query
    if (error) return NextResponse.json({ events: [] })
    return NextResponse.json({ events: (data || []).map(strip) })
  } catch {
    return NextResponse.json({ events: [] })
  }
}
