// Catálogo + helpers dos produtos da Tienda Premium e Otros Productos.
// ALL_PREMIUM_PRODUCTS lista o catálogo completo; PRODUCT_LINK_BY_NAME
// mapeia produtos comprados (owned) pra URL/ação de acesso (interno ou GPT externo).

import { cdnImage } from "@/lib/cdn-image"

export type PremiumProduct = {
  name: string
  type: "Bump" | "Upsell"
  price: string
  img: string
  salesPagePath: string | null
  inlineCheckoutPath?: string
  offer: boolean
  desc: string
}

export type OwnedProduct = {
  name: string
  type: "Bump" | "Upsell"
  progress: number
  img: string
}

export const KEY_TO_PRODUCT_NAME: Record<string, string> = {
  creativos: "Producto 1",
  andromeda: "Producto 2",
  analytics: "Producto 3",
  revisao: "Servicio Premium",
  minivsl: "Upsell 1",
  "bonus-ganchos": "Bonus 1",
}

export const ALL_PREMIUM_PRODUCTS: PremiumProduct[] = [
  // Preços abaixo são fallback de skeleton (LATAM/DEFAULT). API
  // /api/profile/product-pricing retorna o valor real por região +
  // priceFrom riscado + conversão pra moeda local.
  {
    name: "Producto 1",
    type: "Bump",
    price: "US$ 16.90",
    img: cdnImage("producto-1.webp", { width: 540 }),
    salesPagePath: "/creativos",
    offer: false,
    desc: "Descripción del Producto 1 — edita en site-texts y aquí.",
  },
  {
    name: "Producto 2",
    type: "Bump",
    price: "US$ 12.90",
    img: cdnImage("producto-2.webp", { width: 540 }),
    salesPagePath: "/andromeda",
    offer: false,
    desc: "Descripción del Producto 2 — edita en site-texts y aquí.",
  },
  {
    name: "Producto 3",
    type: "Bump",
    price: "US$ 12.90",
    img: cdnImage("producto-3.webp", { width: 540 }),
    salesPagePath: "/analytics",
    offer: false,
    desc: "Descripción del Producto 3 — edita en site-texts y aquí.",
  },
  {
    name: "Upsell 1",
    type: "Upsell",
    price: "US$ 24.90",
    img: cdnImage("upsell-1.webp", { width: 540 }),
    salesPagePath: null,
    inlineCheckoutPath: "/minivsl",
    offer: false,
    desc: "Descripción del Upsell 1 — edita en site-texts y aquí.",
  },
  {
    name: "Servicio Premium",
    type: "Upsell",
    price: "US$ 99.90",
    img: cdnImage("servicio-premium.webp", { width: 540 }),
    salesPagePath: null,
    inlineCheckoutPath: "/revisao",
    offer: true,
    desc: "Descripción del Servicio Premium — edita en site-texts y aquí.",
  },
]

export type ProductLink = {
  url: string
  external: boolean
  cta: string
  // Slug interno (quando external=false) → vira view ViewProducto interna
  internalSlug?: "andromeda" | "analytics" | "embudo" | "bonus-ganchos" | "revisao"
}

// Entregável de cada produto comprado (Otros Productos).
// External = link em nova aba (agentes GPT). Internal = view interna do SPA.
export const PRODUCT_LINK_BY_NAME: Record<string, ProductLink> = {
  "Producto 1": {
    url: "https://chatgpt.com/g/SEU_GPT_CREATIVOS_ID",
    external: true,
    cta: "Abrir Agente",
  },
  "Upsell 1": {
    url: "https://chatgpt.com/g/SEU_GPT_MINIVSL_ID",
    external: true,
    cta: "Abrir Agente",
  },
  "Producto 2": {
    url: "/miembros/producto/andromeda",
    external: false,
    cta: "Acceder",
    internalSlug: "andromeda",
  },
  "Producto 3": {
    url: "/miembros/producto/analytics",
    external: false,
    cta: "Acceder",
    internalSlug: "analytics",
  },
  "Servicio Premium": {
    url: "/miembros/producto/revisao",
    external: false,
    cta: "Enviar Materiales",
    internalSlug: "revisao",
  },
  "Bonus 1": {
    url: "/miembros/producto/bonus-ganchos",
    external: false,
    cta: "Ver Bonus",
    internalSlug: "bonus-ganchos",
  },
}

export type BonusProduct = {
  name: string
  slug: string
  img: string
  desc: string
}

export const ALL_BONUSES: BonusProduct[] = [
  {
    name: "Bonus 1",
    slug: "bonus-ganchos",
    img: "https://cdn.SEU_DOMINIO.com/bonus-1.webp",
    desc: "Descripción del Bonus 1 — edita en site-texts y aquí.",
  },
]

// Filtro: locked = todos os do catálogo MENOS os já comprados.
export function getLockedProducts(owned: OwnedProduct[]): PremiumProduct[] {
  const ownedNames = new Set(owned.map((o) => o.name.trim().toLowerCase()))
  return ALL_PREMIUM_PRODUCTS.filter(
    (p) => !ownedNames.has(p.name.trim().toLowerCase())
  )
}

// Monta OwnedProduct[] a partir de keys do banco
export function buildOwnedFromKeys(keys: string[]): OwnedProduct[] {
  return keys
    .map((key): OwnedProduct | null => {
      const productName = KEY_TO_PRODUCT_NAME[key]
      if (!productName) return null
      const catalog = ALL_PREMIUM_PRODUCTS.find(
        (p) => p.name.trim().toLowerCase() === productName.trim().toLowerCase()
      )
      const bonus = ALL_BONUSES.find(
        (b) => b.name.trim().toLowerCase() === productName.trim().toLowerCase()
      )
      return {
        name: productName,
        type: catalog?.type || "Bump",
        progress: 0,
        img: catalog?.img || bonus?.img || "",
      }
    })
    .filter((p): p is OwnedProduct => p !== null)
}
