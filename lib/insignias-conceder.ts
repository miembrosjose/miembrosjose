// CONCEDER UNA INSIGNIA: la tabla, el XP y el aviso.
//
// ── POR QUÉ ESTÁ AQUÍ Y NO EN LA RUTA ──────────────────────────────────────
// Esto vivía dentro de /api/profile/insignia-unlocked, que es donde el
// navegador PIDE una insignia. Pero el navegador no es el único sitio donde
// se gana una: al marcar un capítulo como visto, el servidor ya sabe —él y
// nadie más— que alguien acaba de completar una temporada.
//
// Mientras la concesión vivió solo en aquella ruta hubo una carrera que rompía
// el sistema entero: el navegador guardaba el capítulo y comprobaba las
// insignias en el mismo gesto, así que la comprobación del servidor llegaba
// ANTES de que el capítulo estuviera guardado, no encontraba el avance y la
// rechazaba. Se veía el aviso en pantalla y la insignia no quedaba en ningún
// sitio.
//
// Ahora el avance y la insignia se resuelven en la misma petición, en el
// mismo orden y en el mismo sitio: primero se guarda el capítulo, después se
// mira qué se ha ganado con él. No hay carrera posible.

import type { User } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import type { Achievement } from "@/lib/achievements"
import { esGradoDelCamino, getAchievementById, rangoMasAlto } from "@/lib/achievements"
import { insigniasGanadas } from "@/lib/insignias-ganadas"
import { emitCommunityEvent } from "@/lib/notify"

/** XP por categoría. Las compras no dan: ya dieron un nivel al comprarse. */
const XP_POR_CATEGORIA: Record<string, number> = {
  progression: 50,
  community: 200,
  time: 200,
  agents: 200,
  products: 0,
  exclusive: 0,
}

/**
 * Las que se anuncian a toda la Red.
 *
 * El resto solo avisa a quien la gana. Anunciar cada insignia común llenaría
 * la Red de ruido y quitaría valor justo a las que importan.
 */
const SE_ANUNCIAN = new Set([
  "time_eterno", "rank_leyenda",
  "product_creativos", "product_andromeda", "product_analytics",
  "product_minivsl", "product_revisao",
  "rank_operador", "rank_estratega", "rank_capo", "rank_padrino",
  "time_habitue", "time_veterano",
  "training_complete",
])

/**
 * Deja constancia de una insignia ya comprobada: la guarda, da el XP que
 * corresponda y avisa.
 *
 * NO comprueba nada: quien llama tiene que haberlo hecho. Devuelve true si era
 * nueva, false si ya la tenía.
 */
