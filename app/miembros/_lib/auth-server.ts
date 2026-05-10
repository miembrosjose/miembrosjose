// Auth-gating server-side compartilhado entre as páginas de /miembros.
// Antes esse mesmo bloco era copiado em 7 page.tsx — qualquer mudança
// (logging, tweak no dev bypass, troca de redirect) precisava ser feita
// nas 7. Agora fica num lugar só.
//
// Uso:
//   const { user, supabase } = await requireMiembrosAuth()
//   // já validou login (em prod) — pode chamar isAdmin(user) etc.
//
// Pra páginas que precisam de front válido (Lecciones, Comunidad, Inicio,
// Funnels), use requireFrontAccess() — checa expires_at e redireciona pra
// /miembros/acceso-vencido se expirou.

import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

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

/**
 * Auth + checa se user tem front VÁLIDO (não expirado, não revogado).
 * Se expirado, redireciona pra /miembros/acceso-vencido.
 * Admin sempre passa (bypass).
 *
 * Use em páginas: /miembros (inicio), /miembros/lecciones, /miembros/perfil,
 * /miembros/mensajes, /miembros/u/[id], etc.
 *
 * NÃO use em /miembros/producto/* — produtos premium não vencem, só o front.
 */
export async function requireFrontAccess(): Promise<MiembrosAuthResult> {
  const result = await requireMiembrosAuth()
  if (process.env.NODE_ENV === "development") return result
  const { user } = result
  if (!user) return result // requireMiembrosAuth já redirecionou

  // Admin nunca expira
  if (isAdmin(user)) return result

  // Checa stripe_sales pelo user — se TODOS sales front estão expirados,
  // redirect pra /miembros/acceso-vencido.
  const admin = getSupabaseAdmin()
  const { data: sales } = await admin
    .from("stripe_sales")
    .select("items, expires_at")
    .eq("user_id", user.id)
    .eq("status", "paid")

  const nowMs = Date.now()
  let hasValidFront = false
  for (const s of sales || []) {
    const items = (s.items as Array<{ key?: string }>) || []
    const isFrontSale = items.some((it) => it?.key && it.key.replace(/__downsell$/, "") === "front")
    if (!isFrontSale) continue
    // expires_at NULL = permanente (pré-migration). expires_at no futuro = válido.
    const exp = (s as { expires_at?: string | null }).expires_at
    if (!exp || new Date(exp).getTime() > nowMs) {
      hasValidFront = true
      break
    }
  }

  if (!hasValidFront) {
    redirect("/miembros/acceso-vencido")
  }

  return result
}
