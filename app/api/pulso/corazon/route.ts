// API — el corazón de una respuesta del Pulso.
//
//   POST   /api/pulso/corazon   { respuestaId }   lo pone
//   DELETE /api/pulso/corazon?respuestaId=…       lo quita
//
// POR QUÉ ES UNA RUTA APARTE
// /api/pulso ya usa sus tres verbos para la respuesta en sí. Colgar aquí un
// cuarto significado del mismo POST obligaría a mirar el cuerpo del mensaje
// para saber qué se está pidiendo, que es justo lo que hace ilegibles las
// APIs con el tiempo.
//
// SEGURIDAD
// Con el cliente de sesión, nunca con service_role. Las policies de
// pulso_corazones solo dejan insertar y borrar filas con auth.uid() = user_id,
// así que aunque este archivo se equivocara nadie podría poner un corazón en
// nombre de otro ni inflar el contador de su propia respuesta.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** El único gesto que existe hoy. La columna admite más sin migrar. */
const TIPO = "corazon"

/**
 * Cuando la tabla todavía no está creada —la migración
 * docs/sql/pulso_corazones.sql se ejecuta a mano en Supabase— Postgres
 * responde con un error que no es culpa de quien pulsa el botón. Merece un
 * mensaje que diga qué falta, no un 500 mudo.
 */
function faltaLaTabla(mensaje: string): boolean {
  return /does not exist|schema cache/i.test(mensaje)
}

function leerId(body: unknown): string | null {
  const b = (body ?? {}) as Record<string, unknown>
  return typeof b.respuestaId === "string" && b.respuestaId.length > 0 ? b.respuestaId : null
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const respuestaId = leerId(body)
  if (!respuestaId) return NextResponse.json({ error: "Falta la respuesta" }, { status: 400 })

  // upsert y no insert: pulsar dos veces seguidas —el doble toque del móvil,
  // una pestaña vieja— no debe devolver un error de clave duplicada.
  const { error } = await supabase
    .from("pulso_corazones")
    .upsert(
      { respuesta_id: respuestaId, user_id: user.id, tipo: TIPO },
      { onConflict: "respuesta_id,user_id,tipo" },
    )

  if (error) {
    if (faltaLaTabla(error.message)) {
      return NextResponse.json(
        { error: "Los corazones aún no están activados en la base de datos." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const respuestaId = new URL(req.url).searchParams.get("respuestaId")
  if (!respuestaId) return NextResponse.json({ error: "Falta la respuesta" }, { status: 400 })

  // El filtro por user_id es redundante con la policy, y se queda: si alguien
  // cambiara la policy por error, esto sigue impidiendo quitar lo ajeno.
  const { error } = await supabase
    .from("pulso_corazones")
    .delete()
    .eq("respuesta_id", respuestaId)
    .eq("user_id", user.id)
    .eq("tipo", TIPO)

  if (error) {
    if (faltaLaTabla(error.message)) {
      return NextResponse.json(
        { error: "Los corazones aún no están activados en la base de datos." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: "No se pudo quitar" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
