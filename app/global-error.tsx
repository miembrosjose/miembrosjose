"use client"

import { useEffect } from "react"

// Error boundary de nivel raíz (envuelve <html>/<body>). Solo se activa ante
// errores en el layout raíz. Mínimo, sin dependencias del proyecto, sin stack.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[global-error] digest=%s", error?.digest ?? "unknown")
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#050510",
          color: "#F3F6FA",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: "1.6rem", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
          Los 144.000
        </h1>
        <p style={{ color: "#a8a8c0", maxWidth: 420, lineHeight: 1.6, margin: "0 0 24px" }}>
          Tuvimos un inconveniente al cargar la página. Intenta de nuevo.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            border: "1px solid #6D4A9B",
            background: "#6D4A9B",
            color: "#F3F6FA",
            padding: "14px 28px",
            fontSize: "0.8rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  )
}
