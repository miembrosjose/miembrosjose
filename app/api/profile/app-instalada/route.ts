// ═══════════════════════════════════════════════════════════════════════════
//  POST /api/profile/app-instalada · «esta cuenta ya tiene la aplicación»
// ═══════════════════════════════════════════════════════════════════════════
//
// Sin cuerpo. Lo llama la propia aplicación instalada cuando se abre.
//
// ── POR QUÉ HACE FALTA ────────────────────────────────────────────────────
// Saber si la aplicación está instalada es una pregunta que solo sabe
// contestar el navegador desde el que se pregunta, y mal: en iPhone, la
// aplicación añadida a la pantalla de inicio tiene su PROPIO almacenamiento,
// separado del de Safari. Son dos mundos que no se hablan.
//
// Resultado: alguien la instala, la usa a diario desde el icono, y cuando
// entra una vez desde Safari la plataforma le vuelve a ofrecer que la
// instale. No hay forma de arreglarlo en el navegador, porque el navegador
// de verdad no lo sabe.
//
// Guardándolo en la cuenta, lo sabe en cualquier sitio donde entre.
//
// ── POR QUÉ EN user_metadata Y NO EN UNA TABLA ────────────────────────────
// Porque viaja dentro de la sesión. Cualquier pantalla puede consultarlo sin
// una consulta más, que es justo lo que necesita algo que se mira en cada
// carga para decidir si enseñar una invitación.
//
// ── LO QUE NO HACE ────────────────────────────────────────────────────────
// No se desmarca nunca. Desinstalar no deja rastro que el servidor pueda
// ver, y equivocarse por no insistir es mucho más barato que equivocarse
// insistiendo: quien la quiera de nuevo la instala sin que nadie le invite.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function POST() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const ya = (user.user_metadata as { app_instalada_at?: string } | null)?.app_instalada_at

  // Ya estaba. No se reescribe: la fecha que importa es la primera, y además
  // esto se llama en cada arranque de la aplicación.
  if (ya) return NextResponse.json({ ok: true, ya: true, desde: ya })

  const ahora = new Date().toISOString()
  const { error } = await supabase.auth.updateUser({ data: { app_instalada_at: ahora } })

  if (error) {
    console.error("[app-instalada] no se pudo guardar:", error.message)
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }

  // ── Y EN EL PERFIL, QUE ES LO QUE SE PUEDE CONSULTAR ──────────────────
  // La sesión sirve al navegador —la lleva encima, sin pedir nada— pero no se
  // puede filtrar ni contar desde el servidor. El padrón de las
  // comunicaciones sale de `profiles`, así que para poder mandar el
  // recordatorio de instalar la aplicación solo a quien no la tiene, el dato
  // tiene que estar también ahí.
  //
  // Si esta parte falla, no se devuelve error: la persona ya tiene lo suyo
  // guardado en la sesión y dejar de usar la aplicación por no poder
  // segmentar un correo sería el peor intercambio posible. Se reintenta en el
  // siguiente arranque.
  try {
    await getSupabaseAdmin()
      .from("profiles")
      .update({ app_instalada_at: ahora })
      .eq("id", user.id)
      .is("app_instalada_at", null)
  } catch (e) {
    console.warn("[app-instalada] perfil no actualizado:", e instanceof Error ? e.message : e)
  }

  return NextResponse.json({ ok: true, ya: false, desde: ahora })
}
