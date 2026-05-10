"use client"

// Tu Biblioteca - Otros Productos + Tienda Premium
// Migra renderOwnedProducts + renderLockedProducts.
// Click em locked → abre /producto/<slug> (futura ViewProductSalespage interna)
// Click em owned interno → setView("producto", slug)
// Click em owned external → window.open

import { useEffect, useState } from "react"
import { ArrowRight, ExternalLink, Lock, LockOpen } from "lucide-react"
import { api } from "../_lib/api"
import { useView } from "../_lib/view-context"
import {
  ALL_PREMIUM_PRODUCTS,
  ALL_BONUSES,
  PRODUCT_LINK_BY_NAME,
  buildOwnedFromKeys,
  getLockedProducts,
  type OwnedProduct,
  type PremiumProduct,
  type BonusProduct,
} from "../_lib/products"
import { checkProductAchievements } from "../_lib/achievements-unlock"
import styles from "./products.module.css"

// ─────────────────────────────────────────────────────────────────────────
// Hook compartilhado: busca produtos comprados via /api/profile/owned-products
// ─────────────────────────────────────────────────────────────────────────

export function useOwnedProducts() {
  const [owned, setOwned] = useState<OwnedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function refetch() {
      try {
        const data = await api<{ product_keys: string[] }>("/api/profile/owned-products")
        if (cancelled) return
        const keys = Array.isArray(data.product_keys) ? data.product_keys : []
        const built = buildOwnedFromKeys(keys)
        setOwned(built)
        // Insignias de produto — desbloqueia 1 por produto comprado
        checkProductAchievements(built)
      } catch {
        // Silencioso — fica vazio (tudo locked aparece na Tienda)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Fetch inicial
    refetch()

    // Re-fetch quando a aba volta a ficar focada/visível
    // (caso user libere produto via painel admin em outra aba ou volte da admin SPA)
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refetch()
    }
    // Re-fetch on-demand: outros componentes podem despachar esse event quando
    // sabem que o servidor concedeu um produto novo (ex: ForumPost após reply
    // num post BONO que disparou auto-grant do bonus-ganchos).
    function onOwnedRefresh() {
      refetch()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("focus", refetch)
    window.addEventListener("app:owned-products-refresh", onOwnedRefresh)

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("focus", refetch)
      window.removeEventListener("app:owned-products-refresh", onOwnedRefresh)
    }
  }, [])

  return { owned, loading }
}

// ─────────────────────────────────────────────────────────────────────────
// OwnedProducts — Tu Biblioteca · Otros Productos
// ─────────────────────────────────────────────────────────────────────────

type OwnedProductsProps = {
  owned: OwnedProduct[]
}

