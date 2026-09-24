// CENTRO DE COMUNIDAD — QUIÉN PUEDE VER QUÉ, Y QUIÉN PUEDE HACER QUÉ.
//
// ── POR QUÉ ESTO VIVE EN UN SOLO ARCHIVO ───────────────────────────────────
// Esconder el botón de la Temporada 4 no protege nada: basta con pedir esa
// dirección a mano para leer las conversaciones de una etapa que todavía no se
// ha recorrido, y eso es exactamente lo que no debe pasar. La regla de acceso
// tiene que vivir donde se sirven los datos, no donde se pintan.
//
// Aquí está esa regla, una sola vez. Todas las rutas de /api/comunidad la
// piden antes de devolver nada.
//
// ── LAS DOS PREGUNTAS ──────────────────────────────────────────────────────
//   1. ¿Puede ENTRAR en este espacio? Los permanentes son de todos. Los de
//      temporada se abren con el acceso a esa temporada.
//   2. ¿Qué puede HACER? Miembro, moderación o administración.
//
// ── UNA TEMPORADA NO SE CIERRA AL AVANZAR ──────────────────────────────────
// Quien llega a la Temporada 3 conserva la 1 y la 2. Lo que se vivió ahí
// —preguntas, respuestas, experiencias— sigue siendo suyo y sigue siendo útil
// para quien venga detrás. Solo las etapas que aún no se han abierto quedan
// cerradas, y se ven cerradas: se sabe que existen, no lo que dicen.

import type { User } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getNetworkRoles } from "@/lib/red/roles"

export type EspacioComunidad = {
  id: string
  slug: string
  name: string
  kicker: string
  description: string
  /**
   * 'global' · permanente, de todos y siempre.
   * 'season' · una de las cuatro temporadas.
   * 'hito'   · un paso del camino que no es una temporada: los portales que
   *            hay entre ellas, el Umbral, los Objetivos, la Misión.
   */
  tipo: "global" | "season" | "hito"
  season_num: number | null
  /** Solo en los hitos: la temporada que hay que tener abierta para entrar. */
  desbloquea_con: number | null
  icono: string
  sort_order: number
  activo: boolean
}

export type CategoriaComunidad = {
  id: string
  space_id: string
  slug: string
  name: string
  description: string
  sort_order: number
}

/**
 * Lo que alguien puede hacer en la comunidad.
 *
 * No se inventa un sistema de roles nuevo: administración es la misma que en
 * el resto de la plataforma, y la moderación se apoya en el rol de Guardián de
 * La Red, que ya existe y ya se concede desde el panel.
 */
export type PapelComunidad = "miembro" | "moderacion" | "administracion"

