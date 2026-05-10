// API — comprar produto premium 1-click off-session.
//
// POST /api/buy-product
//   Body: { product_key: "creativos" | "andromeda" | "analytics" | "minivsl" | "revisao" }
//
// Lógica:
//   1. Auth via cookie Supabase
//   2. Lê preço do produto na config da região do user
//   3. Acha stripe_customer_id mais recente (cliente Hotmart NÃO tem)
//   4. Tenta cobrar off-session com cartão salvo
//   5. Sucesso → cria stripe_sale + retorna sucesso
//   6. Falha → retorna erro pro frontend abrir fallback inline (Elements)
//
// Webhook stripe-webhook detecta sale_type='upsell' + metadata.product_key
// e atualiza tudo (XP, insignias, etc).

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/server"
import { CHECKOUT_CONFIGS, type CheckoutRegion } from "@/lib/checkout-configs"

export const dynamic = "force-dynamic"

const VALID_KEYS = new Set(["creativos", "andromeda", "analytics", "minivsl", "revisao"])

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
  "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
])

/** Encontra preço do produto na config da região */
function getProductPriceUsd(region: CheckoutRegion, productKey: string): number | null {
  const config = CHECKOUT_CONFIGS[region]
  if (!config) return null

  const bump = config.bumps.find((b) => b.key === productKey)
  if (bump) return bump.price

  const upsell = config.upsells.find((u) => u.key === productKey)
  if (upsell) return upsell.price

  return null
}

