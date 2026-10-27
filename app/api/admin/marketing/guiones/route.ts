// API — los guiones.
//
//   GET  /api/admin/marketing/guiones?estado=…
//   POST /api/admin/marketing/guiones
//
// ── POR QUÉ ESTO NO PIDE UN RANGO DE FECHAS ────────────────────────────────
// Las actividades se miran por semanas; los guiones no. La pregunta aquí es
// «¿cuáles están esperándome?» y «¿qué hay en el banco de ideas?», que son
// preguntas de ESTADO, no de calendario. Un guion entregado hace tres semanas
// y sin aprobar tiene que seguir viéndose.
//
// Son pocos por naturaleza —cinco a la semana— así que se traen todos los que
// están vivos y se filtran en la pantalla.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirMarketing, limpiarGuion } from "@/lib/marketing/servidor"

export const dynamic = "force-dynamic"

/** Tope por si algún día el banco de ideas crece mucho. */
const MAX = 400

export async function GET(req: NextRequest) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  const soloEstado = req.nextUrl.searchParams.get("estado") || ""

  let q = getSupabaseAdmin()
    .from("mkt_guiones")
    .select("*")
    // Lo que espera al dueño primero, y dentro de eso lo más urgente de
    // entregar. Es el orden en que hay que atenderlos.
    .order("fecha_entrega", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(MAX)

  if (soloEstado) q = q.eq("estado", soloEstado)

  const { data, error } = await q

  if (error) {
    console.error("[marketing] guiones:", error.message)
    if (/mkt_guiones|does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({
        error: "Falta crear la tabla. Corre docs/sql/marketing_02_guiones.sql "
          + "en Supabase y vuelve a entrar.",
      }, { status: 503 })
    }
    return NextResponse.json({ error: "No se pudieron leer los guiones" }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    guiones: data || [],
    esPropietario: g.esPropietario,
    yo: g.user.id,
  })
}

export async function POST(req: NextRequest) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const limpio = limpiarGuion(body, { parcial: false, esPropietario: g.esPropietario })
  if ("error" in limpio) return NextResponse.json({ error: limpio.error }, { status: 400 })

  const { data, error } = await getSupabaseAdmin()
    .from("mkt_guiones")
    .insert({ ...limpio.campos, created_by: g.user.id })
    .select("*")
    .single()

  if (error) {
    console.error("[marketing] crear guion:", error.message)
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, guion: data })
}
