// API — atualiza a insignia destacada (featured_badge_id) do user.
//
// PATCH /api/profile/featured-badge
//   Body: { badge_id: string | null }
//   - badge_id = null         → remove insignia destacada
//   - badge_id = string       → valida que existe Y que el user la tiene
//   Salva em user.user_metadata.featured_badge_id.
//
// LA COMPROBACIÓN DE PROPIEDAD SE HACE AQUÍ, en el servidor. Antes no se
// hacía en ningún sitio —el comentario de este archivo decía que la fuente de
// verdad era el localStorage del prototipo— y cualquiera podía lucir el Sello
// del Admin, el Embajador Galáctico o un rol de la Red sin tenerlos.
//
// Las otras dos insignias destacadas (estrella y llama) sí comprobaban, pero
// contra una tabla que el propio navegador podía rellenar. Ahora las tres
// preguntan a lib/insignias-ganadas.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAchievementById } from "@/lib/achievements"
import { insigniasDisponibles } from "@/lib/insignias-ganadas"
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

  if (badgeId) {
    const suyas = await insigniasDisponibles(user)
    if (!suyas.has(badgeId)) {
      return NextResponse.json(
        { error: "Esa insignia no es tuya todavía." },
        { status: 403 },
      )
    }
  }

  const { error } = await supabase.auth.updateUser({
    data: { featured_badge_id: badgeId },
  })
  if (error) {
    console.error("[/api/profile/featured-badge] updateUser error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  // Cascade: propaga la insignia a TODAS las interacciones públicas.
  // Respeta la ELECCIÓN de la persona.
  //
  // Quitarse la insignia deja los mensajes SIN insignia, no con la
  // «Bienvenida»: esa está retirada del catálogo y ponerla era inventarle a
  // alguien una distinción que no eligió ni ganó.
  const cascadeBadgeId = badgeId || (isAdmin(user) ? "admin_seal" : null)
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
