"use client"

// Fondo de estrellas persistente para el área de miembros.
//
// Reutiliza el mismo <Starfield> de la intro, pero en modo CALMO: startedAt=null
// deja la curva de velocidad en "drift" (deriva lenta, sin warp). Las estrellas
// se ven en los espacios vacíos (márgenes, huecos entre tarjetas, detrás de las
// temporadas) sin tapar el texto ni las tarjetas opacas.
//
// pointer-events:none → no interfiere con clics. aria-hidden → decorativo.

import type { CSSProperties } from "react"
import { Starfield } from "./Starfield"

type Variant =
  // Capa fija al viewport, detrás del contenido del shell (página principal).
  | "fixed"
  // Pinnada al top dentro de un contenedor con scroll (drawer de episodios):
  // se queda quieta mientras el contenido hace scroll, y no ocupa altura de
  // layout (margin-bottom negativo) para no empujar el contenido.
  | "sticky"

type Props = {
  variant?: Variant
  /** z-index de la capa (0 dentro de un overlay/scroller propio). */
  zIndex?: number
}

export function SpaceBackground({ variant = "fixed", zIndex = 0 }: Props) {
  const base: CSSProperties = {
    zIndex,
    pointerEvents: "none",
    // Base oscura por si el canvas tarda 1 frame en pintar.
    background: "#050510",
  }

  const style: CSSProperties =
    variant === "sticky"
      ? {
          ...base,
          position: "sticky",
          top: 0,
          alignSelf: "stretch",
          flex: "none",
          width: "100%",
          height: "100vh",
          // No consume altura en el flujo → el contenido empieza arriba.
          marginBottom: "-100vh",
        }
      : {
          ...base,
          position: "fixed",
          inset: 0,
        }

  return (
    <div aria-hidden style={style}>
      <Starfield startedAt={null} />
    </div>
  )
}
