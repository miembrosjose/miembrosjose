"use client"

// View interna /miembros/producto/<slug> — sem reload, dentro do SpaHomeShell.
// Reusa Content components existentes (já client-side) e ProductLockedView.

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { useAuth } from "../_lib/auth-context"
import { useView } from "../_lib/view-context"
import { api } from "../_lib/api"
import { ProductLockedView } from "@/components/product-locked-view"
import { EmbudoServiceContent } from "../producto/embudo/embudo-content"
import { AndromedaContent } from "../producto/andromeda/andromeda-content"
import { BonusGanchosContent } from "../producto/bonus/bonus-content"
import { RevisaoContent } from "../producto/revisao/revisao-content"
import styles from "./views.module.css"

type Slug = "embudo" | "andromeda" | "analytics" | "bonus-ganchos" | "revisao"

const VALID_SLUGS: Slug[] = ["embudo", "andromeda", "analytics", "bonus-ganchos", "revisao"]

function isValidSlug(s: string | undefined): s is Slug {
  return !!s && (VALID_SLUGS as string[]).includes(s)
}

export function ViewProducto() {
  const { params, setView } = useView()
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const [ownedKeys, setOwnedKeys] = useState<string[] | null>(null)
  const [ownedError, setOwnedError] = useState(false)

  const slug = params.slug

  // Fetch owned products (só pra slugs que precisam de ownership check)
  useEffect(() => {
    if (!user) return
    if (slug === "embudo") {
      setOwnedKeys([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<{ product_keys: string[] }>("/api/profile/owned-products")
        if (cancelled) return
        setOwnedKeys(Array.isArray(data.product_keys) ? data.product_keys : [])
      } catch {
        if (!cancelled) setOwnedError(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, slug])

  // Slug inválido → volta pra inicio
  useEffect(() => {
    if (!isValidSlug(slug)) setView("inicio")
  }, [slug, setView])

  if (!isValidSlug(slug)) return null

  if (authLoading) {
    return (
      <div className={styles.view}>
        <section className={styles.section}>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            Cargando...
          </p>
        </section>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.view}>
        <section className={styles.section}>
          <p style={{ color: "var(--text-muted)" }}>No autenticado.</p>
        </section>
      </div>
    )
  }

  // Slugs livres: acessíveis a qualquer membro logado sem ownership check
  if (slug === "embudo") {
    return (
      <div className={styles.view}>
        <CloseButton onClose={() => setView("inicio")} />
        <EmbudoServiceContent />
      </div>
    )
  }


  // Slugs gated: precisa esperar fetch
  if (ownedKeys === null && !ownedError) {
    return (
      <div className={styles.view}>
        <section className={styles.section}>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            Verificando acceso...
          </p>
        </section>
      </div>
    )
  }

  const owns = (ownedKeys || []).includes(slug)
  const allowed = owns || isAdmin

  if (!allowed) {
    return (
      <div className={styles.view}>
        <CloseButton onClose={() => setView("inicio")} />
        {slug === "andromeda" ? (
          <ProductLockedView
            productName="Producto 2"
            checkoutSlug="andromeda"
            tagline="Tagline del Producto 2"
            description="Descripción del Producto 2 — edita aquí."
          />
        ) : slug === "bonus-ganchos" ? (
          <ProductLockedView
            productName="Bonus 1"
            checkoutSlug={null}
            tagline="Tagline del Bonus 1"
            description="Este bonus aún no está disponible para ti. Consulta con el equipo para obtener acceso."
          />
        ) : slug === "revisao" ? (
          <ProductLockedView
            productName="Servicio Premium"
            checkoutSlug="revisao"
            tagline="Tagline del Servicio Premium"
            description="Descripción del Servicio Premium — edita aquí."
          />
        ) : (
          <ProductLockedView
            productName="Producto 3"
            checkoutSlug="analytics"
            tagline="Tagline del Producto 3"
            description="Descripción del Producto 3 — edita aquí."
          />
        )}
      </div>
    )
  }

  if (slug === "bonus-ganchos") {
    return (
      <div className={styles.view}>
        <CloseButton onClose={() => setView("inicio")} />
        <BonusGanchosContent />
      </div>
    )
  }

  if (slug === "revisao") {
    return (
      <div className={styles.view}>
        <CloseButton onClose={() => setView("inicio")} />
        <RevisaoContent />
      </div>
    )
  }

  return (
    <div className={styles.view}>
      <CloseButton onClose={() => setView("inicio")} />
      {slug === "andromeda" ? <AndromedaContent /> : <AnalyticsContent />}
    </div>
  )
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Cerrar"
      style={{
        position: "fixed",
        right: 24,
        top: 80,
        zIndex: 50,
        width: 36,
        height: 36,
        background: "rgba(10, 10, 15, 0.95)",
        border: "1px solid var(--border-subtle)",
        backdropFilter: "blur(8px)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <X size={18} />
    </button>
  )
}

// Conteúdo do produto Analytics — placeholder, edita aqui.
function AnalyticsContent() {
  return (
    <main style={{ margin: "0 auto", width: "100%", maxWidth: 960, padding: "4rem 1.5rem" }}>
      <header style={{ marginBottom: "3rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "2.5rem" }}>
        <p style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4em", color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>
          Producto Premium
        </p>
        <h1 style={{ marginTop: "0.75rem", fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
          Producto 3
        </h1>
        <p style={{ marginTop: "1rem", maxWidth: 540, fontSize: "1rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
          Contenido pendiente — edita este componente con el material del producto.
        </p>
      </header>
    </main>
  )
}
