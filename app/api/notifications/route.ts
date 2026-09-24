// API — lista notificações do user atual.
//
// GET /api/notifications?unread_only=1&limit=50
//   Retorna { notifications, unread_count }
// POST /api/notifications/mark-all-read (não — é em rota separada)

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100)
  const unreadOnly = searchParams.get("unread_only") === "1"

  // FOMO de eventos de outros (level up, insignia, top3 etc) só aparece se
  // user está online no momento. Filtra notifs desses tipos com mais de 5min
  // — quem ficou offline não vê o evento depois. Tipos "_self" (suas próprias
  // conquistas) NÃO sofrem esse filtro: aparecem sempre, em qualquer momento.
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const liveOnlyTypes = `(public_level_up,public_insignia,public_streak,public_funnel_hot,public_funnel_new,public_top3,rank_up)`
  // SQL: ((type NOT IN (...)) OR (created_at >= 5min ago))
  const liveOrFresh = `type.not.in.${liveOnlyTypes},created_at.gte.${fiveMinAgo}`

  // `source_insignia_id` llegó con docs/sql/notificaciones_insignia.sql. Si esa
  // migración todavía no se ha corrido, la consulta falla y se repite sin esa
  // columna: la campana sigue funcionando, solo que sin el emblema.
  const BASE = "id, type, source_user_id, source_user_name, source_user_avatar_url, source_forum_post_id, source_forum_reply_id, source_feed_post_id, title, preview, read_at, created_at"
  const CON_INSIGNIA = BASE + ", source_insignia_id"

  const pedir = (campos: string) => {
    let q = supabase
      .from("notifications")
      .select(campos)
      .eq("user_id", user.id)
      .or(liveOrFresh)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (unreadOnly) q = q.is("read_at", null)
    return q
  }

  let { data, error } = await pedir(CON_INSIGNIA)
  if (error && /source_insignia_id|column|schema cache/i.test(error.message)) {
    ;({ data, error } = await pedir(BASE))
  }
  if (error) {
    console.error("[/api/notifications GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Count unread (mesma lógica de filtro do listing)
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null)
    .or(liveOrFresh)

  return NextResponse.json({
    notifications: data || [],
    unread_count: unreadCount || 0,
  })
}
