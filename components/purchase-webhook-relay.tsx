"use client"

import { useEffect, useRef } from "react"
import { readCookie } from "@/lib/cookies"

/**
 * Dispara fetch fire-and-forget pro relay interno (/api/webhook/purchase-relay)
 * que enriquece os dados e manda pro webhook externo de Purchase (CAPI).
 *
 * Roda 1x por sessão por PI (dedup via sessionStorage) — evita disparo duplicado
 * se cliente recarregar a página, navegar e voltar, etc.
 *
 * Lê do client:
 *  - fbp, fbc — cookies setados pelo Meta Pixel
 *  - user_agent — navigator.userAgent
 *  - event_source_url — window.location.href (URL completa com query params)
 *
 * Server enriquece com:
 *  - Dados do PI (Stripe): customer info, items, value, currency, UTMs do metadata
 *  - IP do header (cf-connecting-ip)
 *  - Address (ct, st, zp, country) do billing_details
 */
type Props = {
  paymentIntentId: string
  /** Nome do evento Meta CAPI. Default "Purchase". Pode ser "AddPaymentInfo". */
  eventName?: string
}

export function PurchaseWebhookRelay({ paymentIntentId, eventName = "Purchase" }: Props) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    if (typeof window === "undefined") return
    if (!paymentIntentId) return

    // Dedup por PI ID + eventName — evita disparo duplicado em refreshes
    // (mas permite Purchase + AddPaymentInfo separados pro mesmo PI)
    const dedupKey = `webhook_relay_fired_${paymentIntentId}_${eventName}`
    try {
      if (sessionStorage.getItem(dedupKey)) return
      sessionStorage.setItem(dedupKey, "1")
    } catch {
      // sessionStorage pode falhar em modo privado — segue sem dedup
    }

    fired.current = true

    const fbp = readCookie("_fbp")
    const fbc = readCookie("_fbc")
    const userAgent = navigator.userAgent
    const eventSourceUrl = window.location.href

    // subscription_id passado pela URL de redirect do gracias — identifica compra parcelada
    // (Stripe API dahlia removeu PaymentIntent.invoice, não dá mais pra detectar server-side via PI)
    const subscriptionId = new URLSearchParams(window.location.search).get("subscription_id") || null

    // Fire-and-forget — não bloqueia render
    fetch("/api/webhook/purchase-relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_intent_id: paymentIntentId,
        event_name: eventName,
        subscription_id: subscriptionId,
        fbp,
        fbc,
        user_agent: userAgent,
        event_source_url: eventSourceUrl,
      }),
      keepalive: true, // garante envio mesmo se cliente fechar a aba
    }).catch(() => {
      // Silent — falha no relay não pode quebrar UX
    })
  }, [paymentIntentId, eventName])

  return null
}
