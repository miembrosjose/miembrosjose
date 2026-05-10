// API — cria PaymentIntent deferred pra comprar produto premium (fallback do 1-click).
//
// POST /api/buy-product/create-pi
//   Body: { product_key, currency, amount }

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/server"
import { CHECKOUT_CONFIG } from "@/lib/checkout-configs"

export const dynamic = "force-dynamic"

const VALID_KEYS = new Set(["creativos", "andromeda", "analytics", "minivsl", "revisao"])
const AMOUNT_TOLERANCE_PCT = 0.05

function getProductPriceUsd(productKey: string): number | null {
  const bump = CHECKOUT_CONFIG.bumps.find((b) => b.key === productKey)
  if (bump) return bump.price
  const upsell = CHECKOUT_CONFIG.upsells.find((u) => u.key === productKey)
  if (upsell) return upsell.price
  return null
}

function getProductName(productKey: string): string {
  const NAMES: Record<string, string> = {
    creativos: "Producto 1",
    andromeda: "Producto 2",
    analytics: "Producto 3",
    minivsl: "Upsell 1",
    revisao: "Servicio Premium",
  }
  return NAMES[productKey] || productKey
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 })

  let body: { product_key?: string; currency?: string; amount?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const productKey = body.product_key
  const requestedCurrency = (body.currency || "").toLowerCase()
  const requestedAmount = Number(body.amount)

  if (!productKey || !VALID_KEYS.has(productKey)) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 })
  }
  if (!requestedCurrency || !requestedAmount || requestedAmount <= 0) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 })
  }

  // Só aceita USD
  if (requestedCurrency !== "usd") {
    return NextResponse.json(
      { error: "currency_not_allowed", message: "Solo se acepta USD." },
      { status: 400 },
    )
  }

  const stripe = getStripe()
  const admin = getSupabaseAdmin()

  // Busca customer existente
  const { data: sales } = await admin
    .from("stripe_sales")
    .select("stripe_customer_id, customer_name, customer_phone")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(10)

  const saleWithCustomer = (sales || []).find(
    (s) => (s as { stripe_customer_id?: string | null }).stripe_customer_id,
  ) as
    | {
        stripe_customer_id?: string | null
        customer_name?: string | null
        customer_phone?: string | null
      }
    | undefined
  const stripeCustomerId = saleWithCustomer?.stripe_customer_id || null

  const userMeta = (user.user_metadata || {}) as {
    full_name?: string
    name?: string
    phone?: string
  }
  const customerName =
    userMeta.full_name || userMeta.name || saleWithCustomer?.customer_name || ""
  const customerPhone = userMeta.phone || saleWithCustomer?.customer_phone || ""

  const priceUsd = getProductPriceUsd(productKey)
  if (!priceUsd) {
    return NextResponse.json({ error: "product_not_found" }, { status: 400 })
  }

  // Valida amount (±5%)
  const diff = Math.abs(requestedAmount - priceUsd) / priceUsd
  if (diff > AMOUNT_TOLERANCE_PCT) {
    return NextResponse.json(
      { error: "amount_mismatch", message: "Valor inválido. Recarga la página." },
      { status: 400 },
    )
  }

  const amountCents = Math.round(requestedAmount * 100)

  try {
    const productName = getProductName(productKey)
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      setup_future_usage: "off_session",
      customer: stripeCustomerId || undefined,
      receipt_email: user.email || undefined,
      description: `Compra premium: ${productName}`,
      metadata: {
        sale_type: "upsell",
        upsells: productKey,
        product_key: productKey,
        upsell_user_id: user.id,
        items: JSON.stringify([{ key: productKey, price: priceUsd }]),
        customer_email: user.email || "",
        customer_name: customerName,
        customer_phone: customerPhone,
        total_usd_cents: String(Math.round(priceUsd * 100)),
      },
    })

    return NextResponse.json({
      client_secret: pi.client_secret,
      payment_intent_id: pi.id,
      amount: amountCents,
      currency: "usd",
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error creating payment intent"
    console.error("[/api/buy-product/create-pi]", msg)
    return NextResponse.json({ error: "stripe_error", message: msg }, { status: 500 })
  }
}
