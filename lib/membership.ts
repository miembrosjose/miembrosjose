// Verificación de membresía server-side, reutilizando el MISMO mecanismo que
// app/miembros/_lib/auth-server.ts: admin (profiles.is_admin) o una fila activa
// en member_subscriptions (status = 'active'), garantizado por RLS.
//
// El control de acceso a audios privados SIEMPRE ocurre aquí, en el servidor.

import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

type SupabaseServer = Awaited<ReturnType<typeof getSupabaseServer>>

export type MembershipInfo = {
  userId: string | null
  authenticated: boolean
  isAdmin: boolean
  /** Membresía mensual activa (o admin). */
  active: boolean
}

export async function getMembership(supabase: SupabaseServer): Promise<MembershipInfo> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { userId: null, authenticated: false, isAdmin: false, active: false }
  }

  // Admin entra siempre (mismo bypass que auth-server.ts).
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()
  if (profile?.is_admin === true) {
    return { userId: user.id, authenticated: true, isAdmin: true, active: true }
  }

  // Membro normal: RLS devuelve solo su propia fila.
  const { data: sub } = await supabase
    .from("member_subscriptions")
    .select("status, current_period_end")
    .maybeSingle()

  // Igual que el gate (auth-server): activa, o cancelada al final del período
  // con acceso vigente hasta current_period_end.
  const s = sub as { status?: string; current_period_end?: string | null } | null
  const periodEndMs = s?.current_period_end ? new Date(s.current_period_end).getTime() : 0
  const active = s?.status === "active" || (s?.status === "canceled" && periodEndMs > Date.now())

  return {
    userId: user.id,
    authenticated: true,
    isAdmin: false,
    active,
  }
}

/**
 * Entitlement de una meditación PREMIUM (compra específica).
 *
 * Consulta `meditation_purchases` con el service_role (fiable, sin sorpresas de
 * RLS): true si el usuario tiene una compra `paid` de esa meditación.
 * Si la tabla aún no existe, degrada a false (premium bloqueado).
 */
export async function hasPremiumEntitlement(
  _supabase: SupabaseServer,
  userId: string,
  meditationId: string,
): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from("meditation_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("meditation_id", meditationId)
      .eq("status", "paid")
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}
