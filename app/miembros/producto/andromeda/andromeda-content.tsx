"use client"

export function AndromedaContent() {
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
          PRODUCTO PREMIUM
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
          Producto 2
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.65, maxWidth: 560, margin: "0 auto" }}>
          Contenido pendiente — edita este componente con el material del producto.
        </p>
      </header>
    </main>
  )
}
