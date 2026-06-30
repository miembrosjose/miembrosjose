// GET  /api/admin/episodes/[id]/blocks → lista blocos do episodio
// POST /api/admin/episodes/[id]/blocks → cria novo bloco

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: RouteContext) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id: episodeId } = await ctx.params

  const { data, error } = await supabase
    .from("episode_blocks")
    .select("*")
    .eq("episode_id", episodeId)
    .order("position", { ascending: true })
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[blocks GET] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ blocks: data ?? [] })
}

export async function POST(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id: episodeId } = await ctx.params
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const position = body.position === "above_video" ? "above_video" : "below_video"
  const content = typeof body.content === "string" ? body.content : ""
  const sortOrder = Number(body.sort_order) || 0

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("episode_blocks")
    .insert({
      episode_id: episodeId,
      position,
      sort_order: sortOrder,
      content,
      kind: typeof body.kind === "string" ? body.kind : "text",
    })
    .select()
    .single()

  if (error) {
    console.error("[blocks POST] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ block: data }, { status: 201 })
}
