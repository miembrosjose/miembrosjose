// API — la lista de comunicaciones y la creación de borradores.
//
//   GET  /api/admin/comunicaciones?estado=borradores|programadas|enviadas
//   POST /api/admin/comunicaciones     { type }
//
// Crear NO envía nada. Crear es abrir una hoja en blanco: una comunicación
// nace siempre como borrador y no hay forma de que nazca de otra manera,
// porque el estado no está entre los campos que se pueden escribir desde
// fuera. Ver `CAMPOS_EDITABLES` en lib/comunicaciones/servidor.ts.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin, registrarEvento } from "@/lib/comunicaciones/servidor"
import { TIPOS, esTipoValido } from "@/lib/comunicaciones/tipos"

export const dynamic = "force-dynamic"

/** Lo que se lista. El cuerpo entero no hace falta para una fila. */
const CAMPOS_LISTA =
  "id, type, internal_title, subject, status, audience, scheduled_at, scheduled_timezone, " +
  "recipients_estimated, recipients_excluded, sent_at, metrics, created_at, updated_at"

/**
 * Las tres pestañas del panel.
 *
 * «Programadas» incluye lo que está en cola o saliendo: para quien mira, una
 * comunicación que el proveedor ya tiene pero aún no ha repartido está más
 * cerca de «programada» que de «enviada», y ponerla en enviadas antes de que
 * salga sería contar de más.
 */
const POR_PESTANA: Record<string, string[]> = {
  borradores: ["draft", "failed"],
  programadas: ["scheduled", "queued", "sending"],
  enviadas: ["sent", "cancelled"],
}

export async function GET(req: NextRequest) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const estado = new URL(req.url).searchParams.get("estado") || "borradores"
  const estados = POR_PESTANA[estado]
  if (!estados) return NextResponse.json({ error: "Pestaña desconocida" }, { status: 400 })

  const { data, error } = await getSupabaseAdmin()
    .from("communications")
    .select(CAMPOS_LISTA)
    .in("status", estados)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[comunicaciones] listar:", error.message)
    return NextResponse.json({ error: "No se pudo leer la lista" }, { status: 500 })
  }

  // Los contadores de las pestañas, para no tener que pedir las tres listas.
  const conteos: Record<string, number> = {}
  await Promise.all(
    Object.entries(POR_PESTANA).map(async ([nombre, ests]) => {
      const { count } = await getSupabaseAdmin()
        .from("communications")
        .select("id", { count: "exact", head: true })
        .in("status", ests)
      conteos[nombre] = count ?? 0
    }),
  )

  return NextResponse.json({ ok: true, comunicaciones: data || [], conteos })
}

export async function POST(req: NextRequest) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  let body: { type?: string }
  try { body = await req.json() } catch { body = {} }

  const tipo = body.type
  if (!esTipoValido(tipo)) {
    return NextResponse.json({ error: "Tipo de comunicación desconocido" }, { status: 400 })
  }

  const def = TIPOS[tipo]

  // Se nace con lo que el tipo ya sabe de sí mismo: el eyebrow y el texto del
  // botón. No es relleno, es no empezar delante de seis campos vacíos.
  const { data, error } = await getSupabaseAdmin()
    .from("communications")
    .insert({
      type: tipo,
      internal_title: `${def.nombre} · sin título`,
      eyebrow: def.eyebrowPorDefecto,
      cta_text: def.ctaPorDefecto,
      audience: { kind: "todos" },
      status: "draft",
      created_by: g.user.id,
    })
    .select("id")
    .single()

  if (error || !data) {
    console.error("[comunicaciones] crear:", error?.message)
    return NextResponse.json({ error: "No se pudo crear la comunicación" }, { status: 500 })
  }

  await registrarEvento(data.id, g.user.id, "created", { type: tipo })
  return NextResponse.json({ ok: true, id: data.id })
}
