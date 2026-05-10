// Utmify API wrapper — envia eventos de venda pro dashboard de tracking.
//
// Documentação: https://api.utmify.com.br/api-credentials/orders
// Token: env var UTMIFY_API_TOKEN (gerado no dashboard Utmify > Integrações > Credenciais de API)
//
// Status enviados (nosso checkout é cartão Stripe, então pulamos waiting_payment):
//  - paid           → venda confirmada (front à vista, 1ª parcela do parcelado, upsell, downsell)
//  - refunded       → reembolso (charge.refunded) ou inadimplência (subscription.unpaid)
//
// platform: "CopyFilms" (hardcoded — identifica origem das vendas no dashboard Utmify)
// commission: gatewayFeeInCents=0 (não calculamos taxa Stripe pra não adicionar latência)
//             userCommission = total (sem dedução de taxa)

const UTMIFY_ENDPOINT = "https://api.utmify.com.br/api-credentials/orders"
const PLATFORM_NAME = "CopyFilms"

type UtmifyStatus = "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback"
type UtmifyPaymentMethod = "credit_card" | "boleto" | "pix" | "paypal" | "free_price"
type UtmifyCurrency = "BRL" | "USD" | "EUR" | "GBP" | "ARS" | "CAD"

type UtmifyCustomer = {
  name: string
  email: string
  phone: string | null
  document: string | null
  country?: string
  ip?: string
}

type UtmifyProduct = {
  id: string
  name: string
  planId: string | null
  planName: string | null
  quantity: number
  priceInCents: number
}

type UtmifyTrackingParameters = {
  src: string | null
  sck: string | null
  utm_source: string | null
  utm_campaign: string | null
  utm_medium: string | null
  utm_content: string | null
  utm_term: string | null
}

type UtmifyCommission = {
  totalPriceInCents: number
  gatewayFeeInCents: number
  userCommissionInCents: number
  currency?: UtmifyCurrency
}

export type UtmifyOrder = {
  orderId: string
  platform: string
  paymentMethod: UtmifyPaymentMethod
  status: UtmifyStatus
  createdAt: string // YYYY-MM-DD HH:MM:SS UTC
  approvedDate: string | null
  refundedAt: string | null
  customer: UtmifyCustomer
  products: UtmifyProduct[]
  trackingParameters: UtmifyTrackingParameters
  commission: UtmifyCommission
  isTest?: boolean
}

/**
 * Formata Date pra `YYYY-MM-DD HH:MM:SS` em UTC (formato exigido pela Utmify).
 */
export function formatUtmifyDate(date: Date | number | string | null | undefined): string | null {
  if (!date) return null
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return null
  return d.toISOString().replace("T", " ").substring(0, 19)
}

/**
 * Mapeia uma moeda Stripe (lowercase) pra enum Utmify (uppercase).
 * Se a moeda não estiver no enum, retorna undefined (Utmify trata como BRL default).
 */
function mapCurrency(stripeCurrency: string): UtmifyCurrency | undefined {
  const upper = stripeCurrency.toUpperCase()
  if (upper === "BRL" || upper === "USD" || upper === "EUR" || upper === "GBP" || upper === "ARS" || upper === "CAD") {
    return upper
  }
  return undefined
}

/**
 * Envia um pedido pra Utmify. Falha NÃO derruba o webhook do Stripe (logado pra investigação).
 */
export async function sendOrderToUtmify(order: UtmifyOrder): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = process.env.UTMIFY_API_TOKEN
  if (!token) {
    console.warn("Utmify: UTMIFY_API_TOKEN não configurado — pedido NÃO enviado")
    return { ok: false, error: "missing token" }
  }

  try {
    const res = await fetch(UTMIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": token,
      },
      body: JSON.stringify(order),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => "")
      console.error(
        `🔴 Utmify ${order.status} FALHOU pra ${order.orderId}: ${res.status} ${errBody.slice(0, 200)}`
      )
      return { ok: false, error: `${res.status}: ${errBody.slice(0, 200)}` }
    }

    console.log(`✅ Utmify ${order.status} OK pra ${order.orderId} (${order.customer.email})`)
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error"
    console.error(`🔴 Utmify fetch error pra ${order.orderId}: ${msg}`)
    return { ok: false, error: msg }
  }
}

// ── Helpers de construção do payload ──────────────────────────────────────────

type SaleItem = { key: string; name: string; price: number; qty: number }

type StripeSaleData = {
  paymentIntentId: string
  amountInCents: number
  currency: string // lowercase
  createdAt: number // unix timestamp (segundos) ou Date
  approvedDate?: number | Date | null
  refundedAt?: number | Date | null
  status: UtmifyStatus
  customer: {
    name: string | null
    email: string | null
    phone: string | null
    country: string | null
    ip?: string | null
  }
  items: SaleItem[]
  utm: Record<string, string | null | undefined> | null
}

/**
 * Constrói o payload Utmify a partir dos dados que já temos no webhook do Stripe.
 *
 * Retorna null se faltar dado obrigatório (email, items vazios, etc) — webhook segue normal.
 */
export function buildUtmifyOrder(data: StripeSaleData): UtmifyOrder | null {
  // Email é obrigatório pela Utmify (validação interna)
  if (!data.customer.email) return null
  if (data.items.length === 0) return null

  const fallbackName = data.customer.email.split("@")[0]
  const customerName = (data.customer.name || "").trim() || fallbackName

  return {
    orderId: data.paymentIntentId,
    platform: PLATFORM_NAME,
    paymentMethod: "credit_card",
    status: data.status,
    createdAt: formatUtmifyDate(typeof data.createdAt === "number" ? data.createdAt * 1000 : data.createdAt) || formatUtmifyDate(new Date())!,
    approvedDate: formatUtmifyDate(typeof data.approvedDate === "number" ? data.approvedDate * 1000 : data.approvedDate),
    refundedAt: formatUtmifyDate(typeof data.refundedAt === "number" ? data.refundedAt * 1000 : data.refundedAt),
    customer: {
      name: customerName,
      email: data.customer.email,
      phone: data.customer.phone || null,
      document: null, // Não coletamos CPF/CNPJ no checkout
      ...(data.customer.country ? { country: data.customer.country } : {}),
      ...(data.customer.ip ? { ip: data.customer.ip } : {}),
    },
    products: data.items.map((item) => ({
      id: item.key,
      name: item.name,
      planId: null,
      planName: null,
      quantity: item.qty,
      priceInCents: Math.round(item.price * 100),
    })),
    trackingParameters: {
      src: data.utm?.src || null,
      sck: data.utm?.sck || null,
      utm_source: data.utm?.utm_source || null,
      utm_campaign: data.utm?.utm_campaign || null,
      utm_medium: data.utm?.utm_medium || null,
      utm_content: data.utm?.utm_content || null,
      utm_term: data.utm?.utm_term || null,
    },
    commission: {
      totalPriceInCents: data.amountInCents,
      gatewayFeeInCents: 0, // Não calculamos taxa Stripe — adicionaria latência (1 call extra à API)
      userCommissionInCents: data.amountInCents,
      ...(mapCurrency(data.currency) ? { currency: mapCurrency(data.currency) } : {}),
    },
  }
}
