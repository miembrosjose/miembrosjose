// API — avisar de que alguien tocó una notificación de campaña.
//
//   POST /api/push/clic   { id: "<id de la comunicación>" }
//
// ── POR QUÉ ESTE DATO ES EL ÚNICO QUE SE PUEDE MEDIR DE VERDAD ─────────────
// Un servicio de push responde «aceptado» cuando recibe el aviso, y de ahí en
// adelante no informa de nada: no dice si llegó al teléfono, ni si estaba
// apagado, ni si alguien lo vio. Llamar «entregado» a ese «aceptado» sería
// inventarse una cifra, y el panel no lo hace.
//
// El toque, en cambio, ocurre en nuestro propio trabajador de servicio. Es el
// único momento después del envío en que la plataforma sabe algo de verdad, y
// por eso existe esta ruta.
//
// ── POR QUÉ NO SE IDENTIFICA LA FILA EXACTA ────────────────────────────────
// `push_envios` tiene una fila por dispositivo, y esas filas se escriben
// DESPUÉS de enviar: en el momento de componer el aviso todavía no tienen
// identificador que meter dentro.
//
// Así que el aviso lleva el de la comunicación, y aquí se marca lo que esa
// persona recibió de esa campaña. Para la pregunta que importa —a cuánta gente
// le interesó— es exactamente lo mismo, y no obliga a reordenar el envío.
//
// ── LO QUE NO SE GUARDA ────────────────────────────────────────────────────
// Ni desde qué dispositivo, ni con qué navegador, ni a dónde fue después. Solo
// que esta persona abrió esta campaña, que es lo que hacía falta saber.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  // La sesión, no un identificador del cuerpo. Sin esto, cualquiera podría
  // inflar las cifras de una campaña ajena mandando toques a mano.
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { id?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ ok: true }) }

  const id = typeof body.id === "string" ? body.id.trim() : ""
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    // Un aviso que no viene de una campaña —un mensaje, una insignia— no trae
    // identificador. No es un error: simplemente no hay nada que apuntar.
    return NextResponse.json({ ok: true, apuntado: false })
  }

  const { error } = await getSupabaseAdmin()
    .from("push_envios")
    .update({ clic_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("communication_id", id)
    // Solo el primero. Abrir el mismo aviso tres veces no son tres personas
    // interesadas, y dejar que lo sobrescriba movería la fecha a la última
    // vez en lugar de la primera, que es la que dice cuánto tardó en verlo.
    .is("clic_at", null)

  if (error) {
    // No se le devuelve un fallo al trabajador de servicio: él ya ha abierto
    // la ventana, que es lo que la persona pidió. Perder una estadística no
    // puede estropear un clic.
    console.error("[/api/push/clic]", error.message)
    return NextResponse.json({ ok: true, apuntado: false })
  }

  return NextResponse.json({ ok: true, apuntado: true })
}
