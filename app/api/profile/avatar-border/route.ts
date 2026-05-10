// API — atualiza a cor de borda do avatar do user.
//
// PATCH /api/profile/avatar-border
//   Body: { color: string | null }
//   - color = null         → remove (volta pra borda padrão)
//   - color = string       → valida que está na paleta pré-definida
//   Salva em user.user_metadata.avatar_border_color.
//
// Paleta fixa pra evitar input livre (cores fora da identidade do produto).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export const AVATAR_BORDER_PALETTE = [
  "#7f1d1d", // red-900 marca
  "#c9a961", // gold marca
  "#ffffff", // branco
  "#10b981", // esmeralda
  "#3b82f6", // azul royal
  "#a855f7", // roxo
  "#b9f2ff", // diamond ciano
  "#ec4899", // rosa
] as const

const PALETTE_SET = new Set<string>(AVATAR_BORDER_PALETTE)

export async function PATCH(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { color?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const color = body.color
  if (color !== null && typeof color !== "string") {
    return NextResponse.json({ error: "color must be string or null" }, { status: 400 })
  }

  if (color !== null && !PALETTE_SET.has(color)) {
    return NextResponse.json({ error: "Color not in palette" }, { status: 400 })
  }

  const { error } = await supabase.auth.updateUser({
    data: { avatar_border_color: color },
  })
  if (error) {
    console.error("[/api/profile/avatar-border] updateUser error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  // Cascade: propaga a cor em TODAS as interações públicas do user
  // (posts antigos refletem a nova cor sem precisar editar manualmente).
  const admin = getSupabaseAdmin()
  await Promise.all([
    admin.from("forum_posts").update({ author_avatar_border: color }).eq("user_id", user.id),
    admin.from("forum_replies").update({ author_avatar_border: color }).eq("user_id", user.id),
    admin.from("episode_comments").update({ author_avatar_border: color }).eq("user_id", user.id),
    admin.from("funnel_feedbacks").update({ author_avatar_border: color }).eq("user_id", user.id),
    admin.from("user_funnels").update({ author_avatar_border: color }).eq("user_id", user.id),
  ]).catch((e) => {
    console.warn("[/api/profile/avatar-border] cascade warning:", e)
  })

  return NextResponse.json({ avatar_border_color: color })
}
