"use client"

// Wrapper de carga del shell de miembros.
//
// CLAVE DE RENDIMIENTO (fix Error 1102): el shell real (SpaHomeShellInner) es
// grande y se renderizaba en el SERVIDOR (SSR) en cada request autenticado a
// /miembros, empujando el CPU del Worker por encima del límite → Error 1102
// "Worker exceeded resource limits".
//
// Aquí lo cargamos con ssr:false: el Worker sólo hace el auth (en la page
// server component) y emite este loader liviano; TODO el árbol pesado se
// renderiza en el NAVEGADOR. Así el Worker deja de gastar CPU renderizando la
// app y el 1102 desaparece de raíz. La experiencia funcional es idéntica; sólo
// se añade un breve estado de carga antes de la hidratación.
//
// La página es noindex + gated por sesión, así que el SSR no aportaba valor de
// SEO/first-paint que justifique el costo de CPU.

import dynamic from "next/dynamic"

const SpaHomeShellInner = dynamic(
  () => import("./SpaHomeShellInner").then((m) => m.SpaHomeShellInner),
  { ssr: false, loading: () => <MembersLoading /> },
)

export function SpaHomeShell() {
  return <SpaHomeShellInner />
}

function MembersLoading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.4rem",
        background: "#050510",
        color: "#F3F6FA",
      }}
    >
      <div style={{ position: "relative", width: 54, height: 54 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(167,139,202,0.22)",
            borderTopColor: "#a78bca",
            animation: "l144spin 0.9s linear infinite",
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 10,
            borderRadius: "50%",
            border: "1.5px solid rgba(217,184,102,0.18)",
            borderBottomColor: "#d9b866",
            animation: "l144spin 1.4s linear infinite reverse",
          }}
        />
      </div>
      <p
        style={{
          fontFamily: "var(--font-cinzel, 'Orbitron', sans-serif)",
          fontSize: "0.72rem",
          letterSpacing: "0.42em",
          textTransform: "uppercase",
          color: "#a78bca",
          margin: 0,
          paddingLeft: "0.42em",
        }}
      >
        Los 144000
      </p>
      <style>{"@keyframes l144spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  )
}
