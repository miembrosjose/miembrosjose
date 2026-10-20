// API — registrar y retirar el dispositivo de una persona para recibir push.
//
//   POST   /api/push/subscribe    { subscription, reemplaza? }
//   DELETE /api/push/subscribe    { endpoint }
//
// ── POR QUÉ ESTO NO LO ESCRIBE EL NAVEGADOR DIRECTAMENTE ───────────────────
// La tabla tiene políticas de lectura y borrado para cada persona, pero NO de
// escritura. La inserción pasa por aquí, con la sesión comprobada y la clave
// de servicio.
//
// Si el navegador pudiera insertar, bastaría con cambiar un `user_id` en la
// petición para registrar un dispositivo a nombre de otro y empezar a recibir
// sus avisos. Aquí el `user_id` NO viene del cliente: sale de la sesión.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

type SuscripcionCliente = {
  endpoint?: unknown
  keys?: { p256dh?: unknown; auth?: unknown }
}

function texto(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : ""
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { subscription?: SuscripcionCliente; reemplaza?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const s = body.subscription || {}
  const endpoint = texto(s.endpoint, 2000)
  const p256dh = texto(s.keys?.p256dh, 500)
  const auth = texto(s.keys?.auth, 500)

  // Las tres son obligatorias: sin cualquiera de ellas el mensaje no se puede
  // cifrar, y el servicio de push lo rechazaría en cada envío.
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "suscripcion_incompleta" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const ahora = new Date().toISOString()

  // El navegador puede rotar la suscripción: cuando avisa de cuál sustituye,
  // se retira la vieja para no quedarse mandando a una dirección muerta.
  const reemplaza = texto(body.reemplaza, 2000)
  if (reemplaza && reemplaza !== endpoint) {
    await admin.from("push_subscriptions")
      .update({ activa: false, motivo_baja: "rotada", updated_at: ahora })
      .eq("endpoint", reemplaza)
      .eq("user_id", user.id)
  }

  // `onConflict: endpoint` es lo que permite varios dispositivos por persona:
  // cada uno tiene su endpoint, así que cada uno es su propia fila. Volver a
  // suscribirse desde el MISMO dispositivo actualiza la suya en vez de
  // acumular duplicados.
  //
  // Se reactiva a propósito: si estaba apagada por un fallo anterior y la
  // persona vuelve a autorizar, tiene que volver a funcionar.
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: texto(req.headers.get("user-agent"), 300),
      activa: true,
      motivo_baja: null,
      updated_at: ahora,
    },
    { onConflict: "endpoint" },
  )

  if (error) {
    console.error("[/api/push/subscribe]", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { endpoint?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const endpoint = texto(body.endpoint, 2000)
  if (!endpoint) return NextResponse.json({ error: "falta_endpoint" }, { status: 400 })

  const admin = getSupabaseAdmin()
  // El `eq` sobre user_id importa: sin él, conociendo un endpoint ajeno se
  // podría dejar a otro sin notificaciones.
  const { error } = await admin.from("push_subscriptions")
    .update({ activa: false, motivo_baja: "revocada", updated_at: new Date().toISOString() })
    .eq("endpoint", endpoint)
    .eq("user_id", user.id)

  if (error) {
    console.error("[/api/push/subscribe DELETE]", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
