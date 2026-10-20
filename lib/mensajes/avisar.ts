// AVISAR DE UN MENSAJE PRIVADO.
//
// ── LO QUE NO EXISTÍA ──────────────────────────────────────────────────────
// Hasta ahora, recibir un mensaje no generaba NADA: ni una fila en la campana,
// ni un aviso en el móvil. Si no estabas mirando la pantalla de mensajes en
// ese momento, no te enterabas. Era el caso más evidente para una
// notificación y era el único que no tenía ninguna.
//
// ── POR QUÉ UNA SOLA NOTIFICACIÓN POR CONVERSACIÓN ─────────────────────────
// Diez mensajes seguidos no son diez avisos. Si ya hay uno sin leer de esa
// misma persona, no se crea otro: la campana ya está diciendo que hay algo de
// ella. Cuando se lee, el siguiente mensaje vuelve a avisar.
//
// Eso resuelve la duplicación en los dos sitios a la vez —la campana y el
// móvil— con una sola consulta, y sin ventanas de tiempo que siempre acaban
// siendo demasiado cortas o demasiado largas.
//
// ── POR QUÉ NUNCA LANZA ────────────────────────────────────────────────────
// Esto corre DESPUÉS de que el mensaje ya se guardó. Si fallara y tumbara la
// petición, la persona vería un error habiendo enviado el mensaje
// correctamente, y lo mandaría otra vez.

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { avisarAPersona } from "@/lib/push/repartir"

type Entrada = {
  remitenteId: string
  remitenteNombre: string
  remitenteAvatar: string | null
  destinatarioId: string
  texto: string | null
  tipoMedia: string | null
}

/** Lo que se enseña cuando el mensaje no es texto. */
function resumirMedia(tipo: string | null): string {
  if (tipo === "image") return "Te envió una imagen"
  if (tipo === "audio") return "Te envió un audio"
  return "Te envió un mensaje"
}

export async function avisarMensajeNuevo(e: Entrada): Promise<void> {
  try {
    // Mandarse un mensaje a uno mismo no avisa a nadie.
    if (e.remitenteId === e.destinatarioId) return

    const admin = getSupabaseAdmin()

    // ── ¿YA HAY UN AVISO SIN LEER DE ESTA MISMA PERSONA? ──────────────────
    const { data: pendiente } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", e.destinatarioId)
      .eq("type", "dm_message")
      .eq("source_user_id", e.remitenteId)
      .is("read_at", null)
      .limit(1)
      .maybeSingle()

    if (pendiente) return

    // ── LAS PREFERENCIAS DE QUIEN RECIBE ──────────────────────────────────
    // Se leen del destinatario, nunca de quien envía: es su teléfono y su
    // decisión. Si no se pueden leer, se asume que sí quiere — es el valor
    // por defecto y el comportamiento menos sorprendente.
    const { data: destino } = await admin.auth.admin.getUserById(e.destinatarioId)
    const prefs = ((destino?.user?.user_metadata as { notification_prefs?: unknown } | null)
      ?.notification_prefs ?? {}) as {
      push?: { mensajes?: boolean; vista_previa?: boolean }
    }
    const quierePush = prefs.push?.mensajes !== false
    const quiereTexto = prefs.push?.vista_previa !== false

    const resumen = e.texto?.trim() ? e.texto.trim() : resumirMedia(e.tipoMedia)

    // ── LA CAMPANA ────────────────────────────────────────────────────────
    // Se escribe siempre, independientemente del push. Son dos cosas: una es
    // el historial dentro de la plataforma y la otra interrumpe el día.
    // Apagar los avisos del móvil no debe vaciar la campana.
    await admin.from("notifications").insert({
      user_id: e.destinatarioId,
      type: "dm_message",
      source_user_id: e.remitenteId,
      source_user_name: e.remitenteNombre,
      source_user_avatar_url: e.remitenteAvatar,
      title: e.remitenteNombre,
      preview: resumen.slice(0, 160),
    })

    if (!quierePush) return

    // ── EL MÓVIL ──────────────────────────────────────────────────────────
    // Una notificación se lee en la pantalla BLOQUEADA, a la vista de quien
    // esté al lado. Con la vista previa apagada se dice QUIÉN escribe, nunca
    // QUÉ: eso ya obliga a desbloquear para enterarse.
    await avisarAPersona(
      e.destinatarioId,
      {
        title: e.remitenteNombre,
        body: quiereTexto ? resumen.slice(0, 160) : "Te ha escrito",
        // Abre la conversación con esa persona, no la lista.
        url: `/miembros/mensajes/${e.remitenteId}`,
        // Agrupa por conversación: si llegaran dos, el segundo reemplaza al
        // primero en vez de apilarse.
        tag: `dm-${e.remitenteId}`,
      },
      "mensajes",
    )
  } catch (err) {
    // El mensaje YA está guardado. Un fallo aquí no puede devolver un error a
    // quien lo envió: creería que no se mandó y lo repetiría.
    console.error("[mensajes/avisar]", err instanceof Error ? err.message : err)
  }
}
