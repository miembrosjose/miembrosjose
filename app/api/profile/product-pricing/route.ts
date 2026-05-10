// API — retorna opções de pagamento (moeda + valor) pra um produto premium.
// Usado pelo modal de compra (BuyProductModal) pra mostrar seletor USD/local.
//
// GET /api/profile/product-pricing?product_key=andromeda

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { CHECKOUT_CONFIGS, type CheckoutRegion } from "@/lib/checkout-configs"

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
    creativos: "Producto 1",
    andromeda: "Producto 2",
    analytics: "Producto 3",
    minivsl: "Agente Mini VSL",
    revisao: "Servicio Premium",
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

  // Detecta região via sale válida mais recente.
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

  const pricing = getProductPriceUsd(region, productKey)
  if (!pricing) {
    return NextResponse.json({ error: "product_not_in_region" }, { status: 400 })
  }

  const priceUsd = pricing.price
  const priceFromUsd = pricing.priceFrom

  // Moeda nativa da região: USD pra DEFAULT, ou eur/gbp/chf
  const currency = region === "DEFAULT" ? "usd" : region.toLowerCase()
  return NextResponse.json({
    product_name: getProductName(productKey),
    options: [
      {
        currency,
        amount: priceUsd,
        label: `Pagar en ${currency.toUpperCase()}`,
        formatted: formatCurrency(priceUsd, currency),
        formatted_from: priceFromUsd ? formatCurrency(priceFromUsd, currency) : null,
      },
    ],
  })
}
