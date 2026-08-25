// Auth-gating server-side compartilhado entre as páginas de /miembros.
//
// Acesso ao conteúdo privado exige, nesta ordem:
//   1. Sessão válida do Supabase Auth (senão → /miembros/login).
//   2. Se o user for ADMIN (mecanismo existente: profiles.is_admin, checado
//      server-side — mesmo mecanismo de lib/admin-auth.ts) → entra direto.
//   3. Caso contrário, precisa de uma linha em member_subscriptions com o
//      mesmo email (garantido pelo RLS) e status = 'active'. Qualquer outro
//      estado (pending / past_due / canceled / sem linha) → /miembros/acceso-suspendido.
//
// A verificação é 100% server-side via RLS (a query com a sessão do user só
// retorna a própria linha). Nunca se confia em localStorage.
//
// Acesso granular por temporada/produto continua controlado pelas tabelas
// user_season_access / user_product_access.

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

  // 1. Sessão válida
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/miembros/login")

  // 2. Bypass de admin — mesmo mecanismo server-side existente (profiles.is_admin).
  //    Nunca usa user_metadata nem lista de emails hardcoded, e o cliente não decide.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()
  if (profile?.is_admin === true) {
    return { user, supabase }
  }

  // 3. Membro normal: precisa de membresía ativa. O RLS garante que esta query
  //    só retorna a linha cujo email == email da sessão.
  const { data: sub } = await supabase
    .from("member_subscriptions")
    .select("status, current_period_end")
    .maybeSingle()

  // 4. Acesso concedido se:
  //    - status 'active', OU
  //    - cancelada AO FINAL DO PERÍODO: acceso permanece até current_period_end
  //      (é o que a própria página "Acceso hasta …" indica). Antes qualquer
  //      status != 'active' bloqueava, o que negava acesso já pago.
  const periodEndMs = sub?.current_period_end
    ? new Date(sub.current_period_end as string).getTime()
    : 0
  const hasAccess =
    sub?.status === "active" ||
    (sub?.status === "canceled" && periodEndMs > Date.now())

  // Fail-closed: qualquer outro caso (past_due / inactive / expirada / sem linha) → suspenso.
  if (!hasAccess) {
    redirect("/miembros/acceso-suspendido")
  }

  return { user, supabase }
}
