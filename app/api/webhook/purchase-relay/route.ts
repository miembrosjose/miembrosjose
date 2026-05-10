// Relay server-side pro webhook externo de Purchase (CAPI / Conversions API).
//
// Cliente envia fbp/fbc/user_agent/event_source_url (dados que só existem no browser);
// server enriquece com dados do PI da Stripe + IP do header + UTMs do metadata
// e faz POST pro webhook externo.
//
// Vantagens vs chamar webhook direto do client:
//  - URL do webhook não exposta no client (segurança)
//  - IP confiável (header CF-Connecting-IP)
//  - Dados de Stripe (value, currency, customer info) buscados server-side
//  - Funciona mesmo com ad blocker bloqueando POST direto pra webhook externo


import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe/server"
import type Stripe from "stripe"

const WEBHOOK_URL = "https://SEU_TRACKING_WEBHOOK.com/webhook/purchaseinsert"

type RequestBody = {
  payment_intent_id: string
  fbp?: string | null
  fbc?: string | null
  user_agent?: string | null
  event_source_url?: string | null
  /** Nome do evento Meta CAPI: "Purchase" (default) ou "AddPaymentInfo" */
  event_name?: string | null
  /** ID da subscription (parcelado) — passado pela URL do gracias. Stripe API dahlia removeu
   *  PaymentIntent.invoice, então não dá mais pra detectar subscription server-side via PI. */
  subscription_id?: string | null
}

function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  )
}

