// ═══════════════════════════════════════════════════════════════════════════
//  EL REPARTIDOR · manda un aviso a todos los dispositivos de una persona
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ EXISTE ESTA CAPA ───────────────────────────────────────────────
// `enviar.ts` sabe hablar con UN dispositivo. Esto sabe a cuántos hay que
// hablar, qué hacer con los que ya no contestan, y deja constancia de todo.
//
// Vive aparte a propósito: es el único punto por el que pasarán los avisos
// automáticos (fase 4) y los del panel de administración (fase 8). Si mañana
// hay que añadir preferencias, límites de frecuencia o una cola de reintentos,
// se añaden aquí y valen para todos.
//
// ── POR QUÉ NUNCA LANZA ────────────────────────────────────────────────────
// Esto se va a llamar desde dentro de flujos que YA funcionan: conceder una
// insignia, guardar un capítulo, publicar un comunicado. Si un fallo de push
// tumbara esas operaciones, habríamos cambiado un sistema que avisa poco por
// uno que rompe cosas. El aviso en pantalla tiene que seguir funcionando
// aunque el push falle entero.

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { enviarAUnDispositivo, type Aviso } from "./enviar"

export type ResumenEnvio = {
  dispositivos: number
  entregados: number
  fallidos: number
  /** Suscripciones muertas que se han desactivado en esta pasada. */
  retiradas: number
}

/**
 * Manda un aviso a TODOS los dispositivos activos de una persona.
 *
 * @param categoria Para el registro y, más adelante, para las preferencias.
 */
export async function avisarAPersona(
  userId: string,
  aviso: Aviso,
  categoria = "sistema",
): Promise<ResumenEnvio> {
  const resumen: ResumenEnvio = { dispositivos: 0, entregados: 0, fallidos: 0, retiradas: 0 }

  try {
    const admin = getSupabaseAdmin()

    const { data: subs, error } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId)
      .eq("activa", true)

    if (error || !subs?.length) return resumen
    resumen.dispositivos = subs.length

    const ahora = new Date().toISOString()

    for (const s of subs) {
      const r = await enviarAUnDispositivo(
        { id: s.id as string, endpoint: s.endpoint as string, p256dh: s.p256dh as string, auth: s.auth as string },
        aviso,
      )

      if (r.estado === "ok") {
        resumen.entregados++
        await admin.from("push_subscriptions")
          .update({ last_used_at: ahora })
          .eq("id", s.id)
      } else if (r.estado === "gone") {
        // Muerta de verdad. Se apaga, no se borra: así queda constancia de
        // cuánta gente perdió los avisos y por qué.
        resumen.retiradas++
        await admin.from("push_subscriptions")
          .update({ activa: false, motivo_baja: "gone", updated_at: ahora })
          .eq("id", s.id)
      } else {
        resumen.fallidos++
      }

      // El registro guarda el título y el destino —que de todas formas se ven
      // en la pantalla de bloqueo— pero nunca el cuerpo de un mensaje privado.
      await admin.from("push_envios").insert({
        user_id: userId,
        subscription_id: s.id,
        categoria,
        titulo: aviso.title?.slice(0, 200) ?? null,
        url: aviso.url ?? null,
        resultado: r.estado === "ok" ? "ok" : r.estado === "gone" ? "gone" : "fallo",
        http_status: "http" in r ? r.http : null,
        error: r.estado === "fallo" ? r.error.slice(0, 500) : null,
      })
    }
  } catch (e) {
    console.error("[push] repartir:", e instanceof Error ? e.message : e)
  }

  return resumen
}
