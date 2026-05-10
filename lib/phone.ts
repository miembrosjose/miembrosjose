/**
 * Normalização de telefone pra formato E.164 (sem o "+").
 *
 * Aplica regras específicas por país pra cobrir variações comuns de input:
 *  - AR: cell phones precisam do "9" entre DDI e número
 *  - EC, PY: removem o "0" inicial do número local
 *  - Países sem DDD usam o número direto
 *
 * Exemplos validados:
 *   AR: 011 15 2345-6789 → 5491123456789
 *   BR: 11 98765-4321    → 5511987654321
 *   CL: 9 1234 5678      → 56912345678
 *   CO: 300 123 4567     → 573001234567
 *   EC: 09 1234 5678     → 593912345678
 *   MX: 55 1234 5678     → 525512345678
 *   PY: 0981 123456      → 595981123456
 */

export function normalizePhoneE164(
  phone: string,
  countryCode: string,
  dialCode: string,
): string {
  let digits = phone.replace(/\D/g, "")
  const cleanDdi = dialCode.replace(/\D/g, "")

  // Evita duplicar DDI se o usuário digitou o número já com código do país.
  // Ex: Chile 56912345678 com country=CL → remove o 56 antes de processar.
  if (digits.startsWith(cleanDdi) && digits.length > cleanDdi.length + 4) {
    digits = digits.slice(cleanDdi.length)
  }

  switch (countryCode) {
    case "AR": {
      // Argentina: remove 0 inicial e "15" móvel após código de área.
      // E.164 exige o "9" entre DDI e número pra celular.
      let normalized = digits.replace(/^0/, "")
      normalized = normalized.replace(/^(\d{2,4})15(\d{6,8})$/, "$1$2")
      return `${cleanDdi}9${normalized}`
    }

    case "EC":
    case "PY": {
      // Equador e Paraguai: remove 0 inicial.
      const normalized = digits.replace(/^0/, "")
      return `${cleanDdi}${normalized}`
    }

    default: {
      // BR, MX, CO, DO, CL, CR, PA, PE, SV, UY e fallback genérico:
      // simples concatenação DDI + número.
      return `${cleanDdi}${digits}`
    }
  }
}