export function OwnedProducts({ owned }: OwnedProductsProps) {
  const { setView } = useView()

  if (owned.length === 0) return null

  return (
    <div className={styles.grid}>
      {owned.map((p) => {
        const link = PRODUCT_LINK_BY_NAME[p.name]
        if (link) {
          const Icon = link.external ? ExternalLink : ArrowRight

          if (link.external) {
            return (
              <a
                key={p.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.card}
              >
                <div className={styles.thumb}>
                  <img src={p.img} alt={p.name} loading="lazy" />
                </div>
                <div className={styles.body}>
                  <div className={styles.name}>{p.name}</div>
                  <div className={styles.progress}>
                    <div className={styles.progressFill} style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className={styles.footer}>
                    <span className={styles.access}>
                      {link.cta} <Icon size={12} />
                    </span>
                  </div>
                </div>
              </a>
            )
          }

          // Internal: navega via setView pra ViewProducto
          return (
            <a
              key={p.name}
              href={link.url}
              onClick={(e) => {
                e.preventDefault()
                if (link.internalSlug) setView("producto", null, { slug: link.internalSlug })
              }}
              className={styles.card}
            >
              <div className={styles.thumb}>
                <img src={p.img} alt={p.name} loading="lazy" />
              </div>
              <div className={styles.body}>
                <div className={styles.name}>{p.name}</div>
                <div className={styles.progress}>
                  <div className={styles.progressFill} style={{ width: `${p.progress}%` }} />
                </div>
                <div className={styles.footer}>
                  <span className={styles.access}>
                    {link.cta} <Icon size={12} />
                  </span>
                </div>
              </div>
            </a>
          )
        }

        // Sem link mapeado → fallback
        return (
          <div key={p.name} className={styles.card}>
            <div className={styles.thumb}>
              <img src={p.img} alt={p.name} loading="lazy" />
            </div>
            <div className={styles.body}>
              <div className={styles.name}>{p.name}</div>
              <div className={styles.progress}>
                <div className={styles.progressFill} style={{ width: `${p.progress}%` }} />
              </div>
              <div className={styles.footer}>
                <span className={styles.access}>
                  Acceder <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// LockedProducts — Tienda Premium
// ─────────────────────────────────────────────────────────────────────────

type LockedProductsProps = {
  owned: OwnedProduct[]
  onOpenSalespage: (product: PremiumProduct) => void
  lockedBonuses?: BonusProduct[]
}

export function LockedProducts({ owned, onOpenSalespage, lockedBonuses }: LockedProductsProps) {
  const { setView } = useView()
  const locked = getLockedProducts(owned)

  if (locked.length === 0 && !lockedBonuses?.length) return null

  return (
    <div className={styles.grid}>
      {locked.map((p) => (
        <button
          key={p.name}
          type="button"
          onClick={() => onOpenSalespage(p)}
          className={`${styles.card} ${styles.cardLocked}`}
        >
          <div className={styles.thumb}>
            <img src={p.img} alt={p.name} loading="lazy" />
            <div className={styles.lockIcon}>
              <Lock size={36} />
            </div>
          </div>
          <div className={styles.body}>
            <div className={styles.name}>{p.name}</div>
            <div className={`${styles.footer} ${styles.footerLocked}`}>
              <span className={styles.access}>
                Desbloquear <LockOpen size={12} />
              </span>
            </div>
          </div>
        </button>
      ))}
      {lockedBonuses?.map((b) => (
        <button
          key={b.slug}
          type="button"
          onClick={() => setView("comunidad")}
          className={`${styles.card} ${styles.cardLocked}`}
        >
          <div className={styles.thumb}>
            <img src={b.img} alt={b.name} loading="lazy" />
            <div className={styles.lockIcon}>
              <Lock size={36} />
            </div>
          </div>
          <div className={styles.body}>
            <div className={styles.name}>{b.name}</div>
            <div className={`${styles.footer} ${styles.footerLocked}`}>
              <span className={styles.access}>
                Desbloquear <LockOpen size={12} />
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// BonusProducts — Bonus Desbloqueados (visível a todos os membros)
// ─────────────────────────────────────────────────────────────────────────

export function BonusProducts({ owned }: { owned: OwnedProduct[] }) {
  const { setView } = useView()
  const ownedNames = new Set(owned.map((o) => o.name.trim().toLowerCase()))

  return (
    <div className={styles.grid}>
      {ALL_BONUSES.map((b) => {
        const unlocked = ownedNames.has(b.name.trim().toLowerCase())

        if (unlocked) {
          return (
            <a
              key={b.slug}
              href={`/miembros/producto/${b.slug}`}
              onClick={(e) => {
                e.preventDefault()
                setView("producto", null, { slug: b.slug })
              }}
              className={styles.card}
            >
              <div className={styles.thumb}>
                <img src={b.img} alt={b.name} loading="lazy" />
              </div>
              <div className={styles.body}>
                <div className={styles.name}>{b.name}</div>
                <div className={styles.footer}>
                  <span className={styles.access}>
                    Acceder <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </a>
          )
        }

        return (
          <div key={b.slug} className={`${styles.card} ${styles.cardLocked}`}>
            <div className={styles.thumb}>
              <img src={b.img} alt={b.name} loading="lazy" />
              <div className={styles.lockIcon}>
                <Lock size={36} />
              </div>
            </div>
            <div className={styles.body}>
              <div className={styles.name}>{b.name}</div>
              <div className={`${styles.footer} ${styles.footerLocked}`}>
                <span className={styles.access}>
                  Bloqueado <LockOpen size={12} />
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Helper: se quiser usar a section "Tienda Premium" sem expor a função getLockedProducts
export function hasLockedProducts(owned: OwnedProduct[]): boolean {
  return getLockedProducts(owned).length > 0
}

// Re-export pra evitar import duplicado lá fora
export { ALL_PREMIUM_PRODUCTS, getLockedProducts }
export type { OwnedProduct, PremiumProduct }
