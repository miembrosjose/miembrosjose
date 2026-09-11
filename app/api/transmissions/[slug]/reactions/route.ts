// GET  /api/transmissions/[slug]/reactions  → { counts: {emoji:n}, mine: [emoji] }
// POST /api/transmissions/[slug]/reactions  → body { emoji }; alterna (toggle).
//
// Reacciones de miembros sobre una transmisión. RLS: cada uno crea/borra las
// suyas; todos leen. Set de emojis permitido acotado (evita basura).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const ALLOWED = ["✨", "🙏", "❤️", "🔥", "💫"]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from("transmission_reactions")
      .select("emoji, user_id")
      .eq("transmission_slug", slug)
    if (error) return NextResponse.json({ counts: {}, mine: [] })

    const counts: Record<string, number> = {}
    const mine: string[] = []
    for (const r of data || []) {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1
      if (r.user_id === user.id) mine.push(r.emoji)
    }
    return NextResponse.json({ counts, mine })
  } catch {
    return NextResponse.json({ counts: {}, mine: [] })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { emoji?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const emoji = (body.emoji || "").trim()
  if (!ALLOWED.includes(emoji)) {
    return NextResponse.json({ error: "Emoji no permitido" }, { status: 400 })
  }

  // Toggle: si ya existe, la quita; si no, la crea.
  const { data: existing } = await supabase
    .from("transmission_reactions")
    .select("id")
    .eq("transmission_slug", slug)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle()

  if (existing) {
    await supabase.from("transmission_reactions").delete().eq("id", existing.id)
    return NextResponse.json({ ok: true, active: false })
  }

  const { error } = await supabase
    .from("transmission_reactions")
    .insert({ transmission_slug: slug, user_id: user.id, emoji })
  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json({ ok: true, active: true })
}
