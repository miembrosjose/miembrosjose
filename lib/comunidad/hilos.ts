// CENTRO DE COMUNIDAD — LEER CONVERSACIONES.
//
// Una conversación ES una fila de `forum_posts`. No hay tabla nueva ni
// migración de contenido: lo único que se le añadió fue saber a qué espacio
// pertenece. Así los «me gusta», las respuestas, los reportes y las insignias
// de autor siguen funcionando exactamente igual que ayer.
//
// Este archivo concentra la forma de leerlas para que ninguna ruta se invente
// la suya y se olvide del filtro de acceso.

import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

/** Las columnas que la interfaz necesita de una conversación. */
export const CAMPOS_HILO =
  "id, user_id, author_name, author_username, author_avatar, author_avatar_url, " +
  "author_badge_id, author_star_id, author_flame_id, author_avatar_border, author_is_admin, " +
  "title, body, image_url, tags, likes_count, dislikes_count, replies_count, hot, " +
  "created_at, edited_at, pinned, pin_order, space_id, category_id, is_official, " +
  "is_locked, last_activity_at"

export type Orden = "recientes" | "activas" | "sin_respuesta"

export type FiltroHilos = {
  /** Espacios cuyo contenido puede leer quien pregunta. Nunca opcional. */
  legibles: string[]
  spaceId?: string | null
  categoryId?: string | null
  orden?: Orden
  /** Búsqueda en título y cuerpo. */
  q?: string | null
  limite?: number
  /** Cursor: la marca de actividad del último resultado de la página anterior. */
  antesDe?: string | null
  /** Solo las fijadas, o solo las no fijadas. Sin valor, todas. */
  fijadas?: boolean | null
}

/**
 * Lista conversaciones respetando SIEMPRE los espacios legibles.
 *
 * El filtro de acceso se aplica aquí, no en quien llama: si alguien añade una
 * ruta nueva y se olvida de comprobarlo, la consulta sigue sin devolver una
 * temporada cerrada.
 */
export async function listarHilos(filtro: FiltroHilos) {
  const limite = Math.min(Math.max(filtro.limite ?? 20, 1), 50)

  // Sin un solo espacio legible no hay nada que devolver, y conviene salir
  // antes: un `.in()` con lista vacía es un error en PostgREST, no una lista
  // vacía.
  if (filtro.legibles.length === 0) return { hilos: [], siguienteCursor: null as string | null }

  let q = getSupabaseAdmin()
    .from("forum_posts")
    .select(CAMPOS_HILO)
    .in("space_id", filtro.legibles)

  if (filtro.spaceId) {
    // Pedir un espacio concreto nunca amplía: si no estaba entre los legibles,
    // la intersección deja la consulta vacía.
    if (!filtro.legibles.includes(filtro.spaceId)) {
      return { hilos: [], siguienteCursor: null as string | null }
    }
    q = q.eq("space_id", filtro.spaceId)
  }
  if (filtro.categoryId) q = q.eq("category_id", filtro.categoryId)
  if (typeof filtro.fijadas === "boolean") q = q.eq("pinned", filtro.fijadas)

  if (filtro.q) {
    // Se limpia lo que rompería la sintaxis del filtro `.or` de PostgREST.
    const limpio = filtro.q.replace(/[,()%*\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80)
    if (limpio) q = q.or(`title.ilike.%${limpio}%,body.ilike.%${limpio}%`)
  }

  if (filtro.orden === "sin_respuesta") q = q.eq("replies_count", 0)

  // Por actividad, siempre. «Reciente» en una comunidad es «donde acaba de
  // pasar algo», no «lo último que se abrió»: una conversación de hace un mes
  // con una respuesta de hoy está más viva que una de ayer sin ninguna.
  q = q.order("last_activity_at", { ascending: false })

  if (filtro.antesDe) q = q.lt("last_activity_at", filtro.antesDe)

  const { data, error } = await q.limit(limite + 1)
  if (error) {
    console.error("[comunidad/hilos] listar", error.message)
    return { hilos: [], siguienteCursor: null as string | null }
  }

  const filas = data || []
  const hayMas = filas.length > limite
  const pagina = hayMas ? filas.slice(0, limite) : filas
  const ultimo = pagina[pagina.length - 1] as { last_activity_at?: string } | undefined

  return {
    hilos: pagina,
    siguienteCursor: hayMas ? ultimo?.last_activity_at ?? null : null,
  }
}

/**
 * Marca en cada conversación si quien mira le dio «me gusta», si la sigue y si
 * le puso «no me gusta». Tres consultas en lote, nunca una por fila.
 */
export async function marcarLoMio(
  supabase: SupabaseClient,
  userId: string,
  hilos: Array<Record<string, unknown>>,
) {
  const ids = hilos.map((h) => h.id)
  if (ids.length === 0) return hilos

  const admin = getSupabaseAdmin()
  const [{ data: gusta }, { data: noGusta }, { data: sigue }] = await Promise.all([
    supabase.from("forum_likes").select("post_id").eq("user_id", userId).in("post_id", ids),
    supabase.from("forum_dislikes").select("post_id").eq("user_id", userId).in("post_id", ids),
    admin.from("community_thread_follows").select("post_id").eq("user_id", userId).in("post_id", ids),
  ])

  const s1 = new Set((gusta || []).map((r) => (r as { post_id: unknown }).post_id))
  const s2 = new Set((noGusta || []).map((r) => (r as { post_id: unknown }).post_id))
  const s3 = new Set((sigue || []).map((r) => (r as { post_id: unknown }).post_id))

  return hilos.map((h) => ({
    ...h,
    liked_by_me: s1.has(h.id),
    disliked_by_me: s2.has(h.id),
    followed_by_me: s3.has(h.id),
  }))
}

/** Cuántas conversaciones y cuándo fue lo último, por espacio. */
export async function resumenPorEspacio(legibles: string[]) {
  const vacio = new Map<string, { conversaciones: number; ultima: string | null }>()
  if (legibles.length === 0) return vacio

  // Una sola lectura de dos columnas y el recuento en memoria. Con el tamaño
  // de hoy es más barato que diez consultas agregadas, y no necesita una vista.
  const { data } = await getSupabaseAdmin()
    .from("forum_posts")
    .select("space_id, last_activity_at")
    .in("space_id", legibles)

  for (const f of (data || []) as Array<{ space_id: string; last_activity_at: string | null }>) {
    const actual = vacio.get(f.space_id) ?? { conversaciones: 0, ultima: null }
    actual.conversaciones += 1
    if (f.last_activity_at && (!actual.ultima || f.last_activity_at > actual.ultima)) {
      actual.ultima = f.last_activity_at
    }
    vacio.set(f.space_id, actual)
  }
  return vacio
}
