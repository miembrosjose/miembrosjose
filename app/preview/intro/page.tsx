"use client"

// Preview isolado da Intro — usado pra testar visualmente sem precisar logar.
// Acesse http://localhost:3001/preview/intro

import { useState } from "react"
import { Intro } from "@/app/miembros/_components/Intro"

export default function IntroPreviewPage() {
  const [key, setKey] = useState(0)
  const [done, setDone] = useState(false)

  return (
    <main
      className="miembros-shell"
      style={{
        minHeight: "100dvh",
        background: "#000000",
        color: "#F3F6FA",
        fontFamily: "var(--font-mono)",
      }}
    >
      {!done && (
        <Intro
          key={key}
          onComplete={() => setDone(true)}
          onSkip={() => {}}
        />
      )}

      {done && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100dvh",
            gap: "1.5rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "#a0a0b0" }}>
            Transmission complete · Session ended
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem("app_intro_seen")
              } catch {
                // ignora
              }
              setKey((k) => k + 1)
              setDone(false)
            }}
            style={{
              padding: "0.75rem 1.6rem",
              background: "transparent",
              border: "1px solid rgba(109, 74, 155, 0.5)",
              color: "#6D4A9B",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            [ R ] Replay transmission
          </button>
        </div>
      )}
    </main>
  )
}
