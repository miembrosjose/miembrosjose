"use client"

// StripeInlinePayment — Componente reutilizável de pagamento DEFERRED REAL.
// Espelha o padrão do /checkout principal (stripe-payment-form-deferred.tsx):
//
//  1. Mount Elements com { mode: "payment", amount, currency } SEM clientSecret
//  2. User preenche cartão na PaymentElement
//  3. Click em Pagar → elements.submit() valida → fetch cria PI deferred no
//     servidor → recebe clientSecret → stripe.confirmPayment({ clientSecret,
//     elements, redirect: "if_required" })
//
// CRÍTICO: PI **NÃO** é criado no mount/change de moeda. Só no clique de Pagar.
// Isso evita "Incompletos" no Stripe Dashboard quando user abre e fecha sem pagar.
//
// Suporta seletor de moeda USD/local pra LATAM (cliente argentino pode escolher
// pagar em ARS ou USD dependendo do cartão dele). Quando muda moeda, Elements
// re-monta automaticamente via useMemo (amount/currency primitivos no deps).

import { useMemo, useRef, useState } from "react"
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

// Cache global do Stripe.js — evita re-load entre montagens
let cachedStripe: Promise<StripeJs | null> | null = null
function getStripeJs(): Promise<StripeJs | null> {
  if (cachedStripe) return cachedStripe
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não configurada")
    return Promise.resolve(null)
  }
  cachedStripe = loadStripe(key)
  return cachedStripe
}

// Currencies que NÃO usam centavos (zero-decimal currencies do Stripe)
const ZERO_DECIMAL_CURRENCIES = new Set(["jpy", "krw", "vnd", "clp", "isk", "huf"])

function toMinorUnits(amount: number, currency: string): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase())) return Math.round(amount)
  return Math.round(amount * 100)
}

export type CurrencyOption = {
  currency: string  // ISO lowercase: "usd", "brl", "ars", etc
  amount: number    // valor na unidade (ex: 40 USD, 218.40 BRL)
  label: string     // "Pagar en USD" / "Pagar en BRL"
  formatted: string // "US$ 40,00" / "R$ 218,40"
}

type Props = {
  /** Lista de moedas/valores possíveis. Se length=1 não mostra seletor. */
  currencyOptions: CurrencyOption[]
  /** Moeda inicialmente selecionada (default: primeira da lista) */
  defaultCurrency?: string
  /** Endpoint que cria PI deferred. Recebe POST { currency, amount } e retorna { client_secret } */
  createPiEndpoint: string
  /** Body extra pra enviar ao endpoint (ex: { product_key: "andromeda" }) */
  bodyExtras?: Record<string, unknown>
  /** Mensagem opcional acima do form (ex: erro friendly) */
  headline?: string
  /** Email do user — pré-preenche no PaymentElement e ATIVA detecção do Link.
   * Sem email passado, Link não aparece como opção (Stripe não consegue
   * fazer lookup da Link account). */
  customerEmail?: string
  /** Chamado após pagamento confirmado. Componente NÃO faz reload — caller decide. */
  onSuccess: (paymentIntentId: string) => void
}

