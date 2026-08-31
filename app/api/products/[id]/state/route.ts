// GET /api/products/[id]/state
// Estado de compra de un producto de la Tienda para el usuario actual:
//   { owned, price_cents, currency, purchasable }
// El precio SIEMPRE se lee del servidor (Supabase). Admin => owned=true.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getMembership } from "@/lib/membership"
import { getServerProduct, hasProductAccess } from "@/lib/product-purchase"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const membership = await getMembership(supabase)
  if (!membership.authenticated || !user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }

  const product = await getServerProduct(id)
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 })

  // Admin ve todo desbloqueado.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()
  const isAdmin = !!profile?.is_admin

  const owned = isAdmin || (await hasProductAccess(user.id, product.id))

  return NextResponse.json({
    owned,
    price_cents: product.priceCents,
    currency: product.currency,
    purchasable: product.isPurchasable,
  })
}
