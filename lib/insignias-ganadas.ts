// QUÉ INSIGNIAS TIENE DE VERDAD UNA PERSONA.
//
// ── POR QUÉ EXISTE ESTE ARCHIVO ────────────────────────────────────────────
// Durante un tiempo, /api/profile/insignia-unlocked concedía CUALQUIER
// insignia del catálogo a quien la pidiera. Bastaba con una línea en la
// consola del navegador para ponerse «Instructor de Los 144.000» o
// «Embajador Galáctico», y el sincronizador del navegador lo hacía solo: la
// copia en localStorage se subía entera al servidor en cada arranque.
//
// De ahí salían dos síntomas que parecían distintos:
//   · Cualquiera podía elegir insignias que no había ganado.
//   · Reiniciar el avance de alguien no servía de nada: el servidor se
//     vaciaba y el navegador volvía a subirlo todo al recargar.
//
// Este módulo es la respuesta a una sola pregunta —¿esta persona tiene esta
// insignia?— y la contesta MIRANDO LOS HECHOS, no lo que diga el cliente.
//
// ── LAS TRES CLASES DE INSIGNIA ────────────────────────────────────────────
//   1. LIBRES      · No dependen de nada. Solo `welcome`, que se concede al
//                    entrar por primera vez y la tiene todo el mundo.
//      AUTODECLARABLES · El círculo VIP: se concede al abrir el enlace de la
//                    comunidad, un gesto que el servidor no puede observar.
//                    Se acepta si se pide, pero NO se da a quien no la pida.
//   2. VERIFICABLES· El servidor puede comprobarlas: capítulos vistos, días
//                    de acceso, aportaciones al foro, compras.
//   3. DEL SERVIDOR· Las concede la administración o un proceso interno.
//                    NUNCA se pueden pedir. Aquí se rechazan siempre: si
//                    aparecen, es porque alguien las escribió en la tabla
//                    desde un endpoint de administración.

import type { User } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import {
  getAchievementById,
  computeCommunityRank,
  computeTimeBadges,
  rangosHasta,
} from "@/lib/achievements"

/** La tiene todo el mundo desde que entra. Es el valor por defecto. */
const LIBRES = new Set(["welcome"])

/**
 * Se conceden a quien las pide, pero no se dan solas.
 *
 * El Círculo VIP marca que alguien abrió el enlace del grupo. Eso pasa en
 * WhatsApp, fuera de la plataforma: el servidor no lo puede ver. Se acepta la
 * petición del navegador —no da ninguna ventaja— pero no se reparte a quien
 * nunca la pidió, que es lo que haría meterla entre las libres.
 */
export const AUTODECLARABLES = new Set(["vip_community"])

/**
 * La compra que concede cada insignia de producto.
 *
 * La clave es la de `stripe_sales.items[].key`, la misma que usa
 * /api/profile/owned-products.
 */
const COMPRA_A_INSIGNIA: Record<string, string> = {
  creativos: "product_creativos",
  andromeda: "product_andromeda",
  analytics: "product_analytics",
  revisao: "product_revisao",
  minivsl: "product_minivsl",
  "bonus-ganchos": "product_bonus_ganchos",
}

/**
 * El conjunto de insignias que el servidor puede DEMOSTRAR que alguien ganó.
 *
 * No incluye las que concede la administración: esas viven en
 * `user_unlocked_achievements` y se consultan aparte.
 */
