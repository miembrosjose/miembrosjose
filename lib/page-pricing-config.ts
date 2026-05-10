// Preços e configurações por moeda — fonte única de verdade para a salespage.
// Para alterar preços ou parcelas, edite apenas este arquivo.
//
// currentPrice/originalPrice = ACCESO VITALÍCIO (lifetime) — botão principal
// annualPrice = ACCESO ANUAL — botão secundário (12 meses, depois renova)

export const SALESPAGE_PRICING = {
  DEFAULT: { symbolSpan: "US$ ", currentPrice: "97",  originalPrice: "197", formattedCurrent: "US$ 97",  formattedOriginal: "US$ 197", annualPrice: "57",  formattedAnnual: "US$ 57"  },
  EUR:     { symbolSpan: "€",    currentPrice: "197", originalPrice: "497", formattedCurrent: "€197",    formattedOriginal: "€497",    annualPrice: "127", formattedAnnual: "€127"    },
  USD:     { symbolSpan: "US$ ", currentPrice: "197", originalPrice: "497", formattedCurrent: "US$ 197", formattedOriginal: "US$ 497", annualPrice: "127", formattedAnnual: "US$ 127" },
  GBP:     { symbolSpan: "£",    currentPrice: "197", originalPrice: "497", formattedCurrent: "£197",    formattedOriginal: "£497",    annualPrice: "127", formattedAnnual: "£127"    },
  CHF:     { symbolSpan: "CHF",  currentPrice: "197", originalPrice: "497", formattedCurrent: "CHF 197", formattedOriginal: "CHF 497", annualPrice: "127", formattedAnnual: "CHF 127" },
} as const

export type SalespagePricingKey = keyof typeof SALESPAGE_PRICING
