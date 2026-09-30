// API — LA BITÁCORA EN EL SERVIDOR.
//
//   GET    /api/journal            todas las entradas de quien pregunta
//   PUT    /api/journal            { entries: [...] } → las guarda (upsert)
//   DELETE /api/journal            { ids: [...] }     → las retira
//
// ── POR QUÉ NO SE USA service_role ─────────────────────────────────────────
// Se usa la sesión de la persona, así que las policies de RLS son las que
// impiden leer o escribir la bitácora de otro. No depende de que este archivo
// acierte con el `where`: aunque tuviera un fallo, la base no devolvería nada
// ajeno.
//
// Eso importa más aquí que en cualquier otra tabla. Esto guarda heridas de
// infancia, patrones familiares y memorias de abuso porque así se pide en los
// portales. Es el sitio donde un error de permisos hace más daño.
//
// ── POR QUÉ EL NAVEGADOR MANDA EL id ───────────────────────────────────────
// El id es `<origen>__<pregunta-en-slug>`, calculado en el cliente desde hace
// tiempo. Que sea determinístico es lo que permite responder la misma pregunta
// desde el móvil y desde el ordenador y que se actualice la MISMA entrada, sin
// tener que preguntarle antes al servidor cuál era.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** Tope por petición. La sincronización manda todo lo que haya cambiado. */
const MAX_ENTRADAS = 500
const MAX_RESPUESTA = 20000

type EntradaCliente = {
  id?: unknown
  category?: unknown
  source?: unknown
  sourceLabel?: unknown
  prompt?: unknown
  answer?: unknown
  private?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

function texto(v: unknown, max = 500): string {
  return typeof v === "string" ? v.slice(0, max) : ""
}

function fecha(v: unknown): string {
  const s = typeof v === "string" ? v : ""
  const t = Date.parse(s)
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString()
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, category, source, source_label, prompt, answer, is_private, created_at, updated_at")
    .eq("user_id", user.id)

  if (error) {
    console.error("[/api/journal GET]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Se devuelve con los nombres que usa el cliente, para que la capa de
  // sincronización no tenga que traducir en dos sitios.
  const entries = (data || []).map((r) => ({
    id: r.id as string,
    category: r.category as string,
    source: r.source as string,
    sourceLabel: (r.source_label as string) ?? "",
    prompt: r.prompt as string,
    answer: r.answer as string,
    private: r.is_private as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }))

  return NextResponse.json({ entries })
}

export async function PUT(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { entries?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const brutas = Array.isArray(body.entries) ? (body.entries as EntradaCliente[]) : []
  if (brutas.length === 0) return NextResponse.json({ ok: true, guardadas: 0 })
  if (brutas.length > MAX_ENTRADAS) {
    return NextResponse.json({ error: "Demasiadas entradas de una vez" }, { status: 413 })
  }

  const filas = brutas
    .filter((e) => texto(e.id) && texto(e.answer, MAX_RESPUESTA).trim())
    .map((e) => ({
      user_id: user.id,
      id: texto(e.id, 200),
      category: texto(e.category, 40),
      source: texto(e.source, 120),
      source_label: texto(e.sourceLabel, 200),
      prompt: texto(e.prompt, 1000),
      answer: texto(e.answer, MAX_RESPUESTA),
      // Privado salvo que se diga lo contrario EXPLÍCITAMENTE. Un valor que no
      // llega, o que llega roto, no puede acabar publicando nada.
      is_private: e.private !== false,
      created_at: fecha(e.createdAt),
      updated_at: fecha(e.updatedAt),
    }))

  if (filas.length === 0) return NextResponse.json({ ok: true, guardadas: 0 })

  const { error } = await supabase
    .from("journal_entries")
    .upsert(filas, { onConflict: "user_id,id" })

  if (error) {
    console.error("[/api/journal PUT]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, guardadas: filas.length })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { ids?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const ids = Array.isArray(body.ids)
    ? (body.ids as unknown[]).map((i) => texto(i, 200)).filter(Boolean).slice(0, MAX_ENTRADAS)
    : []

  if (ids.length === 0) return NextResponse.json({ ok: true, borradas: 0 })

  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("user_id", user.id)
    .in("id", ids)

  if (error) {
    console.error("[/api/journal DELETE]", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, borradas: ids.length })
}
