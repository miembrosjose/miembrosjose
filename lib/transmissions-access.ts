// Acceso a categorías de Transmisiones (paywall).
//
// Modelo: un ÚNICO producto ($9.99) desbloquea TODAS las categorías bloqueadas.
// Se compra con el 1-click de Stripe (mismo sistema que meditaciones/numerología:
// products + user_product_access). Admin y testers/reviewers ven todo.
// Categorías gratuitas siempre accesibles.
//
// Defensivo: si las tablas/columnas/producto todavía no existen, degrada a
// "sin bloqueo" para no romper la lectura.

import type { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { hasProductAccess } from "@/lib/product-purchase"
import { TRANSMISIONES_ACCESS_PRODUCT_NUM } from "@/app/miembros/_lib/tool-products"

type Supa = Awaited<ReturnType<typeof getSupabaseServer>>

export type TxProduct = { id: string; priceCents: number; currency: string } | null

let cachedProduct: TxProduct | undefined

// Producto único de acceso a Transmisiones (num estable = 93). Cacheado por proceso.
export async function getTransmisionsProduct(): Promise<TxProduct> {
  if (cachedProduct !== undefined) return cachedProduct
  try {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from("products")
      .select("id, price_cents, currency")
      .eq("num", TRANSMISIONES_ACCESS_PRODUCT_NUM)
      .maybeSingle<{ id: string; price_cents?: number; currency?: string }>()
    cachedProduct = data
      ? { id: data.id, priceCents: Number(data.price_cents ?? 999), currency: (data.currency || "usd").toLowerCase() }
      : null
  } catch {
    cachedProduct = null
  }
  return cachedProduct
}

export type CategoryAccess = {
  /** Acceso total: admin/tester o compra del producto. */
  isAdminLike: boolean
  grantedSlugs: Set<string>
}

export async function getCategoryAccess(supabase: Supa, userId: string): Promise<CategoryAccess> {
  let fullAccess = false
  const grantedSlugs = new Set<string>()

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, manual_access, access_role")
      .eq("id", userId)
      .maybeSingle<{ is_admin?: boolean; manual_access?: boolean; access_role?: string | null }>()
    const role = profile?.access_role
    fullAccess =
      profile?.is_admin === true ||
      profile?.manual_access === true ||
      role === "tester" || role === "reviewer" || role === "admin"
  } catch {
    fullAccess = false
  }

  // Compra del producto único → acceso total a las categorías bloqueadas.
  if (!fullAccess) {
    try {
      const product = await getTransmisionsProduct()
      if (product) fullAccess = await hasProductAccess(userId, product.id)
    } catch {
      /* sin producto/acceso */
    }
  }

  // Accesos por categoría concedidos manualmente (opcional).
  try {
    const { data } = await supabase
      .from("user_category_access")
      .select("category_slug")
      .eq("user_id", userId)
    for (const row of data || []) grantedSlugs.add((row as { category_slug: string }).category_slug)
  } catch {
    /* tabla ausente */
  }

  return { isAdminLike: fullAccess, grantedSlugs }
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
