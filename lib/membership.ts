// Verificación de membresía server-side, reutilizando el MISMO mecanismo que
// app/miembros/_lib/auth-server.ts: admin (profiles.is_admin) o una fila activa
// en member_subscriptions (status = 'active'), garantizado por RLS.
//
// El control de acceso a audios privados SIEMPRE ocurre aquí, en el servidor.

import { getSupabaseServer } from "@/lib/supabase/server"

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
    .select("status")
    .maybeSingle()

  return {
    userId: user.id,
    authenticated: true,
    isAdmin: false,
    active: sub?.status === "active",
  }
}

/**
 * Entitlement de una meditación PREMIUM (compra específica).
 *
 * STUB — el sistema de compras adicionales aún no existe. La separación queda
 * preparada: cuando exista (Stripe + tabla de entitlements), esta función
 * consultará la compra del usuario. Hoy devuelve false → premium sigue bloqueado.
 */
export async function hasPremiumEntitlement(
  _supabase: SupabaseServer,
  _userId: string,
  _meditationId: string,
): Promise<boolean> {
  return false
}