export async function concederInsignia(
  user: User,
  id: string,
  opciones: { silencioso?: boolean } = {},
): Promise<boolean> {
  const ach = getAchievementById(id)
  if (!ach) return false

  const admin = getSupabaseAdmin()

  // `ignoreDuplicates` no dice si insertó. Se mira antes, porque de ello
  // depende si hay que avisar: repetir el aviso de algo que ya se tenía es
  // la forma más rápida de que la gente deje de mirarlos.
  const { data: yaLaTiene } = await admin
    .from("user_unlocked_achievements")
    .select("achievement_id")
    .eq("user_id", user.id)
    .eq("achievement_id", id)
    .maybeSingle()

  const { error } = await admin
    .from("user_unlocked_achievements")
    .upsert(
      { user_id: user.id, achievement_id: id },
      { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
    )
  if (error) {
    console.error("[insignias] no se pudo guardar %s: %s", id, error.message)
    return false
  }
  if (yaLaTiene) return false

  // ── XP, una sola vez por insignia ──
  const xp = XP_POR_CATEGORIA[ach.category] ?? 0
  const { data: yaCobro } = await admin
    .from("xp_events")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_type", "insignia_unlocked")
    .eq("source_id", id)
    .limit(1)

  if (!yaCobro?.length && xp > 0) {
    await admin.rpc("apply_xp_delta", {
      p_user_id: user.id,
      p_event_type: "insignia_unlocked",
      p_xp_delta: xp,
      p_level_delta: 0,
      p_source_table: "achievements",
      p_source_id: id,
    })
  }

  // Los productos suben un nivel al comprarse. Dedup propio.
  if (ach.category === "products") {
    const { data: yaSubio } = await admin
      .from("xp_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_type", "product_level_grant")
      .eq("source_id", id)
      .limit(1)
    if (!yaSubio?.length) {
      await admin.rpc("apply_xp_delta", {
        p_user_id: user.id,
        p_event_type: "product_level_grant",
        p_xp_delta: 0,
        p_level_delta: 1,
        p_source_table: "achievements",
        p_source_id: id,
      })
    }
  }

  // ── El aviso ──
  // `silencioso` es para cuando el servidor está recuperando de golpe lo que
  // ya se había ganado antes. Eso no es un momento de logro: avisar de seis
  // cosas a la vez convierte la campana en ruido y no dice nada nuevo.
  if (opciones.silencioso) {
    await destacarSiProcede(user, ach)
    return true
  }

  const meta = (user.user_metadata || {}) as { full_name?: string; avatar_url?: string }
  const nombre = meta.full_name || user.email?.split("@")[0] || "Miembro"
  const avatar = (typeof meta.avatar_url === "string" && meta.avatar_url) || null
  const emoji = ach.tier === "topo" ? "🔥" : ach.tier === "diamond" ? "💎" : ach.tier === "gold" ? "🥇" : "🥈"

  // SIEMPRE se avisa a quien la gana, se anuncie o no a la Red. Antes esto
  // colgaba de la lista de anuncios, así que la mayoría de las insignias no
  // dejaban ni rastro en la campana: se ganaban en silencio.
  //
  // Sin foto de perfil y CON el identificador de la insignia: en un aviso de
  // «Fulano te respondió» la cara es el dato, pero en «Desbloqueaste 144» lo
  // que hay que ver es el emblema. Poniendo la foto salía la tuya propia.
  //
  // Si la columna todavía no existe —falta correr
  // docs/sql/notificaciones_insignia.sql— se reintenta sin ella: antes un
  // emblema bonito que ningún aviso.
  const avisoBase = {
    user_id: user.id,
    type: "public_insignia_self",
    source_user_id: user.id,
    source_user_name: nombre,
    source_user_avatar_url: null,
    title: `Desbloqueaste "${ach.name}" ${emoji}`,
    preview: ach.desc,
  }
  const { error: errAviso } = await admin
    .from("notifications")
    .insert({ ...avisoBase, source_insignia_id: id })
  if (errAviso) {
    if (/source_insignia_id|column|schema cache/i.test(errAviso.message)) {
      await admin.from("notifications").insert(avisoBase)
    } else {
      console.warn("[insignias] aviso propio:", errAviso.message)
    }
  }

  if (SE_ANUNCIAN.has(id)) {
    await emitCommunityEvent({
      type: "public_insignia",
      actorUserId: user.id,
      actorName: nombre,
      actorAvatarUrl: avatar,
      title: `${nombre} desbloqueó "${ach.name}" ${emoji}`,
      preview: ach.desc,
      category: "badge",
      visibility: "members",
      priority: ach.tier === "topo" || ach.tier === "diamond" ? "highlight" : "important",
    })
  }

  await destacarSiProcede(user, ach)

  return true
}

/**
 * Ponerle la insignia recién ganada, sin que tenga que ir a su perfil.
 *
 * ── CUÁNDO SÍ Y CUÁNDO NO ────────────────────────────────────────────────
 * Ganar algo y que no se note es la forma más rápida de que deje de
 * importar. Pero pisarle a alguien la insignia que eligió a mano es peor: esa
 * elección es suya. La regla intenta respetar las dos cosas:
 *
 *   · Si no lleva ninguna, se le pone.
 *   · Si lleva una retirada del catálogo —la vieja «Bienvenida», por
 *     ejemplo—, se sustituye: eso no lo eligió nadie.
 *   · Si sube de grado dentro del Camino, se actualiza al grado nuevo: la
 *     escalera es una sola y nadie quiere seguir enseñando el peldaño de
 *     abajo.
 *   · En cualquier otro caso se deja lo que tenga puesto.
 *
 * Las cuentas de administración no se tocan: su Sello va con el cargo.
 *
 * NO se reescriben los mensajes antiguos. Cambiar hacia atrás la firma de lo
 * ya publicado es más de lo que pide "ponérsela ahora"; eso solo pasa cuando
 * la persona elige a mano desde su perfil.
 */
async function destacarSiProcede(user: User, ach: Achievement): Promise<void> {
  // Una insignia retirada no se luce ni aunque se acabe de conceder.
  if (ach.retirada) return
  if ((user.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true) return

  const admin = getSupabaseAdmin()

  // Se relee del servidor: dentro de una misma petición se pueden conceder
  // varias, y el objeto que llegó con la llamada ya estaría desfasado.
  const { data } = await admin.auth.admin.getUserById(user.id)
  const meta = (data?.user?.user_metadata || {}) as Record<string, unknown>
  const actual = typeof meta.featured_badge_id === "string" ? meta.featured_badge_id : ""
  const laDeAhora = actual ? getAchievementById(actual) : undefined

  const noLlevaNadaQueValga = !actual || !laDeAhora || laDeAhora.retirada === true
  const subeDeGrado =
    esGradoDelCamino(actual) &&
    esGradoDelCamino(ach.id) &&
    rangoMasAlto([actual, ach.id]) === ach.id

  if (!noLlevaNadaQueValga && !subeDeGrado) return

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, featured_badge_id: ach.id },
  })
  if (error) console.warn("[insignias] no se pudo destacar %s: %s", ach.id, error.message)
}

