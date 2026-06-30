// PATCH  /api/admin/products/[id] → edita
// DELETE /api/admin/products/[id] → remove + apaga mídia do R2 se houver

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"
import { deleteFromR2 } from "@/lib/r2"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

const EDITABLE = [
  "num",
  "name",
  "description",
  "media_url",
  "video_url",
  "thumb_url",
  "gradient",
  "emoji",
  "sort_order",
  "is_locked",
  "checkout_url",
] as const

export async function PATCH(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  for (const k of EDITABLE) if (k in body) patch[k] = body[k]
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select()
    .single()
  if (error) {
    console.error("[products PATCH] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ product: data })
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  const supabase = await getSupabaseServer()

  const { data: existing } = await supabase
    .from("products")
    .select("media_url")
    .eq("id", id)
    .single()

  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) {
    console.error("[products DELETE] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (existing?.media_url) {
    try { await deleteFromR2(existing.media_url) } catch (e) {
      console.warn("[products DELETE] R2 cleanup falhou:", e)
    }
  }
  return NextResponse.json({ ok: true })
}
