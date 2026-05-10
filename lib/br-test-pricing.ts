// 🧪 OVERRIDE DE TESTE — preços de R$ 1 (~$0.20 USD) APENAS para Brasil.
//
// Problema: testar 1-click off-session em prod precisa de cobrança real.
// Mas não dá pra cobrar $16-99 USD nos testes (custo alto). Ao mesmo tempo
// não dá pra mudar preço de TODA LATAM (clientes LATAM reais comprariam por
// R$1 inadvertidamente).
//
// Solução: override SÓ quando o user é do Brasil (cf-ipcountry === "BR" OU
// customer_country === "BR" OU card.country === "BR"). Outros países LATAM
// continuam pagando preço original.
//
// Como testar:
//  - Logar em conta admin/test no BR
//  - Comprar bumps/upsells por $0.20 USD ≈ R$1 BRL
//  - Outros clientes LATAM (México, Argentina, etc) pagam preço normal
//
// Pra desativar globalmente: setar `BR_TEST_OVERRIDE_ENABLED = false` ou
// deletar este arquivo + remover os imports.

export const BR_TEST_OVERRIDE_ENABLED = true
const BR_TEST_PRICE_USD = 0.20

/**
 * Detecta se o country é BR. Aceita cf-ipcountry, customer_country, card.country.
 */
export function isBrazilianContext(country: string | null | undefined): boolean {
  if (!country) return false
  return country.toUpperCase() === "BR"
}

/**
 * Aplica override de $0.20 USD se country=BR e modo teste ativo.
 * Pra outros países, retorna o priceOriginal sem mudança.
 */
export function applyBrTestPrice(
  priceOriginalUsd: number,
  country: string | null | undefined,
): number {
  if (BR_TEST_OVERRIDE_ENABLED && isBrazilianContext(country)) {
    return BR_TEST_PRICE_USD
  }
  return priceOriginalUsd
}

/**
 * Aplica override em PriceFrom também (pra display "de X por solo Y" funcionar).
 * Brasileiro: priceFrom também $1.00 USD pra mostrar contexto.
 */
export function applyBrTestPriceFrom(
  priceFromOriginalUsd: number | null,
  country: string | null | undefined,
): number | null {
  if (BR_TEST_OVERRIDE_ENABLED && isBrazilianContext(country)) {
    return 1.00 // $1.00 USD ≈ R$5 BRL
  }
  return priceFromOriginalUsd
}
