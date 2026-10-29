// API — borrar varios borradores de una vez.
//
//   POST /api/admin/comunicaciones/borrar   { ids: [...] }
//
// ── POR QUÉ UN POST Y NO UN DELETE ────────────────────────────────────────
// Porque lleva cuerpo. Un DELETE con cuerpo es legal pero lo tratan distinto
// los intermediarios —algunos lo descartan por el camino—, y aquí el cuerpo
// ES la operación: sin la lista no hay nada que borrar. Un POST a una ruta
// que se llama «borrar» no engaña a nadie y llega entero siempre.
//
// ── POR QUÉ UNA LISTA Y NO UN FILTRO ──────────────────────────────────────
// Sería más corto mandar «borra todos los borradores», y sería la forma de
// que un día una pantalla mal refrescada se lleve por delante veinte que
// alguien estaba escribiendo. Solo se borra lo que el navegador tenía
// delante y la persona marcó.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin } from "@/lib/comunicaciones/servidor"

export const dynamic = "force-dynamic"

/** Un mes de borradores de prueba no llega a esto. */
const TOPE = 200

const ES_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  let body: { ids?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const ids = Array.isArray(body.ids)
    ? [...new Set(body.ids.filter((x): x is string => typeof x === "string" && ES_ID.test(x)))]
    : []

  if (ids.length === 0) return NextResponse.json({ ok: true, borradas: 0, conservadas: [] })
  if (ids.length > TOPE) {
    return NextResponse.json(
      { error: `No se pueden borrar más de ${TOPE} de una vez.` },
      { status: 400 },
    )
  }

  const admin = getSupabaseAdmin()

  // ── SE MIRA ANTES DE BORRAR ────────────────────────────────────────────
  // No basta con poner el filtro en el DELETE. Si una programada se cuela en
  // la selección, el borrado la dejaría fuera en silencio y la pantalla
  // diría «14 borradas» habiendo borrado 13. Quien pulsa tiene que enterarse
  // de que una no se fue, y de cuál.
  const { data, error: errLeer } = await admin
    .from("communications")
    .select("id, status, internal_title, subject, provider_broadcast_id")
    .in("id", ids)

  if (errLeer) {
    console.error("[comunicaciones] borrar en bloque · leer:", errLeer.message)
    return NextResponse.json({ error: "No se pudo leer" }, { status: 500 })
  }

  type Fila = {
    id: string
    status: string
    internal_title: string | null
    subject: string | null
    provider_broadcast_id: string | null
  }

  const filas = (data || []) as Fila[]
  const nombre = (f: Fila) => f.subject?.trim() || f.internal_title?.trim() || "sin título"

  const borrables: string[] = []
  const conservadas: string[] = []

  for (const f of filas) {
    // Lo enviado es historial: borrarlo deja la plataforma sin memoria de un
    // correo que mucha gente sí recibió.
    if (f.status !== "draft" && f.status !== "failed") {
      conservadas.push(`«${nombre(f)}» · ${f.status}`)
      continue
    }

    // ── LA SEGUNDA PUERTA ──────────────────────────────────────────────
    // Un borrador con Broadcast en el proveedor es un borrador solo de
    // nombre: algo llegó a crearse ahí fuera. Borrar la fila dejaría ese
    // Broadcast huérfano en Resend, sin nada que lo relacione con nada.
    if (f.provider_broadcast_id) {
      conservadas.push(`«${nombre(f)}» · tiene un envío creado en el proveedor`)
      continue
    }

    borrables.push(f.id)
  }

  // Las que ni siquiera existen: alguien borró desde otra pestaña. No es un
  // error —el resultado es el que se pedía— pero se dice.
  const noEstaban = ids.length - filas.length
  if (noEstaban > 0) {
    conservadas.push(`${noEstaban} ya no existían`)
  }

  if (borrables.length === 0) {
    return NextResponse.json({ ok: true, borradas: 0, conservadas })
  }

  // Una sola operación, no una por fila.
  const { data: idas, error } = await admin
    .from("communications")
    .delete()
    .in("id", borrables)
    .select("id")

  if (error) {
    console.error("[comunicaciones] borrar en bloque:", error.message)
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    borradas: (idas || []).length,
    conservadas,
  })
}
