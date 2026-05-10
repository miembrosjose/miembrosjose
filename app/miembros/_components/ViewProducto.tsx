"use client"

// View interna /miembros/producto/<slug> — sem reload, dentro do SpaHomeShell.
// Reusa Content components existentes (já client-side) e ProductLockedView.

import { useEffect, useState } from "react"
import { Download, ArrowUpRight, X } from "lucide-react"
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
            productName="Andrómeda.ADS"
            checkoutSlug="andromeda"
            tagline="El método completo para escalar Meta Ads en la era de la IA"
            description="Estrategia validada de probar / validar / escalar com criterio matemático: ABO vs CBO, Público Advantage+, Marketing de Raíz, regla 1-1-X y aislamiento inteligente."
          />
        ) : slug === "bonus-ganchos" ? (
          <ProductLockedView
            productName="Pack de Ganchos Neuronales™"
            checkoutSlug={null}
            tagline="30+ Hooks estratégicos por nivel de conciencia"
            description="Este bonus aún no está disponible para ti. Consulta con el equipo para obtener acceso."
          />
        ) : slug === "revisao" ? (
          <ProductLockedView
            productName="Revisión de Tu Embudo"
            checkoutSlug="revisao"
            tagline="Análisis riguroso y profundo de toda la estructura"
            description="Estrategia, narrativa, lógica de conversión y puntos de fuga del embudo. Recibe orientaciones claras, ajustes precisos y recomendaciones estratégicas."
          />
        ) : (
          <ProductLockedView
            productName="Analytics"
            checkoutSlug="analytics"
            tagline="Dashboard cinematográfico para tu propio embudo"
            description="Template completo Next.js + integración con Facebook Ads + prompts Notion para construir tu propio panel."
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

// Conteúdo Analytics (extraído de app/miembros/producto/analytics/page.tsx — server component)
function AnalyticsContent() {
  return (
    <main
      style={{
        margin: "0 auto",
        width: "100%",
        maxWidth: 960,
        padding: "4rem 1.5rem",
      }}
    >
      <header style={{ marginBottom: "3rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "2.5rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.4em",
            color: "var(--accent-gold)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Producto · Dashboard
        </p>
        <h1
          style={{
            marginTop: "0.75rem",
            fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
          }}
        >
          Analytics
        </h1>
        <p
          style={{
            marginTop: "1rem",
            maxWidth: 540,
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
          }}
        >
          Template completo de Dashboard para tu propio embudo: 4 abas (Funil, Analytics, Campañas,
          Criativos), integración con Facebook Ads via Marketing API, métricas en tiempo real y
          prompts listos para usar.
        </p>
      </header>

      <section style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <a
          href="/downloads/dashboard-template.tsx"
          download
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            border: "1px solid rgba(201, 169, 97, 0.4)",
            background: "linear-gradient(135deg, rgba(201, 169, 97, 0.1), transparent)",
            padding: "1.5rem",
            transition: "all 0.3s",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.3em",
                color: "var(--accent-gold)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Descargar
            </span>
            <Download size={20} color="var(--accent-gold)" />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            Template <span style={{ color: "var(--accent-gold)" }}>.tsx</span>
          </h2>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
            Esqueleto del Dashboard listo para implementar. Solo descargá el archivo y seguí al
            Notion — ahí están todas las instrucciones paso a paso.
          </p>
          <span
            style={{
              marginTop: "0.5rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--accent-gold)",
              fontFamily: "var(--font-mono)",
            }}
          >
            page.tsx <span style={{ color: "var(--text-muted)" }}>→</span>
          </span>
        </a>

        <a
          href="https://www.notion.so/SEU_NOTION_ID"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            border: "1px solid var(--border-subtle)",
            background: "rgba(18, 18, 26, 0.4)",
            padding: "1.5rem",
            transition: "all 0.3s",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.3em",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Notion · Prompts
            </span>
            <ArrowUpRight size={20} color="var(--text-secondary)" />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            Prompts completos
          </h2>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
            Acceso a la página Notion con todos los prompts listos para usar. Copia, pega y
            construye cada aba (Funil, Analytics, Campañas, Criativos).
          </p>
          <span
            style={{
              marginTop: "0.5rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Abrir Notion <span style={{ color: "var(--text-muted)" }}>↗</span>
          </span>
        </a>
      </section>
    </main>
  )
}
