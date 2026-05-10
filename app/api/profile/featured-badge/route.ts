// API — atualiza a insignia destacada (featured_badge_id) do user.
//
// PATCH /api/profile/featured-badge
//   Body: { badge_id: string | null }
//   - badge_id = null         → remove insignia destacada
//   - badge_id = string       → valida que existe em lib/achievements.ts
//   Salva em user.user_metadata.featured_badge_id.
//
// NOTA: a verificação "user tem essa insignia desbloqueada?" é client-side
// (localStorage do prototipo). Server NÃO valida ownership porque a fonte
// de verdade do unlocked ainda é localStorage. Se algum dia migrar pra
// Supabase, validar aqui.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAchievementById } from "@/lib/achievements"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { badge_id?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const badgeId = body.badge_id
  if (badgeId !== null && typeof badgeId !== "string") {
    return NextResponse.json({ error: "badge_id must be string or null" }, { status: 400 })
  }

  if (badgeId && !getAchievementById(badgeId)) {
    return NextResponse.json({ error: "Invalid badge_id" }, { status: 400 })
  }

  const { error } = await supabase.auth.updateUser({
    data: { featured_badge_id: badgeId },
  })
  if (error) {
    console.error("[/api/profile/featured-badge] updateUser error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  // Cascade: propaga a insignia em TODAS as interações públicas do user.
  // Respeita a ESCOLHA do user (admin pode escolher Recluta, Bienvenido, etc).
  // Fallbacks: admin → admin_seal, outros → welcome (todo user tem por default).
  const cascadeBadgeId = badgeId || (isAdmin(user) ? "admin_seal" : "welcome")
  const admin = getSupabaseAdmin()
  await Promise.all([
    admin.from("forum_posts").update({ author_badge_id: cascadeBadgeId }).eq("user_id", user.id),
    admin.from("forum_replies").update({ author_badge_id: cascadeBadgeId }).eq("user_id", user.id),
    admin.from("episode_comments").update({ author_badge_id: cascadeBadgeId }).eq("user_id", user.id),
    admin.from("funnel_feedbacks").update({ author_badge_id: cascadeBadgeId }).eq("user_id", user.id),
    admin.from("user_funnels").update({ author_badge_id: cascadeBadgeId }).eq("user_id", user.id),
  ]).catch((e) => {
    console.warn("[/api/profile/featured-badge] cascade warning:", e)
    // Não falha — o user_metadata foi atualizado com sucesso, cascade é best-effort
  })

  return NextResponse.json({ featured_badge_id: badgeId })
}
