// API — cria PaymentIntent deferred pra comprar produto premium (fallback do 1-click).
// Usado pelo StripeInlinePayment quando 1-click off-session falha ou cliente Hotmart.
//
// POST /api/buy-product/create-pi
//   Body: { product_key, currency, amount }
//
// Lógica:
//   1. Auth via cookie Supabase
//   2. Valida product_key
//   3. Calcula valor esperado (preço USD da config + conversão se moeda local)
//   4. Valida amount enviado (anti-fraude, ±5% tolerância)
//   5. Cria PaymentIntent deferred (sem off_session, sem auto-confirm)
//      com setup_future_usage='off_session' (próximas compras viram 1-click)
//   6. Retorna client_secret pro componente Elements confirmar
//
// Webhook stripe-webhook detecta sale_type='upsell' e cria stripe_sale.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/server"
import { CHECKOUT_CONFIGS, type CheckoutRegion } from "@/lib/checkout-configs"
import { getExchangeRates, convertFromUsd, type SupportedCurrency } from "@/lib/exchange-rates"
import { applyBrTestPrice } from "@/lib/br-test-pricing"

export const dynamic = "force-dynamic"

const VALID_KEYS = new Set(["creativos", "andromeda", "analytics", "minivsl", "revisao"])

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
  "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
])

const NATIVE_CURRENCY_BY_REGION: Record<string, string> = {
  USD: "usd",
  EUR: "eur",
  GBP: "gbp",
  CHF: "chf",
}

const AMOUNT_TOLERANCE_PCT = 0.05

function getProductPriceUsd(region: CheckoutRegion, productKey: string): number | null {
  const config = CHECKOUT_CONFIGS[region]
  if (!config) return null
  const bump = config.bumps.find((b) => b.key === productKey)
  if (bump) return bump.price
  const upsell = config.upsells.find((u) => u.key === productKey)
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

  const stripe = getStripe()
  const admin = getSupabaseAdmin()

  // Detecta região via sale válida mais recente + Stripe customer existente +
  // dados do cliente (nome/telefone). Filtra regions inválidas (AUTO_BONO etc).
  const VALID_REGIONS: ReadonlySet<string> = new Set(["DEFAULT", "USD", "EUR", "GBP", "CHF"])
  const { data: sales } = await admin
    .from("stripe_sales")
    .select("region, customer_country, stripe_customer_id, customer_name, customer_phone")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(10)

  const validSale = (sales || []).find((s) => {
    const r = (s as { region?: string | null }).region
    return r && VALID_REGIONS.has(r)
  })

  let region: CheckoutRegion = "DEFAULT"
  let saleCountry: string | null = null
  if (validSale) {
    region = (validSale.region as CheckoutRegion) || "DEFAULT"
    saleCountry = (validSale.customer_country as string | null) || null
  }

  // Stripe customer existente — qualquer sale com stripe_customer_id (incluindo
  // sales antigas em region inválida que ainda têm customer válido).
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

  // Nome/telefone — prioriza user_metadata (Supabase) → última sale → vazio.
  const userMeta = (user.user_metadata || {}) as {
    full_name?: string
    name?: string
    phone?: string
  }
  const customerName =
    userMeta.full_name || userMeta.name || saleWithCustomer?.customer_name || ""
  const customerPhone = userMeta.phone || saleWithCustomer?.customer_phone || ""

  const originalPriceUsd = getProductPriceUsd(region, productKey)
  if (!originalPriceUsd) {
    return NextResponse.json({ error: "product_not_in_region" }, { status: 400 })
  }
  // 🧪 Override BR: aplica $0.20 USD se country=BR
  const detectedCountry = saleCountry || req.headers.get("cf-ipcountry") || null
  const priceUsd = applyBrTestPrice(originalPriceUsd, detectedCountry)

  // Pra USD/EUR/GBP/CHF, currency precisa bater com região
  const nativeCurrency = NATIVE_CURRENCY_BY_REGION[region]
  if (nativeCurrency && requestedCurrency !== nativeCurrency) {
    return NextResponse.json(
      {
        error: "currency_not_allowed",
        message: `Para esta región solo se acepta ${nativeCurrency.toUpperCase()}.`,
      },
      { status: 400 },
    )
  }

  // Calcula valor esperado
  let expectedAmount: number
  if (requestedCurrency === "usd") {
    expectedAmount = priceUsd
  } else {
    try {
      const rates = await getExchangeRates()
      const converted = convertFromUsd(priceUsd, requestedCurrency as SupportedCurrency, rates)
      if (!converted || converted <= 0) {
        return NextResponse.json(
          { error: "currency_not_supported" },
          { status: 400 },
        )
      }
      expectedAmount = converted
    } catch {
      return NextResponse.json(
        { error: "currency_rate_unavailable" },
        { status: 500 },
      )
    }
  }

  // Valida amount (±5%)
  const diff = Math.abs(requestedAmount - expectedAmount) / expectedAmount
  if (diff > AMOUNT_TOLERANCE_PCT) {
    console.warn("[/api/buy-product/create-pi] amount mismatch", {
      user_id: user.id,
      product_key: productKey,
      requested: requestedAmount,
      expected: expectedAmount,
      diff_pct: diff,
    })
    return NextResponse.json(
      { error: "amount_mismatch", message: "Valor inválido. Recarga la página." },
      { status: 400 },
    )
  }

  const amountCents = ZERO_DECIMAL_CURRENCIES.has(requestedCurrency)
    ? Math.round(requestedAmount)
    : Math.round(requestedAmount * 100)

  // Cria PaymentIntent deferred
  try {
    const productName = getProductName(productKey)
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: requestedCurrency,
      // automatic_payment_methods habilita Card + Apple Pay + Google Pay + Link
      // dependendo do dispositivo e da config da conta no Stripe Dashboard.
      // allow_redirects:never bloqueia métodos que precisam redirect (boleto, etc)
      // pra UX 1-click (cliente já tá logado, não queremos redirect).
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      setup_future_usage: "off_session",
      // Vincula ao Stripe Customer existente do user — necessário pra que
      // o cartão novo digitado fique salvo no customer (próxima compra
      // vira 1-click off-session).
      customer: stripeCustomerId || undefined,
      receipt_email: user.email || undefined,
      description: `Compra premium: ${productName}`,
      metadata: {
        sale_type: "upsell",
        // upsells (csv) — formato esperado pelo webhook handlePaymentIntentSucceeded
        upsells: productKey,
        product_key: productKey,
        upsell_user_id: user.id,
        region,
        // items JSON — fallback pro caso de processamento alternativo
        items: JSON.stringify([{ key: productKey, price: priceUsd }]),
        // Dados do cliente — webhook handler usa pra salvar em stripe_sales
        // sem precisar pedir email/nome/telefone (já temos do auth + sales antigas).
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
      currency: requestedCurrency,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error creating payment intent"
    console.error("[/api/buy-product/create-pi]", msg)
    return NextResponse.json({ error: "stripe_error", message: msg }, { status: 500 })
  }
}
