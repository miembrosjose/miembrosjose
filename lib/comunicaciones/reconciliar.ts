// CENTRO DE COMUNICACIONES — poner al día lo que el proveedor ya hizo.
//
// ── EL FALLO QUE ESTO ARREGLA ──────────────────────────────────────────────
// Una comunicación programada se queda en «programada» para siempre. El correo
// sale —Resend lo reparte a su hora, eso funciona— pero nuestra base no se
// entera, porque nadie le pregunta.
//
// Había dos caminos previstos para enterarse y ninguno servía:
//
//   · el webhook, que hace falta configurar aparte y que no estaba puesto;
//   · la ruta de métricas, que sí reconcilia... pero solo se llama al abrir el
//     detalle de una comunicación que YA figura como enviada. Para llegar ahí
//     tenía que estar enviada, y para estar enviada tenía que pasar por ahí.
//
// Un círculo cerrado. El resultado, desde fuera: el correo llega a la bandeja
// de todo el mundo y el panel sigue diciendo «programada», que es exactamente
// la clase de duda que una herramienta de envío no puede permitirse.
//
// ── POR QUÉ NO BASTA CON ARREGLAR EL WEBHOOK ───────────────────────────────
// Porque un webhook es una llamada de fuera que puede no llegar: un despliegue
// a destiempo, un fallo de red, un secreto mal puesto. Si el estado depende
// solo de eso, cada aviso perdido deja una comunicación mintiendo para
// siempre.
//
// Esto es lo contrario: en vez de esperar a que nos cuenten, se pregunta. Y se
// pregunta en el único momento en que a alguien le importa —al abrir la lista—
// y solo por las que pueden haber cambiado.

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { estadoBroadcast, hayProveedor } from "./proveedor"

/**
 * Cuántas se consultan como mucho de una vez.
 *
 * Cada una es una llamada al proveedor. Con este tope, abrir la lista nunca
 * cuesta más de unos pocos viajes aunque haya cincuenta programadas viejas; lo
 * que no entre esta vez entrará en la siguiente.
 */
const MAX_POR_VEZ = 10

/**
 * Margen después de la hora prevista antes de preguntar.
 *
 * Preguntar por algo cuya hora aún no ha llegado es gastar una llamada para
 * que nos digan lo que ya sabemos. Se espera un minuto por si el reloj del
 * proveedor y el nuestro no coinciden al segundo.
 */
const MARGEN_MS = 60 * 1000

export type ResultadoReconciliacion = {
  consultadas: number
  actualizadas: number
}

/**
 * Pregunta al proveedor por las que ya deberían haber salido, y las mueve.
 *
 * Nunca falla hacia fuera: si el proveedor no contesta, la lista se enseña con
 * lo que hay. Una pantalla que no abre porque no se pudo comprobar un estado
 * es peor que una pantalla con un estado de hace un minuto.
 */
export async function reconciliarPendientes(): Promise<ResultadoReconciliacion> {
  const res: ResultadoReconciliacion = { consultadas: 0, actualizadas: 0 }
  if (!hayProveedor()) return res

  const admin = getSupabaseAdmin()
  const limite = new Date(Date.now() - MARGEN_MS).toISOString()

  // Las candidatas: las que el proveedor tiene, que todavía figuran en vuelo, y
  // cuya hora ya pasó. Una programada para mañana no se toca.
  //
  // `queued` y `sending` no tienen hora prevista —son envíos inmediatos— así
  // que para ellas vale la de creación: si se mandó hace más de un minuto, ya
  // debería constar como enviada.
  const { data, error } = await admin
    .from("communications")
    .select("id, status, provider_broadcast_id, scheduled_at, created_at")
    .in("status", ["scheduled", "queued", "sending"])
    .not("provider_broadcast_id", "is", null)
    .order("scheduled_at", { ascending: true, nullsFirst: true })
    .limit(MAX_POR_VEZ * 3)

  if (error || !data) return res

  const candidatas = (data as Array<{
    id: string
    status: string
    provider_broadcast_id: string
    scheduled_at: string | null
    created_at: string
  }>)
    .filter((c) => (c.scheduled_at ?? c.created_at) <= limite)
    .slice(0, MAX_POR_VEZ)

  for (const c of candidatas) {
    try {
      const p = await estadoBroadcast(c.provider_broadcast_id)
      res.consultadas++

      if (p.status === "sent") {
        await admin
          .from("communications")
          .update({ status: "sent", sent_at: p.sentAt ?? new Date().toISOString() })
          .eq("id", c.id)
          // Solo si sigue donde estaba. Entre la consulta y esta escritura
          // alguien pudo cancelarla, y resucitarla aquí sería peor que
          // cualquier estado desactualizado.
          .in("status", ["scheduled", "queued", "sending"])
        res.actualizadas++
      }
    } catch {
      // Esta no se pudo comprobar. Se sigue con las demás: un identificador
      // que el proveedor ya no reconoce no puede impedir que se actualicen las
      // otras nueve.
    }
  }

  return res
}
