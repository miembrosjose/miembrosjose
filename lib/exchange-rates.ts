// Câmbio USD → outras moedas via API gratuita (open.er-api.com)
// Sem API key, suporta 160+ moedas. Atualiza a cada hora (cache Next).

const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "GBP", "CHF",
  "BRL", "MXN", "ARS", "CLP", "COP", "CRC", "DOP", "PEN", "PYG", "UYU",
] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export type ExchangeRates = Record<SupportedCurrency, number>

/**
 * Pega câmbio USD → todas as moedas suportadas. Cache de 1 hora (Next fetch).
 * Retorna { USD: 1, BRL: 5.05, MXN: 20.1, ARS: 1010, ... }
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  const fallback: ExchangeRates = {
    USD: 1, EUR: 0.92, GBP: 0.79, CHF: 0.88,
    BRL: 5.0, MXN: 20.0, ARS: 1000, CLP: 950,
    COP: 4000, CRC: 510, DOP: 60, PEN: 3.75, PYG: 7400, UYU: 40,
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 }, // 1h cache
    })
    if (!res.ok) return fallback

    const data = (await res.json()) as { result?: string; rates?: Record<string, number> }
    if (data.result !== "success" || !data.rates) return fallback

    const rates = {} as ExchangeRates
    for (const c of SUPPORTED_CURRENCIES) {
      rates[c] = typeof data.rates[c] === "number" ? data.rates[c] : fallback[c]
    }
    return rates
  } catch {
    return fallback
  }
}

/**
 * Converte um valor de USD pra outra moeda usando os câmbio fornecido.
 * Arredonda pra cima pra valor "limpo" baseado na moeda.
 *
 * Aceita toCurrency em qualquer casing (case-insensitive) — callers podem
 * passar "brl" minúsculo OU "BRL" maiúsculo. Retorna 0 se moeda não suportada.
 */
export function convertFromUsd(amountUsd: number, toCurrency: SupportedCurrency | string, rates: ExchangeRates): number {
  const c = String(toCurrency).toUpperCase() as SupportedCurrency
  if (c === "USD") return amountUsd
  const rate = rates[c]
  if (!rate || !Number.isFinite(rate)) return 0
  const raw = amountUsd * rate

  // Arredondamento por moeda (algumas têm decimais, outras não):
  switch (c) {
    // Moedas sem decimais (1 unidade é o mínimo)
    case "ARS":
    case "CLP":
    case "COP":
    case "PYG":
      return Math.round(raw)
    // Moedas com 2 decimais
    case "BRL":
    case "MXN":
    case "PEN":
    case "UYU":
    case "CRC":
    case "DOP":
    case "EUR":
    case "GBP":
    case "CHF":
      return Math.round(raw * 100) / 100
    default:
      return raw
  }
}
