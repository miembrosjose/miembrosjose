// Helpers de compra 1-click de productos de la Tienda (server-only).
// Reutiliza el mismo resolvedor de customer/PaymentMethod que las meditaciones.

import { getSupabaseAdmin } from "@/lib/supabase/admin"

// Reexporta los resolvedores de Stripe (idénticos para productos y meditaciones).
export { resolveInAccountCustomerId, resolveReusablePayment } from "@/lib/meditation-purchase"

export type ServerProduct = {
  id: string
  name: string
  priceCents: number
  currency: string
  isLocked: boolean
  availableFrom: string | null
  /** Comprable = bloqueado + con precio + sin fecha de "próximamente". */
  isPurchasable: boolean
}

/** Lee un producto por id vía service role (bypass RLS). null si no existe. */
export async function getServerProduct(id: string): Promise<ServerProduct | null> {
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from("products")
    .select("id, name, price_cents, currency, is_locked, available_from")
    .eq("id", id)
    .maybeSingle()
  if (!data) return null
  const priceCents = Number((data as { price_cents?: number }).price_cents ?? 0)
  const isLocked = !!(data as { is_locked?: boolean }).is_locked
  const availableFrom = (data as { available_from?: string | null }).available_from ?? null
  return {
    id: (data as { id: string }).id,
    name: (data as { name: string }).name,
    priceCents,
    currency: ((data as { currency?: string }).currency || "usd").toLowerCase(),
    isLocked,
    availableFrom,
    isPurchasable: isLocked && priceCents > 0 && !availableFrom,
  }
}

/** ¿El usuario ya tiene acceso a este producto? (fila en user_product_access). */
export async function hasProductAccess(userId: string, productId: string): Promise<boolean> {
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from("user_product_access")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle()
  return !!data
}

/**
 * Registra (idempotente) el acceso comprado. Usado por el endpoint de
 * confirmación inmediata Y por el webhook (reconciliación). El unique
 * (user_id, product_id) + ignoreDuplicates evita compras duplicadas.
 */
export async function registerProductEntitlement(args: {
  userId: string
  productId: string
  paymentIntentId: string
}): Promise<void> {
  const admin = getSupabaseAdmin()
  await admin.from("user_product_access").upsert(
    {
      user_id: args.userId,
      product_id: args.productId,
      note: `stripe:${args.paymentIntentId}`,
    },
    { onConflict: "user_id,product_id", ignoreDuplicates: true },
  )
}
