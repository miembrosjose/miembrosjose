// API admin — upsert/delete de overrides de textos.
//
// POST /api/admin/site-texts
//   Body: { key: string, value: string }
//   Upsert: se já existe, atualiza. Se não, insere.
//
// DELETE /api/admin/site-texts?key=...
//   Remove override (volta pro default do código).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import { SITE_TEXTS } from "@/lib/site-texts"

export const dynamic = "force-dynamic"

const VALID_KEYS = new Set(SITE_TEXTS.map((e) => e.key))

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { key?: string; value?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const key = (body.key || "").trim()
  const value = (body.value || "").trim()
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 })
  if (!VALID_KEYS.has(key)) return NextResponse.json({ error: "key inválida" }, { status: 400 })
  if (!value) return NextResponse.json({ error: "value vazio (use DELETE pra remover override)" }, { status: 400 })
  if (value.length > 5000) return NextResponse.json({ error: "value muy largo" }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from("site_texts")
    .upsert(
      { key, value, updated_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    )
  if (error) {
    console.error("[/api/admin/site-texts POST]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const key = new URL(req.url).searchParams.get("key")
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin.from("site_texts").delete().eq("key", key)
  if (error) {
    console.error("[/api/admin/site-texts DELETE]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
