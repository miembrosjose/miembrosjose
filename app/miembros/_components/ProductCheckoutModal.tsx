"use client"

// Modal de compra 1-click de un producto de la Tienda.
// Mismo flujo que las meditaciones premium: intenta cobro on_session con la
// tarjeta guardada; si no hay tarjeta reutilizable o requiere 3DS, cae al
// Payment Element inline. Al desbloquear, avisa al padre (onSuccess).

import { useCallback, useEffect, useState } from "react"
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js"
import { Lock, Sparkles, Check, X } from "lucide-react"
import { StripeInlinePayment } from "./StripeInlinePayment"
import type { DbProduct } from "../_lib/use-products"

let cachedStripe: Promise<StripeJs | null> | null = null
function getStripeJs(): Promise<StripeJs | null> {
  if (cachedStripe) return cachedStripe
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) return Promise.resolve(null)
  cachedStripe = loadStripe(key)
  return cachedStripe
}

function money(cents: number, currency = "usd"): string {
  const sym = currency.toLowerCase() === "usd" ? "US$" : currency.toUpperCase() + " "
  return `${sym} ${(cents / 100).toFixed(2)}`
}

type Phase = "loading" | "locked" | "processing" | "needs_card" | "unlocked" | "error"

type Props = {
  product: DbProduct | null
  onClose: () => void
  /** Se llama cuando el acceso queda desbloqueado (para refrescar y abrir el producto). */
  onSuccess: (product: DbProduct) => void
}

export function ProductCheckoutModal({ product, onClose, onSuccess }: Props) {
  const [phase, setPhase] = useState<Phase>("loading")
  const [priceCents, setPriceCents] = useState(0)
  const [currency, setCurrency] = useState("usd")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const id = product?.id ?? null

  // Trava body scroll
  useEffect(() => {
    if (!product) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [product])

  // Estado inicial (precio real + si ya es propiedad).
  useEffect(() => {
    if (!id) return
    let cancelled = false
    setPhase("loading")
    setErrorMsg(null)
    fetch(`/api/products/${encodeURIComponent(id)}/state`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) { if (!cancelled) setPhase("locked"); return }
        setPriceCents(d.price_cents ?? 0)
        setCurrency(d.currency ?? "usd")
        setPhase(d.owned ? "unlocked" : "locked")
      })
      .catch(() => { if (!cancelled) setPhase("locked") })
    return () => { cancelled = true }
  }, [id])

  const goUnlocked = useCallback(() => {
    setPhase("unlocked")
    if (product) {
      // Avisa a la app que el acceso cambió (refresca cards + navbar).
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:product-access-changed"))
      }
      setTimeout(() => onSuccess(product), 900)
    }
  }, [product, onSuccess])

  const confirmEntitlement = useCallback(async (paymentIntentId: string) => {
    if (!id) return
    try {
      const r = await fetch(`/api/products/${encodeURIComponent(id)}/confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      })
      const d = await r.json()
      if (d.status === "unlocked") { goUnlocked(); return }
    } catch { /* cae a error */ }
    setPhase("error"); setErrorMsg("No pudimos confirmar el pago. Inténtalo nuevamente.")
  }, [id, goUnlocked])

  const handleUnlock = useCallback(async () => {
    if (!id) return
    setErrorMsg(null); setPhase("processing")
    try {
      const r = await fetch(`/api/products/${encodeURIComponent(id)}/unlock`, {
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
  }, [id, goUnlocked, confirmEntitlement])

  if (!product) return null

  const priceLabel = money(priceCents, currency)

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center bg-[#050510]/90 backdrop-blur-sm p-4"
      role="dialog"
      aria-label={`Comprar ${product.name}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-[min(440px,94vw)] overflow-hidden border bg-[#0f0c07]"
        style={{ borderRadius: 18, borderColor: "rgba(217,184,102,0.28)", boxShadow: "0 30px 80px -12px rgba(0,0,0,0.85), 0 0 40px -10px rgba(217,184,102,0.25)" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-[#050510]/70 p-2 text-[#e6cf95] backdrop-blur transition-colors hover:bg-[#251f30]"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {/* Hero */}
        <div className="relative h-40 overflow-hidden" style={{ background: product.gradient }}>
          {product.thumb_url || product.media_url ? (
            /\.(mp4|webm|mov)(\?|$)/i.test(product.thumb_url || product.media_url || "") ? (
              <video src={(product.thumb_url || product.media_url)!} autoPlay muted loop playsInline
                     className="absolute inset-0 h-full w-full object-cover opacity-70" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(product.thumb_url || product.media_url)!} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
            )
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-70">{product.emoji}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c07] via-[#0f0c07]/50 to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#d9b866]/50 bg-[#050510]/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e6cf95] [font-family:var(--font-mono)]">
            <Lock size={11} /> Producto premium
          </span>
        </div>

        <div className="p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a86b] [font-family:var(--font-mono)]">Tienda · 144000</p>
          <h3 className="mt-1 text-2xl font-bold text-[#F3F6FA] [font-family:var(--font-cinzel)]">{product.name}</h3>
          {product.description && (
            <p className="mt-2 text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">{product.description}</p>
          )}

          {phase === "unlocked" ? (
            <div className="mt-6 flex flex-col items-center justify-center gap-2 py-6 text-[#d9b866] [font-family:var(--font-mono)]">
              <Check size={30} />
              <span className="text-xs uppercase tracking-[0.18em]">Acceso desbloqueado</span>
            </div>
          ) : phase === "needs_card" ? (
            <div className="mt-5">
              <p className="mb-3 flex items-center gap-2 text-xs text-[#a8a8c0] [font-family:var(--font-mono)]">
                <Sparkles size={14} className="text-[#d9b866]" /> Confirma tu tarjeta para desbloquear.
              </p>
              <StripeInlinePayment
                currencyOptions={[{ currency, amount: priceCents / 100, label: "Pagar", formatted: priceLabel }]}
                createPiEndpoint={`/api/products/${encodeURIComponent(id!)}/create-pi`}
                onSuccess={(piId) => { confirmEntitlement(piId) }}
              />
            </div>
          ) : (
            <>
              <div className="mt-5 flex items-baseline gap-3 border-t border-[#d9b866]/15 pt-4">
                <span className="text-3xl font-bold text-[#e6cf95] [font-family:var(--font-cinzel)]">{priceLabel}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8a8c0] [font-family:var(--font-mono)]">Pago único</span>
              </div>
              {errorMsg && (
                <p className="mt-3 text-xs text-[#fca5a5] [font-family:var(--font-geist-sans)]">{errorMsg}</p>
              )}
              <button
                type="button"
                onClick={handleUnlock}
                disabled={phase === "processing" || phase === "loading"}
                className="mt-5 w-full py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#050510] transition-all disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-mono)]"
                style={{ borderRadius: 10, background: "linear-gradient(135deg, #e6cf95 0%, #d9b866 60%, #c9a86b 100%)", boxShadow: "0 10px 26px -8px rgba(217,184,102,0.55)" }}
              >
                {phase === "processing" ? "Procesando…" : phase === "loading" ? "…" : `Comprar · ${priceLabel}`}
              </button>
              <p className="mt-3 text-center text-[10px] text-[#6a6a85] [font-family:var(--font-mono)]">
                Compra 1-click con tu tarjeta guardada · Pago seguro con Stripe
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
