// PATCH /api/admin/series-info — atualiza metadados da série (só admin).
// Pega a única row existente (single-row pattern).

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

const EDITABLE = ["description", "cast_text", "genres", "kind", "year", "rating", "quality"] as const

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

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
  // Single-row: pega o id da única row e atualiza
  const { data: existing } = await supabase
    .from("series_info")
    .select("id")
    .limit(1)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: "series_info não inicializado (rode supabase-series-info.sql)" }, { status: 500 })
  }

  const { data, error } = await supabase
    .from("series_info")
    .update(patch)
    .eq("id", existing.id)
    .select()
    .single()

  if (error) {
    console.error("[series-info PATCH] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ info: data })
}
