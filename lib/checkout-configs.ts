// Configs de checkout por região — fonte única de verdade.
// Pricing aqui é placeholder e será substituído por Price IDs da Stripe quando o backend for plugado.

import { ES_COUNTRIES, USA_COUNTRIES, GBP_COUNTRIES, CHF_COUNTRIES } from "./countries"

export type CheckoutRegion = "DEFAULT" | "EUR" | "USD" | "GBP" | "CHF"

const BUMP_CREATIVOS_IMG = "https://cdn.copyfilms.online/michaelazo.webp"
const BUMP_ANDROMEDA_IMG = "https://cdn.copyfilms.online/campanas.webp"
const BUMP_ANALYTICS_IMG = "https://cdn.copyfilms.online/analytics.webp"
const UPSELL_REVISAO_IMG = "https://cdn.copyfilms.online/revisao.webp"
const UPSELL_MINIVSL_IMG = "https://cdn.copyfilms.online/minivsl.webp"

// Stripe Price IDs por região (criados via scripts/stripe-bootstrap-live.mjs em 2026-04-27 — LIVE MODE)
// LATAM (DEFAULT) usa Price em USD + Adaptive Pricing pra converter pra moeda local (BRL, MXN, etc).
// USD/EUR/GBP/CHF usam Price na própria moeda — sem conversão.
// Mini VSL é único USD ($24.90) usado em todas as regiões.
export const STRIPE_PRICE_IDS = {
  front: {
    DEFAULT: "price_1TQhMy3ZNcaJuoiZid39WbFE", // USD 57
    USD:     "price_1TQhMz3ZNcaJuoiZE3uj87fr", // USD 197
    EUR:     "price_1TQhMz3ZNcaJuoiZTuOLlIh6", // EUR 197
    GBP:     "price_1TQhMz3ZNcaJuoiZKYe0gBUu", // GBP 197
    CHF:     "price_1TQhN03ZNcaJuoiZM3bxhiuw", // CHF 197
  },
  // Acceso Anual NÃO precisa de Price IDs novos — usa unit_amount inline
  // (mesmo padrão do front à vista). frontAnnualPrice vive no CheckoutConfig
  // de cada região. Differenciação no Stripe Dashboard via metadata.product_variant.
  creativos: {
    DEFAULT: "price_1TQhN03ZNcaJuoiZXbZUihPB", // USD 9.90
    USD:     "price_1TQhN03ZNcaJuoiZXMAOzFrk", // USD 34.90
    EUR:     "price_1TQhN13ZNcaJuoiZ4kymhEHR", // EUR 34.90
    GBP:     "price_1TQhN13ZNcaJuoiZ31Aswwcf", // GBP 34.90
    CHF:     "price_1TQhN13ZNcaJuoiZrnV0HgMb", // CHF 34.90
  },
  andromeda: {
    DEFAULT: "price_1TQhN23ZNcaJuoiZETvzzwr4", // USD 7.90
    USD:     "price_1TQhN23ZNcaJuoiZmyLHqqPj", // USD 27.90
    EUR:     "price_1TQhN33ZNcaJuoiZZUB1emID", // EUR 27.90
    GBP:     "price_1TQhN33ZNcaJuoiZDTzYgTov", // GBP 27.90
    CHF:     "price_1TQhN33ZNcaJuoiZyvLCXfhg", // CHF 27.90
  },
  analytics: {
    DEFAULT: "price_1TQhN43ZNcaJuoiZ9mBPlrcx", // USD 7.90
    USD:     "price_1TQhN43ZNcaJuoiZ8zDwm3sz", // USD 27.90
    EUR:     "price_1TQhN43ZNcaJuoiZfk5bxNlV", // EUR 27.90
    GBP:     "price_1TQhN53ZNcaJuoiZNim0i4fb", // GBP 27.90
    CHF:     "price_1TQhN53ZNcaJuoiZ4nLqJhJv", // CHF 27.90
  },
  revisao: {
    DEFAULT: "price_1TQhN63ZNcaJuoiZFYBtjrxv", // USD 49.90
    USD:     "price_1TQhN63ZNcaJuoiZgpOEtStd", // USD 99.90
    EUR:     "price_1TQhN63ZNcaJuoiZ2i2DgfpC", // EUR 99.90
    GBP:     "price_1TQhN73ZNcaJuoiZzZ1jA24Q", // GBP 99.90
    CHF:     "price_1TQhN73ZNcaJuoiZe89Sgjtb", // CHF 99.90
  },
  // Mini VSL: USD único pra todas regiões (cliente paga $24.90 USD em qualquer país)
  minivsl: "price_1TQhN73ZNcaJuoiZqd4L6c7z",
} as const

