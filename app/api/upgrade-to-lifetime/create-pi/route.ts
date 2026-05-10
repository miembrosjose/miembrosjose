// API — cria PaymentIntent deferred pro upgrade Anual → Vitalicio.
// Usado pelo fallback inline quando 1-click off-session falha (cartão expirado,
// sem cartão salvo, cliente Hotmart, etc).
//
// POST /api/upgrade-to-lifetime/create-pi
//   Body: { currency: "usd" | "brl" | "ars" | ..., amount: number }
//
// Lógica:
//   1. Auth via cookie Supabase
//   2. Valida amount (anti-fraude: não confia no client)
//      - LATAM: USD 40 ou equivalente em moeda local (com tolerância 5%)
//      - USD/EUR/GBP/CHF: 70 na moeda nativa
//   3. Cria PaymentIntent SEM off_session, SEM auto-confirm
//   4. Retorna client_secret pro componente Stripe Elements confirmar
//
// Webhook stripe-webhook detecta metadata.upgrade_to_lifetime=true e atualiza
// plan='lifetime' / expires_at=NULL no banco.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/server"
import { getExchangeRates, convertFromUsd, type SupportedCurrency } from "@/lib/exchange-rates"
import { applyBrTestPrice } from "@/lib/br-test-pricing"

export const dynamic = "force-dynamic"

// Valor base do upgrade (USD) por região
const UPGRADE_BASE_USD: Record<string, number> = {
  DEFAULT: 40,
  USD: 70,
  EUR: 70,
  GBP: 70,
  CHF: 70,
}

// Moedas nativas pra USD/EUR/GBP/CHF (sem conversão)
const NATIVE_CURRENCY_BY_REGION: Record<string, string> = {
  USD: "usd",
  EUR: "eur",
  GBP: "gbp",
  CHF: "chf",
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
  "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
])

const AMOUNT_TOLERANCE_PCT = 0.05 // ±5% — protege contra variação de câmbio entre client e server

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  let body: { currency?: string; amount?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const requestedCurrency = (body.currency || "").toLowerCase()
  const requestedAmount = Number(body.amount)

  if (!requestedCurrency || !requestedAmount || requestedAmount <= 0) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 })
  }

  const stripe = getStripe()
  const admin = getSupabaseAdmin()

  // 1) Acha sale anual do user (mais recente, válido) pra pegar region + customer
  const { data: sales } = await admin
    .from("stripe_sales")
    .select("id, stripe_customer_id, region, plan, expires_at, customer_country")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .eq("plan", "annual")
    .order("created_at", { ascending: false })
    .limit(5)

  const now = Date.now()
  const validAnnualSale = (sales || []).find((s) => {
    return !s.expires_at || new Date(s.expires_at).getTime() > now
  })

  if (!validAnnualSale) {
    return NextResponse.json(
      { error: "no_annual_sale", message: "No tienes un acceso anual activo." },
      { status: 400 },
    )
  }

  // 2) Valida amount — calcula valor esperado server-side
  const region = validAnnualSale.region || "DEFAULT"
  // 🧪 Override BR: detecta country (customer_country da sale > cf-ipcountry)
  const detectedCountry =
    (validAnnualSale.customer_country as string | null) ||
    req.headers.get("cf-ipcountry") ||
    null
  const baseUsd = applyBrTestPrice(
    UPGRADE_BASE_USD[region] ?? UPGRADE_BASE_USD.DEFAULT,
    detectedCountry,
  )

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

  // Pra LATAM (DEFAULT), aceita USD ou moeda local válida
  let expectedAmount: number
  if (requestedCurrency === "usd") {
    expectedAmount = baseUsd
  } else {
    // Moeda local LATAM — converte USD pra moeda solicitada e compara
    try {
      const rates = await getExchangeRates()
      const converted = convertFromUsd(baseUsd, requestedCurrency as SupportedCurrency, rates)
      if (!converted || converted <= 0) {
        return NextResponse.json(
          { error: "currency_not_supported", message: "Moneda no soportada." },
          { status: 400 },
        )
      }
      expectedAmount = converted
    } catch {
      return NextResponse.json(
        { error: "currency_rate_unavailable", message: "No se pudo obtener cotización." },
        { status: 500 },
      )
    }
  }

  // Tolerância de ±5% pra absorver flutuação de câmbio entre client e server
  const diff = Math.abs(requestedAmount - expectedAmount) / expectedAmount
  if (diff > AMOUNT_TOLERANCE_PCT) {
    console.warn("[upgrade-to-lifetime/create-pi] amount mismatch:", {
      user_id: user.id,
      requested: requestedAmount,
      expected: expectedAmount,
      currency: requestedCurrency,
      diff_pct: diff,
    })
    return NextResponse.json(
      { error: "amount_mismatch", message: "Valor inválido. Recarga la página." },
      { status: 400 },
    )
  }

  // 3) Converte pra centavos (ou unidades inteiras pra zero-decimal)
  const amountCents = ZERO_DECIMAL_CURRENCIES.has(requestedCurrency)
    ? Math.round(requestedAmount)
    : Math.round(requestedAmount * 100)

  // 4) Cria PaymentIntent deferred (sem off_session, sem confirm — Elements vai
  // confirmar via stripe.confirmPayment com elements + clientSecret)
  try {
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: requestedCurrency,
      // Sem off_session — cliente está presente, vai digitar cartão novo
      // Sem confirm: true — Elements confirma client-side
      // automatic_payment_methods habilita Card + Apple Pay + Google Pay + Link
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      setup_future_usage: "off_session", // salva cartão pra próximas compras virarem 1-click
      receipt_email: user.email || undefined,
      description: "Upgrade Anual a Vitalicio",
      metadata: {
        sale_type: "upgrade_to_lifetime",
        upgrade_to_lifetime: "true",
        upgrade_user_id: user.id,
        region,
        previous_annual_sale_id: validAnnualSale.id,
        customer_email: user.email || "",
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
    console.error("[upgrade-to-lifetime/create-pi] stripe error:", msg)
    return NextResponse.json(
      { error: "stripe_error", message: msg },
      { status: 500 },
    )
  }
}
