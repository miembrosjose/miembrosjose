// PROPAGAR LA INSIGNIA DESTACADA A TODO LO QUE YA ESTÁ PUBLICADO.
//
// ── POR QUÉ HACE FALTA PROPAGAR NADA ───────────────────────────────────────
// Cada mensaje del foro, cada respuesta y cada comentario guarda una COPIA de
// quién lo escribió: nombre, foto e insignia. Se hace así para que la lista se
// pinte de una sola consulta, sin ir a buscar el perfil de cada autor.
//
// El precio es que esas copias envejecen. Quien gana una insignia la ve en el
// menú y en su perfil, pero sus mensajes de ayer siguen enseñando la anterior
// —o ninguna—, y desde fuera parece que no ha pasado nada.
//
// ── POR QUÉ SE REESCRIBE EL PASADO ─────────────────────────────────────────
// Podría parecer que reescribir mensajes antiguos es falsear su historia. No
// lo es: la insignia no es un dato DEL MENSAJE, es un dato DE LA PERSONA que
// aparece junto a él. Nadie espera que un avatar antiguo siga siendo la foto
// que tenías aquel día, y con la insignia pasa igual.
//
// Esto ya existía dentro de /api/profile/featured-badge, donde solo corría
// cuando alguien la elegía a mano. Vive aquí para que también corra cuando la
// insignia la pone el servidor al concederla.

import { getSupabaseAdmin } from "@/lib/supabase/admin"

/** Las tablas que guardan una copia de la insignia del autor. */
const TABLAS = [
  "forum_posts",
  "forum_replies",
  "episode_comments",
  "funnel_feedbacks",
  "user_funnels",
] as const

/**
 * Pone `badgeId` en todo lo que esta persona haya publicado.
 *
 * `null` deja los mensajes SIN insignia. Es lo correcto: quitarse la insignia
 * y que aparezca otra por defecto sería inventarle a alguien una distinción
 * que no eligió.
 *
 * No lanza. Si una tabla falla, el resto sigue: la insignia destacada ya está
 * guardada en el perfil, que es lo que manda. Esto es solo el reflejo.
 */
export async function propagarInsignia(userId: string, badgeId: string | null): Promise<void> {
  const admin = getSupabaseAdmin()
  const resultados = await Promise.allSettled(
    TABLAS.map((t) => admin.from(t).update({ author_badge_id: badgeId }).eq("user_id", userId)),
  )
  resultados.forEach((r, i) => {
    if (r.status === "rejected") {
      console.warn("[insignias] no se pudo propagar a %s: %s", TABLAS[i], r.reason)
    }
  })
}
