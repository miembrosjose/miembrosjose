// Cliente Stripe server-side compatível com edge runtime (Cloudflare Pages).
// Usa fetch HTTP client em vez do default Node.js https.

import Stripe from "stripe"

let cached: Stripe | null = null

export function getStripe(): Stripe {
  if (cached) return cached

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurado")

  cached = new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  })

  return cached
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET não configurado")
  return secret
}
