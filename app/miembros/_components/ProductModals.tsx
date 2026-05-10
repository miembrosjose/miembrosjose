"use client"

// Modais de produto premium pra Tienda.
//
// Roteamento:
//   - product.salesPagePath  → ProductSalespageModal (iframe da landing completa, checkout escondido + sticky CTA 1-click)
//   - product.inlineCheckoutPath → ProductCheckoutModal (hero compacto + footer 1-click no mesmo estilo)

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"
import type { PremiumProduct } from "../_lib/products"
import { useAuth } from "../_lib/auth-context"
import { BuyButton } from "./BuyButton"
import { StripeInlinePayment, type CurrencyOption } from "./StripeInlinePayment"
import { getProductPricingOptions } from "@/lib/client-pricing"
import styles from "./product-modals.module.css"

type ProductKey = "creativos" | "andromeda" | "analytics" | "minivsl" | "revisao"

const PRODUCT_KEY_BY_NAME: Record<string, ProductKey> = {
  "Producto 1": "creativos",
  "Producto 2": "andromeda",
  "Producto 3": "analytics",
  "Upsell 1": "minivsl",
  "Servicio Premium": "revisao",
}

function getProductKey(product: PremiumProduct): ProductKey | null {
  return PRODUCT_KEY_BY_NAME[product.name] || null
}

// Em miembros.SEU_DOMINIO.com força URL absoluta pro domínio principal.
function buildIframeUrl(path: string): string {
  if (typeof window === "undefined") return path
  const isMiembrosSubdomain = window.location.hostname.startsWith("miembros.")
  const base = isMiembrosSubdomain ? `https://SEU_DOMINIO.com${path}` : path
  return base.includes("?") ? `${base}&member=1` : `${base}?member=1`
}

// ─────────────────────────────────────────────────────────────────────────
// Hook compartilhado: carrega preço com conversão de moeda local (LATAM)
// ─────────────────────────────────────────────────────────────────────────

type PricingOption = {
  currency: string
  amount: number
  label: string
  formatted: string
  formatted_from?: string | null
}

type PricingState = {
  options: PricingOption[] | null
  loading: boolean
  error: string | null
  retry: () => void
}

function usePricing(productKey: ProductKey | null): PricingState {
  const [options, setOptions] = useState<PricingOption[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!productKey) return
    setLoading(false)
    setError(null)
    const opts = getProductPricingOptions(productKey)
    if (opts.length > 0) {
      setOptions(opts)
    } else {
      setError("empty_options")
    }
  }, [productKey, attempt])

  return {
    options,
    loading,
    error,
    retry: () => setAttempt((a) => a + 1),
  }
}