/**
 * Mira qué se ha ganado esta persona AHORA MISMO y concede lo que falte.
 *
 * Se llama justo después de guardar un hecho que puede desbloquear algo —un
 * capítulo visto, por ejemplo—. Devuelve solo lo que ese hecho ha
 * desbloqueado, para que la pantalla lo anuncie en el momento.
 *
 * ── CÓMO DISTINGUE LO NUEVO DE LO QUE FALTABA ────────────────────────────
 * `yaSeTenian` es lo que el servidor podía demostrar ANTES de guardar el
 * hecho. Todo lo que ya estaba ahí y aun así falta en la tabla es una
 * recuperación —una tabla recién limpiada, un reinicio, un dispositivo
 * nuevo—: se guarda en silencio, porque nadie acaba de lograrlo.
 *
 * Lo que aparece solo DESPUÉS es lo que este gesto ha desbloqueado, y eso sí
 * se anuncia.
 *
 * La primera versión de esto contaba cuántas caían de golpe y, si eran más de
 * dos, las callaba todas. Silenciaba también la buena: al ver el primer
 * capítulo con la tabla recién limpiada caían cuatro llamas de tiempo —que se
 * tenían desde hacía meses— y con ellas la insignia del capítulo. No sonaba
 * nada y el perfil no se enteraba.
 */
export async function otorgarLasGanadas(
  user: User,
  yaSeTenian: Set<string> = new Set(),
): Promise<string[]> {
  const ganadas = await insigniasGanadas(user)
  if (ganadas.size === 0) return []

  const admin = getSupabaseAdmin()
  const { data: yaTiene } = await admin
    .from("user_unlocked_achievements")
    .select("achievement_id")
    .eq("user_id", user.id)

  const suyas = new Set((yaTiene || []).map((r) => (r as { achievement_id: string }).achievement_id))
  const faltan = [...ganadas].filter((id) => !suyas.has(id))

  const nuevas: string[] = []
  for (const id of faltan) {
    // Ya era demostrable antes de este gesto: no se acaba de lograr.
    const recuperando = yaSeTenian.has(id)
    const concedida = await concederInsignia(user, id, { silencioso: recuperando })
    if (concedida && !recuperando) nuevas.push(id)
  }
  return nuevas
}
