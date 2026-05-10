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
  creativos: "Creativos.AI",
  andromeda: "Andrómeda.ADS",
  analytics: "Analytics.KPI",
  revisao: "Revisión de Tu Embudo",
  minivsl: "Agente Copy Mini VSL's",
  "bonus-ganchos": "Pack de Ganchos Neuronales™",
}

export const ALL_PREMIUM_PRODUCTS: PremiumProduct[] = [
  // Preços abaixo são fallback de skeleton (LATAM/DEFAULT). API
  // /api/profile/product-pricing retorna o valor real por região +
  // priceFrom riscado + conversão pra moeda local.
  {
    name: "Creativos.AI",
    type: "Bump",
    price: "US$ 16.90",
    img: cdnImage("creativosai.webp", { width: 540 }),
    salesPagePath: "/creativos",
    offer: false,
    desc: "Genera creativos publicitarios en minutos con IA entrenada para conversión.",
  },
  {
    name: "Andrómeda.ADS",
    type: "Bump",
    price: "US$ 12.90",
    img: cdnImage("andromedaads.webp", { width: 540 }),
    salesPagePath: "/andromeda",
    offer: false,
    desc: "Estrategias avanzadas para Meta Ads que maximizan tu ROAS.",
  },
  {
    name: "Analytics.KPI",
    type: "Bump",
    price: "US$ 12.90",
    img: cdnImage("analyticskpi.png", { width: 540 }),
    salesPagePath: "/analytics",
    offer: false,
    desc: "Domina las métricas que importan. Análisis profundo de KPIs y dashboards prácticos.",
  },
  {
    name: "Agente Copy Mini VSL's",
    type: "Upsell",
    price: "US$ 24.90",
    img: cdnImage("minivsl.webp", { width: 540 }),
    salesPagePath: null,
    inlineCheckoutPath: "/minivsl",
    offer: false,
    desc: "Inserta un Mini VSL con el copy de este Agente GPT en medio de tu embudo gamificado y aumenta la percepción de valor de tu producto, especialmente en productos que necesitan más tiempo para convencer al lead.",
  },
  {
    name: "Revisión de Tu Embudo",
    type: "Upsell",
    price: "US$ 99.90",
    img: cdnImage("revisao.webp", { width: 540 }),
    salesPagePath: null,
    inlineCheckoutPath: "/revisao",
    offer: true,
    desc: "Yo, desarrollador oficial de esta metodología, realizaré un análisis completo de tu embudo para eliminar posibles puntos de fuga de tus leads, aplicar ajustes estratégicos y maximizar el rendimiento de tu embudo.",
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
  "Creativos.AI": {
    url: "https://chatgpt.com/g/SEU_GPT_CREATIVOS_ID",
    external: true,
    cta: "Abrir Agente",
  },
  "Agente Copy Mini VSL's": {
    url: "https://chatgpt.com/g/SEU_GPT_MINIVSL_ID",
    external: true,
    cta: "Abrir Agente",
  },
  "Andrómeda.ADS": {
    url: "/miembros/producto/andromeda",
    external: false,
    cta: "Acceder",
    internalSlug: "andromeda",
  },
  "Analytics.KPI": {
    url: "/miembros/producto/analytics",
    external: false,
    cta: "Acceder",
    internalSlug: "analytics",
  },
  "Revisión de Tu Embudo": {
    url: "/miembros/producto/revisao",
    external: false,
    cta: "Enviar Materiales",
    internalSlug: "revisao",
  },
  "Pack de Ganchos Neuronales™": {
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
    name: "Pack de Ganchos Neuronales™",
    slug: "bonus-ganchos",
    img: "https://cdn.SEU_DOMINIO.com/Bonus.webp",
    desc: "30+ Hooks estratégicos categorizados por nivel de conciencia para Reels, Headlines, Carruseles, UGC y Stories.",
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
