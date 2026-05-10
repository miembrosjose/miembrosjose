// URLs de checkout — fonte única de verdade.
// Tudo aponta pro checkout custom em SEU_DOMINIO.com/checkout.
// O checkout detecta região automaticamente via geolocation/IP.
// Mantemos `CHECKOUT_URLS[region]` por compat com código existente que mapeia por região.

import { GBP_COUNTRIES, CHF_COUNTRIES, ES_COUNTRIES, USA_COUNTRIES } from "./countries"

const CHECKOUT_BASE = "https://SEU_DOMINIO.com/checkout"

export const CHECKOUT_URLS = {
  GBP:     CHECKOUT_BASE,
  CHF:     CHECKOUT_BASE,
  EUR:     CHECKOUT_BASE,
  USD:     CHECKOUT_BASE,
  DEFAULT: CHECKOUT_BASE,
} as const

// Retorna a URL de checkout de acordo com o código ISO do país.
// Hoje retorna a mesma URL pra todas as regiões — checkout custom detecta região internamente.
// Mantido pra compat com chamadas existentes.
export function getCheckoutUrl(countryCode: string): string {
  if ((GBP_COUNTRIES as readonly string[]).includes(countryCode)) return CHECKOUT_URLS.GBP
  if ((CHF_COUNTRIES as readonly string[]).includes(countryCode)) return CHECKOUT_URLS.CHF
  if ((ES_COUNTRIES  as readonly string[]).includes(countryCode)) return CHECKOUT_URLS.EUR
  if ((USA_COUNTRIES as readonly string[]).includes(countryCode)) return CHECKOUT_URLS.USD
  return CHECKOUT_URLS.DEFAULT
}
