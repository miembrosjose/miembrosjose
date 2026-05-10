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
import type { CheckoutRegion } from "@/lib/checkout-configs"

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

  // Detecta região via sale válida mais recente
  const VALID_REGIONS: ReadonlySet<string> = new Set(["DEFAULT", "USD", "EUR", "GBP", "CHF"])
  const { data: sales } = await admin
    .from("stripe_sales")
    .select("region")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(10)

  const validSale = (sales || []).find((s) => {
    const r = (s as { region?: string | null }).region
    return r && VALID_REGIONS.has(r)
  })

  const region: CheckoutRegion = validSale
    ? ((validSale.region as CheckoutRegion) || "DEFAULT")
    : "DEFAULT"

  const baseUsd = UPGRADE_BASE_USD[region] ?? 40
  const currency = region === "DEFAULT" ? "usd" : region.toLowerCase()

  return NextResponse.json({
    options: [
      {
        currency,
        amount: baseUsd,
        label: currencyLabel(currency),
        formatted: formatCurrency(baseUsd, currency),
      },
    ],
    display_local: null,
  })
}
