"use client"

// LA RED DE SEGURIDAD DE LOS PANELES.
//
// ── POR QUÉ EXISTE ───────────────────────────────────────────────────────
// Cuando algo falla al dibujar el contenido de un panel, React desmonta el
// árbol hasta el límite de error más cercano. Si no hay ninguno cerca, ese
// límite es el de la aplicación entera: la pantalla se va, y quien mira solo
// ve que "el módulo se cerró solo" sin la menor pista de por qué.
//
// Este componente pone el límite DENTRO del panel. Pase lo que pase, el panel
// sigue ahí y dice qué ocurrió, con el mensaje del fallo a la vista para poder
// contarlo. Un módulo que se rompe explicando es reparable; uno que
// desaparece, no.

import React from "react"

type Props = {
  /** Qué módulo es, para que el aviso diga de qué está hablando. */
  modulo: string
  /** Vuelve al formulario en blanco, si el módulo tiene uno. */
  onReiniciar?: () => void
  children: React.ReactNode
}

type Estado = { fallo: Error | null }

export class PanelFallo extends React.Component<Props, Estado> {
  state: Estado = { fallo: null }

  static getDerivedStateFromError(fallo: Error): Estado {
    return { fallo }
  }

  componentDidCatch(fallo: Error, info: React.ErrorInfo) {
    // A la consola con nombre propio: si alguien abre las herramientas del
    // navegador para contarlo, lo encuentra a la primera.
    console.error("[panel] %s falló:", this.props.modulo, fallo, info.componentStack)
  }

  render() {
    if (!this.state.fallo) return this.props.children

    return (
      <div
        role="alert"
        style={{
          padding: "1.6rem 1.2rem",
          maxWidth: 560,
          margin: "0 auto",
          fontFamily: "var(--font-geist-sans)",
          color: "#d8d3c6",
        }}
      >
        <p
          style={{
            margin: "0 0 0.6rem",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.6rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#e08a8a",
          }}
        >
          Algo se rompió aquí dentro
        </p>
        <h2
          style={{
            margin: "0 0 0.8rem",
            fontFamily: "var(--font-cinzel, serif)",
            fontSize: "1.3rem",
            lineHeight: 1.2,
            color: "#F3F6FA",
          }}
        >
          {this.props.modulo} no pudo dibujarse
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", lineHeight: 1.65 }}>
          No has perdido nada: tus datos siguen guardados en este dispositivo. El
          módulo se quedó a medias al pintar la pantalla.
        </p>
        <p
          style={{
            margin: "0 0 1.2rem",
            padding: "0.7rem 0.8rem",
            border: "1px solid rgba(224,138,138,0.3)",
            background: "rgba(224,138,138,0.08)",
            borderRadius: 10,
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.72rem",
            lineHeight: 1.5,
            color: "#e6b0b0",
            overflowWrap: "anywhere",
          }}
        >
          {this.state.fallo.message || "Error sin mensaje"}
        </p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => this.setState({ fallo: null })}
            style={botonStyle}
          >
            Volver a intentarlo
          </button>
          {this.props.onReiniciar && (
            <button
              type="button"
              onClick={() => { this.setState({ fallo: null }); this.props.onReiniciar?.() }}
              style={botonStyle}
            >
              Empezar de nuevo
            </button>
          )}
        </div>
      </div>
    )
  }
}

const botonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 40,
  padding: "0.55rem 1rem",
  borderRadius: 999,
  border: "1px solid rgba(217,184,102,0.4)",
  background: "transparent",
  color: "#e6cf95",
  fontSize: "0.8rem",
  cursor: "pointer",
}
