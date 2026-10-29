// API — las plantillas de correo guardadas.
//
//   GET  /api/admin/comunicaciones/plantillas
//   POST /api/admin/comunicaciones/plantillas   { nombre, html, descripcion? }
//
// ── QUÉ ES UNA PLANTILLA AQUÍ Y QUÉ NO ────────────────────────────────────
// Es un punto de partida: HTML que se copia al empezar. NO es una plantilla
// con huecos que se rellenan —no hay variables, no hay motor— porque eso ya
// existe y se llama modo formulario.
//
// La diferencia importa: si esto tuviera variables, habría dos sistemas de
// plantillas en la misma pantalla y habría que explicar cuál usar cuándo.
//
// ── LAS DE FÁBRICA NO ESTÁN AQUÍ ──────────────────────────────────────────
// Las cinco de partida viven en el código, en `EditorCodigo.tsx`, porque son
// diseño de la marca: cambian cuando cambia la marca, no cuando se escribe
// un correo. Esta tabla es solo para lo que administración quiera guardar.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin } from "@/lib/comunicaciones/servidor"

export const dynamic = "force-dynamic"

/** Un correo largo cabe de sobra. Más que esto es un error de pegado. */
const TOPE_HTML = 400_000

function faltaLaTabla(mensaje: string): boolean {
  return /email_templates|does not exist|schema cache/i.test(mensaje)
}

export async function GET() {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { data, error } = await getSupabaseAdmin()
    .from("email_templates")
    .select("id, nombre, descripcion, html, created_at")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    // Entre desplegar y correr el SQL hay un hueco. Ahí esto devuelve una
    // lista vacía en vez de un error: el editor sigue teniendo las cinco de
    // fábrica, que es lo que de verdad hace falta para empezar.
    if (faltaLaTabla(error.message)) return NextResponse.json({ ok: true, plantillas: [] })
    console.error("[comunicaciones] plantillas · listar:", error.message)
    return NextResponse.json({ error: "No se pudieron leer" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plantillas: data || [] })
}

export async function POST(req: NextRequest) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  let body: { nombre?: unknown; html?: unknown; descripcion?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : ""
  const html = typeof body.html === "string" ? body.html : ""
  const descripcion = typeof body.descripcion === "string" ? body.descripcion.trim().slice(0, 300) : ""

  if (!nombre) {
    return NextResponse.json({ error: "Ponle un nombre: es por lo que la vas a reconocer." }, { status: 400 })
  }
  if (nombre.length > 80) {
    return NextResponse.json({ error: "El nombre es demasiado largo." }, { status: 400 })
  }
  if (!html.trim()) {
    return NextResponse.json({ error: "No hay nada que guardar." }, { status: 400 })
  }
  if (html.length > TOPE_HTML) {
    return NextResponse.json({ error: "Ese HTML es demasiado grande." }, { status: 400 })
  }

  // ── SE GUARDA SIN LIMPIAR ──────────────────────────────────────────────
  // Igual que el correo: el saneador actúa al DIBUJAR. Guardar lo limpio
  // perdería el original, y una plantilla es justo lo que más tiempo va a
  // vivir en la base.
  const { data, error } = await getSupabaseAdmin()
    .from("email_templates")
    // Guardar con un nombre que ya existe lo REEMPLAZA. Es lo que quiere
    // decir quien escribe el mismo nombre otra vez; crear una segunda
    // «Carta» dejaría dos plantillas indistinguibles en la lista.
    .upsert(
      { nombre, descripcion, html, created_by: g.user.id, updated_at: new Date().toISOString() },
      { onConflict: "nombre" },
    )
    .select("id, nombre")
    .single()

  if (error) {
    if (faltaLaTabla(error.message)) {
      return NextResponse.json({
        error: "Falta correr docs/sql/comunicaciones_03_internas.sql en Supabase.",
      }, { status: 503 })
    }
    console.error("[comunicaciones] plantillas · guardar:", error.message)
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plantilla: data })
}

export async function DELETE(req: NextRequest) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const id = req.nextUrl.searchParams.get("id") || ""
  if (!id) return NextResponse.json({ error: "Falta el identificador" }, { status: 400 })

  const { error } = await getSupabaseAdmin()
    .from("email_templates")
    .delete()
    .eq("id", id)
    // Las de fábrica no se borran desde aquí. Hoy no hay ninguna en la tabla
    // —viven en el código— pero la condición va puesta: el día que se
    // siembre alguna, recuperarla exigiría volver a correr el SQL.
    .eq("es_base", false)

  if (error) {
    console.error("[comunicaciones] plantillas · borrar:", error.message)
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
