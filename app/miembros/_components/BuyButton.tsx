"use client"

// BuyButton — componente embedded de compra de produto premium.
// SEM wrapper de modal. Usado DENTRO de outros componentes (ProductCheckoutModal,
// ProductSalespageModal) onde o popup com copy do produto já existe.
//
// Comportamento:
//  1. Renderiza botão "Comprar 1-click"
//  2. Click → tenta /api/buy-product (off-session com cartão salvo)
//  3. Sucesso → callback onSuccess + reload
//  4. Falha (cartão expirado/sem cartão/Hotmart) → mostra StripeInlinePayment inline
//
// Pra ter o modal completo com hero + descrição, use BuyProductModal.

import { useEffect, useMemo, useState } from "react"
import { StripeInlinePayment, type CurrencyOption } from "./StripeInlinePayment"
import { getProductPricingOptions } from "@/lib/client-pricing"

type ProductKey = "creativos" | "andromeda" | "analytics" | "minivsl" | "revisao"

type Props = {
  productKey: ProductKey
  /** Texto do botão. Default: "Comprar ahora" */
  buttonLabel?: string
  /** Estilo do botão. Default: dourado destaque */
  buttonStyle?: React.CSSProperties
  /** Container className extra (ex: pra width/margin) */
  className?: string
  /** Callback após sucesso. Componente faz reload se onSuccess não fornecido. */
  onSuccess?: () => void
  /** Callback quando 1-click falha e precisa abrir checkout completo.
   * Quando fornecido, BuyButton NÃO mostra Stripe Elements inline —
   * delega pro pai (ex: ProductSalespageModal troca iframe pra checkout). */
  onFallbackNeeded?: () => void
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "fallback"; reason: "card_declined" | "no_customer" | "no_payment_method" | "other" }
  | { kind: "error"; message: string }

const DEFAULT_BUTTON_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "0.95rem 1.5rem",
  border: "1px solid #c9a961",
  background: "#c9a961",
  color: "#0a0a0f",
  fontFamily: "var(--font-mono)",
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "all 0.2s",
}

export function BuyButton({
  productKey,
  buttonLabel = "Comprar ahora",
  buttonStyle,
  className = "",
  onSuccess,
  onFallbackNeeded,
}: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const [pricingOptions, setPricingOptions] = useState<CurrencyOption[] | null>(null)
  const [hadStripeCustomer, setHadStripeCustomer] = useState(false)

  const inlineBodyExtras = useMemo(
    () => ({ product_key: productKey }),
    [productKey],
  )

  function handleSuccess() {
    setStatus({ kind: "success" })
    // Dispara refresh dos owned-products SEM reload — notificações (toast XP,
    // achievements, broadcast queue) continuam tocando sem corte. A pagina inteira
    // re-pesquisa /api/profile/owned-products via listener em Products.tsx.
    window.dispatchEvent(new CustomEvent("app:owned-products-refresh"))
    if (onSuccess) {
      setTimeout(onSuccess, 1500)
    }
    // Sem onSuccess: NÃO recarrega — caller decide quando fechar o modal.
    // O event acima já libera os produtos no UI.
  }

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
        handleSuccess()
        return
      }

      const errorCode = data.error || "other"
      // Blacklist de erros estruturais (não tem como recuperar via fallback) —
      // qualquer outro erro abre fallback Stripe Elements pra digitar cartão novo.
      // Isso cobre card_declined, expired_card, currency_not_supported,
      // payment_failed, stripe_error, no_customer, no_payment_method, etc.
      const NON_RECOVERABLE = new Set([
        "not_authenticated",
        "invalid_body",
        "invalid_product",
        "product_not_in_region",
        "no_sales",
      ])
      const isFallbackEligible = !NON_RECOVERABLE.has(errorCode)

      if (isFallbackEligible) {
        // Se o pai forneceu onFallbackNeeded (ex: ProductSalespageModal),
        // delega pra ele — o pai vai trocar o iframe pelo checkout completo
        // em vez de mostrar Stripe Elements inline aqui.
        if (onFallbackNeeded) {
          onFallbackNeeded()
          // Reseta o BuyButton pra idle (botão volta ao normal — caso user
          // queira tentar de novo se o checkout do iframe der erro também)
          setStatus({ kind: "idle" })
          return
        }

        // Sem callback pai — comportamento padrão: Stripe Elements inline.
        const hadOldCard =
          errorCode === "card_declined" ||
          errorCode === "expired_card" ||
          errorCode === "stripe_error" ||
          errorCode === "payment_failed"
        setHadStripeCustomer(hadOldCard)
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

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
          }}
        >
          {status.message}
        </div>
      )}

      {/* Estado IDLE/LOADING/ERROR — botão 1-click */}
      {(status.kind === "idle" || status.kind === "loading" || status.kind === "error") && (
        <button
          type="button"
          onClick={handleBuy1Click}
          disabled={status.kind === "loading"}
          style={{
            ...DEFAULT_BUTTON_STYLE,
            ...buttonStyle,
            cursor: status.kind === "loading" ? "wait" : "pointer",
            opacity: status.kind === "loading" ? 0.6 : 1,
          }}
        >
          {status.kind === "loading" ? "Procesando..." : buttonLabel}
        </button>
      )}

      {/* Estado FALLBACK — Stripe Elements inline.
       * Sempre renderiza ALGO no estado fallback (não some pra tela branca):
       *  - pricingOptions === null → loader (carregando opções)
       *  - pricingOptions === []   → mensagem + botão tentar de novo
       *  - pricingOptions com itens → StripeInlinePayment */}
      {status.kind === "fallback" && pricingOptions === null && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#a0a0b0",
            fontSize: "0.8rem",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
          }}
        >
          Cargando opciones de pago…
        </div>
      )}

      {status.kind === "fallback" && Array.isArray(pricingOptions) && pricingOptions.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div
            style={{
              padding: "0.85rem",
              background: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.4)",
              color: "#fca5a5",
              fontSize: "0.8rem",
              lineHeight: 1.4,
            }}
          >
            No se pudieron cargar las opciones de pago. Intenta de nuevo.
          </div>
          <button
            type="button"
            onClick={() => setStatus({ kind: "idle" })}
            style={{ ...DEFAULT_BUTTON_STYLE, ...buttonStyle }}
          >
            Tentar de novo
          </button>
        </div>
      )}

      {status.kind === "fallback" && Array.isArray(pricingOptions) && pricingOptions.length > 0 && (
        <StripeInlinePayment
          currencyOptions={pricingOptions}
          createPiEndpoint="/api/buy-product/create-pi"
          bodyExtras={inlineBodyExtras}
          headline={
            hadStripeCustomer
              ? "Tu tarjeta anterior fue rechazada. Ingresa una nueva:"
              : "Ingresa tu tarjeta para esta compra:"
          }
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
