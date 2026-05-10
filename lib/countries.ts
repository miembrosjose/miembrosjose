// Agrupamentos de países por moeda/salespage — fonte única de verdade.
// Qualquer mudança (adicionar/remover país) deve ser feita apenas aqui.

export const ES_COUNTRIES = [
  "ES","DE","AT","BE","FR","IE","IT","NL","PT","FI","LU",
  "SK","SI","EE","GR","LV","LT","MT","AD","MC","SM","VA",
] as const

export const USA_COUNTRIES = [
  "US","CA","PR","NO","SE","DK","IS","AU","NZ","SG","TW",
  "HK","JP","KR","IL","AE","QA","KW","SA",
] as const

export const GBP_COUNTRIES = ["GB","GI","IM","JE","GG"] as const

export const CHF_COUNTRIES = ["CH","LI"] as const

export type PricingRegion = "DEFAULT" | "EUR" | "USD" | "GBP" | "CHF"

// Retorna a região de preço com base no país — fonte única de verdade para roteamento de preço.
export function getPricingRegion(countryCode: string): PricingRegion {
  if ((GBP_COUNTRIES as readonly string[]).includes(countryCode)) return "GBP"
  if ((CHF_COUNTRIES as readonly string[]).includes(countryCode)) return "CHF"
  if ((ES_COUNTRIES  as readonly string[]).includes(countryCode)) return "EUR"
  if ((USA_COUNTRIES as readonly string[]).includes(countryCode)) return "USD"
  return "DEFAULT"
}
