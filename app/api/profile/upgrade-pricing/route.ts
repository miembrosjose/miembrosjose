// API — retorna opções de pagamento (moeda + valor) pro upgrade Anual → Vitalicio.
// Usado pelo fallback inline (StripeInlinePayment) pra mostrar seletor de moeda.
//
// GET /api/profile/upgrade-pricing
//
// Lógica:
//   1. Auth via cookie Supabase
//   2. Detecta região do user via stripe_sales mais recente OU cf-ipcountry
//   3. Pra LATAM (DEFAULT): retorna 2 opções (USD + moeda local detectada)
//   4. Pra USD/EUR/GBP/CHF: retorna 1 opção (moeda nativa)
//
// Retorna:
//   { options: [
//       { currency: "usd", amount: 40, label: "Pagar en USD", formatted: "US$ 40,00" },
//       { currency: "brl", amount: 218.40, label: "Pagar en BRL", formatted: "R$ 218,40" }
//   ]}

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getExchangeRates, convertFromUsd, type SupportedCurrency } from "@/lib/exchange-rates"
import { OFF_SESSION_LOCAL_CURRENCY, type CheckoutRegion } from "@/lib/checkout-configs"
import { applyBrTestPrice } from "@/lib/br-test-pricing"

export const dynamic = "force-dynamic"

// Valor base USD por região
const UPGRADE_BASE_USD: Record<string, number> = {
  DEFAULT: 40,
  USD: 70,
  EUR: 70,
  GBP: 70,
  CHF: 70,
}

// Símbolo de moeda + locale pra formatar
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

function currencyLabel(currency: string): string {
  return `Pagar en ${currency.toUpperCase()}`
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  // 1) Detecta região via sale válida mais recente. Filtra regions que não
  //    são keys oficiais (AUTO_BONO etc) pra não quebrar lookup.
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

  // Fallback: pega country via Cloudflare se sale não tinha
  if (!detectedCountry) {
    detectedCountry = req.headers.get("cf-ipcountry") || null
  }

  // 🧪 Override de teste: BR → $0.20 USD. Outros países pagam preço normal.
  const baseUsd = applyBrTestPrice(UPGRADE_BASE_USD[region] ?? 40, detectedCountry)

  // Detecta moeda local LATAM via geo — usado tanto pra display (always)
  // quanto pra opção de cobrança (só se region=DEFAULT, pra não conflitar
  // com o cobrança real em USD/EUR/GBP/CHF).
  const previousLocalCurrency = sales?.[0]?.currency?.toLowerCase()
  // OFF_SESSION_LOCAL_CURRENCY inclui BR→BRL — área de membros usa cobrança
  // off-session sem Adaptive Pricing, então display deve refletir BRL pra BR.
  const localFromCountry = detectedCountry
    ? OFF_SESSION_LOCAL_CURRENCY[detectedCountry.toUpperCase()]?.toLowerCase()
    : undefined
  const localCurrency = previousLocalCurrency && previousLocalCurrency !== "usd"
    ? previousLocalCurrency
    : localFromCountry

  // Calcula formatted local SEMPRE (pra display approx) — se conversão falhar fica null
  let displayLocal: { currency: string; formatted: string; amount: number } | null = null
  if (localCurrency && localCurrency !== "usd" && localCurrency !== region.toLowerCase()) {
    try {
      const rates = await getExchangeRates()
      const converted = convertFromUsd(baseUsd, localCurrency as SupportedCurrency, rates)
      if (converted && converted > 0) {
        displayLocal = {
          currency: localCurrency,
          amount: Math.round(converted * 100) / 100,
          formatted: formatCurrency(converted, localCurrency),
        }
      }
    } catch {
      // ignora
    }
  }

  // 2) Pra USD/EUR/GBP/CHF: cobrança em moeda nativa, mas display_local
  // mostra approx local se user tá num país LATAM (admin do BR testando, etc)
  if (region !== "DEFAULT") {
    const nativeCurrency = region.toLowerCase()
    return NextResponse.json({
      options: [
        {
          currency: nativeCurrency,
          amount: baseUsd,
          label: currencyLabel(nativeCurrency),
          formatted: formatCurrency(baseUsd, nativeCurrency),
        },
      ],
      display_local: displayLocal,
    })
  }

  // 3) Pra LATAM: USD + moeda local (se detectada)
  const options = [
    {
      currency: "usd",
      amount: baseUsd,
      label: "Pagar en USD",
      formatted: formatCurrency(baseUsd, "usd"),
    },
  ]

  if (displayLocal) {
    options.push({
      currency: displayLocal.currency,
      amount: displayLocal.amount,
      label: currencyLabel(displayLocal.currency),
      formatted: displayLocal.formatted,
    })
  }

  // display_local null pra LATAM — moeda local já está em options[1]
  return NextResponse.json({ options, display_local: null })
}
