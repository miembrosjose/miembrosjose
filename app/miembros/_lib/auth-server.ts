// Auth-gating server-side compartilhado entre as páginas de /miembros.
// Los 144000 = acesso vitalício uma vez liberado. Sem vencimento.
// Quem está logado entra. Acesso granular por temporada/produto é
// controlado pelas tabelas user_season_access / user_product_access.

import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getSupabaseServer } from "@/lib/supabase/server"

export type MiembrosAuthResult = {
  user: User | null
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
}

export async function requireMiembrosAuth(): Promise<MiembrosAuthResult> {
  const supabase = await getSupabaseServer()

  // Em dev pula o gate pra facilitar testes locais sem login real.
  if (process.env.NODE_ENV === "development") {
    return { user: null, supabase }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/miembros/login")

  return { user, supabase }
}
