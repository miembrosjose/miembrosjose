// ═══════════════════════════════════════════════════════════════════════════
//  EL PULSO, DESDE EL PANEL · listar, escribir, corregir, retirar
// ═══════════════════════════════════════════════════════════════════════════
//
//   GET    /api/admin/pulso          todas las semanas, con sus respuestas
//   POST   /api/admin/pulso          una semana nueva
//   PATCH  /api/admin/pulso          corregir una
//   DELETE /api/admin/pulso?id=…     retirar una que no ha empezado
//
// ── POR QUÉ ESTO NO EXISTÍA ───────────────────────────────────────────────
// El Pulso se sembró con tres preguntas desde una migración y nunca tuvo
// pantalla. Para escribir la cuarta había que abrir el editor SQL de
// Supabase y escribir un INSERT a mano — con lo cual la pregunta semanal
// dependía de que alguien que supiera SQL estuviera disponible el lunes.
//
// ── LA REGLA QUE HAY QUE RESPETAR ─────────────────────────────────────────
// La pregunta vigente es LA MÁS RECIENTE CUYA FECHA YA PASÓ. No hay un
// interruptor de «activa»: rotan solas por fecha.
//
// Eso tiene una consecuencia que la pantalla debe dejar clarísima: cambiar
// la fecha de una semana futura la adelanta o la retrasa, y poner una fecha
// pasada la activa AHORA MISMO, desplazando a la que estuviera.
//
// ── LO QUE NO SE BORRA ────────────────────────────────────────────────────
// Una semana que ya empezó no se puede retirar desde aquí. Puede tener
// respuestas de gente, y borrarla se las llevaría por delante. Corregir el
// texto sí; hacerla desaparecer, no.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

type Semana = {
  id: string
  numero: number
  pregunta: string
  invitacion: string
  inicia_en: string
  dias: number
  practica_titulo: string | null
  practica_url: string | null
  practica_duracion: string | null
}

async function exigirAdmin() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { respuesta: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) }
  if (!isAdmin(user)) return { respuesta: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { user }
}

/** Lo que se puede escribir. Lo que no esté aquí se descarta en silencio. */
function soloEditable(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  if (typeof body.numero === "number") out.numero = body.numero
  if (typeof body.pregunta === "string") out.pregunta = body.pregunta.trim()
  if (typeof body.invitacion === "string") out.invitacion = body.invitacion.trim()
  if (typeof body.inicia_en === "string") out.inicia_en = body.inicia_en
  if (typeof body.dias === "number") out.dias = body.dias
  for (const campo of ["practica_titulo", "practica_url", "practica_duracion"] as const) {
    if (typeof body[campo] === "string") {
      const v = (body[campo] as string).trim()
      out[campo] = v.length === 0 ? null : v
    }
  }
  return out
}

export async function GET() {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from("pulso_semanal")
    .select("id, numero, pregunta, invitacion, inicia_en, dias, practica_titulo, practica_url, practica_duracion")
    .order("inicia_en", { ascending: false })

  if (error) {
    console.error("[admin/pulso] leer:", error.message)
    return NextResponse.json({ error: "No se pudo leer" }, { status: 500 })
  }

  const semanas = (data || []) as Semana[]

  // ── CUÁNTAS RESPUESTAS LLEVA CADA UNA ────────────────────────────────
  // Es el único número que dice si una pregunta funcionó. Sin él, escribir
  // la siguiente es escribir a ciegas.
  const conteos = new Map<string, number>()
  if (semanas.length > 0) {
    const { data: respuestas } = await admin
      .from("pulso_respuestas")
      .select("pulso_id")
      .in("pulso_id", semanas.map((s) => s.id))
    for (const r of (respuestas || []) as Array<{ pulso_id: string }>) {
      conteos.set(r.pulso_id, (conteos.get(r.pulso_id) ?? 0) + 1)
    }
  }

  // La vigente, con la misma regla que usa la pantalla de los miembros: la
  // más reciente que ya empezó. Calcularla aquí evita que el panel invente
  // su propia versión y acaben discrepando.
  const hoy = new Date().toISOString().slice(0, 10)
  const vigente = semanas.find((s) => s.inicia_en <= hoy)?.id ?? null

  return NextResponse.json({
    hoy,
    vigente,
    semanas: semanas.map((s) => ({ ...s, respuestas: conteos.get(s.id) ?? 0 })),
  })
}

export async function POST(req: NextRequest) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const fila = soloEditable(body)
  if (!fila.pregunta || String(fila.pregunta).length < 5) {
    return NextResponse.json({ error: "Falta la pregunta." }, { status: 400 })
  }
  if (!fila.inicia_en) {
    return NextResponse.json({ error: "Falta la fecha en que empieza." }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // El número se sugiere solo: es un rótulo («Semana 12»), no una clave, y
  // pedirlo a mano es pedir que alguien lo repita o se salte uno.
  if (typeof fila.numero !== "number") {
    const { data: ultima } = await admin
      .from("pulso_semanal")
      .select("numero")
      .order("numero", { ascending: false })
      .limit(1)
      .maybeSingle<{ numero: number }>()
    fila.numero = (ultima?.numero ?? 0) + 1
  }

  const { data, error } = await admin
    .from("pulso_semanal")
    .insert(fila)
    .select("*")
    .single()

  if (error) {
    console.error("[admin/pulso] crear:", error.message)
    return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 })
  }

  return NextResponse.json({ ok: true, semana: data })
}

export async function PATCH(req: NextRequest) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const id = typeof body.id === "string" ? body.id : null
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 })

  const cambios = soloEditable(body)
  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "No hay nada que cambiar." }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from("pulso_semanal")
    .update(cambios)
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    console.error("[admin/pulso] corregir:", error.message)
    return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 })
  }

  return NextResponse.json({ ok: true, semana: data })
}

export async function DELETE(req: NextRequest) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 })

  const admin = getSupabaseAdmin()

  const { data: semana } = await admin
    .from("pulso_semanal")
    .select("inicia_en")
    .eq("id", id)
    .maybeSingle<{ inicia_en: string }>()

  if (!semana) return NextResponse.json({ error: "No existe." }, { status: 404 })

  // ── LO QUE YA EMPEZÓ NO SE RETIRA ────────────────────────────────────
  // Puede tener respuestas de gente. Borrarla se las llevaría por delante, y
  // nadie que pulse «eliminar» en una pregunta está pensando en las
  // cuarenta respuestas que hay debajo.
  const hoy = new Date().toISOString().slice(0, 10)
  if (semana.inicia_en <= hoy) {
    return NextResponse.json(
      { error: "Esta semana ya empezó y puede tener respuestas. Se puede corregir el texto, no retirarla." },
      { status: 409 },
    )
  }

  const { error } = await admin.from("pulso_semanal").delete().eq("id", id)
  if (error) {
    console.error("[admin/pulso] retirar:", error.message)
    return NextResponse.json({ error: "No se pudo retirar." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
