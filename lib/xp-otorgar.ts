// DAR EXPERIENCIA POR UNA ACCIÓN, UNA SOLA VEZ.
//
// ── POR QUÉ HACE FALTA ─────────────────────────────────────────────────────
// La experiencia se repartía casi entera desde disparadores de la base
// heredados de otro proyecto: los de un sistema de embudos de venta. Premiaban
// publicar un embudo o recibir tres «me gusta» en él, y no premiaban nada de
// lo que esta plataforma es de verdad: ver un capítulo, escribir en la
// comunidad, practicar, volver.
//
// Esto es el camino nuevo, desde el código, para las acciones que sí existen.
// No sustituye a los disparadores de golpe —eso se hace con calma y sin romper
// lo que ya cuenta—, sino que añade lo que faltaba.
//
// ── LA REGLA QUE LO SOSTIENE: UNA VEZ POR ORIGEN ───────────────────────────
// Cada concesión lleva un `origen`: el capítulo, la conversación, el día. La
// tabla `xp_events` guarda tipo + origen, y antes de dar nada se comprueba si
// ya está. Sin eso, volver a marcar el mismo capítulo daría cien puntos cada
// vez y el nivel dejaría de significar nada.

import type { User } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { XP_REWARDS, type XpEventType } from "@/lib/xp"

/**
 * Concede la experiencia de una acción si no se concedió ya.
 *
 * `origen` identifica el hecho concreto —"s1e3", el id de la conversación, la
 * fecha del día—. Dos llamadas con el mismo tipo y el mismo origen dan puntos
 * una sola vez.
 *
 * Devuelve cuántos puntos se dieron: 0 si ya estaban dados. Nunca lanza: que
 * falle el contador no puede tumbar la acción que lo provocó.
 */
export async function otorgarXp(
  user: User,
  tipo: XpEventType,
  origen: string,
): Promise<number> {
  const puntos = XP_REWARDS[tipo]
  if (!puntos || puntos <= 0 || !origen) return 0

  try {
    const admin = getSupabaseAdmin()

    const { data: yaEsta } = await admin
      .from("xp_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_type", tipo)
      .eq("source_id", origen)
      .limit(1)

    if (yaEsta && yaEsta.length > 0) return 0

    await admin.rpc("apply_xp_delta", {
      p_user_id: user.id,
      p_event_type: tipo,
      p_xp_delta: puntos,
      p_level_delta: 0,
      p_source_table: "plataforma",
      p_source_id: origen,
    })
    return puntos
  } catch (e) {
    console.warn("[xp] no se pudo otorgar %s (%s):", tipo, origen, e)
    return 0
  }
}