export type BumpConfig = {
  key: "creativos" | "andromeda" | "analytics"
  emoji: string
  title: string
  description: string
  priceFrom: number
  price: number
  image: string
  stripePriceId?: string // Preencher depois quando criar Prices na Stripe
}

export type UpsellConfig = {
  key: "revisao" | "minivsl"
  title: string
  description: string
  priceFrom?: number // Opcional — se não tiver, não mostra "de" riscado
  price: number
  image: string
  stripePriceId?: string
}

/**
 * Calcula o % de desconto a partir de priceFrom e price.
 * Retorna null se não houver desconto válido.
 */
export function calcDiscountPct(priceFrom: number | undefined, price: number): number | null {
  if (!priceFrom || priceFrom <= price) return null
  return Math.round((1 - price / priceFrom) * 100)
}

export type Currency = "USD" | "EUR" | "GBP" | "CHF"

/** Plano de parcelamento — valor explícito por parcela em USD (LATAM converte pra moeda local). */
export type InstallmentPlan = {
  /** Quantidade de parcelas (2, 3, 4, 5) */
  count: number
  /** Valor de CADA parcela em USD (ou na moeda da região pra USD/EUR/GBP/CHF) */
  value: number
}

export type CheckoutConfig = {
  region: CheckoutRegion
  currency: Currency
  /** Preço do produto principal (Copy Film's) — equivalente a 1x à vista (Acceso Vitalício) */
  frontPrice: number
  /** Stripe Price ID do produto principal — preencher quando integrar */
  frontStripePriceId?: string
  /**
   * Preço do Acceso Anual (1 ano de acesso, pagamento único).
   * LATAM (DEFAULT): 57 USD. USD/EUR/GBP/CHF: 127 na moeda local.
   * Usado quando o checkout é acessado via /checkout?plan=annual.
   */
  frontAnnualPrice: number
  /**
   * Planos de parcelamento (com juros embutidos).
   * - `oficial`: aplica quando NÃO tem exit discount
   * - `exit`: aplica quando exit-intent foi aceito (cliente recebeu desconto)
   * Null = só à vista (sem parcelamento).
   */
  installmentPlans: {
    oficial: InstallmentPlan[]
    exit: InstallmentPlan[]
  } | null
  /** Order bumps disponíveis nessa região */
  bumps: BumpConfig[]
  /** Upsells 1-click pós-pagamento */
  upsells: UpsellConfig[]
}

/* ─── Builders auxiliares ──────────────────────────────── */

type BumpPrices = {
  creativosFrom: number; creativos: number
  andromedaFrom: number; andromeda: number
  analyticsFrom: number; analytics: number
}

type UpsellPrices = {
  /** Revisão: priceFrom é opcional. Se omitido, não mostra desconto. */
  revisaoFrom?: number
  revisao: number
  miniVslFrom?: number
  miniVsl: number
}

const buildUpsells = (region: CheckoutRegion, p: UpsellPrices): UpsellConfig[] => [
  {
    key: "revisao",
    title: "Revisión de Tu Embudo",
    description: "Yo, desarrollador oficial de esta metodología, realizaré un análisis completo de tu embudo para eliminar posibles puntos de fuga de tus leads, aplicar ajustes estratégicos y maximizar el rendimiento de tu embudo.",
    priceFrom: p.revisaoFrom,
    price: p.revisao,
    image: UPSELL_REVISAO_IMG,
    stripePriceId: STRIPE_PRICE_IDS.revisao[region],
  },
  {
    key: "minivsl",
    title: "Agente Copy para Mini VSL's",
    description: "Inserta un Mini VSL con el copy de este Agente GPT en medio de tu embudo gamificado y aumenta la percepción de valor de tu producto, especialmente en productos que necesitan más tiempo para convencer al lead.",
    priceFrom: p.miniVslFrom,
    price: p.miniVsl,
    image: UPSELL_MINIVSL_IMG,
    stripePriceId: STRIPE_PRICE_IDS.minivsl,
  },
]

const buildBumps = (region: CheckoutRegion, p: BumpPrices): BumpConfig[] => [
  {
    key: "creativos",
    emoji: "🤖",
    title: "[OFERTA ÚNICA] Creativos.AI",
    description: "Pega el copy de tu embudo en este Agente GPT y deja que de ahora en adelante él escriba tus mejores creativos.",
    priceFrom: p.creativosFrom,
    price: p.creativos,
    image: BUMP_CREATIVOS_IMG,
    stripePriceId: STRIPE_PRICE_IDS.creativos[region],
  },
  {
    key: "andromeda",
    emoji: "⚡",
    title: "[OFERTA ÚNICA] Andromeda.ADS",
    description: "Copia la estructura de campañas que yo y los mejores del mercado usamos para escalar en Meta Ads.",
    priceFrom: p.andromedaFrom,
    price: p.andromeda,
    image: BUMP_ANDROMEDA_IMG,
    stripePriceId: STRIPE_PRICE_IDS.andromeda[region],
  },
  {
    key: "analytics",
    emoji: "📊",
    title: "[OFERTA ÚNICA] Analytics.KPI",
    description: "Rastrea los leads en tu embudo, identifica tus mejores campañas, tus creativos ganadores y monitorea KPIs.",
    priceFrom: p.analyticsFrom,
    price: p.analytics,
    image: BUMP_ANALYTICS_IMG,
    stripePriceId: STRIPE_PRICE_IDS.analytics[region],
  },
]

