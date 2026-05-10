// API — like/dislike em funnel.
//
// POST /api/funnels/[id]/react
//   Body: { vote: 'like' | 'dislike' | null }
//   - like/dislike: insere ou atualiza reação. Toggle se já era o mesmo voto.
//   - null: remove reação (clicou no botão ativo).
//   Retorna { vote, likes_count, dislikes_count }

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: funnelId } = await params
  if (!funnelId) return NextResponse.json({ error: "Invalid funnel id" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { vote?: string | null }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const vote = body.vote === "like" || body.vote === "dislike" ? body.vote : null

  // Estado atual
  const { data: existing } = await supabase
    .from("funnel_reactions")
    .select("vote")
    .eq("funnel_id", funnelId)
    .eq("user_id", user.id)
    .maybeSingle()

  let finalVote: "like" | "dislike" | null = null

  if (vote === null) {
    // Remove reação
    if (existing) {
      await supabase.from("funnel_reactions").delete().eq("funnel_id", funnelId).eq("user_id", user.id)
    }
    finalVote = null
  } else if (existing && existing.vote === vote) {
    // Toggle: clicou no mesmo voto → remove
    await supabase.from("funnel_reactions").delete().eq("funnel_id", funnelId).eq("user_id", user.id)
    finalVote = null
  } else {
    // Insere ou atualiza
    await supabase.from("funnel_reactions")
      .upsert({ funnel_id: funnelId, user_id: user.id, vote }, { onConflict: "funnel_id,user_id" })
    finalVote = vote
  }

  // Lê counters atualizados (trigger ja rodou)
  const { data: f } = await supabase.from("user_funnels").select("likes_count, dislikes_count").eq("id", funnelId).maybeSingle()

  return NextResponse.json({
    vote: finalVote,
    likes_count: f?.likes_count ?? 0,
    dislikes_count: f?.dislikes_count ?? 0,
  })
}
