"use client"

// Desbloqueo del acceso completo a Transmisiones ($9.99) — 1-click de Stripe.
// Reutiliza ProductUnlockInline (mismo flujo que meditaciones / numerología
// premium): cobro con tarjeta guardada → 3DS si hace falta → tarjeta inline.
// Botón dorado glossy con brillo animado (estilos en transmision-unlock.module.css).
// Al confirmar, recarga para revelar el contenido desbloqueado.

import { ProductUnlockInline } from "./ProductUnlockInline"
import styles from "./transmision-unlock.module.css"

export function TransmisionUnlock({
  productId,
  priceCents,
  currency,
  label,
}: {
  productId: string
  priceCents: number
  currency: string
  label?: string
}) {
  const price = `$${(priceCents / 100).toFixed(2)}`
  return (
    <div className={styles.wrap}>
      <ProductUnlockInline
        productId={productId}
        priceCents={priceCents}
        currency={currency}
        priceLabel={price}
        buttonLabel={label || `Desbloquear todo · ${price}`}
        buttonStyle={{}}
        onSuccess={() => {
          if (typeof window !== "undefined") window.location.reload()
        }}
      />
    </div>
  )
}
