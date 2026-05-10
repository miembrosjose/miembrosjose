"use client"

// BuyProductModal — modal pra comprar produto premium dentro da área de membros.
// Tenta 1-click off-session primeiro. Se falhar (cartão expirado, sem cartão,
// cliente Hotmart), abre Stripe Elements inline pra cliente digitar cartão novo.
//
// Reutiliza StripeInlinePayment (mesmo componente usado no upgrade vitalício).

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { StripeInlinePayment, type CurrencyOption } from "./StripeInlinePayment"
import { getProductPricingOptions } from "@/lib/client-pricing"

type ProductKey = "creativos" | "andromeda" | "analytics" | "minivsl" | "revisao"

type Props = {
  productKey: ProductKey
  productName: string
  productImage: string
  productDescription: string
  onClose: () => void
  /** Callback após pagamento bem-sucedido. Modal fecha automaticamente. */
  onSuccess?: () => void
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "fallback"; reason: "card_declined" | "no_customer" | "no_payment_method" }
  | { kind: "error"; message: string }

export function BuyProductModal({
  productKey,
  productName,
  productImage,
  productDescription,
  onClose,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const [pricingOptions, setPricingOptions] = useState<CurrencyOption[] | null>(null)
  const [hadStripeCustomer, setHadStripeCustomer] = useState(false)

  // Body extras estável pro StripeInlinePayment (anti-remount)
  const inlineBodyExtras = useMemo(
    () => ({ product_key: productKey }),
    [productKey],
  )

  async function handleBuy1Click() {
    setStatus({ kind: "loading" })
    try {
      const res = await fetch("/api/buy-product", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_key: productKey }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatus({ kind: "success" })
        setTimeout(() => {
          onSuccess?.()
          window.location.reload()
        }, 1500)
        return
      }

      const errorCode = data.error || "other"
      const isFallbackEligible =
        errorCode === "card_declined" ||
        errorCode === "expired_card" ||
        errorCode === "no_customer" ||
        errorCode === "no_payment_method"

      if (isFallbackEligible) {
        setHadStripeCustomer(errorCode === "card_declined" || errorCode === "expired_card")
        await loadPricingOptions()
        setStatus({ kind: "fallback", reason: errorCode as never })
        return
      }

      setStatus({ kind: "error", message: data.message || "No se pudo procesar el pago." })
    } catch {
      setStatus({ kind: "error", message: "Error de conexión. Intenta nuevamente." })
    }
  }

  function loadPricingOptions() {
    setPricingOptions(getProductPricingOptions(productKey))
  }

  // Carrega pricing automaticamente pra cliente Hotmart (sem stripe_customer_id):
  // tenta 1-click → vai falhar → abre fallback. Tudo em 1 só fluxo automático.
  // Isso evita cliente clicar em "Comprar" e ver loading desnecessário antes de
  // ver o form. Mas comportamento atual é OK — primeiro click tenta 1-click,
  // segundo state já mostra fallback. Mantemos simples por agora.

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "linear-gradient(135deg, #12121a 0%, #0f0f17 50%, #12121a 100%)",
          border: "1px solid #c9a961",
          padding: "2rem 1.75rem",
          color: "#f5f5f7",
          fontFamily: "var(--font-body)",
          position: "relative",
          boxShadow: "0 30px 60px -30px rgba(201,169,97,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Cantos decorativos dourados */}
        <span style={{ position: "absolute", left: 0, top: 0, width: 8, height: 8, borderLeft: "2px solid #c9a961", borderTop: "2px solid #c9a961" }} />
        <span style={{ position: "absolute", right: 0, top: 0, width: 8, height: 8, borderRight: "2px solid #c9a961", borderTop: "2px solid #c9a961" }} />
        <span style={{ position: "absolute", left: 0, bottom: 0, width: 8, height: 8, borderLeft: "2px solid #c9a961", borderBottom: "2px solid #c9a961" }} />
        <span style={{ position: "absolute", right: 0, bottom: 0, width: 8, height: 8, borderRight: "2px solid #c9a961", borderBottom: "2px solid #c9a961" }} />

        {/* Botão X fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            color: "#a0a0b0",
            cursor: "pointer",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#f5f5f7" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#a0a0b0" }}
        >
          <X size={18} />
        </button>

        {/* Header — produto + imagem */}
        <p
          style={{
            fontSize: "0.65rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "#c9a961",
            margin: 0,
          }}
        >
          Comprar producto premium
        </p>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "1rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={productImage}
            alt={productName}
            style={{
              width: 80,
              height: 80,
              objectFit: "cover",
              border: "1px solid #2a2a36",
            }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              {productName}
            </h2>
            <p style={{ fontSize: "0.75rem", color: "#a0a0b0", margin: "0.4rem 0 0", lineHeight: 1.4 }}>
              {productDescription}
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: "#2a2a36", margin: "1.5rem 0" }} />

        {/* Estado SUCCESS */}
        {status.kind === "success" && (
          <div
            style={{
              padding: "1rem",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.4)",
              color: "#4ade80",
              fontSize: "0.85rem",
              textAlign: "center",
              fontFamily: "var(--font-mono)",
            }}
          >
            ✓ Compra confirmada. Acceso liberado.
          </div>
        )}

        {/* Estado ERROR */}
        {status.kind === "error" && (
          <div
            style={{
              padding: "0.85rem",
              background: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.4)",
              color: "#fca5a5",
              fontSize: "0.8rem",
              lineHeight: 1.4,
              marginBottom: "1rem",
            }}
          >
            {status.message}
          </div>
        )}

        {/* Estado IDLE/LOADING — botão 1-click */}
        {(status.kind === "idle" || status.kind === "loading" || status.kind === "error") && (
          <button
            type="button"
            onClick={handleBuy1Click}
            disabled={status.kind === "loading"}
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
              cursor: status.kind === "loading" ? "wait" : "pointer",
              opacity: status.kind === "loading" ? 0.6 : 1,
              transition: "all 0.2s",
            }}
          >
            {status.kind === "loading" ? "Procesando..." : "Comprar 1-click"}
          </button>
        )}

        {/* Estado FALLBACK — Stripe Elements inline */}
        {status.kind === "fallback" && pricingOptions && pricingOptions.length > 0 && (
          <div style={{ marginTop: "0.5rem" }}>
            <StripeInlinePayment
              currencyOptions={pricingOptions}
              createPiEndpoint="/api/buy-product/create-pi"
              bodyExtras={inlineBodyExtras}
              headline={
                hadStripeCustomer
                  ? "Tu tarjeta anterior fue rechazada. Ingresa una nueva:"
                  : "Ingresa tu tarjeta para esta compra:"
              }
              onSuccess={() => {
                setStatus({ kind: "success" })
                setTimeout(() => {
                  onSuccess?.()
                  window.location.reload()
                }, 1500)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
