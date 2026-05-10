"use client"

const WHATSAPP_URL =
  "https://wa.me/SEU_WHATSAPP_NUMBER?text=Hola,%20soy%20miembro%20y%20ya%20tengo%20mi%20proyecto%20listo.%20Quiero%20enviar%20los%20materiales."

export function RevisaoContent() {
  return (
    <main
      style={{
        margin: "0 auto",
        width: "100%",
        maxWidth: 860,
        padding: "4rem 1.5rem 6rem",
        color: "var(--text-primary)",
      }}
    >
      <header style={{ marginBottom: "3.5rem", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(201,169,97,0.12)",
            border: "1px solid rgba(201,169,97,0.35)",
            padding: "0.35rem 1rem",
            marginBottom: "1.25rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
          }}
        >
          SERVICIO PREMIUM
        </div>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
            marginBottom: "1rem",
          }}
        >
          Servicio Premium
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.65, maxWidth: 560, margin: "0 auto", marginBottom: "2rem" }}>
          Contenido pendiente — edita este componente con la propuesta del servicio.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "0.875rem 2rem",
            background: "#7f1d1d",
            color: "var(--text-primary)",
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          Enviar Materiales
        </a>
      </header>
    </main>
  )
}
