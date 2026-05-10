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

  return NextResponse.json({ ok: true })
}