export async function papelDe(user: User): Promise<PapelComunidad> {
  if ((user.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true) {
    return "administracion"
  }
  const roles = await getNetworkRoles(user.id)
  if (roles.includes("guardian")) return "moderacion"
  return "miembro"
}

export function puedeModerar(papel: PapelComunidad): boolean {
  return papel === "moderacion" || papel === "administracion"
}

/** Solo administración toca la estructura: espacios, categorías, orden. */
export function puedeEstructurar(papel: PapelComunidad): boolean {
  return papel === "administracion"
}

/**
 * Todos los espacios, en orden.
 *
 * ── POR QUÉ HAY UN SEGUNDO INTENTO ────────────────────────────────────────
 * `desbloquea_con` llegó con docs/sql/comunidad_03_recorrido.sql. Si esa
 * migración no se ha aplicado —o se quedó a medias—, pedir esa columna hace
 * fallar la consulta entera, y entonces esto devolvía una lista VACÍA: sin
 * espacios no hay espacios legibles, y sin espacios legibles el foro aparece
 * completamente vacío aunque las conversaciones estén ahí.
 *
 * Una columna que falta no puede esconder el foro. Se reintenta sin ella y la
 * comunidad sigue funcionando con lo que había antes; los pasos del camino
 * aparecerán cuando la migración entre.
 */
export async function todosLosEspacios(): Promise<EspacioComunidad[]> {
  const admin = getSupabaseAdmin()
  const BASE = "id, slug, name, kicker, description, tipo, season_num, icono, sort_order, activo"

  const pedir = (campos: string) =>
    admin
      .from("community_spaces")
      .select(campos)
      .eq("activo", true)
      .order("sort_order", { ascending: true })

  let { data, error } = await pedir(BASE + ", desbloquea_con")
  if (error) {
    if (!/desbloquea_con|column|schema cache/i.test(error.message)) {
      console.error("[comunidad/acceso] espacios", error.message)
    }
    ;({ data, error } = await pedir(BASE))
  }
  if (error) {
    console.error("[comunidad/acceso] espacios (segundo intento)", error.message)
    return []
  }

  // Sin la columna, un hito no sabría con qué se abre. Se le pone la temporada
  // más alta: es lo más conservador —queda cerrado hasta el final del camino—
  // y nunca enseña de más.
  return ((data || []) as unknown as EspacioComunidad[]).map((e) => ({
    ...e,
    desbloquea_con: e.desbloquea_con ?? (e.tipo === "hito" ? 4 : null),
  }))
}

export async function categoriasDe(spaceIds: string[]): Promise<CategoriaComunidad[]> {
  if (spaceIds.length === 0) return []
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from("community_categories")
    .select("id, space_id, slug, name, description, sort_order")
    .in("space_id", spaceIds)
    .eq("activo", true)
    .order("sort_order", { ascending: true })
  return (data || []) as CategoriaComunidad[]
}

/**
 * Las temporadas abiertas para esta persona, por NÚMERO.
 *
 * Se suman dos fuentes, y sumar nunca quita:
 *   · `user_season_access`, que es la puerta comercial y la que ya gobierna el
 *     resto de la plataforma. Se traduce de id a número con la tabla
 *     `seasons`, porque el número es lo estable entre entornos.
 *   · Haber visto algún capítulo de esa temporada. Quien ya estuvo dentro no
 *     puede quedarse fuera de su conversación por un desajuste de la otra
 *     tabla.
 *
 * Administración las tiene todas: gestiona y modera en todas partes.
 */
export async function temporadasAbiertas(user: User, papel: PapelComunidad): Promise<Set<number>> {
  const admin = getSupabaseAdmin()

  const { data: temporadas } = await admin.from("seasons").select("id, num")
  const numPorId = new Map<string, number>()
  for (const s of (temporadas || []) as Array<{ id: string; num: number }>) {
    numPorId.set(s.id, s.num)
  }

  if (papel === "administracion") return new Set(numPorId.values())

  const abiertas = new Set<number>()

  const [{ data: acceso }, { data: avance }] = await Promise.all([
    admin.from("user_season_access").select("season_id").eq("user_id", user.id),
    admin.from("user_episode_progress").select("season_num").eq("user_id", user.id),
  ])

  for (const a of (acceso || []) as Array<{ season_id: string }>) {
    const n = numPorId.get(a.season_id)
    if (n) abiertas.add(n)
  }
  for (const p of (avance || []) as Array<{ season_num: number }>) {
    if (Number.isFinite(p.season_num)) abiertas.add(Number(p.season_num))
  }

  return abiertas
}

/**
 * ¿Puede entrar en este espacio?
 *
 *   global · siempre. Presentarse, contar lo que se vivió o preguntar no
 *            depende de por dónde vaya nadie.
 *   season · solo con esa temporada abierta.
 *   hito   · con la temporada que lo precede. El Portal del Compromiso se abre
 *            al tener la Temporada 1; los Objetivos y la Misión, al tener la 4.
 *            Así el final del camino no se lee antes de recorrerlo.
 */
export function puedeEntrar(espacio: EspacioComunidad, abiertas: Set<number>): boolean {
  if (espacio.tipo === "global") return true
  if (espacio.tipo === "season") {
    return espacio.season_num !== null && abiertas.has(espacio.season_num)
  }
  return espacio.desbloquea_con !== null && abiertas.has(espacio.desbloquea_con)
}

/**
 * Los ids de espacio cuyo CONTENIDO puede leer esta persona.
 *
 * Es lo que se pasa a cualquier consulta de conversaciones. Mientras toda
 * lectura pase por aquí, no hay forma de asomarse a una temporada cerrada
 * cambiando la dirección a mano.
 */
export function espaciosLegibles(
  espacios: EspacioComunidad[],
  abiertas: Set<number>,
): string[] {
  return espacios.filter((e) => puedeEntrar(e, abiertas)).map((e) => e.id)
}

/** La temporada más alta que tiene abierta. Es «dónde va» en su recorrido. */
export function temporadaActual(abiertas: Set<number>): number | null {
  let mayor: number | null = null
  for (const n of abiertas) if (mayor === null || n > mayor) mayor = n
  return mayor
}

/**
 * Todo lo que hace falta saber de alguien para servirle la comunidad.
 *
 * Se resuelve una vez por petición y se pasa de mano en mano, para no repetir
 * las mismas cuatro consultas en cada ruta.
 */
export type ContextoComunidad = {
  papel: PapelComunidad
  espacios: EspacioComunidad[]
  abiertas: Set<number>
  legibles: string[]
  temporadaActual: number | null
}

export async function contextoDe(user: User): Promise<ContextoComunidad> {
  const papel = await papelDe(user)
  const [espacios, abiertas] = await Promise.all([
    todosLosEspacios(),
    temporadasAbiertas(user, papel),
  ])
  return {
    papel,
    espacios,
    abiertas,
    legibles: espaciosLegibles(espacios, abiertas),
    temporadaActual: temporadaActual(abiertas),
  }
}
