"use client"

// Desbloqueo 1-click de un producto de DB, EMBEBIDO (sin modal).
// Mismo sistema que la meditación premium: intenta cobro con la tarjeta guardada;
// si no hay tarjeta reutilizable o requiere 3DS, muestra el Payment Element aquí
// mismo. Un solo botón "DESBLOQUEAR". Al confirmar, avisa al padre (onSuccess).

import { useCallback, useState } from "react"
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js"
import { StripeInlinePayment } from "./StripeInlinePayment"

let cachedStripe: Promise<StripeJs | null> | null = null
function getStripeJs(): Promise<StripeJs | null> {
  if (cachedStripe) return cachedStripe
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) return Promise.resolve(null)
  cachedStripe = loadStripe(key)
  return cachedStripe
}

type Phase = "idle" | "processing" | "needs_card" | "error"

export function ProductUnlockInline({
  productId, priceCents, currency, priceLabel, buttonLabel, buttonStyle, onSuccess,
}: {
  productId: string
  priceCents: number
  currency: string
  priceLabel: string
  buttonLabel: string
  buttonStyle: React.CSSProperties
  onSuccess: () => void
}) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const goUnlocked = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app:product-access-changed"))
    }
    onSuccess()
  }, [onSuccess])

  const confirmEntitlement = useCallback(async (paymentIntentId: string) => {
    try {
      const r = await fetch(`/api/products/${encodeURIComponent(productId)}/confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      })
      const d = await r.json()
      if (d.status === "unlocked") { goUnlocked(); return }
    } catch { /* cae a error */ }
    setPhase("error"); setErrorMsg("No pudimos confirmar el pago. Inténtalo nuevamente.")
  }, [productId, goUnlocked])

  const handleUnlock = useCallback(async () => {
    setErrorMsg(null); setPhase("processing")
    try {
      const r = await fetch(`/api/products/${encodeURIComponent(productId)}/unlock`, {
        method: "POST", credentials: "include",
      })
      const d = await r.json()

      if (d.status === "unlocked" || d.status === "already_owned") { goUnlocked(); return }

      if (d.status === "requires_action" && d.client_secret) {
        const stripe = await getStripeJs()
        if (!stripe) { setPhase("error"); setErrorMsg("No pudimos iniciar la confirmación de pago."); return }
        const { error, paymentIntent } = await stripe.handleNextAction({ clientSecret: d.client_secret })
        if (error || !paymentIntent || paymentIntent.status !== "succeeded") {
          setPhase("error"); setErrorMsg("No pudimos completar el pago. Inténtalo nuevamente."); return
        }
        await confirmEntitlement(paymentIntent.id)
        return
      }

      if (d.status === "needs_payment_method") { setPhase("needs_card"); return }

      setPhase("error"); setErrorMsg("No pudimos completar el pago. Inténtalo nuevamente.")
    } catch {
      setPhase("error"); setErrorMsg("No pudimos completar el pago. Inténtalo nuevamente.")
    }
  }, [productId, goUnlocked, confirmEntitlement])

  if (phase === "needs_card") {
    return (
      <div style={{ marginTop: "0.4rem" }}>
        <StripeInlinePayment
          currencyOptions={[{ currency, amount: priceCents / 100, label: "Pagar", formatted: priceLabel }]}
          createPiEndpoint={`/api/products/${encodeURIComponent(productId)}/create-pi`}
          headline="Ingresa tu tarjeta para desbloquear:"
          onSuccess={(piId) => confirmEntitlement(piId)}
        />
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleUnlock}
        disabled={phase === "processing"}
        style={{ ...buttonStyle, cursor: phase === "processing" ? "wait" : "pointer", opacity: phase === "processing" ? 0.65 : 1 }}
      >
        {phase === "processing" ? "Procesando…" : buttonLabel}
      </button>
      {errorMsg && (
        <p style={{ margin: "0.7rem 0 0", fontSize: "0.78rem", color: "#fca5a5", lineHeight: 1.4 }}>{errorMsg}</p>
      )}
      <p style={{ margin: "0.7rem 0 0", fontSize: "0.66rem", color: "#6a6a85", fontFamily: "var(--font-mono,monospace)", letterSpacing: "0.04em" }}>
        Compra 1-clic con tu tarjeta guardada · Pago seguro con Stripe
      </p>
    </div>
  )
}
