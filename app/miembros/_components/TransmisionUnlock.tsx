"use client"

// Desbloqueo del acceso completo a Transmisiones ($9.99) — 1-click de Stripe.
// Reutiliza ProductUnlockInline (mismo flujo que meditaciones / numerología
// premium): cobro con tarjeta guardada → 3DS si hace falta → tarjeta inline.
// Al confirmar, recarga para revelar el contenido desbloqueado.

import { ProductUnlockInline } from "./ProductUnlockInline"

export function TransmisionUnlock({
  productId,
  priceCents,
  currency,
}: {
  productId: string
  priceCents: number
  currency: string
}) {
  const price = `$${(priceCents / 100).toFixed(2)}`
  return (
    <div style={{ maxWidth: 360, margin: "0 auto" }}>
      <ProductUnlockInline
        productId={productId}
        priceCents={priceCents}
        currency={currency}
        priceLabel={price}
        buttonLabel={`Desbloquear todas las categorías · ${price}`}
        buttonStyle={{
          width: "100%",
          padding: "0.95rem 1.5rem",
          border: "none",
          background: "linear-gradient(135deg, #d9b866, #e6cf95)",
          color: "#050510",
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          fontWeight: 700,
          borderRadius: 10,
        }}
        onSuccess={() => {
          if (typeof window !== "undefined") window.location.reload()
        }}
      />
    </div>
  )
}
