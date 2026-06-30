// GET  /api/admin/seasons/[id]/episodes  → lista episodios da temporada
// POST /api/admin/seasons/[id]/episodes  → cria novo episodio

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: RouteContext) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id: seasonId } = await ctx.params

  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("season_id", seasonId)
    .order("sort_order", { ascending: true })
    .order("num", { ascending: true })

  if (error) {
    console.error("[episodes GET] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ episodes: data ?? [] })
}

export async function POST(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id: seasonId } = await ctx.params

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const num = Number(body.num)
  const title = typeof body.title === "string" ? body.title.trim() : ""
  if (!Number.isInteger(num) || num < 1) {
    return NextResponse.json({ error: "num inválido" }, { status: 400 })
  }
  if (!title) {
    return NextResponse.json({ error: "title obrigatório" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("episodes")
    .insert({
      season_id: seasonId,
      num,
      title,
      description: typeof body.description === "string" ? body.description : null,
      video_url: typeof body.video_url === "string" ? body.video_url : null,
      thumb_url: typeof body.thumb_url === "string" ? body.thumb_url : null,
      sort_order: Number(body.sort_order) || num,
    })
    .select()
    .single()

  if (error) {
    console.error("[episodes POST] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ episode: data }, { status: 201 })
}
