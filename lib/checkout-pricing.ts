// Cálculo client-side de total do checkout — mirror exato da lógica de
// /api/stripe/finalize/route.ts. Usado pra inicializar Stripe Elements em
// modo deferred (mode: "payment", amount, currency) sem fetch ao servidor.
//
// CRÍTICO: a lógica AQUI deve ficar idêntica à de finalize/route.ts.
// Se mudar regra de desconto/combo, atualizar nos DOIS lugares.

import { CHECKOUT_CONFIGS, type CheckoutConfig, type CheckoutRegion } from "./checkout-configs"
import { getExchangeRates, type SupportedCurrency } from "./exchange-rates"

const COMBO_DISCOUNT_PERCENT = 0.3
const EXIT_FRONT_DISCOUNT_PERCENT = 0.2 // 20% só no front
const ZERO_DECIMAL_CURRENCIES = new Set(["clp", "pyg", "krw", "jpy", "vnd"])

export type PaymentMode = "one_time" | "installment"
export type CheckoutPlan = "lifetime" | "annual"

export type PricingInput = {
  region: CheckoutRegion
  currency: SupportedCurrency
  selectedBumps: string[]
  applyComboDiscount: boolean
  applyFrontDiscount: boolean
  paymentMode: PaymentMode
  /** 2-5 — só usado em installment */
  installmentCount?: number
  /**
   * "lifetime" (default) usa config.frontPrice. "annual" usa config.frontAnnualPrice.
   * Annual aceita paymentMode="installment" — usa as mesmas %s de juros do
   * vitalício escaladas pelo ratio frontAnnualPrice/frontPrice.
   */
  plan?: CheckoutPlan
}

export type PricingResult = {
  totalCents: number
  totalUsd: number
  /** Moeda lowercase (formato Stripe) */
  currency: string
  /** Valor da parcela em centavos (só pra installment) */
  installmentCents?: number
}

function toCents(amount: number, currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency)
    ? Math.round(amount)
    : Math.round(amount * 100)
}

/**
 * Calcula o total da venda em centavos baseado na seleção do cliente.
 * Mirror de finalize/route.ts pra modo deferred do Stripe Elements.
 *
 * Async porque LATAM precisa cotação USD→moeda local.
 */
export async function computeCheckoutPricing(
  input: PricingInput,
  /** Override opcional de config — usado pra test pricing BR ou outros sobrescritos */
  configOverride?: CheckoutConfig
): Promise<PricingResult> {
  const config = configOverride || CHECKOUT_CONFIGS[input.region]
  if (!config) throw new Error(`Region inválida: ${input.region}`)

  const selectedBumps = config.bumps.filter((b) => input.selectedBumps.includes(b.key))

  // Bumps em USD com combo se aplicável
  let bumpsTotalUsd = 0
  for (const b of selectedBumps) {
    let priceUsd = b.price
    if (input.applyComboDiscount && selectedBumps.length === config.bumps.length) {
      priceUsd *= 1 - COMBO_DISCOUNT_PERCENT
    }
    bumpsTotalUsd += priceUsd
  }

  // Determina moeda final + cotação
  let currency = config.currency.toLowerCase()
  let usdToTargetRate = 1
  if (input.region === "DEFAULT" && input.currency && input.currency !== "USD") {
    const rates = await getExchangeRates()
    const rate = rates[input.currency]
    if (!rate || rate <= 0) throw new Error(`Cotação indisponível pra ${input.currency}`)
    usdToTargetRate = rate
    currency = input.currency.toLowerCase()
  } else if (input.currency === "USD") {
    currency = "usd"
  }

  if (input.paymentMode === "one_time") {
    // plan="annual" usa frontAnnualPrice (LATAM 57, outros 127); default lifetime usa frontPrice
    let frontUsd = input.plan === "annual" ? config.frontAnnualPrice : config.frontPrice
    if (input.applyFrontDiscount) frontUsd *= 1 - EXIT_FRONT_DISCOUNT_PERCENT

    const totalUsd = frontUsd + bumpsTotalUsd
    if (totalUsd <= 0) throw new Error("Valor total inválido")

    const totalInCurrency = totalUsd * usdToTargetRate
    const totalCents = toCents(totalInCurrency, currency)

    return { totalCents, totalUsd, currency }
  }

  // installment
  if (!config.installmentPlans) {
    throw new Error("Parcelamento não disponível pra essa região")
  }
  const plansSet = input.applyFrontDiscount
    ? config.installmentPlans.exit
    : config.installmentPlans.oficial
  const plan = plansSet.find((p) => p.count === input.installmentCount)
  if (!plan) throw new Error(`Plan de ${input.installmentCount}x não disponível`)

  // Annual installment: aplica ratio (frontAnnualPrice/frontPrice) ao valor
  // da parcela, mantendo a mesma % de juros embutida no plano original.
  const planRatio = input.plan === "annual" ? config.frontAnnualPrice / config.frontPrice : 1
  const installmentValueUsd = Math.round(plan.value * planRatio * 100) / 100
  const totalInstallments = plan.count
  const installmentValueInCurrency = installmentValueUsd * usdToTargetRate
  const installmentCents = toCents(installmentValueInCurrency, currency)

  // Total da venda parcelada (todas as parcelas + bumps full upfront na 1ª)
  // Pra Stripe Elements amount: usamos o total em centavos da moeda local.
  const totalUsd = installmentValueUsd * totalInstallments + bumpsTotalUsd
  const totalInCurrency = totalUsd * usdToTargetRate
  const totalCents = toCents(totalInCurrency, currency)

  return { totalCents, totalUsd, currency, installmentCents }
}