function PriceDisplay({
  options,
  fallback,
}: {
  options: PricingOption[] | null
  fallback: string
}) {
  // Loading → mostra preço hardcoded do catálogo como skeleton
  if (!options || options.length === 0) {
    return <span className={styles.priceUsd}>{fallback}</span>
  }
  const usd = options.find((o) => o.currency === "usd")
  const local = options.find((o) => o.currency !== "usd")
  const primary = usd || options[0]
  const secondary = usd ? local : null

  return (
    <>
      <span className={styles.priceLine}>
        <span className={styles.priceUsd}>{primary.formatted}</span>
      </span>
      {secondary && (
        <span className={styles.priceLocal}>
          ≈ {secondary.formatted}
        </span>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// SALESPAGE MODAL — iframe da landing completa + footer sticky 1-click
// ─────────────────────────────────────────────────────────────────────────

type SalespageModalProps = {
  product: PremiumProduct | null
  onClose: () => void
}

export function ProductSalespageModal({ product, onClose }: SalespageModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false)
  // fallbackMode=true quando 1-click falha → SUBSTITUI iframe + footer
  // pelo StripeInlinePayment (deferred Elements) cobrindo o body inteiro.
  const [fallbackMode, setFallbackMode] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const { user } = useAuth()
  const productKey = product ? getProductKey(product) : null
  const pricing = usePricing(productKey)
  const pricingOptions = pricing.options

  // bodyExtras estável pro StripeInlinePayment (anti-remount loop)
  const inlineBodyExtras = useMemo(
    () => ({ product_key: productKey || "" }),
    [productKey],
  )

  // Reset do loading SÓ quando muda o produto.
  const productId = product?.salesPagePath || null
  useEffect(() => {
    if (productId) {
      setIframeLoaded(false)
      setFallbackMode(false)
    }
  }, [productId])

  // Escape + body overflow lock — onClose via ref pra não causar re-runs.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // useLayoutEffect aplica overflow:hidden ANTES do primeiro paint do modal,
  // evitando que o primeiro touch tente rolar o body e seja descartado.
  // Também compensa scrollbar com paddingRight pra NÃO causar jump horizontal
  // (sem isso, ao remover scrollbar a pagina desloca ~17px e ao fechar modal
  // volta — efeito de "rolagem" perceptivel).
  useLayoutEffect(() => {
    if (!product) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current()
    }
    window.addEventListener("keydown", onKey)
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight
    document.body.style.overflow = "hidden"
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPaddingRight
    }
  }, [product])

  // Focus polling agressivo no iframe — cross-origin iframes precisam de focus
  // pra receber wheel events. Polling cobre o caso onde cursor já está sobre
  // o iframe quando o modal abre (onMouseEnter NÃO dispara nesse caso).
  // .focus() no elemento iframe funciona cross-origin; .contentWindow.focus()
  // pode ser no-op silencioso, então focamos o elemento.
  useEffect(() => {
    if (!product || fallbackMode) return
    const f = () => {
      try { iframeRef.current?.focus() } catch {}
      try { iframeRef.current?.contentWindow?.focus() } catch {}
    }
    const ts = [50, 200, 500, 1000].map((d) => window.setTimeout(f, d))
    return () => ts.forEach((t) => window.clearTimeout(t))
  }, [product, fallbackMode, iframeLoaded])

  if (!product || !product.salesPagePath) return null

  const iframeUrl = buildIframeUrl(product.salesPagePath)
  // CurrencyOption[] pro StripeInlinePayment (compatível com PricingOption)
  const inlineCurrencyOptions: CurrencyOption[] = (pricingOptions || []).map((o) => ({
    currency: o.currency,
    amount: o.amount,
    label: o.label,
    formatted: o.formatted,
  }))

  return (
    <div
      className={styles.salespageModal}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.salespageContent}>
        <div className={styles.salespageHeader}>
          <div className={styles.salespageEyebrow}>
            <span className={styles.salespageEyebrowTitle}>{product.name}</span>
          </div>
          <button
            type="button"
            className={styles.salespageClose}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Em fallbackMode, esconde iframe COMPLETAMENTE e mostra checkout
         * deferred Elements ocupando tudo. Não recarrega iframe nem mostra
         * landing de novo — cliente já leu, só precisa pagar. */}
        {!fallbackMode ? (
          <div
            className={styles.salespageIframeWrapper}
            // onMouseMove (NÃO onMouseEnter) — dispara mesmo se o cursor já
            // estava sobre o iframe no momento que o modal montou. Sem isso,
            // user que abre modal e gira wheel sem mexer o mouse perde o foco.
            onMouseMove={() => {
              try { iframeRef.current?.focus() } catch {}
            }}
            // onWheelCapture roda ANTES do wheel descer pro iframe — última
            // chance de garantir foco antes do browser decidir pra onde mandar
            // a wheel. Capture phase intercepta no parent.
            onWheelCapture={() => {
              try { iframeRef.current?.focus() } catch {}
            }}
          >
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              className={styles.salespageIframe}
              title={`${product.name} · Página de venta`}
              allow="payment *"
              tabIndex={0}
              onLoad={() => {
                setIframeLoaded(true)
                // Foca o iframe ao carregar pra que a primeira roda de scroll
                // seja capturada por ele em vez do parent (que tem overflow:hidden).
                // .focus() no elemento iframe sempre funciona; .contentWindow.focus()
                // cross-origin pode ser no-op mas tentamos por garantia.
                try { iframeRef.current?.focus() } catch {}
                try { iframeRef.current?.contentWindow?.focus() } catch {}
              }}
            />
            <div
              className={`${styles.salespageLoading} ${
                iframeLoaded ? styles.hidden : ""
              }`}
            >
              <div className={styles.salespageLoadingSpinner} />
              <div className={styles.salespageLoadingText}>Cargando contenido</div>
            </div>
          </div>
        ) : (
          // Fallback fullscreen — Stripe Elements deferred cobrindo tudo,
          // com summary do produto (imagem + nome + preço) acima.
          <div className={styles.fallbackBody}>
            {/* Sumário do produto — replica o estilo do StandaloneCheckoutTemplate */}
            <div className={styles.fallbackSummary}>
              <div className={styles.fallbackSummaryImg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.img} alt={product.name} loading="lazy" />
              </div>
              <div className={styles.fallbackSummaryInfo}>
                <h3 className={styles.fallbackSummaryName}>{product.name}</h3>
                <div className={styles.fallbackSummaryPrice}>
                  <PriceDisplay options={pricingOptions} fallback={product.price} />
                </div>
              </div>
            </div>

            {productKey && inlineCurrencyOptions.length > 0 && (
              <div className={styles.fallbackInlineWrap}>
                <StripeInlinePayment
                  currencyOptions={inlineCurrencyOptions}
                  createPiEndpoint="/api/buy-product/create-pi"
                  bodyExtras={inlineBodyExtras}
                  customerEmail={user?.email}
                  onSuccess={() => {
                    // Refresh sem reload — preserva notifications/toasts/broadcast
                    window.dispatchEvent(new CustomEvent("app:owned-products-refresh"))
                    setTimeout(() => onClose(), 1500)
                  }}
                />
              </div>
            )}

            {productKey && pricing.loading && inlineCurrencyOptions.length === 0 && (
              <div className={styles.fallbackLoading}>
                <div className={styles.salespageLoadingSpinner} />
                <div className={styles.salespageLoadingText}>Cargando opciones de pago</div>
              </div>
            )}

            {productKey && !pricing.loading && pricing.error && inlineCurrencyOptions.length === 0 && (
              <div className={styles.fallbackErrorBox}>
                <strong>No se pudieron cargar las opciones de pago.</strong>
                <span>Verifica tu conexión e intenta de nuevo.</span>
                <span style={{ fontSize: "0.7rem", opacity: 0.6, fontFamily: "var(--font-mono)" }}>
                  Detalles: {pricing.error}
                </span>
                <button
                  type="button"
                  onClick={pricing.retry}
                  className={styles.fallbackRetryBtn}
                >
                  Tentar de novo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer 1-click — só aparece em modo normal */}
        {productKey && !fallbackMode && (
          <PurchaseFooter
            productName={product.name}
            fallbackPrice={product.price}
            productKey={productKey}
            pricingOptions={pricingOptions}
            onFallbackNeeded={() => {
              // Se o pricing teve erro/null no carregamento inicial, força refetch
              if (!pricingOptions || pricingOptions.length === 0) pricing.retry()
              setFallbackMode(true)
            }}
          />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// CHECKOUT MODAL — hero compacto + footer 1-click (Mini VSL / Revisão)
// ─────────────────────────────────────────────────────────────────────────

type CheckoutModalProps = {
  product: PremiumProduct | null
  onClose: () => void
}

export function ProductCheckoutModal({ product, onClose }: CheckoutModalProps) {
  const [fallbackMode, setFallbackMode] = useState(false)
  const { user } = useAuth()
  const productKey = product ? getProductKey(product) : null
  const pricing = usePricing(productKey)
  const pricingOptions = pricing.options

  // bodyExtras estável pro StripeInlinePayment (anti-remount loop)
  const inlineBodyExtras = useMemo(
    () => ({ product_key: productKey || "" }),
    [productKey],
  )

  useEffect(() => {
    setFallbackMode(false) // reset ao trocar de produto
  }, [productKey])

  // onClose via ref pra evitar re-runs do useEffect quando o parent re-renderiza
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // useLayoutEffect aplica overflow:hidden ANTES do primeiro paint — sem isso,
  // o primeiro touch pode tentar rolar o body e ser descartado pelo browser.
  useLayoutEffect(() => {
    if (!product) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current()
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [product])

  if (!product) return null

  const inlineCurrencyOptions: CurrencyOption[] = (pricingOptions || []).map((o) => ({
    currency: o.currency,
    amount: o.amount,
    label: o.label,
    formatted: o.formatted,
  }))

  return (
    <div
      className={styles.checkoutOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.checkoutModal}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className={styles.checkoutCloseBtn}
        >
          <X size={18} />
        </button>

        {/* Hero só aparece em modo normal — em fallback, summary do produto
         * cobre o papel da imagem e libera espaço pro form deferred. */}
        {!fallbackMode && (
          <div
            className={styles.checkoutHero}
            style={{ backgroundImage: `url('${product.img}')` }}
          >
            <div className={styles.checkoutHeroContent}>
              <h2 className={styles.checkoutTitle}>{product.name}</h2>
              <p className={styles.checkoutDesc}>{product.desc}</p>
            </div>
          </div>
        )}

        {/* Em fallback: summary + Stripe Elements deferred cobrem tudo */}
        {fallbackMode ? (
          <div className={styles.fallbackBody}>
            <div className={styles.fallbackSummary}>
              <div className={styles.fallbackSummaryImg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.img} alt={product.name} loading="lazy" />
              </div>
              <div className={styles.fallbackSummaryInfo}>
                <h3 className={styles.fallbackSummaryName}>{product.name}</h3>
                <div className={styles.fallbackSummaryPrice}>
                  <PriceDisplay options={pricingOptions} fallback={product.price} />
                </div>
              </div>
            </div>

            {productKey && inlineCurrencyOptions.length > 0 && (
              <div className={styles.fallbackInlineWrap}>
                <StripeInlinePayment
                  currencyOptions={inlineCurrencyOptions}
                  createPiEndpoint="/api/buy-product/create-pi"
                  bodyExtras={inlineBodyExtras}
                  customerEmail={user?.email}
                  onSuccess={() => {
                    // Refresh sem reload — preserva notifications/toasts/broadcast
                    window.dispatchEvent(new CustomEvent("app:owned-products-refresh"))
                    setTimeout(() => onClose(), 1500)
                  }}
                />
              </div>
            )}

            {productKey && pricing.loading && inlineCurrencyOptions.length === 0 && (
              <div className={styles.fallbackLoading}>
                <div className={styles.salespageLoadingSpinner} />
                <div className={styles.salespageLoadingText}>Cargando opciones de pago</div>
              </div>
            )}

            {productKey && !pricing.loading && pricing.error && inlineCurrencyOptions.length === 0 && (
              <div className={styles.fallbackErrorBox}>
                <strong>No se pudieron cargar las opciones de pago.</strong>
                <span>Verifica tu conexión e intenta de nuevo.</span>
                <button type="button" onClick={pricing.retry} className={styles.fallbackRetryBtn}>
                  Tentar de novo
                </button>
              </div>
            )}
          </div>
        ) : (
          productKey && (
            <PurchaseFooter
              productName={product.name}
              fallbackPrice={product.price}
              productKey={productKey}
              pricingOptions={pricingOptions}
              onFallbackNeeded={() => {
                if (!pricingOptions || pricingOptions.length === 0) pricing.retry()
                setFallbackMode(true)
              }}
            />
          )
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// PurchaseFooter — barra única com nome, preço (USD + local) e BuyButton
// Compartilhada entre ProductSalespageModal e ProductCheckoutModal.
// ─────────────────────────────────────────────────────────────────────────

function PurchaseFooter({
  productName,
  fallbackPrice,
  productKey,
  pricingOptions,
  onFallbackNeeded,
}: {
  productName: string
  fallbackPrice: string
  productKey: ProductKey
  pricingOptions: PricingOption[] | null
  onFallbackNeeded?: () => void
}) {
  return (
    <div className={styles.salespageFooter}>
      <div className={styles.salespageFooterPrice}>
        <span className={styles.salespageFooterPriceLabel}>{productName}</span>
        <div className={styles.salespageFooterPriceValue}>
          <PriceDisplay options={pricingOptions} fallback={fallbackPrice} />
        </div>
      </div>
      <div className={styles.salespageFooterCta}>
        <BuyButton productKey={productKey} onFallbackNeeded={onFallbackNeeded} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Roteador automático
// ─────────────────────────────────────────────────────────────────────────

type ProductPurchaseModalProps = {
  product: PremiumProduct | null
  onClose: () => void
}

export function ProductPurchaseModal({ product, onClose }: ProductPurchaseModalProps) {
  if (!product) return null
  if (product.salesPagePath) {
    return <ProductSalespageModal product={product} onClose={onClose} />
  }
  return <ProductCheckoutModal product={product} onClose={onClose} />
}
