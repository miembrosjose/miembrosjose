// Helper client-side pra opções de pricing de produtos premium.
// USD único, sem detecção de região nem conversão de moeda.

import { CHECKOUT_CONFIG } from "./checkout-configs"

export type PricingOption = {
  currency: string
  amount: number
  label: string
  formatted: string
  formatted_from?: string | null
}

function formatUsd(amount: number): string {
  return `US$ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Retorna opções de pricing pra um produto. */
export function getProductPricingOptions(productKey: string): PricingOption[] {
  const bump = CHECKOUT_CONFIG.bumps.find((b) => b.key === productKey)
  const upsell = CHECKOUT_CONFIG.upsells.find((u) => u.key === productKey)
  const product = bump || upsell
  if (!product) return []
  return [
    {
      currency: "usd",
      amount: product.price,
      label: "Pagar en USD",
      formatted: formatUsd(product.price),
      formatted_from: product.priceFrom ? formatUsd(product.priceFrom) : null,
    },
  ]
}