/* ─── Configs por região ───────────────────────────────── */

export const CHECKOUT_CONFIGS: Record<CheckoutRegion, CheckoutConfig> = {
  // LATAM (qualquer país sem grupo específico — México, Colômbia, Argentina, Chile, Peru, Brasil, etc.)
  // Adaptive Pricing ATIVO — Stripe converte $97 USD pra moeda local na hora do pagamento.
  DEFAULT: {
    region: "DEFAULT",
    currency: "USD",
    frontPrice: 97,
    frontStripePriceId: STRIPE_PRICE_IDS.front.DEFAULT,
    frontAnnualPrice: 57,
    installmentPlans: {
      oficial: [
        { count: 2, value: 49.90 },
        { count: 3, value: 34.90 },
        { count: 4, value: 27.90 },
        { count: 5, value: 22.90 },
      ],
      exit: [
        { count: 2, value: 39.90 },
        { count: 3, value: 27.90 },
        { count: 4, value: 22.30 },
        { count: 5, value: 18.30 },
      ],
    },
    bumps: buildBumps("DEFAULT", {
      creativosFrom: 47.90, creativos: 16.90,
      andromedaFrom: 34.90, andromeda: 12.90,
      analyticsFrom: 34.90, analytics: 12.90,
    }),
    upsells: buildUpsells("DEFAULT", {
      revisaoFrom: 199.90, revisao: 99.90,
      miniVslFrom: 49.90, miniVsl: 24.90,
    }),
  },

  // USA + Canadá + Austrália + NZ + Japão + Coreia + outros desenvolvidos
  USD: {
    region: "USD",
    currency: "USD",
    frontPrice: 197,
    frontStripePriceId: STRIPE_PRICE_IDS.front.USD,
    frontAnnualPrice: 127,
    installmentPlans: {
      oficial: [
        { count: 2, value: 99.90 },
        { count: 3, value: 69.90 },
        { count: 4, value: 54.90 },
        { count: 5, value: 44.90 },
      ],
      exit: [
        { count: 2, value: 79.90 },
        { count: 3, value: 55.90 },
        { count: 4, value: 43.90 },
        { count: 5, value: 35.90 },
      ],
    },
    bumps: buildBumps("USD", {
      creativosFrom: 99.90, creativos: 34.90,
      andromedaFrom: 69.90, andromeda: 27.90,
      analyticsFrom: 69.90, analytics: 27.90,
    }),
    upsells: buildUpsells("USD", {
      revisaoFrom: 399.90, revisao: 199.90,
      miniVslFrom: 49.90, miniVsl: 24.90,
    }),
  },

  // Espanha + Europa continental
  EUR: {
    region: "EUR",
    currency: "EUR",
    frontPrice: 197,
    frontStripePriceId: STRIPE_PRICE_IDS.front.EUR,
    frontAnnualPrice: 127,
    installmentPlans: {
      oficial: [
        { count: 2, value: 99.90 },
        { count: 3, value: 69.90 },
        { count: 4, value: 54.90 },
        { count: 5, value: 44.90 },
      ],
      exit: [
        { count: 2, value: 79.90 },
        { count: 3, value: 55.90 },
        { count: 4, value: 43.90 },
        { count: 5, value: 35.90 },
      ],
    },
    bumps: buildBumps("EUR", {
      creativosFrom: 99.90, creativos: 34.90,
      andromedaFrom: 69.90, andromeda: 27.90,
      analyticsFrom: 69.90, analytics: 27.90,
    }),
    upsells: buildUpsells("EUR", {
      revisaoFrom: 399.90, revisao: 199.90,
      miniVslFrom: 49.90, miniVsl: 24.90,
    }),
  },

  // Reino Unido + ilhas britânicas
  GBP: {
    region: "GBP",
    currency: "GBP",
    frontPrice: 197,
    frontStripePriceId: STRIPE_PRICE_IDS.front.GBP,
    frontAnnualPrice: 127,
    installmentPlans: {
      oficial: [
        { count: 2, value: 99.90 },
        { count: 3, value: 69.90 },
        { count: 4, value: 54.90 },
        { count: 5, value: 44.90 },
      ],
      exit: [
        { count: 2, value: 79.90 },
        { count: 3, value: 55.90 },
        { count: 4, value: 43.90 },
        { count: 5, value: 35.90 },
      ],
    },
    bumps: buildBumps("GBP", {
      creativosFrom: 99.90, creativos: 34.90,
      andromedaFrom: 69.90, andromeda: 27.90,
      analyticsFrom: 69.90, analytics: 27.90,
    }),
    upsells: buildUpsells("GBP", {
      revisaoFrom: 399.90, revisao: 199.90,
      miniVslFrom: 49.90, miniVsl: 24.90,
    }),
  },

  // Suíça + Liechtenstein
  CHF: {
    region: "CHF",
    currency: "CHF",
    frontPrice: 197,
    frontStripePriceId: STRIPE_PRICE_IDS.front.CHF,
    frontAnnualPrice: 127,
    installmentPlans: {
      oficial: [
        { count: 2, value: 99.90 },
        { count: 3, value: 69.90 },
        { count: 4, value: 54.90 },
        { count: 5, value: 44.90 },
      ],
      exit: [
        { count: 2, value: 79.90 },
        { count: 3, value: 55.90 },
        { count: 4, value: 43.90 },
        { count: 5, value: 35.90 },
      ],
    },
    bumps: buildBumps("CHF", {
      creativosFrom: 99.90, creativos: 34.90,
      andromedaFrom: 69.90, andromeda: 27.90,
      analyticsFrom: 69.90, analytics: 27.90,
    }),
    upsells: buildUpsells("CHF", {
      revisaoFrom: 399.90, revisao: 199.90,
      miniVslFrom: 49.90, miniVsl: 24.90,
    }),
  },
}

