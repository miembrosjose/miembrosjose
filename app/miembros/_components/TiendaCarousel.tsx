"use client"

// Carrossel da Tienda Premium — mostra produtos do banco.
// Bloqueado: grayscale + click abre checkout. Liberado: ainda só visual
// (a view de detalhes do produto fica pra outra onda).

import { Lock, Clock } from "lucide-react"
import { useState } from "react"
import { useProducts, type DbProduct } from "../_lib/use-products"
import { useProductAccess } from "../_lib/use-product-access"
import { openExternal } from "../_lib/url-helpers"
import { ProductDrawer } from "./ProductDrawer"
import styles from "./products.module.css"

export function TiendaCarousel() {
  const { products, loading } = useProducts()
  const { hasAccess, isAdminOverride } = useProductAccess()
  const [openProduct, setOpenProduct] = useState<DbProduct | null>(null)

  function handleClick(p: DbProduct) {
    // Produtos bloqueados SEMPRE redirecionam pro checkout no click,
    // mesmo pra admin. Admin gerencia via modal "Gestionar".
    if (p.is_locked && p.checkout_url) {
      openExternal(p.checkout_url)
      return
    }
    // Produto liberado (ou admin que tem acesso) → abre drawer com módulos
    setOpenProduct(p)
  }

  if (loading) {
    return <p style={{ textAlign: "center", color: "#a8a8c0", fontSize: "0.85rem" }}>Cargando productos...</p>
  }

  if (products.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#a8a8c0", fontSize: "0.85rem", padding: "2rem 0" }}>
        No hay productos en la tienda todavía.
      </p>
    )
  }

  return (
    <div className={styles.grid}>
      {products.map((p) => {
        const userHasAccess = hasAccess(p.id) || isAdminOverride
        const isLockedForUser = !userHasAccess && p.is_locked
        // "Próximamente": si tiene fecha de disponibilidad, es un placeholder
        // no comprable todavía (aunque seas admin).
        const comingSoon = !!p.available_from

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => { if (!comingSoon) handleClick(p) }}
            className={`${styles.card} ${(isLockedForUser || comingSoon) ? styles.cardLocked : ""}`}
            style={
              comingSoon
                ? { filter: "grayscale(0.55) brightness(0.8)", cursor: "default" }
                : isLockedForUser
                  ? { filter: "grayscale(1) brightness(0.7)", cursor: "pointer" }
                  : { cursor: userHasAccess ? "pointer" : "default" }
            }
          >
            <div className={styles.thumb}>
              {p.media_url ? (
                /\.(mp4|webm|mov)(\?|$)/i.test(p.media_url) ? (
                  <video src={p.media_url} className={styles.video} muted playsInline loop autoPlay />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media_url} alt={p.name} />
                )
              ) : (
                <div style={{ background: p.gradient, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>
                  {p.emoji}
                </div>
              )}
              {comingSoon ? (
                <div className={styles.lockIcon}>
                  <Clock size={34} strokeWidth={1.5} />
                </div>
              ) : isLockedForUser ? (
                <div className={styles.lockIcon}>
                  <Lock size={36} strokeWidth={1.5} />
                </div>
              ) : null}
            </div>
            <div className={styles.body}>
              <h3 className={styles.name}>{p.name}</h3>
              {comingSoon ? (
                <p style={{ fontSize: "0.72rem", color: "#a78bca", marginTop: "0.35rem", lineHeight: 1.4, fontFamily: "var(--font-mono)", letterSpacing: "0.03em" }}>
                  Disponible a partir de {p.available_from}
                </p>
              ) : p.description ? (
                <p style={{ fontSize: "0.75rem", color: "#a8a8c0", marginTop: "0.3rem", lineHeight: 1.4 }}>
                  {p.description}
                </p>
              ) : null}
              <div className={styles.footer} style={{ marginTop: "0.75rem" }}>
                <span className={styles.access}>
                  {comingSoon ? "Próximamente" : isLockedForUser ? "Desbloquear" : userHasAccess ? "Disponible" : "Bloqueado"}
                </span>
              </div>
            </div>
          </button>
        )
      })}
      {/* Drawer do produto (membro) — abre quando clica em produto liberado */}
      <ProductDrawer product={openProduct} onClose={() => setOpenProduct(null)} />
    </div>
  )
}