function nameForKey(key: string): string {
  if (key === "front") return "[BRAND_NAME]"
  if (key === "creativos") return "Producto 1"
  if (key === "andromeda") return "Producto 2"
  if (key === "analytics") return "Producto 3"
  if (key === "revisao") return "Servicio Premium"
  if (key === "minivsl") return "Upsell 1"
  return key
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.payment_intent_id || !/^pi_[A-Za-z0-9]+$/.test(body.payment_intent_id)) {
    return NextResponse.json({ error: "payment_intent_id inválido" }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const pi = await stripe.paymentIntents.retrieve(body.payment_intent_id, {
      expand: ["customer", "latest_charge"],
    })

    const charge =
      typeof pi.latest_charge === "object" && pi.latest_charge !== null
        ? (pi.latest_charge as Stripe.Charge)
        : null
    const billing = charge?.billing_details
    const customerObj =
      typeof pi.customer === "object" &&
      pi.customer !== null &&
      !("deleted" in pi.customer && pi.customer.deleted)
        ? (pi.customer as Stripe.Customer)
        : null

    const fullName = billing?.name || customerObj?.name || pi.metadata?.customer_name || ""
    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

    const email =
      billing?.email || customerObj?.email || pi.receipt_email || pi.metadata?.customer_email || ""
    const phone = billing?.phone || customerObj?.phone || pi.metadata?.customer_phone || ""

    // Geolocalização — prioridade:
    //   1. billing_details.address da Stripe (raro pq fields.address="auto" no Element)
    //   2. customer.address (compra anterior)
    //   3. request.cf (objeto rico do Cloudflare Workers — TUDO disponível em qualquer plano)
    //   4. Headers cf-* (fallback — depende do plano pago do CF)
    const address = billing?.address || customerObj?.address || null

    // Cloudflare expoe propriedades de geo no request.cf quando deployado em Pages/Workers.
    // Funciona em qualquer plano (free incluido) — nao depende de upgrade pra ter city/state/zip.
    type CfData = {
      city?: string
      region?: string
      regionCode?: string
      country?: string
      postalCode?: string
    }
    const cf = (req as unknown as { cf?: CfData }).cf

    const city =
      address?.city ||
      cf?.city ||
      req.headers.get("cf-ipcity") ||
      ""
    const state =
      address?.state ||
      cf?.region ||
      cf?.regionCode ||
      req.headers.get("cf-region") ||
      req.headers.get("cf-region-code") ||
      ""
    const zip =
      address?.postal_code ||
      cf?.postalCode ||
      req.headers.get("cf-postal-code") ||
      ""
    const country =
      address?.country ||
      cf?.country ||
      req.headers.get("cf-ipcountry") ||
      ""

    const customerId = customerObj?.id || (typeof pi.customer === "string" ? pi.customer : "")
    const externalId = customerId || (email ? email.toLowerCase().trim() : "")

    // Detecta tipo de venda pra montar items corretamente:
    //   - front / front_installment → metadata.items é JSON ([{key, price}, ...])
    //   - upsell / downsell → metadata.upsells é CSV ("revisao,minivsl")
    const saleType = pi.metadata?.sale_type || "front"
    let totalUsdCents = parseInt(pi.metadata?.total_usd_cents || "0", 10)
    type MetaItem = { key: string; price?: number; parcelaValueUsd?: number; parcelas?: number }
    let parsedItems: MetaItem[] = []
    let utmMeta: Stripe.Metadata = pi.metadata || {}

    // Stripe API dahlia removeu PaymentIntent.invoice — subscription_id vem direto na request
    const validSubId = body.subscription_id && /^sub_[A-Za-z0-9]+$/.test(body.subscription_id)
      ? body.subscription_id : null
    if (validSubId) {
      // Front parcelado — busca dados da subscription diretamente.
      // CRÍTICO: usa first_invoice_usd_cents (valor REAL pago = 1 parcela + bumps)
      // em vez de total_usd_cents (compromisso total). Meta deve ver só o que
      // o cliente pagou AGORA, não o total das 3 parcelas.
      try {
        const subscription = await stripe.subscriptions.retrieve(validSubId)
        const firstInvoiceCents = parseInt(subscription.metadata?.first_invoice_usd_cents || "0", 10)
        const subTotalCents = parseInt(subscription.metadata?.total_usd_cents || "0", 10)
        // Prioridade: first_invoice (parcela paga) > total (fallback p/ subscriptions antigas)
        totalUsdCents = firstInvoiceCents || subTotalCents || totalUsdCents
        utmMeta = { ...subscription.metadata, ...utmMeta }
        try {
          parsedItems = JSON.parse(subscription.metadata?.items || "[]") as MetaItem[]
        } catch {
          parsedItems = []
        }
      } catch {
        // ignora — usa dados do PI mesmo
      }
    } else if (saleType === "upsell" || saleType === "downsell") {
      // Upsell/downsell — items vêm de metadata.upsells (CSV de keys)
      const upsellKeys = (pi.metadata?.upsells || "").split(",").filter(Boolean)
      // Sufixo __downsell é só interno — limpa pra ter o key real do produto
      const cleanKeys = upsellKeys.map((k) => k.replace(/__downsell$/, ""))
      parsedItems = cleanKeys.map((key) => ({ key }))
    }

    if (parsedItems.length === 0) {
      try {
        parsedItems = JSON.parse(pi.metadata?.items || "[]") as MetaItem[]
      } catch {
        parsedItems = []
      }
    }

    // Valor em USD (sempre USD pra consistência com Utmify e Meta CAPI)
    const value = totalUsdCents > 0 ? totalUsdCents / 100 : pi.amount / 100
    const currency = totalUsdCents > 0 ? "USD" : pi.currency.toUpperCase()

    // Items → content_name (concatenação de nomes) + num_items
    const itemNames = parsedItems.map((p) => nameForKey(p.key))
    const contentName = itemNames.length > 0 ? itemNames.join(" + ") : "[BRAND_NAME]"
    const numItems = parsedItems.length || 1

    // event_name: aceita override do client. Default "Purchase".
    // Valores esperados: "Purchase" (após pagar) ou "AddPaymentInfo" (ao começar a digitar cartão).
    const eventName = body.event_name || "Purchase"
    // event_id: pra Purchase usa pi.id (cada compra única); pra AddPaymentInfo
    // adiciona sufixo pra não colidir com Purchase do mesmo PI no webhook.
    const eventId = eventName === "Purchase" ? pi.id : `${pi.id}_${eventName.toLowerCase()}`

    // Data/hora UTC — formato compatível com Meta CAPI
    const now = new Date()
    const eventDate = now.toISOString().slice(0, 10) // YYYY-MM-DD
    const eventTime = now.toISOString().slice(11, 19) // HH:MM:SS

    const payload = {
      // User data
      fn: firstName.toLowerCase(),
      ln: lastName.toLowerCase(),
      em: email.toLowerCase().trim(),
      ph: phone.replace(/\D/g, ""),
      ct: city.toLowerCase(),
      st: state.toLowerCase(),
      zp: zip,
      country: country.toUpperCase(),
      external_id: externalId,
      // Event meta
      event_name: eventName,
      event_id: eventId,
      event_source_url: body.event_source_url || `https://SEU_DOMINIO.com/checkout/gracias?payment_intent=${pi.id}`,
      event_date: eventDate,
      event_time: eventTime,
      action_source: "website",
      // Transaction
      currency,
      value,
      content_name: contentName,
      content_type: "product",
      num_items: numItems,
      payment_method: "credit_card",
      sale_type: saleType, // custom field pra filtrar no destino: front, front_installment, upsell, downsell
      // Tracking
      client_ip_address: getClientIp(req) || "",
      client_user_agent: body.user_agent || req.headers.get("user-agent") || "",
      fbp: body.fbp || "",
      fbc: body.fbc || "",
      // UTMs (5 padrão)
      utm_source: utmMeta.utm_source || "",
      utm_medium: utmMeta.utm_medium || "",
      utm_campaign: utmMeta.utm_campaign || "",
      utm_content: utmMeta.utm_content || "",
      utm_term: utmMeta.utm_term || "",
    }

    // Fire-and-forget — webhook externo não pode bloquear render do cliente.
    // Se falhar, loga no console (visível no Cloudflare Pages logs).
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => "")
      console.error(`🔴 Purchase relay falhou ${res.status}: ${errBody.slice(0, 200)}`)
      return NextResponse.json({ ok: false, error: `webhook ${res.status}` }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Relay error"
    console.error(`🔴 Purchase relay error: ${msg}`)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
