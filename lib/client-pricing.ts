// Helper client-side pra opções de pricing de produtos premium.
// Substitui o fetch a /api/profile/product-pricing (removido).
// Cliente edita os valores em CHECKOUT_CONFIGS quando plugar Stripe.

import { CHECKOUT_CONFIGS } from "./checkout-configs"

export type PricingOption = {
  currency: string
  amount: number
  label: string
  formatted: string
  formatted_from?: string | null
}

const CURRENCY_FORMAT: Record<string, { symbol: string; locale: string; decimals: number }> = {
  usd: { symbol: "US$", locale: "en-US", decimals: 2 },
  eur: { symbol: "€", locale: "es-ES", decimals: 2 },
  gbp: { symbol: "£", locale: "en-GB", decimals: 2 },
  chf: { symbol: "CHF", locale: "de-CH", decimals: 2 },
}

function formatCurrency(amount: number, currency: string): string {
  const fmt = CURRENCY_FORMAT[currency] || { symbol: currency.toUpperCase(), locale: "en-US", decimals: 2 }
  const formatted = amount.toLocaleString(fmt.locale, {
    minimumFractionDigits: fmt.decimals,
    maximumFractionDigits: fmt.decimals,
  })
  return `${fmt.symbol} ${formatted}`
}

/** Retorna opções de pricing pra um produto. Sempre region DEFAULT (cliente plugar geo se quiser). */
export function getProductPricingOptions(productKey: string): PricingOption[] {
  const config = CHECKOUT_CONFIGS.DEFAULT
  if (!config) return []
  const bump = config.bumps.find((b) => b.key === productKey)
  const upsell = config.upsells.find((u) => u.key === productKey)
  const product = bump || upsell
  if (!product) return []
  return [
    {
      currency: "usd",
      amount: product.price,
      label: "Pagar en USD",
      formatted: formatCurrency(product.price, "usd"),
      formatted_from: product.priceFrom ? formatCurrency(product.priceFrom, "usd") : null,
    },
  ]
}

/** Opção de pricing pro upgrade Anual → Vitalício. */
export function getUpgradePricingOptions(): PricingOption[] {
  return [
    {
      currency: "usd",
      amount: 40,
      label: "Pagar en USD",
      formatted: formatCurrency(40, "usd"),
    },
  ]
}
