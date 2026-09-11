// GET  /api/transmissions/reads       → { slugs: [...] }  transmisiones leídas por el usuario
// POST /api/transmissions/reads       → body { slug }; marca como leída (idempotente)
//
// "Leído" se marca cuando el usuario llega al final de una transmisión.
// RLS: cada usuario solo ve/escribe lo suyo. Degrada silencioso si falta la tabla.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from("transmission_reads")
      .select("transmission_slug")
      .eq("user_id", user.id)
    if (error) return NextResponse.json({ slugs: [] })
    return NextResponse.json({ slugs: (data || []).map((r) => (r as { transmission_slug: string }).transmission_slug) })
  } catch {
    return NextResponse.json({ slugs: [] })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { slug?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const slug = (body.slug || "").trim()
  if (!slug) return NextResponse.json({ error: "slug requerido" }, { status: 400 })

  try {
    await supabase
      .from("transmission_reads")
      .upsert({ user_id: user.id, transmission_slug: slug }, { onConflict: "user_id,transmission_slug" })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
