// GET /api/user/season-access → retorna lista de season_ids que o user
// tem acesso. Frontend usa pra decidir se mostra grayscale + redirect ao
// checkout em temporadas bloqueadas.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  // Admin pode ver tudo (acesso total)
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (profile?.is_admin) {
    // Pega TODOS os season ids — admin tem acesso completo por padrão
    const { data: all } = await supabase.from("seasons").select("id")
    return NextResponse.json({
      season_ids: (all ?? []).map((s) => s.id),
      is_admin_override: true,
    })
  }

  const { data, error } = await supabase
    .from("user_season_access")
    .select("season_id")
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    season_ids: (data ?? []).map((r) => r.season_id),
    is_admin_override: false,
  })
}
