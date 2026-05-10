// API — atualiza a estrella (community/post badge) destacada do user.
// Aparece no top-right da foto de perfil.
//
// PATCH /api/profile/featured-star
//   Body: { id: string | null }
//   - id = null         → remove
//   - id = string       → valida que existe E é category=community E user já desbloqueou
//   Salva em user.user_metadata.featured_star_id.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAchievementById } from "@/lib/achievements"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { id?: string | null }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const id = body.id
  if (id !== null && typeof id !== "string") {
    return NextResponse.json({ error: "id must be string or null" }, { status: 400 })
  }

  if (id !== null) {
    const ach = getAchievementById(id)
    if (!ach || ach.category !== "community") {
      return NextResponse.json({ error: "Insignia inválida pra estrella" }, { status: 400 })
    }
    // Verifica que o user desbloqueou
    const admin = getSupabaseAdmin()
    const { data: unlock } = await admin
      .from("user_unlocked_achievements")
      .select("achievement_id")
      .eq("user_id", user.id)
      .eq("achievement_id", id)
      .limit(1)
      .maybeSingle()
    if (!unlock) {
      return NextResponse.json({ error: "Estrella no desbloqueada" }, { status: 403 })
    }
  }

  const { error } = await supabase.auth.updateUser({
    data: { featured_star_id: id },
  })
  if (error) {
    console.error("[/api/profile/featured-star] updateUser error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  // Cascade: propaga em todas interações públicas (forum, replies, comments,
  // funnels, feedback). Best-effort — falha aqui não invalida o updateUser.
  const admin = getSupabaseAdmin()
  await Promise.all([
    admin.from("forum_posts").update({ author_star_id: id }).eq("user_id", user.id),
    admin.from("forum_replies").update({ author_star_id: id }).eq("user_id", user.id),
    admin.from("episode_comments").update({ author_star_id: id }).eq("user_id", user.id),
    admin.from("funnel_feedbacks").update({ author_star_id: id }).eq("user_id", user.id),
    admin.from("user_funnels").update({ author_star_id: id }).eq("user_id", user.id),
  ]).catch((e) => {
    console.warn("[/api/profile/featured-star] cascade warning:", e)
  })

  return NextResponse.json({ featured_star_id: id })
}
