// Acceso a categorías de Transmisiones (paywall).
//
// Regla: una categoría bloqueada (is_locked) requiere que el usuario tenga
// acceso concedido (user_category_access) para leer su contenido. Admin y
// testers/reviewers ven todo. Categorías gratuitas siempre accesibles.
//
// Defensivo: si las tablas/columnas todavía no existen, degrada a "sin bloqueo"
// para no romper la lectura.

import type { getSupabaseServer } from "@/lib/supabase/server"

type Supa = Awaited<ReturnType<typeof getSupabaseServer>>

export type CategoryAccess = {
  isAdminLike: boolean
  grantedSlugs: Set<string>
}

export async function getCategoryAccess(supabase: Supa, userId: string): Promise<CategoryAccess> {
  let isAdminLike = false
  const grantedSlugs = new Set<string>()

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, manual_access, access_role")
      .eq("id", userId)
      .maybeSingle<{ is_admin?: boolean; manual_access?: boolean; access_role?: string | null }>()
    const role = profile?.access_role
    isAdminLike =
      profile?.is_admin === true ||
      profile?.manual_access === true ||
      role === "tester" || role === "reviewer" || role === "admin"
  } catch {
    isAdminLike = false
  }

  try {
    const { data } = await supabase
      .from("user_category_access")
      .select("category_slug")
      .eq("user_id", userId)
    for (const row of data || []) grantedSlugs.add((row as { category_slug: string }).category_slug)
  } catch {
    /* tabla ausente → sin accesos concedidos */
  }

  return { isAdminLike, grantedSlugs }
}

// Bloqueada para este usuario = categoría marcada is_locked y sin acceso.
export function isCategoryLocked(
  categorySlug: string | null,
  isLocked: boolean,
  access: CategoryAccess,
): boolean {
  if (!isLocked) return false
  if (access.isAdminLike) return false
  if (categorySlug && access.grantedSlugs.has(categorySlug)) return false
  return true
}
