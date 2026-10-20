// API — los resultados de una comunicación enviada.
//
//   GET /api/admin/comunicaciones/<id>/metricas
//
// ── DE DÓNDE SALEN LOS NÚMEROS ─────────────────────────────────────────────
// Resend no ofrece un «dame el resumen de esta campaña» por API. Lo que ofrece
// son avisos: uno cada vez que un correo se entrega, se abre, se hace clic,
// rebota o alguien se queja. Nuestro extremo los recibe —ver
// /api/comunicaciones/webhook— y los anota uno por uno.
//
// Esto los cuenta. Por eso las cifras son de PERSONAS, no de veces: la tabla
// tiene una fila por (comunicación, correo, suceso), así que alguien que abre
// el correo cinco veces cuenta una. Es lo que interesa saber.
//
// ── Y EL ESTADO ────────────────────────────────────────────────────────────
// De paso se le pregunta al proveedor si la comunicación ya salió. Una
// programada no cambia sola de estado en nuestra base: nadie la está mirando a
// las siete de la tarde. Se entera la primera vez que alguien abre esta
// pantalla, que es exactamente cuando importa.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin, leerComunicacion, registrarEvento } from "@/lib/comunicaciones/servidor"
import { estadoBroadcast, hayProveedor } from "@/lib/comunicaciones/proveedor"
import type { EstadoComunicacion, MetricasComunicacion } from "@/lib/comunicaciones/tipos"

export const dynamic = "force-dynamic"

const SUCESOS = ["sent", "delivered", "opened", "clicked", "bounced", "complained"] as const

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const c = await leerComunicacion(id)
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 })

  const admin = getSupabaseAdmin()

  // ── El estado real, si el proveedor lo sabe ─────────────────────────────
  let estado: EstadoComunicacion = c.status
  if (c.provider_broadcast_id && hayProveedor() && ["scheduled", "queued", "sending"].includes(c.status)) {
    try {
      const p = await estadoBroadcast(c.provider_broadcast_id)
      if (p.status === "sent") {
        estado = "sent"
        await admin
          .from("communications")
          .update({ status: "sent", sent_at: p.sentAt ?? new Date().toISOString() })
          .eq("id", id)
      }
    } catch (e) {
      // Que el proveedor no conteste no puede dejar la pantalla sin abrir. Se
      // enseña lo que tenemos y se registra el motivo.
      console.warn("[comunicaciones] estado:", e instanceof Error ? e.message : e)
    }
  }

  // ── SI SALIÓ POR NOTIFICACIÓN, LOS NÚMEROS SON OTROS ────────────────────
  // Y hay que decir con precisión qué significan, porque la tentación de
  // presentarlos como los del correo es grande y sería mentir:
  //
  //   intentos      dispositivos a los que se habló. Una persona con el
  //                 teléfono y la tableta son dos.
  //   aceptados     el servicio de push dijo que sí. NO quiere decir que
  //                 llegara al teléfono: de ahí en adelante no informa de
  //                 nada. Nunca se llama «entregado» a esto.
  //   personas      a cuántas les llegó al menos a un dispositivo.
  //   tocaron       cuántas lo abrieron. Este sí es un dato nuestro, porque
  //                 el toque ocurre en nuestro trabajador de servicio.
  //   retiradas     suscripciones que ya no existen. Se apagan solas.
  //
  // No hay «abrieron sin tocar»: nadie informa de si una notificación se miró
  // en la pantalla de bloqueo. Esa cifra no existe y no se finge.
  if (c.canal === "push") {
    const filas: Array<{ user_id: string | null; resultado: string; clic_at: string | null }> = []
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await admin
        .from("push_envios")
        .select("user_id, resultado, clic_at")
        .eq("communication_id", id)
        .range(desde, desde + 999)
      if (error) break
      const lote = (data || []) as typeof filas
      filas.push(...lote)
      if (lote.length < 1000) break
    }

    const personas = new Set<string>()
    const tocaron = new Set<string>()
    let aceptados = 0
    let fallidos = 0
    let retiradas = 0

    for (const f of filas) {
      if (f.resultado === "ok") {
        aceptados++
        if (f.user_id) personas.add(f.user_id)
      } else if (f.resultado === "gone") retiradas++
      else fallidos++

      if (f.clic_at && f.user_id) tocaron.add(f.user_id)
    }

    const base = personas.size
    return NextResponse.json({
      ok: true,
      estado,
      canal: "push",
      push: {
        intentos: filas.length,
        aceptados,
        personas: base,
        tocaron: tocaron.size,
        fallidos,
        retiradas,
        // Sobre las personas alcanzadas, no sobre los dispositivos: a nadie le
        // interesa qué porcentaje de pantallas se tocó.
        tasaToque: base > 0 ? Math.round((tocaron.size / base) * 1000) / 10 : null,
      },
      destinatariosPrevistos: c.recipients_estimated,
      // Sin ni una fila es que el envío no llegó a ocurrir, no que no le
      // interesara a nadie. Distinguirlo evita una conclusión falsa.
      sinDatos: filas.length === 0,
    })
  }

  // ── El recuento ─────────────────────────────────────────────────────────
  // Un `count` por suceso, sin traerse ni una fila. Seis consultas de cabecera
  // frente a traer miles de filas para contarlas en memoria.
  const conteos = await Promise.all(
    SUCESOS.map(async (s) => {
      const { count } = await admin
        .from("communication_metric_events")
        .select("email_id", { count: "exact", head: true })
        .eq("communication_id", id)
        .eq("event_type", s)
      return [s, count ?? 0] as const
    }),
  )
  const por = Object.fromEntries(conteos) as Record<(typeof SUCESOS)[number], number>

  const metricas: MetricasComunicacion = {
    enviados: por.sent,
    entregados: por.delivered,
    aperturas: por.opened,
    clics: por.clicked,
    rebotes: por.bounced,
    quejas: por.complained,
  }

  // Se guarda la foto para que la lista pueda enseñar algo sin recalcular, y
  // para que quede el resumen aunque un día se poden los sucesos.
  await admin
    .from("communications")
    .update({ metrics: metricas, metrics_synced_at: new Date().toISOString() })
    .eq("id", id)

  await registrarEvento(id, g.user.id, "metrics_synced", metricas as Record<string, unknown>)

  // ── Las tres preguntas ──────────────────────────────────────────────────
  // Porcentajes sobre lo ENTREGADO, no sobre lo enviado: una tasa de apertura
  // que incluye los correos que rebotaron miente hacia abajo y no dice nada de
  // lo que se quería saber.
  const base = metricas.entregados || 0
  const pct = (n: number) => (base > 0 ? Math.round((n / base) * 1000) / 10 : null)

  return NextResponse.json({
    ok: true,
    estado,
    metricas,
    // Lo que se prometió antes de enviar, para poder compararlo con lo que
    // realmente se entregó.
    destinatariosPrevistos: c.recipients_estimated,
    tasas: {
      apertura: pct(metricas.aperturas || 0),
      clic: pct(metricas.clics || 0),
    },
    // Cuando no hay ni un suceso, no es que nadie abriera: es que los avisos
    // del proveedor no están llegando. Distinguirlo evita una conclusión falsa.
    sinDatos: Object.values(metricas).every((v) => !v),
  })
}
