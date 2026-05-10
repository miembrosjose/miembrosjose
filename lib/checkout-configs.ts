// Config de checkout — fonte única de verdade.
// USD único, sem regiões, sem plano anual/vitalício, sem parcelamento.

const BUMP_CREATIVOS_IMG = "https://cdn.SEU_DOMINIO.com/bump-creativos.webp"
const BUMP_ANDROMEDA_IMG = "https://cdn.SEU_DOMINIO.com/campanas.webp"
const BUMP_ANALYTICS_IMG = "https://cdn.SEU_DOMINIO.com/analytics.webp"
const UPSELL_REVISAO_IMG = "https://cdn.SEU_DOMINIO.com/revisao.webp"
const UPSELL_MINIVSL_IMG = "https://cdn.SEU_DOMINIO.com/minivsl.webp"

// Stripe Price IDs — CRIAR no Stripe Dashboard antes de subir prod.
export const STRIPE_PRICE_IDS = {
  front: "price_TODO_FRONT",
  creativos: "price_TODO_CREATIVOS",
  andromeda: "price_TODO_ANDROMEDA",
  analytics: "price_TODO_ANALYTICS",
  revisao: "price_TODO_REVISAO",
  minivsl: "price_TODO_MINIVSL",
} as const

export type BumpConfig = {
  key: "creativos" | "andromeda" | "analytics"
  emoji: string
  title: string
  description: string
  priceFrom: number
  price: number
  image: string
  stripePriceId?: string
}

export type UpsellConfig = {
  key: "revisao" | "minivsl"
  title: string
  description: string
  priceFrom?: number
  price: number
  image: string
  stripePriceId?: string
}

/** Calcula o % de desconto a partir de priceFrom e price. */
export function calcDiscountPct(priceFrom: number | undefined, price: number): number | null {
  if (!priceFrom || priceFrom <= price) return null
  return Math.round((1 - price / priceFrom) * 100)
}

export type CheckoutConfig = {
  /** Preço do produto principal (acceso vitalício) */
  frontPrice: number
  frontStripePriceId?: string
  /** Order bumps disponíveis */
  bumps: BumpConfig[]
  /** Upsells 1-click pós-pagamento */
  upsells: UpsellConfig[]
}

export const CHECKOUT_CONFIG: CheckoutConfig = {
  frontPrice: 97,
  frontStripePriceId: STRIPE_PRICE_IDS.front,
  bumps: [
    {
      key: "creativos",
      emoji: "🎯",
      title: "[OFERTA ÚNICA] Producto 1",
      description: "Descripción del Producto 1 — edita aquí.",
      priceFrom: 47.90,
      price: 16.90,
      image: BUMP_CREATIVOS_IMG,
      stripePriceId: STRIPE_PRICE_IDS.creativos,
    },
    {
      key: "andromeda",
      emoji: "⚡",
      title: "[OFERTA ÚNICA] Producto 2",
      description: "Descripción del Producto 2 — edita aquí.",
      priceFrom: 34.90,
      price: 12.90,
      image: BUMP_ANDROMEDA_IMG,
      stripePriceId: STRIPE_PRICE_IDS.andromeda,
    },
    {
      key: "analytics",
      emoji: "📊",
      title: "[OFERTA ÚNICA] Producto 3",
      description: "Descripción del Producto 3 — edita aquí.",
      priceFrom: 34.90,
      price: 12.90,
      image: BUMP_ANALYTICS_IMG,
      stripePriceId: STRIPE_PRICE_IDS.analytics,
    },
  ],
  upsells: [
    {
      key: "revisao",
      title: "Servicio Premium",
      description: "Descripción del Servicio Premium — edita aquí.",
      priceFrom: 199.90,
      price: 99.90,
      image: UPSELL_REVISAO_IMG,
      stripePriceId: STRIPE_PRICE_IDS.revisao,
    },
    {
      key: "minivsl",
      title: "Upsell 1",
      description: "Descripción del Upsell 1 — edita aquí.",
      priceFrom: 49.90,
      price: 24.90,
      image: UPSELL_MINIVSL_IMG,
      stripePriceId: STRIPE_PRICE_IDS.minivsl,
    },
  ],
}
