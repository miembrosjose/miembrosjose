// API — retorna opções de pagamento (moeda + valor) pra um produto premium.
// Usado pelo modal de compra (BuyProductModal) pra mostrar seletor USD/local.
//
// GET /api/profile/product-pricing?product_key=andromeda

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getExchangeRates, convertFromUsd, type SupportedCurrency } from "@/lib/exchange-rates"
import { CHECKOUT_CONFIGS, OFF_SESSION_LOCAL_CURRENCY, type CheckoutRegion } from "@/lib/checkout-configs"
import { applyBrTestPrice, applyBrTestPriceFrom } from "@/lib/br-test-pricing"

export const dynamic = "force-dynamic"

const VALID_KEYS = new Set(["creativos", "andromeda", "analytics", "minivsl", "revisao"])

const CURRENCY_FORMAT: Record<string, { symbol: string; locale: string; decimals: number }> = {
  usd: { symbol: "US$", locale: "en-US", decimals: 2 },
  eur: { symbol: "€", locale: "es-ES", decimals: 2 },
  gbp: { symbol: "£", locale: "en-GB", decimals: 2 },
  chf: { symbol: "CHF", locale: "de-CH", decimals: 2 },
  brl: { symbol: "R$", locale: "pt-BR", decimals: 2 },
  ars: { symbol: "AR$", locale: "es-AR", decimals: 0 },
  mxn: { symbol: "MX$", locale: "es-MX", decimals: 2 },
  cop: { symbol: "COP$", locale: "es-CO", decimals: 0 },
  clp: { symbol: "CLP$", locale: "es-CL", decimals: 0 },
  pen: { symbol: "S/", locale: "es-PE", decimals: 2 },
  uyu: { symbol: "$U", locale: "es-UY", decimals: 0 },
  pyg: { symbol: "Gs", locale: "es-PY", decimals: 0 },
}

function formatCurrency(amount: number, currency: string): string {
  const fmt = CURRENCY_FORMAT[currency] || { symbol: currency.toUpperCase(), locale: "en-US", decimals: 2 }
  const formatted = amount.toLocaleString(fmt.locale, {
    minimumFractionDigits: fmt.decimals,
    maximumFractionDigits: fmt.decimals,
  })
  return `${fmt.symbol} ${formatted}`
}

function getProductPriceUsd(
  region: CheckoutRegion,
  productKey: string,
): { price: number; priceFrom: number | null } | null {
  const config = CHECKOUT_CONFIGS[region]
  if (!config) return null
  const bump = config.bumps.find((b) => b.key === productKey)
  if (bump) return { price: bump.price, priceFrom: bump.priceFrom ?? null }
  const upsell = config.upsells.find((u) => u.key === productKey)
  if (upsell) return { price: upsell.price, priceFrom: upsell.priceFrom ?? null }
  return null
}

function getProductName(productKey: string): string {
  const NAMES: Record<string, string> = {
    creativos: "Creativos.AI",
    andromeda: "Andrómeda.ADS",
    analytics: "Analytics.KPI",
    minivsl: "Agente Mini VSL",
    revisao: "Revisión de Embudo",
  }
  return NAMES[productKey] || productKey
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 })

  const productKey = req.nextUrl.searchParams.get("product_key") || ""
  if (!VALID_KEYS.has(productKey)) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Detecta região via sale válida mais recente. IMPORTANTE: filtra regions
  // que não são keys de CHECKOUT_CONFIGS (ex: AUTO_BONO de auto-grant não conta —
  // sem isso, getProductPriceUsd retorna null e a API quebra com 400).
  const VALID_REGIONS: ReadonlySet<string> = new Set(["DEFAULT", "USD", "EUR", "GBP", "CHF"])
  const { data: sales } = await admin
    .from("stripe_sales")
    .select("region, currency, customer_country")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(10)

  const validSale = (sales || []).find((s) => {
    const r = (s as { region?: string | null }).region
    return r && VALID_REGIONS.has(r)
  })

  let region: CheckoutRegion = "DEFAULT"
  let detectedCountry: string | null = null
  if (validSale) {
    region = (validSale.region as CheckoutRegion) || "DEFAULT"
    detectedCountry = (validSale.customer_country as string | null) || null
  }
  if (!detectedCountry) {
    detectedCountry = req.headers.get("cf-ipcountry") || null
  }

  const pricing = getProductPriceUsd(region, productKey)
  if (!pricing) {
    return NextResponse.json({ error: "product_not_in_region" }, { status: 400 })
  }
  // 🧪 Override de teste: se user é do Brasil, força $0.20 USD pra testar 1-click.
  // Outros países LATAM e USD/EUR/GBP/CHF pagam preço normal.
  const priceUsd = applyBrTestPrice(pricing.price, detectedCountry)
  const priceFromUsd = applyBrTestPriceFrom(pricing.priceFrom, detectedCountry)

  // USD/EUR/GBP/CHF: 1 opção fixa na moeda nativa
  if (region !== "DEFAULT") {
    const nativeCurrency = region.toLowerCase()
    return NextResponse.json({
      product_name: getProductName(productKey),
      options: [
        {
          currency: nativeCurrency,
          amount: priceUsd,
          label: `Pagar en ${nativeCurrency.toUpperCase()}`,
          formatted: formatCurrency(priceUsd, nativeCurrency),
          formatted_from: priceFromUsd ? formatCurrency(priceFromUsd, nativeCurrency) : null,
        },
      ],
    })
  }

  // LATAM: USD + moeda local
  const options: Array<{
    currency: string
    amount: number
    label: string
    formatted: string
    formatted_from: string | null
  }> = [
    {
      currency: "usd",
      amount: priceUsd,
      label: "Pagar en USD",
      formatted: formatCurrency(priceUsd, "usd"),
      formatted_from: priceFromUsd ? formatCurrency(priceFromUsd, "usd") : null,
    },
  ]

  const previousLocalCurrency = sales?.[0]?.currency?.toLowerCase()
  // OFF_SESSION_LOCAL_CURRENCY inclui BR→BRL. Pricing aqui é pra display
  // na área de membros, onde a cobrança 1-click é off-session direto na moeda
  // local (sem Adaptive Pricing). Mostrar BRL pro brasileiro reflete o valor real.
  const localFromCountry = detectedCountry
    ? OFF_SESSION_LOCAL_CURRENCY[detectedCountry.toUpperCase()]?.toLowerCase()
    : undefined

  const localCurrency = previousLocalCurrency && previousLocalCurrency !== "usd"
    ? previousLocalCurrency
    : localFromCountry

  if (localCurrency && localCurrency !== "usd") {
    try {
      const rates = await getExchangeRates()
      const converted = convertFromUsd(priceUsd, localCurrency as SupportedCurrency, rates)
      const convertedFrom = priceFromUsd
        ? convertFromUsd(priceFromUsd, localCurrency as SupportedCurrency, rates)
        : null
      if (converted && converted > 0) {
        options.push({
          currency: localCurrency,
          amount: Math.round(converted * 100) / 100,
          label: `Pagar en ${localCurrency.toUpperCase()}`,
          formatted: formatCurrency(converted, localCurrency),
          formatted_from:
            convertedFrom && convertedFrom > 0
              ? formatCurrency(convertedFrom, localCurrency)
              : null,
        })
      }
    } catch {
      // ignora
    }
  }

  return NextResponse.json({
    product_name: getProductName(productKey),
    options,
  })
}
