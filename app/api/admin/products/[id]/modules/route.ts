// GET  /api/admin/products/[id]/modules → lista módulos do produto
// POST /api/admin/products/[id]/modules → cria novo módulo

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: RouteContext) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id: productId } = await ctx.params

  const { data, error } = await supabase
    .from("product_modules")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("num", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ modules: data ?? [] })
}

export async function POST(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id: productId } = await ctx.params
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const num = Number(body.num)
  const title = typeof body.title === "string" ? body.title.trim() : ""
  if (!Number.isInteger(num) || num < 1) {
    return NextResponse.json({ error: "num inválido" }, { status: 400 })
  }
  if (!title) return NextResponse.json({ error: "title obrigatório" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("product_modules")
    .insert({
      product_id: productId,
      num,
      title,
      description: typeof body.description === "string" ? body.description : null,
      video_url: typeof body.video_url === "string" ? body.video_url : null,
      thumb_url: typeof body.thumb_url === "string" ? body.thumb_url : null,
      sort_order: Number(body.sort_order) || num,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ module: data }, { status: 201 })
}
