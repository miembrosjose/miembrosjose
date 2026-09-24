// API — cancelar una programación.
//
//   POST /api/admin/comunicaciones/<id>/cancelar
//
// ── QUÉ SE PUEDE CANCELAR Y QUÉ NO ─────────────────────────────────────────
// Solo lo que todavía no ha salido. Un correo entregado no se cancela: está en
// la bandeja de quien lo recibió y ahí se queda. Fingir lo contrario sería la
// peor clase de mentira en una herramienta como esta.
//
// Por eso, antes de tocar nada, se le pregunta al proveedor en qué estado está
// de verdad. Nuestra base puede decir «programada» y el proveedor haberla
// repartido hace un minuto; el que manda es el proveedor.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin, leerComunicacion, registrarEvento } from "@/lib/comunicaciones/servidor"
import { esCancelable } from "@/lib/comunicaciones/tipos"
import {
  cancelarBroadcast, estadoBroadcast, hayProveedor, mensajeDeError,
} from "@/lib/comunicaciones/proveedor"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const c = await leerComunicacion(id)
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 })

  if (!esCancelable(c.status)) {
    return NextResponse.json(
      { error: "Solo se puede cancelar una comunicación programada que aún no ha salido." },
      { status: 409 },
    )
  }
  if (!c.provider_broadcast_id) {
    return NextResponse.json({ error: "Esta comunicación no llegó al proveedor." }, { status: 409 })
  }
  if (!hayProveedor()) {
    return NextResponse.json(
      { error: "El proveedor de correo no está configurado en este entorno." },
      { status: 503 },
    )
  }

  const admin = getSupabaseAdmin()

  try {
    // Primero la verdad, y solo después la acción.
    const enProveedor = await estadoBroadcast(c.provider_broadcast_id)

    if (enProveedor.status === "sent") {
      // Ya salió. Se corrige nuestra base para que deje de decir lo contrario:
      // una pantalla que ofrece cancelar algo que ya llegó es peor que no
      // ofrecer nada.
      await admin
        .from("communications")
        .update({ status: "sent", sent_at: enProveedor.sentAt ?? new Date().toISOString() })
        .eq("id", id)
      return NextResponse.json(
        { error: "Esta comunicación ya salió. No se puede cancelar lo que ya está entregado." },
        { status: 409 },
      )
    }

    await cancelarBroadcast(c.provider_broadcast_id)

    const { data } = await admin
      .from("communications")
      .update({
        status: "cancelled",
        scheduled_at: null,
        // La llave se suelta: cancelar devuelve la comunicación a la vida, y
        // duplicarla o volver a programarla tiene que poder empezar limpio.
        send_idempotency_key: null,
        provider_broadcast_id: null,
      })
      .eq("id", id)
      .select("*")
      .single()

    await registrarEvento(id, g.user.id, "cancelled", {
      broadcast_id: c.provider_broadcast_id,
      estaba_programada_para: c.scheduled_at,
    })

    return NextResponse.json({ ok: true, comunicacion: data })
  } catch (e) {
    console.error("[comunicaciones] cancelar:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: mensajeDeError(e) }, { status: 502 })
  }
}