/** Nome do produto pra metadata + items[] */
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
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  let body: { product_key?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const productKey = body.product_key
  if (!productKey || !VALID_KEYS.has(productKey)) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 })
  }

  const stripe = getStripe()
  const admin = getSupabaseAdmin()

  // 1) Acha sale mais recente do user (pra pegar customer_id + region + currency)
  const { data: sales } = await admin
    .from("stripe_sales")
    .select("region, currency, stripe_customer_id, customer_country")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(5)

  if (!sales || sales.length === 0) {
    return NextResponse.json(
      { error: "no_sales", message: "Necesitas tener una compra previa para usar 1-click." },
      { status: 400 },
    )
  }

  // Pega o sale com stripe_customer_id (pode pular sales Hotmart sem customer)
  const saleWithCustomer = sales.find((s) => s.stripe_customer_id)

  if (!saleWithCustomer || !saleWithCustomer.stripe_customer_id) {
    // Cliente Hotmart ou manual — não tem cartão Stripe. Frontend abre Elements.
    return NextResponse.json(
      {
        error: "no_customer",
        message: "Necesitas ingresar una tarjeta para esta compra.",
      },
      { status: 400 },
    )
  }

  // Filtra region inválida (AUTO_BONO etc) — defaulta pra DEFAULT senão
  // getProductPriceUsd retorna null e API quebra com 400.
  const VALID_REGIONS: ReadonlySet<string> = new Set(["DEFAULT", "USD", "EUR", "GBP", "CHF"])
  const rawRegion = (saleWithCustomer.region as string | null) || "DEFAULT"
  const region: CheckoutRegion = (VALID_REGIONS.has(rawRegion) ? rawRegion : "DEFAULT") as CheckoutRegion
  const productPriceUsd = getProductPriceUsd(region, productKey)
  if (!productPriceUsd) {
    return NextResponse.json({ error: "product_not_in_region" }, { status: 400 })
  }

  // 2) Acha payment_method default
  let paymentMethodId: string | null = null
  try {
    const customer = await stripe.customers.retrieve(saleWithCustomer.stripe_customer_id)
    if (customer.deleted) {
      return NextResponse.json(
        { error: "no_customer", message: "Cliente eliminado. Ingresa una nueva tarjeta." },
        { status: 400 },
      )
    }
    paymentMethodId = (customer.invoice_settings?.default_payment_method as string | null) || null
    if (!paymentMethodId) {
      const pms = await stripe.paymentMethods.list({
        customer: saleWithCustomer.stripe_customer_id,
        type: "card",
        limit: 1,
      })
      paymentMethodId = pms.data[0]?.id || null
    }
  } catch (e) {
    console.error("[/api/buy-product] retrieve customer:", e)
    return NextResponse.json(
      { error: "no_customer", message: "Error al recuperar método de pago." },
      { status: 500 },
    )
  }

  if (!paymentMethodId) {
    return NextResponse.json(
      { error: "no_payment_method", message: "No tienes una tarjeta guardada." },
      { status: 400 },
    )
  }

  // 3) Cobra em USD (ou moeda da região USD/EUR/GBP/CHF)
  const finalCurrency = region === "DEFAULT" ? "usd" : region.toLowerCase()
  const finalAmount = productPriceUsd
  const detectedCountry: string | null = (saleWithCustomer.customer_country as string | null) || null

  console.log("[buy-product] charging:", { amount: finalAmount, currency: finalCurrency })

  const amountCents = ZERO_DECIMAL_CURRENCIES.has(finalCurrency)
    ? Math.round(finalAmount)
    : Math.round(finalAmount * 100)

  // 4) Cobra off-session (1-click)
  try {
    const productName = getProductName(productKey)
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: finalCurrency,
      customer: saleWithCustomer.stripe_customer_id,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `Compra premium: ${productName}`,
      metadata: {
        sale_type: "upsell",
        // upsells (csv) — formato esperado pelo webhook handlePaymentIntentSucceeded
        upsells: productKey,
        product_key: productKey,
        upsell_user_id: user.id,
        region,
        // items JSON — fallback pro caso de processamento alternativo
        items: JSON.stringify([{ key: productKey, price: productPriceUsd }]),
        customer_email: user.email || "",
        total_usd_cents: String(Math.round(productPriceUsd * 100)),
      },
    })

    if (pi.status === "succeeded") {
      // GRAVA SALE IMEDIATAMENTE — sem esperar webhook async do Stripe.
      // O webhook ainda vai rodar depois (assíncrono, 1-3s), mas usa upsert com
      // onConflict=stripe_payment_intent_id, então é idempotente: se nós já
      // gravamos aqui, ele só atualiza; se ele chegar primeiro, idem.
      //
      // Isso elimina a race condition: frontend chama owned-products IMEDIATAMENTE
      // após PI succeeded e a sale já está no banco → produto aparece desbloqueado
      // sem precisar reload nem aguardar webhook.
      try {
        await admin.from("stripe_sales").upsert(
          {
            stripe_session_id: null,
            stripe_payment_intent_id: pi.id,
            stripe_customer_id: saleWithCustomer.stripe_customer_id,
            sale_type: "upsell",
            plan: null,
            region,
            items: [{ key: productKey, name: getProductName(productKey), price: productPriceUsd, qty: 1 }],
            amount_total: amountCents,
            currency: finalCurrency,
            customer_email: user.email || null,
            customer_name: null,
            customer_phone: null,
            customer_country: detectedCountry,
            user_id: user.id,
            status: "paid",
          },
          { onConflict: "stripe_payment_intent_id" },
        )
      } catch (e) {
        // Não bloqueia a resposta — webhook arruma depois se falhar aqui.
        console.warn("[buy-product] gravacao imediata falhou (webhook ainda vai gravar):", e instanceof Error ? e.message : e)
      }

      return NextResponse.json({
        success: true,
        payment_intent_id: pi.id,
        amount: amountCents,
        currency: finalCurrency,
      })
    }

    if (pi.status === "requires_action" && pi.client_secret) {
      return NextResponse.json({
        success: false,
        requires_action: true,
        client_secret: pi.client_secret,
      })
    }

    return NextResponse.json(
      { error: "payment_failed", message: "El pago no fue completado." },
      { status: 400 },
    )
  } catch (e) {
    const stripeErr = e as { message?: string; code?: string; decline_code?: string }
    console.error("[/api/buy-product]", stripeErr.message, stripeErr.code, stripeErr.decline_code)

    // Erros recuperáveis via fallback Stripe Elements (digitar cartão novo).
    // Inclui: cartão recusado, expirado, moeda incompatível, autenticação 3DS,
    // payment method inválido, etc. Front-end abre StripeInlinePayment.
    const FALLBACK_CODES = new Set([
      "card_declined",
      "expired_card",
      "incorrect_number",
      "incorrect_cvc",
      "invalid_expiry_month",
      "invalid_expiry_year",
      "currency_not_supported",
      "card_not_supported",
      "payment_intent_authentication_failure",
      "authentication_required",
      "processing_error",
      "invalid_payment_method",
    ])
    if (stripeErr.code && FALLBACK_CODES.has(stripeErr.code)) {
      return NextResponse.json(
        {
          error: "card_declined",
          message: "Tu tarjeta fue rechazada. Ingresa una nueva.",
          original_code: stripeErr.code,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: "stripe_error", message: stripeErr.message || "Error en el pago." },
      { status: 500 },
    )
  }
}
