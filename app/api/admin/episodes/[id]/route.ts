// PATCH  /api/admin/episodes/[id] → edita episodio
// DELETE /api/admin/episodes/[id] → remove episodio

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"
import { deleteFromR2 } from "@/lib/r2"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

const EDITABLE_FIELDS = [
  "num",
  "title",
  "description",
  "video_url",
  "thumb_url",
  "sort_order",
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
  for (const k of EDITABLE_FIELDS) if (k in body) patch[k] = body[k]
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("episodes")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[episode PATCH] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ episode: data })
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  const supabase = await getSupabaseServer()

  // Pega thumb_url pra apagar do R2 (best-effort)
  const { data: existing } = await supabase
    .from("episodes")
    .select("thumb_url")
    .eq("id", id)
    .single()

  const { error } = await supabase.from("episodes").delete().eq("id", id)
  if (error) {
    console.error("[episode DELETE] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (existing?.thumb_url) {
    try { await deleteFromR2(existing.thumb_url) } catch (e) {
      console.warn("[episode DELETE] R2 cleanup falhou:", e)
    }
  }
  return NextResponse.json({ ok: true })
}
