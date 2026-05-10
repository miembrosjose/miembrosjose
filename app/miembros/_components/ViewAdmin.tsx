"use client"

// View interna /miembros/admin — sem reload, dentro do SpaHomeShell.
// Reusa AdminPanel client component existente.

import { useEffect } from "react"
import { useAuth } from "../_lib/auth-context"
import { useView } from "../_lib/view-context"
import { AdminPanel } from "../admin/admin-panel"
import styles from "./views.module.css"

export function ViewAdmin() {
  const { user, isAdmin, isLoading } = useAuth()
  const { setView } = useView()

  // Não-admin → volta pra inicio (mesma redirect do server-side antigo)
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      setView("inicio")
    }
  }, [isLoading, user, isAdmin, setView])

  if (isLoading || !user || !isAdmin) {
    return (
      <div className={styles.view}>
        <section className={styles.section}>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            Verificando permissões...
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.view}>
      {/* Botão close fixo no canto superior direito (admin-panel já tem header próprio) */}
      <button
        type="button"
        onClick={() => setView("inicio")}
        aria-label="Fechar"
        style={{
          position: "fixed",
          top: 80,
          right: 24,
          zIndex: 50,
          width: 36,
          height: 36,
          border: "1px solid #2a2a36",
          background: "rgba(18, 18, 26, 0.9)",
          backdropFilter: "blur(8px)",
          color: "#a0a0b0",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#7f1d1d"
          e.currentTarget.style.color = "#f5f5f7"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#2a2a36"
          e.currentTarget.style.color = "#a0a0b0"
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
          <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <section className={styles.section} style={{ maxWidth: 1280, margin: "0 auto" }}>
        <AdminPanel />
      </section>
    </div>
  )
}