/**
 * Mapeia país (ISO 2) pra moeda local LATAM oferecida no seletor de moeda.
 * Países que NÃO estão aqui usam só USD (sem seletor).
 * Equador (EC), El Salvador (SV) e Panamá (PA) usam USD nativo — não entram.
 */
// BR removido: Copy Films NÃO vende pra Brasil — brasileiro vê apenas USD no seletor
// (Stripe Adaptive Pricing converte automaticamente USD→BRL no momento da cobrança).
export const LATAM_LOCAL_CURRENCY: Record<string, "ARS" | "CLP" | "COP" | "CRC" | "DOP" | "MXN" | "PEN" | "PYG" | "UYU"> = {
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  CR: "CRC",
  DO: "DOP",
  MX: "MXN",
  PE: "PEN",
  PY: "PYG",
  UY: "UYU",
}

export type LocalCurrency = (typeof LATAM_LOCAL_CURRENCY)[keyof typeof LATAM_LOCAL_CURRENCY]

// Mapping pra off-session 1-click. INCLUI BR → BRL porque:
//  - No /checkout principal, brasileiro paga em USD e Stripe Adaptive Pricing
//    converte automaticamente USD→BRL no confirmPayment (on-session, com Elements).
//  - Em off-session 1-click (PaymentIntent.create + confirm: true), Adaptive Pricing
//    NÃO funciona — Stripe cobra na moeda exata que recebe. Cartão BR rejeita
//    USD com "currency_not_supported" / "Moeda não aceita".
//  - Pra reaproveitar o cartão salvo, off-session precisa cobrar em BRL.
//
// Esse mapping NÃO é usado nos seletores de moeda do /checkout — só nos endpoints
// /api/buy-product, /api/upgrade-to-lifetime que cobram off-session.
export const OFF_SESSION_LOCAL_CURRENCY: Record<string, "ARS" | "BRL" | "CLP" | "COP" | "CRC" | "DOP" | "MXN" | "PEN" | "PYG" | "UYU"> = {
  ...LATAM_LOCAL_CURRENCY,
  BR: "BRL",
}

/** Nome do país em espanhol pra exibir no seletor de moeda */
export const COUNTRY_NAME_ES: Record<string, string> = {
  BR: "Brasil",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  CR: "Costa Rica",
  DO: "República Dominicana",
  EC: "Ecuador",
  SV: "El Salvador",
  MX: "México",
  PA: "Panamá",
  PE: "Perú",
  PY: "Paraguay",
  UY: "Uruguay",
}

/** Converte código ISO de país (ex: "BR") em emoji de bandeira (🇧🇷) */
export function countryToFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return ""
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

/** Resolve região a partir do código ISO do país */
export function getCheckoutRegion(countryCode: string): CheckoutRegion {
  if ((GBP_COUNTRIES as readonly string[]).includes(countryCode)) return "GBP"
  if ((CHF_COUNTRIES as readonly string[]).includes(countryCode)) return "CHF"
  if ((ES_COUNTRIES  as readonly string[]).includes(countryCode)) return "EUR"
  if ((USA_COUNTRIES as readonly string[]).includes(countryCode)) return "USD"
  return "DEFAULT"
}