export function StripeInlinePayment(props: Props) {
  const initialCurrency =
    props.defaultCurrency || props.currencyOptions[0]?.currency || "usd"
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency)
  const stripePromiseRef = useRef(getStripeJs())

  const selectedOption = props.currencyOptions.find(
    (o) => o.currency === selectedCurrency,
  ) || props.currencyOptions[0]

  // Stripe Elements options — DEFERRED REAL, sem clientSecret no mount.
  // Quando muda moeda, useMemo re-cria options → Elements re-monta com novos amount/currency.
  //
  // paymentMethodConfiguration removido — usar automatic. Stripe detecta:
  //  - Card (sempre)
  //  - Apple Pay (Safari + domínio verificado no Dashboard)
  //  - Google Pay (Chrome + Stripe.js detecta wallet)
  //  - Link (Stripe one-click)
  // Sem `paymentMethodTypes: ["card"]` que bloqueava todas as wallets.
  const elementsOptions = useMemo(() => {
    if (!selectedOption) return null
    return {
      mode: "payment" as const,
      amount: toMinorUnits(selectedOption.amount, selectedOption.currency),
      currency: selectedOption.currency,
      setupFutureUsage: "off_session" as const,
      // Sem paymentMethodTypes — automatic_payment_methods no PI server cobre todas
      locale: "es" as const,
      appearance: {
        theme: "night" as const,
        variables: {
          colorPrimary: "#c9a961",
          colorBackground: "#0f0f17",
          colorText: "#f5f5f7",
          colorDanger: "#ef4444",
          fontFamily: "system-ui, -apple-system, sans-serif",
          borderRadius: "0px",
          spacingUnit: "4px",
        },
        rules: {
          ".Input": {
            backgroundColor: "#12121a",
            border: "1px solid #2a2a36",
            color: "#f5f5f7",
          },
          ".Input:focus": {
            border: "1px solid #c9a961",
            boxShadow: "0 0 0 1px rgba(201, 169, 97, 0.4)",
          },
          ".Label": {
            color: "#a0a0b0",
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
          },
          ".Tab": {
            backgroundColor: "#12121a",
            border: "1px solid #2a2a36",
            color: "#a0a0b0",
          },
          ".Tab--selected": {
            backgroundColor: "rgba(201, 169, 97, 0.12)",
            border: "1px solid #c9a961",
            color: "#fde68a",
          },
        },
      },
    }
  }, [selectedOption])

  if (!selectedOption || !elementsOptions) {
    return null
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {props.headline && (
        <p style={{ fontSize: "0.85rem", color: "#a0a0b0", margin: 0 }}>{props.headline}</p>
      )}

      {/* Seletor de moeda (só renderiza se >1 opção) */}
      {props.currencyOptions.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {props.currencyOptions.map((opt) => {
            const isActive = opt.currency === selectedCurrency
            return (
              <button
                key={opt.currency}
                type="button"
                onClick={() => setSelectedCurrency(opt.currency)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  border: `1px solid ${isActive ? "#c9a961" : "#2a2a36"}`,
                  background: isActive ? "rgba(201,169,97,0.12)" : "rgba(26,26,36,0.4)",
                  color: isActive ? "#fde68a" : "#a0a0b0",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.7rem" }}>
                    {isActive ? "●" : "○"}
                  </span>
                  <span>{opt.label}</span>
                </div>
                <div style={{
                  marginTop: "0.4rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: isActive ? "#f5f5f7" : "#a0a0b0",
                  letterSpacing: 0,
                  textTransform: "none",
                }}>
                  {opt.formatted}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Elements monta com mode:payment + amount + currency. PI só é criado no submit. */}
      <Elements stripe={stripePromiseRef.current} options={elementsOptions}>
        <CheckoutForm
          amount={selectedOption.amount}
          currency={selectedOption.currency}
          formattedAmount={selectedOption.formatted}
          createPiEndpoint={props.createPiEndpoint}
          bodyExtras={props.bodyExtras}
          customerEmail={props.customerEmail}
          onSuccess={props.onSuccess}
        />
      </Elements>
    </div>
  )
}

// Form interno — submit cria PI deferred no servidor e confirma com Stripe.
function CheckoutForm({
  amount,
  currency,
  formattedAmount,
  createPiEndpoint,
  bodyExtras,
  customerEmail,
  onSuccess,
}: {
  amount: number
  currency: string
  formattedAmount: string
  createPiEndpoint: string
  bodyExtras?: Record<string, unknown>
  customerEmail?: string
  onSuccess: (piId: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || submitting) return
    setSubmitting(true)
    setErrorMsg(null)

    // 1) Valida campos do PaymentElement (cartão preenchido, válido, etc).
    // PaymentElement já mostra erros inline em cada campo — não duplicamos
    // mensagem global. Só interrompemos o submit silenciosamente.
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setSubmitting(false)
      return
    }

    // 2) Cria PaymentIntent deferred no servidor (com selection final)
    let clientSecret: string
    try {
      const res = await fetch(createPiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currency,
          amount,
          ...(bodyExtras || {}),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.client_secret) {
        setErrorMsg(data.message || data.error || "No se pudo iniciar el pago.")
        setSubmitting(false)
        return
      }
      clientSecret = data.client_secret
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error de conexión.")
      setSubmitting(false)
      return
    }

    // 3) Confirma o pagamento — Stripe processa e cobra cartão
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      redirect: "if_required",
    })

    if (confirmError) {
      setErrorMsg(confirmError.message || "Error al procesar el pago.")
      setSubmitting(false)
      return
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id)
      return
    }

    setErrorMsg(`Estado del pago: ${paymentIntent?.status || "desconocido"}.`)
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <PaymentElement
        options={{
          layout: "tabs",
          // Email no defaultValues ativa detecção do Link automaticamente.
          // Stripe faz lookup do email → se já é Link account, mostra botão
          // "Pagar com Link" no topo + cartões salvos.
          defaultValues: customerEmail
            ? { billingDetails: { email: customerEmail } }
            : undefined,
          fields: { billingDetails: { address: { country: "auto" } } },
        }}
      />

      {errorMsg && (
        <div style={{
          padding: "0.65rem 0.85rem",
          background: "rgba(220,38,38,0.1)",
          border: "1px solid rgba(220,38,38,0.4)",
          color: "#fca5a5",
          fontSize: "0.75rem",
          lineHeight: 1.4,
        }}>
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        style={{
          width: "100%",
          padding: "0.95rem 1.25rem",
          border: "1px solid #c9a961",
          background: "#c9a961",
          color: "#0a0a0f",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.6 : 1,
          transition: "all 0.2s",
        }}
      >
        {submitting ? "Procesando..." : `Pagar ${formattedAmount}`}
      </button>
    </form>
  )
}
