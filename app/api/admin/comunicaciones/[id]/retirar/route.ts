// API — retirar un comunicado interno.
//
//   POST /api/admin/comunicaciones/<id>/retirar
//
// ── POR QUÉ ESTO EXISTE ────────────────────────────────────────────────────
// Porque publicar era de ida y no había vuelta. Un comunicado publicado por
// error —con la audiencia mal, con una falta en el titular, o de prueba— se
// quedaba saliéndole a todo el que entrara, y la única salida era borrarlo
// entero y perder el texto.
//
// ── QUÉ HACE ───────────────────────────────────────────────────────────────
// Le quita la fecha de publicación. La consulta que lo enseña al miembro
// exige que esa fecha exista, así que sin ella deja de aparecer: fuera del
// centro de avisos, fuera de las ventanas que interrumpen, fuera del recuento
// de no leídos.
//
// ── LO QUE NO DESHACE ──────────────────────────────────────────────────────
// Lo que ya pasó. Quien lo abrió, lo abrió. Las marcas de lectura se quedan,
// y eso es deliberado: si se borraran y luego se volviera a publicar, la
// ventana de «una sola vez» le saldría OTRA VEZ a quien ya la cerró. Esas
// marcas son lo único que impide que un aviso de una sola vez salga dos.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin, registrarEvento } from "@/lib/comunicaciones/servidor"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from("communications")
    .update({ published_at: null })
    .eq("id", id)
    // Solo si estaba publicado. Si llegan dos peticiones a la vez, la segunda
    // no encuentra fila y no hace nada, en vez de volver a escribir lo mismo.
    .not("published_at", "is", null)
    .select("id")
    .maybeSingle()

  if (error) {
    if (/published_at|does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({
        error: "Falta correr docs/sql/comunicaciones_03_internas.sql en Supabase.",
      }, { status: 503 })
    }
    console.error("[comunicaciones] retirar:", error.message)
    return NextResponse.json({ error: "No se pudo retirar" }, { status: 500 })
  }

  // No estaba publicado. No es un error: el resultado es el que se pedía.
  if (!data) return NextResponse.json({ ok: true, yaEstaba: true })

  await registrarEvento(id, g.user.id, "updated", { accion: "retirada_de_dentro" })

  return NextResponse.json({ ok: true })
}
