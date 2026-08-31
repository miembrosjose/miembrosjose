// POST /api/products/[id]/confirm  { payment_intent_id }
// Cierra el flujo tras 3DS o el Payment Element: recupera el PaymentIntent,
// valida que es NUESTRO (metadata + usuario + producto) y que está 'succeeded',
// y registra el acceso de forma idempotente. El frontend NUNCA crea el acceso.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe/server"
import { getMembership } from "@/lib/membership"
import { getServerProduct, registerProductEntitlement } from "@/lib/product-purchase"

export const dynamic = "force-dynamic"

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const membership = await getMembership(supabase)
  if (!membership.authenticated || !user) {
    return NextResponse.json({ status: "unauthenticated" }, { status: 401 })
  }
  if (!membership.active) {
    return NextResponse.json({ status: "membership_required" }, { status: 403 })
  }

  let body: { payment_intent_id?: string }
  try { body = await req.json() } catch { return NextResponse.json({ status: "invalid_body" }, { status: 400 }) }
  const piId = typeof body.payment_intent_id === "string" ? body.payment_intent_id : ""
  if (!piId) return NextResponse.json({ status: "invalid_body" }, { status: 400 })

  const product = await getServerProduct(id)
  if (!product) return NextResponse.json({ status: "not_found" }, { status: 404 })

  const userId = user.id
  const stripe = getStripe()
  const pi = await stripe.paymentIntents.retrieve(piId)

  if (
    pi.metadata?.type !== "product_purchase" ||
    pi.metadata?.user_id !== userId ||
    pi.metadata?.product_id !== product.id
  ) {
    return NextResponse.json({ status: "mismatch" }, { status: 403 })
  }

  if (pi.status !== "succeeded") {
    return NextResponse.json({ status: "pending", pi_status: pi.status })
  }

  await registerProductEntitlement({ userId, productId: product.id, paymentIntentId: pi.id })
  return NextResponse.json({ status: "unlocked" })
}
