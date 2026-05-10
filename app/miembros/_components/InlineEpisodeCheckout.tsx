"use client"

// Checkout inline embedded em episódios da área de membros (ex: episodio 3 t1).
//
// MESMO padrão do ProductCheckoutModal da Tienda Premium:
//  1. Hero (imagem do produto)
//  2. Body com descrição + preço
//  3. BuyButton (1-click off-session via /api/buy-product)
//  4. Fallback: se 1-click falhar → StripeInlinePayment (deferred Elements)
//
// Diferença pro modal: renderiza inline na sidebar do player, sem overlay.
// Mesma lógica, mesma chamada API, mesmo fluxo Stripe — reusa BuyButton existente.

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../_lib/auth-context"
import { BuyButton } from "./BuyButton"
import { StripeInlinePayment, type CurrencyOption } from "./StripeInlinePayment"
import type { PremiumProduct } from "../_lib/products"
import { getProductPricingOptions } from "@/lib/client-pricing"

type ProductKey = "creativos" | "andromeda" | "analytics" | "minivsl" | "revisao"

const PRODUCT_KEY_BY_NAME: Record<string, ProductKey> = {
  "Producto 1": "creativos",
  "Producto 2": "andromeda",
  "Producto 3": "analytics",
  "Upsell 1": "minivsl",
  "Servicio Premium": "revisao",
}

type PricingOption = {
  currency: string
  amount: number
  label: string
  formatted: string
  formatted_from?: string | null
}

function usePricing(productKey: ProductKey | null) {
  const [options, setOptions] = useState<PricingOption[] | null>(null)

  useEffect(() => {
    if (!productKey) return
    setOptions(getProductPricingOptions(productKey))
  }, [productKey])

  return options
}

type Props = {
  product: PremiumProduct
}

export function InlineEpisodeCheckout({ product }: Props) {
  const productKey = (PRODUCT_KEY_BY_NAME[product.name] as ProductKey | undefined) ?? null
  const { user } = useAuth()
  const options = usePricing(productKey)
  const [fallbackMode, setFallbackMode] = useState(false)

  const inlineBodyExtras = useMemo(
    () => ({ product_key: productKey || "" }),
    [productKey],
  )

  const inlineCurrencyOptions: CurrencyOption[] = (options || []).map((o) => ({
    currency: o.currency,
    amount: o.amount,
    label: o.label,
    formatted: o.formatted,
  }))

  const usd = options?.find((o) => o.currency === "usd")
  const local = options?.find((o) => o.currency !== "usd")
  const primary = usd || options?.[0]
  const secondary = usd ? local : null

  if (!productKey) return null

  return (
    <div style={containerStyle}>
      {/* Hero — imagem do produto */}
      <div style={{ ...heroStyle, backgroundImage: `url('${product.img}')` }}>
        <div style={heroOverlay} />
        <div style={heroContent}>
          <h3 style={titleStyle}>{product.name}</h3>
        </div>
      </div>

      <div style={bodyStyle}>
        <p style={descStyle}>{product.desc}</p>

        {/* Pricing — só preço real, sem riscado */}
        <div style={priceWrap}>
          <span style={priceMain}>{primary?.formatted ?? product.price}</span>
          {secondary && <span style={priceLocal}>≈ {secondary.formatted}</span>}
        </div>

        {/* Estado normal: BuyButton tenta 1-click primeiro */}
        {!fallbackMode && (
          <BuyButton
            productKey={productKey}
            buttonLabel="Comprar 1-click"
            onFallbackNeeded={() => setFallbackMode(true)}
          />
        )}

        {/* Fallback: form Stripe Elements (mesmo que /minivsl tem) */}
        {fallbackMode && inlineCurrencyOptions.length > 0 && (
          <div style={{ marginTop: "0.75rem" }}>
            <p style={fallbackHeadline}>
              Ingresa tu tarjeta para completar la compra:
            </p>
            <StripeInlinePayment
              currencyOptions={inlineCurrencyOptions}
              createPiEndpoint="/api/buy-product/create-pi"
              bodyExtras={inlineBodyExtras}
              customerEmail={user?.email}
              onSuccess={() => {
                window.dispatchEvent(new CustomEvent("app:owned-products-refresh"))
              }}
            />
          </div>
        )}

        {fallbackMode && inlineCurrencyOptions.length === 0 && (
          <div style={errorBoxStyle}>
            <strong>No se pudieron cargar las opciones de pago.</strong>
            <button
              type="button"
              onClick={() => setFallbackMode(false)}
              style={retryBtnStyle}
            >
              Volver a intentar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Styles
const containerStyle: React.CSSProperties = {
  background: "#0a0a0f",
  border: "1px solid rgba(201,169,97,0.25)",
  borderRadius: 6,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
}

const heroStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  backgroundColor: "#0a0a0f",
  backgroundSize: "cover",
  backgroundPosition: "center",
}

const heroOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, #0a0a0f 0%, rgba(10,10,15,0.85) 25%, rgba(10,10,15,0.4) 55%, transparent 85%)",
  pointerEvents: "none",
}

const heroContent: React.CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: "1rem 1.25rem 0.75rem",
  zIndex: 1,
}

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: "1.4rem",
  letterSpacing: "-0.01em",
  color: "#f5f5f7",
  lineHeight: 1.1,
  textShadow: "0 2px 12px rgba(0,0,0,0.7)",
  margin: 0,
}

const bodyStyle: React.CSSProperties = {
  padding: "1rem 1.25rem 1.25rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
}

const descStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  lineHeight: 1.5,
  color: "rgba(245,245,247,0.85)",
  margin: 0,
}

const priceWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.2rem",
  padding: "0.75rem 0.85rem",
  background: "rgba(201,169,97,0.08)",
  border: "1px solid rgba(201,169,97,0.25)",
  borderRadius: 4,
}

const priceMain: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "1.5rem",
  fontWeight: 700,
  color: "#c9a961",
  letterSpacing: "-0.01em",
}

const priceLocal: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.7rem",
  letterSpacing: "0.08em",
  color: "rgba(201,169,97,0.65)",
  textTransform: "uppercase",
}

const fallbackHeadline: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#a0a0b0",
  margin: "0 0 0.65rem",
}

const errorBoxStyle: React.CSSProperties = {
  padding: "0.85rem 1rem",
  background: "rgba(220,38,38,0.08)",
  border: "1px solid rgba(220,38,38,0.3)",
  borderRadius: 4,
  fontSize: "0.8rem",
  color: "#fca5a5",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
}

const retryBtnStyle: React.CSSProperties = {
  padding: "0.5rem 0.85rem",
  border: "1px solid rgba(220,38,38,0.5)",
  background: "transparent",
  color: "#fca5a5",
  fontFamily: "var(--font-mono)",
  fontSize: "0.7rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  cursor: "pointer",
  borderRadius: 3,
}
