// Mapeamento de produtos Hotmart → item keys da área de membros.
//
// COMO DESCOBRIR OS IDs:
//   Cada PURCHASE_APPROVED loga o hotmart_product_id e hotmart_product_name
//   nos logs do Cloudflare. Após uma venda real, copiar o ID numérico e
//   adicionar ao HOTMART_PRODUCT_ID_MAP abaixo (mais confiável que nome).
//
// FALLBACK POR NOME:
//   Enquanto os IDs não estão mapeados, NAME_PATTERNS faz match parcial
//   case-insensitive. Ajustar os patterns se os nomes no Hotmart forem
//   diferentes dos padrões aqui.
//
// REGRA CRÍTICA:
//   Só produtos com isFront=true disparam WhatsApp de boas-vindas e
//   email de invite. Bumps (isFront=false) apenas salvam itens em
//   stripe_sales para liberar acesso na área de membros.

export type HotmartProductInfo = {
  itemKeys: string[]  // chaves que aparecem em stripe_sales.items[]
  isFront: boolean    // só front dispara WhatsApp + email invite
}

// ── Mapeamento por ID numérico (mais confiável) ───────────────────────────
// Preencher com os IDs reais após verificar nos logs do Cloudflare.
// Formato: { [hotmart_product_id]: { itemKeys, isFront } }
export const HOTMART_PRODUCT_ID_MAP: Record<number, HotmartProductInfo> = {
  // Exemplos — substituir pelos IDs reais:
  // 12345678: { itemKeys: ["front"], isFront: true },        // Copy Film's
  // 23456789: { itemKeys: ["creativos"], isFront: false },   // Creativos.AI
  // 34567890: { itemKeys: ["andromeda"], isFront: false },   // Andrómeda.ADS
  // 45678901: { itemKeys: ["analytics"], isFront: false },   // Analytics.KPI
  // 56789012: { itemKeys: ["creativos", "andromeda", "analytics"], isFront: false }, // Combo 3 en 1
}

// ── Fallback por nome do produto (case-insensitive, partial match) ─────────
// Ajustar se os nomes no painel Hotmart forem diferentes.
const NAME_PATTERNS: Array<{ pattern: RegExp; info: HotmartProductInfo }> = [
  {
    // Produto principal — o único que dispara WhatsApp e email de boas-vindas
    pattern: /copy\s*film/i,
    info: { itemKeys: ["front"], isFront: true },
  },
  {
    // Combo dos 3 bumps — ajustar o nome conforme o painel Hotmart
    pattern: /combo|3\s*en\s*1|pack.*3|3.*pack/i,
    info: { itemKeys: ["creativos", "andromeda", "analytics"], isFront: false },
  },
  {
    pattern: /creativos/i,
    info: { itemKeys: ["creativos"], isFront: false },
  },
  {
    pattern: /andr[oó]meda/i,
    info: { itemKeys: ["andromeda"], isFront: false },
  },
  {
    pattern: /analytics/i,
    info: { itemKeys: ["analytics"], isFront: false },
  },
  {
    pattern: /mini\s*vsl|agente.*vsl|vsl.*agente/i,
    info: { itemKeys: ["minivsl"], isFront: false },
  },
  {
    pattern: /revis[aáão]|embudo/i,
    info: { itemKeys: ["revisao"], isFront: false },
  },
  {
    pattern: /ganchos/i,
    info: { itemKeys: ["bonus-ganchos"], isFront: false },
  },
]

/**
 * Resolve o mapping de um produto Hotmart.
 * Retorna null se o produto não for reconhecido — nesse caso o caller
 * usa o comportamento legado (trata como front) e loga um aviso.
 */
export function getHotmartProductInfo(
  productId: number | null,
  productName: string | null,
): HotmartProductInfo | null {
  // 1. ID tem prioridade (imutável, independente de renomear o produto)
  if (productId !== null && HOTMART_PRODUCT_ID_MAP[productId]) {
    return HOTMART_PRODUCT_ID_MAP[productId]
  }

  // 2. Fallback por nome
  if (productName) {
    for (const { pattern, info } of NAME_PATTERNS) {
      if (pattern.test(productName)) return info
    }
  }

  return null
}
