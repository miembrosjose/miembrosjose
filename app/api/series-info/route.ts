// GET /api/series-info — lê metadados da série (qualquer autenticado)

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data, error } = await supabase
    .from("series_info")
    .select("id, description, cast_text, genres, kind, year, rating, quality")
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[series-info GET] erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ info: data })
}
