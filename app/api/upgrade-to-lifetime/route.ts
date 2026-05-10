// API — upgrade de plan='annual' pra plan='lifetime' (1-click off-session).
//
// POST /api/upgrade-to-lifetime
//   Body: {} (vazio — usa session do user logado)
//
// Lógica:
//   1. Auth: pega user logado via cookie Supabase
//   2. Valida: user tem pelo menos 1 stripe_sale com plan='annual' E não vencido
//   3. Acha stripe_customer_id mais recente do user
//   4. Acha payment_method default do customer (cartão salvo)
//   5. Determina amount baseado na região do sale anual:
//      - DEFAULT (LATAM): $40 USD
//      - USD/EUR/GBP/CHF: 70 (na moeda)
//   6. Cria PaymentIntent off-session com metadata.upgrade_to_lifetime=true
//   7. Webhook (stripe-webhook) detecta sucesso e faz UPDATE plan='lifetime'
//
// Erros possíveis:
//   - "no_annual_sale": user não tem sale anual (já vitalício ou nunca comprou)
//   - "no_customer": stripe_customer_id ausente (caso edge — admin grant)
//   - "no_payment_method": cartão expirou ou foi removido
//   - "card_declined": cartão recusou (cliente precisa atualizar com suporte)

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/server"

export const dynamic = "force-dynamic"

// Valores do upgrade por região (em USD/moeda nativa).
// LATAM (DEFAULT) usa USD pq Stripe Adaptive Pricing converte na hora.
// USD/EUR/GBP/CHF: 70 na moeda local (diferença entre 197 - 127).
const UPGRADE_AMOUNT_BY_REGION: Record<string, { amount: number; currency: string }> = {
  DEFAULT: { amount: 40, currency: "usd" },
  USD: { amount: 70, currency: "usd" },
  EUR: { amount: 70, currency: "eur" },
  GBP: { amount: 70, currency: "gbp" },
  CHF: { amount: 70, currency: "chf" },
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
  "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
])

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 })

  const stripe = getStripe()
  const admin = getSupabaseAdmin()

  // 1) Acha sale anual do user (mais recente, válido)
  // Pega TAMBÉM a currency original — pra cobrar na moeda do cartão.
  // Stripe rejeita cobranças em moeda diferente da que o cartão processa
  // (ex: cartão BRL não aceita cobrança em USD).
  const { data: sales } = await admin
    .from("stripe_sales")
    .select("id, stripe_customer_id, region, plan, expires_at, currency, customer_country")
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
      { error: "no_annual_sale", message: "No tienes un acceso anual activo para convertir." },
      { status: 400 },
    )
  }

  if (!validAnnualSale.stripe_customer_id) {
    return NextResponse.json(
      { error: "no_customer", message: "No se encontró método de pago. Contacta soporte." },
      { status: 400 },
    )
  }

  // 2) Acha payment_method default do customer
  let paymentMethodId: string | null = null
  try {
    const customer = await stripe.customers.retrieve(validAnnualSale.stripe_customer_id)
    if (customer.deleted) {
      return NextResponse.json(
        { error: "no_customer", message: "Cuenta de pago eliminada. Contacta soporte." },
        { status: 400 },
      )
    }
    paymentMethodId =
      (customer.invoice_settings?.default_payment_method as string | null) ||
      null

    // Fallback: lista payment methods e pega o mais recente
    if (!paymentMethodId) {
      const pms = await stripe.paymentMethods.list({
        customer: validAnnualSale.stripe_customer_id,
        type: "card",
        limit: 1,
      })
      paymentMethodId = pms.data[0]?.id || null
    }
  } catch (e) {
    console.error("[/api/upgrade-to-lifetime] retrieve customer:", e)
    return NextResponse.json(
      { error: "no_customer", message: "Error al recuperar método de pago." },
      { status: 500 },
    )
  }

  if (!paymentMethodId) {
    return NextResponse.json(
      {
        error: "no_payment_method",
        message: "No tienes un cartão guardado. Contacta soporte para renovar.",
      },
      { status: 400 },
    )
  }

  // 3) Calcula amount baseado na região (sem conversão de moeda).
  const upgradeConfig =
    UPGRADE_AMOUNT_BY_REGION[validAnnualSale.region] || UPGRADE_AMOUNT_BY_REGION.DEFAULT
  const finalCurrency = upgradeConfig.currency
  const finalAmount = upgradeConfig.amount

  const amountCents = ZERO_DECIMAL_CURRENCIES.has(finalCurrency)
    ? Math.round(finalAmount)
    : Math.round(finalAmount * 100)

  // 4) Cria PaymentIntent off-session
  try {
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: finalCurrency,
      customer: validAnnualSale.stripe_customer_id,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: "Upgrade Anual a Vitalicio",
      metadata: {
        sale_type: "upgrade_to_lifetime",
        upgrade_to_lifetime: "true",          // FLAG pro webhook detectar
        upgrade_user_id: user.id,             // pra webhook saber qual user atualizar
        region: validAnnualSale.region,
        previous_annual_sale_id: validAnnualSale.id,
        customer_email: user.email || "",
      },
    })

    if (pi.status === "succeeded") {
      return NextResponse.json({
        success: true,
        payment_intent_id: pi.id,
        amount: amountCents,
        currency: finalCurrency,
      })
    }

    if (pi.status === "requires_action" && pi.client_secret) {
      // 3DS desafio — front completa via stripe.handleCardAction
      return NextResponse.json({
        success: false,
        requires_action: true,
        client_secret: pi.client_secret,
        payment_intent_id: pi.id,
      })
    }

    return NextResponse.json(
      {
        error: "payment_failed",
        message: "El pago no fue completado. Intenta de nuevo o contacta soporte.",
      },
      { status: 400 },
    )
  } catch (e) {
    const stripeErr = e as { message?: string; code?: string; decline_code?: string }
    console.error("[/api/upgrade-to-lifetime] create PI:", stripeErr.message, stripeErr.code, stripeErr.decline_code)

    // Erros recuperáveis via fallback Stripe Elements (digitar cartão novo).
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
