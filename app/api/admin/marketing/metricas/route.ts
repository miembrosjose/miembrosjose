// API — los números, a mano.
//
//   GET  /api/admin/marketing/metricas?desde=YYYY-MM-DD   (lunes)
//   PUT  /api/admin/marketing/metricas                    { periodo, … }
//
// ── POR QUÉ `PUT` Y NO `POST` ──────────────────────────────────────────────
// Porque guardar los números de una semana no es crear algo nuevo cada vez:
// es dejar esa semana como queda. Se abre el martes, se anotan tres cifras,
// se vuelve el jueves y se completan las otras cuatro.
//
// Con `POST` habría que saber si ya existe para decidir entre crear y
// actualizar, y ese «saber» es justo lo que falla cuando se abre la pantalla
// en dos pestañas. Aquí la base lo resuelve con un `upsert` sobre la semana.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirMarketing, limpiarMetricas } from "@/lib/marketing/servidor"

export const dynamic = "force-dynamic"

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: NextRequest) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  const desde = req.nextUrl.searchParams.get("desde") || ""
  if (desde && !ES_FECHA.test(desde)) {
    return NextResponse.json({ error: "Esa fecha no es válida." }, { status: 400 })
  }

  // Sin `desde` se traen las últimas semanas, que es lo que hace falta para
  // comparar. Doce son tres meses: lo que se mira en una reunión mensual.
  let q = getSupabaseAdmin()
    .from("mkt_metricas")
    .select("*")
    .order("periodo", { ascending: false })
    .limit(60)

  if (desde) q = q.gte("periodo", desde)

  const { data, error } = await q

  if (error) {
    console.error("[marketing] metricas:", error.message)
    if (/mkt_metricas|does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({
        error: "Falta crear la tabla. Corre docs/sql/marketing_03_resultados.sql "
          + "en Supabase y vuelve a entrar.",
      }, { status: 503 })
    }
    return NextResponse.json({ error: "No se pudieron leer los resultados" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, metricas: data || [] })
}

export async function PUT(req: NextRequest) {
  const g = await exigirMarketing()
  if ("respuesta" in g) return g.respuesta

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const limpio = limpiarMetricas(body)
  if ("error" in limpio) return NextResponse.json({ error: limpio.error }, { status: 400 })

  const admin = getSupabaseAdmin()

  // ── EL RESUMEN DE LA SEMANA ES ÚNICO ──────────────────────────────────
  // Hay un índice único sobre `periodo` cuando no hay actividad, así que el
  // `upsert` sobre esa columna deja una sola fila por semana por mucho que se
  // guarde desde dos sitios a la vez.
  //
  // Lo de una publicación concreta no pasa por aquí: tiene su propia fila y
  // se edita por identificador.
  const esResumen = !limpio.campos.actividad_id

  if (esResumen) {
    const { data, error } = await admin
      .from("mkt_metricas")
      .upsert({ ...limpio.campos, created_by: g.user.id }, { onConflict: "periodo" })
      .select("*")
      .single()

    if (error) {
      console.error("[marketing] guardar metricas:", error.message)
      return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
    }
    return NextResponse.json({ ok: true, metrica: data })
  }

  const { data, error } = await admin
    .from("mkt_metricas")
    .insert({ ...limpio.campos, created_by: g.user.id })
    .select("*")
    .single()

  if (error) {
    console.error("[marketing] guardar metricas:", error.message)
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }
  return NextResponse.json({ ok: true, metrica: data })
}
