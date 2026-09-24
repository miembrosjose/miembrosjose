// API — duplicar una comunicación.
//
//   POST /api/admin/comunicaciones/<id>/duplicar
//
// Es la forma de reutilizar algo que funcionó, y también la única forma de
// «corregir» algo ya enviado: no se edita lo que salió, se parte de ello.
//
// La copia nace BORRADOR y limpia de todo lo que pertenecía al original: sin
// identificador del proveedor, sin llave de envío, sin fecha, sin métricas, sin
// destinatarios calculados. Heredar cualquiera de esas cosas convertiría la
// copia en una comunicación que la base cree enviada sin haberlo sido.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin, leerComunicacion, registrarEvento } from "@/lib/comunicaciones/servidor"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const c = await leerComunicacion(id)
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 })

  // Se copia lo que se escribió, y nada de lo que ocurrió.
  const { data, error } = await getSupabaseAdmin()
    .from("communications")
    .insert({
      type: c.type,
      internal_title: `${c.internal_title || c.subject} · copia`,
      subject: c.subject,
      preheader: c.preheader,
      eyebrow: c.eyebrow,
      heading: c.heading,
      body: c.body,
      image_url: c.image_url,
      cta_text: c.cta_text,
      cta_url: c.cta_url,
      event_title: c.event_title,
      // La fecha del evento NO se copia. Una sesión duplicada es otra sesión, y
      // heredar el día de la anterior es la forma más fácil de anunciar algo
      // para una fecha que ya pasó.
      event_at: null,
      event_timezone: c.event_timezone,
      event_location: c.event_location,
      audience: c.audience,
      status: "draft",
      created_by: g.user.id,
    })
    .select("id")
    .single()

  if (error || !data) {
    console.error("[comunicaciones] duplicar:", error?.message)
    return NextResponse.json({ error: "No se pudo duplicar" }, { status: 500 })
  }

  await registrarEvento(data.id, g.user.id, "duplicated", { origen: id })
  return NextResponse.json({ ok: true, id: data.id })
}
