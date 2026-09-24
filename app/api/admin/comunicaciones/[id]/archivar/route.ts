// API — archivar y desarchivar una comunicación enviada.
//
//   POST /api/admin/comunicaciones/<id>/archivar     { archivar: boolean }
//
// ── POR QUÉ ARCHIVAR Y NO BORRAR ───────────────────────────────────────────
// Se pidió poder quitar comunicaciones enviadas de la lista, y la forma obvia
// —borrarlas— es la equivocada por tres razones.
//
// La primera: borrar la fila no borra el correo. El correo está en mil bandejas
// de entrada y ahí se queda. Lo único que desaparece es la capacidad de
// responder a «¿qué mandamos el martes, y a cuánta gente?».
//
// La segunda: se lleva por delante las métricas. Los sucesos de apertura y
// clic cuelgan de la comunicación con borrado en cascada, así que borrarla
// borra también lo que se aprendió de ella.
//
// La tercera: no hace falta. Lo que molesta es que la lista crezca, y para eso
// basta con apartarla.
//
// Archivar limpia la vista, no pierde nada y se deshace.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin, leerComunicacion, registrarEvento } from "@/lib/comunicaciones/servidor"

export const dynamic = "force-dynamic"

/**
 * Solo se archiva lo que ya terminó su vida.
 *
 * Un borrador se borra —no hay nada que preservar— y una programada se cancela
 * primero: archivar algo que va a salir dentro de dos horas lo escondería sin
 * impedir que saliera, que es la peor combinación posible.
 */
const ARCHIVABLES = ["sent", "cancelled", "failed"]

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const c = await leerComunicacion(id)
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 })

  let body: { archivar?: boolean }
  try { body = await req.json() } catch { body = {} }
  const archivar = body.archivar !== false

  if (archivar) {
    if (!ARCHIVABLES.includes(c.status)) {
      return NextResponse.json(
        {
          error:
            c.status === "scheduled"
              ? "Cancela la programación antes de archivarla: archivarla la escondería sin impedir que salga."
              : "Solo se archivan las comunicaciones que ya terminaron.",
        },
        { status: 409 },
      )
    }
  } else if (c.status !== "archived") {
    return NextResponse.json({ error: "Esta comunicación no está archivada" }, { status: 409 })
  }

  // Al archivar se guarda de dónde viene, para poder devolverla a su sitio.
  // Sin esto, desarchivar tendría que adivinar si era «enviada» o «cancelada».
  const admin = getSupabaseAdmin()
  const previo = (c.metrics as Record<string, unknown> | null) || {}

  const cambios = archivar
    ? { status: "archived", metrics: { ...previo, _estado_previo: c.status } }
    : { status: (previo._estado_previo as string) || "sent", metrics: sinMarca(previo) }

  const { data, error } = await admin
    .from("communications")
    .update(cambios)
    .eq("id", id)
    .select("*")
    .single()

  if (error || !data) {
    console.error("[comunicaciones] archivar:", error?.message)
    return NextResponse.json({ error: "No se pudo archivar" }, { status: 500 })
  }

  await registrarEvento(id, g.user.id, "updated", {
    accion: archivar ? "archivada" : "desarchivada",
    estado_previo: archivar ? c.status : null,
  })

  return NextResponse.json({ ok: true, comunicacion: data })
}

function sinMarca(m: Record<string, unknown>): Record<string, unknown> {
  const copia = { ...m }
  delete copia._estado_previo
  return copia
}
