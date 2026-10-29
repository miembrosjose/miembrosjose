// API — marcar una comunicación interna como leída.
//
//   POST /api/comunicaciones/<id>/leida   { via?: "abierta" | "cerrada" | "cta" }
//
// ── POR QUÉ ESTO ES UN POST Y NO VIAJA EN EL GET ──────────────────────────
// Porque leer la lista no es haberla leído. Si el propio GET marcara, bastaría
// con que la campana se cargara en segundo plano para que todo quedara leído
// sin que nadie hubiera visto nada — y la ventana que interrumpe no volvería
// a salir jamás, que es justo lo que no puede pasar.
//
// ── EL `via` NO CAMBIA NADA, PERO SE GUARDA ───────────────────────────────
// Leída es leída, venga de donde venga. Se registra cómo porque es la única
// forma de saber si el botón del aviso sirvió de algo, y cuesta una columna.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { marcarLeida, type ComoSeLeyo } from "@/lib/comunicaciones/internas"

export const dynamic = "force-dynamic"

const VIAS: ComoSeLeyo[] = ["abierta", "cerrada", "cta"]

const ES_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await ctx.params
  if (!ES_ID.test(id)) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })
  }

  // El cuerpo es opcional: `navigator.sendBeacon` al cerrar la pestaña puede
  // llegar sin nada, y eso sigue siendo una lectura válida.
  let via: ComoSeLeyo = "abierta"
  try {
    const body = await req.json() as { via?: string }
    if (body?.via && VIAS.includes(body.via as ComoSeLeyo)) via = body.via as ComoSeLeyo
  } catch { /* sin cuerpo: se queda en «abierta» */ }

  // ── SE MARCA PARA UNO MISMO, SIEMPRE ───────────────────────────────────
  // El identificador de la persona sale de la sesión, nunca del cuerpo. Si
  // viniera de fuera, cualquiera podría marcar por otro y hacer desaparecer
  // un aviso que esa persona no ha visto.
  const r = await marcarLeida(id, user.id, via)
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 500 })

  return NextResponse.json({ ok: true })
}
