// PATCH  /api/admin/blocks/[id]  → edita bloco (content, position, sort_order)
// DELETE /api/admin/blocks/[id]  → remove bloco

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

const EDITABLE_FIELDS = ["content", "position", "sort_order", "kind"] as const

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
  // Sanitiza position se vier
  if (typeof patch.position === "string" && patch.position !== "above_video" && patch.position !== "below_video") {
    delete patch.position
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("episode_blocks")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[block PATCH] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ block: data })
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  const supabase = await getSupabaseServer()
  const { error } = await supabase.from("episode_blocks").delete().eq("id", id)
  if (error) {
    console.error("[block DELETE] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
