// API — las comunicaciones internas de quien pregunta.
//
//   GET /api/comunicaciones/mias
//
// Devuelve { lista, sinLeer, bloqueante }.
//
// ── POR QUÉ `bloqueante` VIENE APARTE ──────────────────────────────────────
// Porque es la única que cambia lo que la pantalla hace, no solo lo que
// enseña. El resto se pintan en el centro de avisos cuando a la persona le
// apetece; esta interrumpe. Separarla evita que el componente tenga que
// recorrer la lista buscando cuál era y decidir él, que es como se acaba
// enseñando dos ventanas a la vez.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { internasDe } from "@/lib/comunicaciones/internas"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { lista, sinLeer } = await internasDe(user.id, user.created_at)

  // La primera sin leer que interrumpa. Si hay dos, se enseña una y la otra
  // espera a la siguiente visita: encadenar ventanas es la forma más rápida
  // de que se cierren sin leer.
  const bloqueante = lista.find((c) => c.display_mode === "modal_once" && !c.leida) ?? null

  return NextResponse.json({ lista, sinLeer, bloqueante })
}
