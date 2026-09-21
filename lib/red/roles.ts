// Permisos reales de La Red — SERVER ONLY.
//
// Distinción que sostiene toda la seguridad del módulo:
//   · el EMBLEMA es lo que se ve en el perfil;
//   · el PERMISO es una fila vigente en network_role_assignments.
//
// Nada de lo que decida quién puede crear un encuentro, facilitar un círculo o
// administrar un nodo debe leerse del emblema ni del cliente. Se comprueba
// aquí, en servidor, y además en la RLS de cada tabla mediante
// public.has_network_role().

import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const NETWORK_ROLES = [
  "organizador",
  "facilitador",
  "embajador",
  "colaborador",
  "cartografo",
  "guardian",
  "instructor",
] as const

export type NetworkRole = (typeof NETWORK_ROLES)[number]

export function isNetworkRole(v: unknown): v is NetworkRole {
  return typeof v === "string" && (NETWORK_ROLES as readonly string[]).includes(v)
}

/** Roles vigentes de un miembro. Devuelve [] ante cualquier fallo: nunca concede de más. */
export async function getNetworkRoles(userId: string): Promise<NetworkRole[]> {
  if (!userId) return []
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from("network_role_assignments")
      .select("role_code")
      .eq("user_id", userId)
      .is("revoked_at", null)
    if (error) return []
    return (data || [])
      .map((r) => (r as { role_code: string }).role_code)
      .filter(isNetworkRole)
  } catch {
    return []
  }
}

/** ¿Tiene este miembro el rol vigente? Ante la duda, false. */
export async function hasNetworkRole(userId: string, role: NetworkRole): Promise<boolean> {
  if (!userId) return false
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from("network_role_assignments")
      .select("id")
      .eq("user_id", userId)
      .eq("role_code", role)
      .is("revoked_at", null)
      .maybeSingle()
    if (error) return false
    return !!data
  } catch {
    return false
  }
}

/** Roles vigentes de varios miembros a la vez, para listados. */
export async function getNetworkRolesFor(
  userIds: string[],
): Promise<Map<string, NetworkRole[]>> {
  const out = new Map<string, NetworkRole[]>()
  if (!userIds.length) return out
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from("network_role_assignments")
      .select("user_id, role_code")
      .in("user_id", userIds)
      .is("revoked_at", null)
    if (error) return out
    for (const row of data || []) {
      const r = row as { user_id: string; role_code: string }
      if (!isNetworkRole(r.role_code)) continue
      const list = out.get(r.user_id) || []
      list.push(r.role_code)
      out.set(r.user_id, list)
    }
  } catch {
    /* mapa vacío */
  }
  return out
}

/**
 * Concede un rol. Idempotente: si ya lo tiene vigente, no duplica.
 * El llamador DEBE haber comprobado antes que quien lo pide es admin.
 */
/**
 * Insignia que acompaña a cada función. Las funciones sin insignia
 * simplemente no aparecen aquí.
 */
const INSIGNIA_DE_ROL: Partial<Record<NetworkRole, string>> = {
  organizador: "rol_organizador",
  cartografo: "rol_cartografo",
  colaborador: "rol_colaborador",
  instructor: "rol_instructor",
}

/**
 * Concede o retira la insignia ligada a una función. Nunca hace fallar la
 * operación principal: el rol es el permiso, la insignia es su reflejo. Si el
 * reflejo falla, el permiso ya está puesto y eso es lo que importa.
 */
async function sincronizarInsignia(userId: string, role: NetworkRole, conceder: boolean) {
  const insignia = INSIGNIA_DE_ROL[role]
  if (!insignia) return
  try {
    const admin = getSupabaseAdmin()
    if (conceder) {
      const { data: ya } = await admin
        .from("user_unlocked_achievements")
        .select("achievement_id")
        .eq("user_id", userId)
        .eq("achievement_id", insignia)
        .limit(1)
      if (!ya || ya.length === 0) {
        await admin
          .from("user_unlocked_achievements")
          .insert({ user_id: userId, achievement_id: insignia })
      }
      return
    }

    await admin
      .from("user_unlocked_achievements")
      .delete()
      .eq("user_id", userId)
      .eq("achievement_id", insignia)

    // Si la llevaba destacada, se limpia. Solo si era esa: la elección sobre
    // cualquier otra insignia se respeta.
    const { data: u } = await admin.auth.admin.getUserById(userId)
    const meta = (u?.user?.user_metadata || {}) as Record<string, unknown>
    if (meta.featured_badge_id === insignia) {
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: { ...meta, featured_badge_id: null },
      })
    }
  } catch (e) {
    console.error("[roles] sincronizarInsignia", e instanceof Error ? e.message : e)
  }
}

export async function grantNetworkRole(args: {
  userId: string
  role: NetworkRole
  grantedBy: string
  note?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = getSupabaseAdmin()
    const { data: existing } = await admin
      .from("network_role_assignments")
      .select("id")
      .eq("user_id", args.userId)
      .eq("role_code", args.role)
      .is("revoked_at", null)
      .maybeSingle()
    if (existing) {
      await sincronizarInsignia(args.userId, args.role, true)
      return { ok: true }
    }

    const { error } = await admin.from("network_role_assignments").insert({
      user_id: args.userId,
      role_code: args.role,
      granted_by: args.grantedBy,
      note: args.note ?? null,
    })
    if (error) return { ok: false, error: error.message }
    await sincronizarInsignia(args.userId, args.role, true)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" }
  }
}

/** Retira un rol marcando revoked_at. Conserva el histórico: nunca borra. */
export async function revokeNetworkRole(args: {
  userId: string
  role: NetworkRole
  note?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from("network_role_assignments")
      .update({ revoked_at: new Date().toISOString(), note: args.note ?? null })
      .eq("user_id", args.userId)
      .eq("role_code", args.role)
      .is("revoked_at", null)
    if (error) return { ok: false, error: error.message }
    await sincronizarInsignia(args.userId, args.role, false)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" }
  }
}
