// GET   /api/admin/seasons          → lista todas (qualquer autenticado)
// POST  /api/admin/seasons          → cria nova (só admin)
// Endpoints de update/delete em /api/admin/seasons/[id]/route.ts

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[seasons GET] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ seasons: data ?? [] })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const num = Number(body.num)
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!Number.isInteger(num) || num < 1) {
    return NextResponse.json({ error: "num inválido" }, { status: 400 })
  }
  if (!name) {
    return NextResponse.json({ error: "name obrigatório" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("seasons")
    .insert({
      num,
      name,
      episodes: Number(body.episodes) || 0,
      starter: Boolean(body.starter),
      external: Boolean(body.external),
      redirect_url: typeof body.redirect_url === "string" ? body.redirect_url : null,
      video_bg: typeof body.video_bg === "string" ? body.video_bg : null,
      gradient:
        typeof body.gradient === "string"
          ? body.gradient
          : "linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)",
      emoji: typeof body.emoji === "string" ? body.emoji : "🎬",
      sort_order: Number(body.sort_order) || num,
      is_locked: Boolean(body.is_locked),
      checkout_url: typeof body.checkout_url === "string" ? body.checkout_url : null,
    })
    .select()
    .single()

  if (error) {
    console.error("[seasons POST] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ season: data }, { status: 201 })
}