export async function insigniasGanadas(user: User): Promise<Set<string>> {
  const admin = getSupabaseAdmin()
  const ganadas = new Set<string>(LIBRES)

  const meta = (user.user_metadata || {}) as { unique_login_days?: number }

  const [progreso, temporadas, capitulos, posts, respuestas, ventas] = await Promise.all([
    admin.from("user_episode_progress").select("season_num, episode_num").eq("user_id", user.id),
    admin.from("seasons").select("id, num, episodes, external"),
    admin.from("episodes").select("season_id"),
    admin.from("forum_posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    admin.from("forum_replies").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    admin.from("stripe_sales").select("items").eq("user_id", user.id).eq("status", "paid"),
  ])

  // ── Capítulos vistos ─────────────────────────────────────────────────────
  const vistos = new Set(
    (progreso.data || []).map((r) => {
      const x = r as { season_num: number; episode_num: number }
      return `${x.season_num}:${x.episode_num}`
    }),
  )
  const vistosPorTemporada = new Map<number, number>()
  for (const clave of vistos) {
    const n = Number(clave.split(":")[0])
    vistosPorTemporada.set(n, (vistosPorTemporada.get(n) || 0) + 1)
  }

  if (vistos.size >= 1) ganadas.add("first_lesson")
  if (vistos.has("1:1")) ganadas.add("agent_estratega")
  // Semilla Estelar marca a quien EMPEZÓ la Temporada 1, no a quien terminó.
  if ((vistosPorTemporada.get(1) || 0) >= 1) ganadas.add("semilla_estelar")

  // Cuántos capítulos tiene cada temporada. Se cuentan las filas reales de
  // `episodes`; el campo `seasons.episodes` queda de respaldo por si una
  // temporada se declaró sin cargarle todavía los capítulos.
  const porTemporada = new Map<string, number>()
  for (const e of (capitulos.data || []) as Array<{ season_id: string }>) {
    porTemporada.set(e.season_id, (porTemporada.get(e.season_id) || 0) + 1)
  }

  type FilaTemporada = { id: string; num: number; episodes: number | null; external: boolean | null }
  const listaTemporadas = (temporadas.data || []) as FilaTemporada[]

  let todasCompletas = listaTemporadas.length > 0
  for (const t of listaTemporadas) {
    if (t.external) continue
    const total = porTemporada.get(t.id) || t.episodes || 0
    // Una temporada sin capítulos no está "completa": está vacía. Contarla
    // como completa regalaría la insignia a quien no ha visto nada.
    if (total <= 0) { todasCompletas = false; continue }
    if ((vistosPorTemporada.get(t.num) || 0) >= total) ganadas.add(`season_${t.num}_complete`)
    else todasCompletas = false
  }
  if (todasCompletas) ganadas.add("training_complete")

  // ── Aportaciones al foro → patente de comunidad ──────────────────────────
  const aportaciones = (posts.count || 0) + (respuestas.count || 0)
  for (const id of rangosHasta(computeCommunityRank(aportaciones).level)) ganadas.add(id)

  // ── Días de acceso → llamas ──────────────────────────────────────────────
  for (const id of computeTimeBadges(Number(meta.unique_login_days) || 0)) ganadas.add(id)

  // ── Compras ──────────────────────────────────────────────────────────────
  for (const fila of (ventas.data || []) as Array<{ items: Array<{ key?: string }> | null }>) {
    for (const it of fila.items || []) {
      if (!it?.key) continue
      const clave = it.key.replace(/__downsell$/, "")
      const insignia = COMPRA_A_INSIGNIA[clave]
      if (insignia) ganadas.add(insignia)
    }
  }

  // ── Lo retirado no se vuelve a conceder ─────────────────────────────────
  //
  // Una insignia `retirada` está fuera del catálogo: quien la tenga se la
  // queda, pero no se da a nadie más. Eso incluye la «Bienvenida», la
  // «Primera Clase», «Semilla Estelar» y las de producto.
  //
  // Sin esta regla pasaba algo que parecía otra cosa: cada vez que alguien
  // marcaba un capítulo, el servidor deducía esas insignias viejas, las
  // concedía otra vez y mandaba un aviso por cada una. Después de limpiar la
  // tabla, la primera clase vista devolvía media docena de avisos de
  // insignias que se acababan de borrar.
  //
  // Nunca se cuela tampoco algo que no esté en el catálogo.
  for (const id of [...ganadas]) {
    const ach = getAchievementById(id)
    if (!ach || ach.retirada) ganadas.delete(id)
  }

  return ganadas
}

/**
 * Todo lo que esta persona puede LUCIR: lo que se ha ganado más lo que le
 * concedió la administración, que vive en `user_unlocked_achievements`.
 *
 * Es la lista que gobierna el selector del perfil y la que validan los tres
 * endpoints de insignia destacada.
 */
export async function insigniasDisponibles(user: User): Promise<Set<string>> {
  const admin = getSupabaseAdmin()
  const [ganadas, concedidas] = await Promise.all([
    insigniasGanadas(user),
    admin.from("user_unlocked_achievements").select("achievement_id").eq("user_id", user.id),
  ])

  for (const fila of (concedidas.data || []) as Array<{ achievement_id: string }>) {
    if (getAchievementById(fila.achievement_id)) ganadas.add(fila.achievement_id)
  }

  // El Sello del Admin va con el cargo, no con la tabla.
  const esAdmin = (user.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true
  if (esAdmin) ganadas.add("admin_seal")
  else ganadas.delete("admin_seal")

  return ganadas
}
