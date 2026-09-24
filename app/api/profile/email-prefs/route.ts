// API — qué correos quiere recibir cada miembro.
//
//   GET  /api/profile/email-prefs
//   POST /api/profile/email-prefs   { novedades?, contenidos?, sesiones?, red?, unsubscribed_all? }
//
// ── ESTO NO ES notification-prefs ──────────────────────────────────────────
// Aquella ruta gobierna la CAMPANA de dentro de la plataforma: quién responde
// en el foro, quién sube de nivel. Vive en `user_metadata` y está bien ahí.
//
// Esta gobierna el CORREO. Son dos cosas distintas y se ven distintas en el
// perfil. Vive en tabla propia porque hay que poder preguntar «¿a cuántos les
// llegaría esto?» del lado del servidor, y `user_metadata` no se consulta así:
// habría que recorrer usuarios uno a uno cada vez que se prepara un envío.
//
// ── LO QUE ESTO NO APAGA ───────────────────────────────────────────────────
// Los correos transaccionales. Quien se da de baja de todo sigue recibiendo su
// enlace de acceso, su recuperación de cuenta y el aviso de un pago fallido.
// No son publicidad: son el funcionamiento de su cuenta, y dejarle sin ellos
// sería dejarle fuera de la plataforma sin haberlo pedido.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { PREFERENCIAS_POR_DEFECTO, type PreferenciasCorreo } from "@/lib/comunicaciones/servidor"

export const dynamic = "force-dynamic"

const CAMPOS = ["novedades", "contenidos", "sesiones", "red", "unsubscribed_all"] as const

/**
 * Lo que se enseña en el perfil, con las mismas palabras que usa el panel al
 * calcular la audiencia. Si aquí dijera una cosa y allí otra, nadie sabría qué
 * apaga qué.
 */
export const FAMILIAS = [
  {
    id: "novedades" as const,
    titulo: "Novedades importantes",
    descripcion: "Anuncios y comunicaciones especiales de Los 144.000.",
  },
  {
    id: "contenidos" as const,
    titulo: "Nuevos contenidos y transmisiones",
    descripcion: "Cuando se publica un episodio, un módulo o una transmisión.",
  },
  {
    id: "sesiones" as const,
    titulo: "Sesiones en vivo y activaciones",
    descripcion: "Anuncios y recordatorios de lo que ocurre en directo.",
  },
  {
    id: "red" as const,
    titulo: "Encuentros y actividad de La Red",
    descripcion: "Encuentros y lo que se mueve en la comunidad.",
  },
]

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  // Con la sesión de quien pregunta, no con la clave de servicio: la policy de
  // fila propia es la que garantiza que nadie lea las de otro, y usarla aquí es
  // la forma de comprobar que funciona.
  const { data } = await supabase
    .from("email_preferences")
    .select("novedades, contenidos, sesiones, red, unsubscribed_all")
    .eq("user_id", user.id)
    .maybeSingle()

  // Sin fila, todo encendido. Quien acaba de entrar no ha dicho que no a nada.
  const prefs: PreferenciasCorreo = { ...PREFERENCIAS_POR_DEFECTO, ...(data || {}) }

  return NextResponse.json({ ok: true, prefs, familias: FAMILIAS })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const cambios: Record<string, unknown> = {}
  for (const campo of CAMPOS) {
    if (typeof body[campo] === "boolean") cambios[campo] = body[campo]
  }
  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "Nada que cambiar" }, { status: 400 })
  }

  // Cuándo se dio de baja, para poder responder si alguien reclama que sigue
  // recibiendo correos. Se pone al darse de baja y se limpia al volver.
  if (typeof cambios.unsubscribed_all === "boolean") {
    cambios.unsubscribed_at = cambios.unsubscribed_all ? new Date().toISOString() : null
  }

  const { error } = await supabase
    .from("email_preferences")
    .upsert({ user_id: user.id, ...cambios }, { onConflict: "user_id" })

  if (error) {
    console.error("[email-prefs] guardar:", error.message)
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }

  const { data } = await supabase
    .from("email_preferences")
    .select("novedades, contenidos, sesiones, red, unsubscribed_all")
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({
    ok: true,
    prefs: { ...PREFERENCIAS_POR_DEFECTO, ...(data || {}) },
  })
}
