// PATCH  /api/admin/seasons/[id] → edita
// DELETE /api/admin/seasons/[id] → remove (+ apaga mídia do R2 se houver)

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"
import { deleteFromR2 } from "@/lib/r2"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

const EDITABLE_FIELDS = [
  "num",
  "name",
  "episodes",
  "starter",
  "external",
  "redirect_url",
  "video_bg",
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
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  // Pega só campos permitidos
  const patch: Record<string, unknown> = {}
  for (const k of EDITABLE_FIELDS) {
    if (k in body) patch[k] = body[k]
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("seasons")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[seasons PATCH] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ season: data })
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  const supabase = await getSupabaseServer()

  // Pega URL do vídeo pra remover do R2 antes
  const { data: existing } = await supabase
    .from("seasons")
    .select("video_bg")
    .eq("id", id)
    .single()

  const { error } = await supabase.from("seasons").delete().eq("id", id)
  if (error) {
    console.error("[seasons DELETE] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Remove vídeo do R2 (best-effort — não bloqueia se falhar)
  if (existing?.video_bg) {
    try {
      await deleteFromR2(existing.video_bg)
    } catch (e) {
      console.warn("[seasons DELETE] R2 cleanup falhou:", e)
    }
  }

  return NextResponse.json({ ok: true })
}
