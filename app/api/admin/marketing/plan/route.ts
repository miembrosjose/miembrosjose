// API — el plan del mes, y la propuesta de calendario.
//
//   GET  /api/admin/marketing/plan?mes=YYYY-MM-01
//   PUT  /api/admin/marketing/plan              { mes, objetivos, frecuencias, … }
//   POST /api/admin/marketing/plan/generar      { mes }
//
// ── LAS FRECUENCIAS SON METAS, NO PUBLICACIONES AUTOMÁTICAS ────────────────
// Guardar «3 reels por semana» no crea nada. Lo que lo crea es pulsar
// «generar», y lo que se genera son actividades normales: se pueden mover,
// renombrar y borrar.
//
// La diferencia importa. Un sistema que publica solo acaba llenando el
// calendario de filas que nadie pidió y que todos ignoran.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirMarketing, limpiarPlan } from "@/lib/marketing/servidor"

export const dynamic = "force-dynamic"

const ES_MES = /^\d{4}-\d{2}-01$/

export async function GET(req: NextRequest) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  const mes = req.nextUrl.searchParams.get("mes") || ""
  if (!ES_MES.test(mes)) {
    return NextResponse.json({ error: "Falta el mes, como AAAA-MM-01." }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from("mkt_plan")
    .select("*")
    .eq("mes", mes)
    .maybeSingle()

  if (error) {
    console.error("[marketing] plan:", error.message)
    if (/mkt_plan|does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({
        error: "Falta crear la tabla. Corre docs/sql/marketing_03_resultados.sql "
          + "en Supabase y vuelve a entrar.",
      }, { status: 503 })
    }
    return NextResponse.json({ error: "No se pudo leer el plan" }, { status: 500 })
  }

  // ── UN MES SIN PLAN NO ES UN ERROR ────────────────────────────────────
  // Es un mes que todavía no se ha planificado. Se devuelve vacío con las
  // frecuencias del mes anterior, que es de donde se parte siempre: nadie
  // reescribe las metas cada treinta días desde cero.
  if (!data) {
    const { data: anterior } = await getSupabaseAdmin()
      .from("mkt_plan")
      .select("frecuencias")
      .lt("mes", mes)
      .order("mes", { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      ok: true,
      plan: null,
      frecuenciasHeredadas: anterior?.frecuencias ?? [],
      esPropietario: g.esPropietario,
    })
  }

  return NextResponse.json({ ok: true, plan: data, esPropietario: g.esPropietario })
}

export async function PUT(req: NextRequest) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const limpio = limpiarPlan(body, { esPropietario: g.esPropietario })
  if ("error" in limpio) return NextResponse.json({ error: limpio.error }, { status: 400 })

  const { data, error } = await getSupabaseAdmin()
    .from("mkt_plan")
    .upsert({ ...limpio.campos, created_by: g.user.id }, { onConflict: "mes" })
    .select("*")
    .single()

  if (error) {
    console.error("[marketing] guardar plan:", error.message)
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plan: data })
}
