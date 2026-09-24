// API — progresso de episódios assistidos do user (sincroniza entre devices).
//
// GET  /api/profile/episode-progress
//   Retorna lista de episódios assistidos: [{ season_num, episode_num, watched_at }]
//
// POST /api/profile/episode-progress
//   Body: { season_num: number, episode_num: number }
//   Marca episódio como assistido (upsert idempotente — re-marcar não falha).
//
// Tabela user_episode_progress tem RLS — user só lê/escreve o próprio progresso.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { otorgarLasGanadas } from "@/lib/insignias-conceder"
import { insigniasGanadas } from "@/lib/insignias-ganadas"
import { otorgarXp } from "@/lib/xp-otorgar"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data, error } = await supabase
    .from("user_episode_progress")
    .select("season_num, episode_num, watched_at")
    .eq("user_id", user.id)
    .order("watched_at", { ascending: true })

  if (error) {
    console.error("[/api/profile/episode-progress GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ progress: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { season_num?: number; episode_num?: number }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const seasonNum = Number(body.season_num)
  const episodeNum = Number(body.episode_num)

  if (!Number.isInteger(seasonNum) || seasonNum < 1 || seasonNum > 99) {
    return NextResponse.json({ error: "Invalid season_num" }, { status: 400 })
  }
  if (!Number.isInteger(episodeNum) || episodeNum < 1 || episodeNum > 999) {
    return NextResponse.json({ error: "Invalid episode_num" }, { status: 400 })
  }

  // Lo que ya se podía demostrar ANTES de guardar este capítulo. Es lo que
  // permite después distinguir lo que este capítulo ha desbloqueado de lo que
  // simplemente faltaba en la tabla. Ver otorgarLasGanadas.
  let antes = new Set<string>()
  try {
    antes = await insigniasGanadas(user)
  } catch {
    // Si esto falla, se sigue: como mucho, un aviso de más.
  }

  // Upsert: re-marcar mesmo (S, E) não dá erro — PRIMARY KEY (user_id, season, episode).
  // onConflict: "user_id,season_num,episode_num" → ignora insert se já existe.
  const { error } = await supabase
    .from("user_episode_progress")
    .upsert(
      { user_id: user.id, season_num: seasonNum, episode_num: episodeNum },
      { onConflict: "user_id,season_num,episode_num", ignoreDuplicates: true },
    )

  if (error) {
    console.error("[/api/profile/episode-progress POST]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // ── Y lo que se haya ganado con este capítulo ──────────────────────────
  //
  // Se resuelve AQUÍ, en la misma petición y después de guardar el avance.
  // Antes lo pedía el navegador por su cuenta, en el mismo gesto: la petición
  // de la insignia adelantaba a la del capítulo, el servidor no encontraba el
  // avance que la justificaba y la rechazaba. Se veía el aviso en pantalla y
  // la insignia no quedaba en ningún sitio.
  //
  // Si falla, el capítulo YA está guardado y eso es lo importante: las
  // insignias se recuperan solas la próxima vez que se marque algo.
  let nuevas: string[] = []
  try {
    nuevas = await otorgarLasGanadas(user, antes)
  } catch (e) {
    console.error("[/api/profile/episode-progress] insignias", e)
  }

  // Ver un capítulo es lo que más cuesta y lo que más vale. Una vez por
  // capítulo: el origen es «s1e3», así que volver a marcarlo no repite.
  const xp = await otorgarXp(user, "episode_complete", `s${seasonNum}e${episodeNum}`)

  return NextResponse.json({ ok: true, insignias_nuevas: nuevas, xp })
}
