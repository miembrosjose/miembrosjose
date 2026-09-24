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
