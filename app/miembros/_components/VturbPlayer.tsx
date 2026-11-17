"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  EL REPRODUCTOR DE VTURB
// ═══════════════════════════════════════════════════════════════════════════
//
// Dos caminos, porque VTurb da dos formatos de código y no se portan igual:
//
//   NATIVO (<vturb-smartplayer>) — se carga su script en esta misma página.
//     La pantalla completa es la de verdad, la del navegador.
//
//   IFRAME (embed.html) — el reproductor vive en un marco aparte.
//     Más aislado, pero el botón de pantalla completa agranda dentro del
//     marco en vez de ocupar la pantalla. Se usa cuando el código pegado es
//     del formato clásico, que no trae elemento nativo.
//
// ── NADA DE INYECTAR EL CÓDIGO PEGADO ─────────────────────────────────────
// Este componente no recibe HTML: recibe direcciones ya construidas por el
// servidor a partir de los identificadores. Lo que se pegó en el panel no
// llega hasta aquí. Ver lib/red/vturb.ts.
//
// ── POR QUÉ SE MONTA SOLO CUANDO SE VE ────────────────────────────────────
// Cargar el script de VTurb trae su propio peso y empieza a hablar con sus
// servidores. En una rejilla de cuarenta grabaciones, montar cuarenta
// reproductores para que se vea uno es la diferencia entre una pantalla que
// abre y una que se arrastra. Quien use esto debe montarlo únicamente cuando
// la grabación esté de verdad en pantalla.

import { useEffect, useRef } from "react"

type Props = {
  /** Dirección del script del reproductor nativo. */
  script: string | null
  /** Dirección del reproductor en iframe. */
  iframe: string | null
  /** Identificador del elemento nativo (vid-xxxx), si el código lo traía. */
  elementoId: string | null
  titulo: string
}

export function VturbPlayer({ script, iframe, elementoId, titulo }: Props) {
  const nativo = !!script && !!elementoId

  if (nativo) {
    return <PlayerNativo script={script!} elementoId={elementoId!} />
  }

  if (iframe) {
    return (
      <div style={CAJA}>
        <iframe
          src={iframe}
          title={titulo}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    )
  }

  // Ni una cosa ni la otra: la fila está a medias. Se dice, en vez de dejar
  // un rectángulo negro que parece un vídeo que no carga.
  return (
    <div style={{ ...CAJA, display: "grid", placeItems: "center" }}>
      <p
        style={{
          color: "#8b90b4",
          fontSize: "0.78rem",
          textAlign: "center",
          padding: "1.5rem",
          margin: 0,
        }}
      >
        Esta grabación no tiene reproductor guardado todavía.
      </p>
    </div>
  )
}

/**
 * 16:9 para el iframe, que no tiene tamaño propio.
 *
 * El reproductor NATIVO no usa esta caja: fija él su altura según la forma
 * real del vídeo. Si se le impusiera 16:9, una grabación vertical saldría
 * recortada por arriba y por abajo.
 */
const CAJA: React.CSSProperties = {
  position: "relative",
  width: "100%",
  paddingTop: "56.25%",
  background: "#05050d",
  borderRadius: 12,
  overflow: "hidden",
}

function PlayerNativo({ script, elementoId }: { script: string; elementoId: string }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    // El elemento se escribe a mano —no con JSX— porque <vturb-smartplayer>
    // es un elemento propio de VTurb que React no conoce, y su script lo
    // busca en el documento por identificador.
    //
    // Solo se le da el ancho. La altura la pone VTurb con la proporción del
    // vídeo de verdad.
    host.innerHTML =
      `<vturb-smartplayer id="${elementoId}" ` +
      `style="display:block;width:100%"></vturb-smartplayer>`

    // createElement y no innerHTML: un <script> escrito con innerHTML no se
    // ejecuta nunca. Y se vuelve a añadir en cada montaje para que el
    // reproductor se inicialice de nuevo al abrir otra grabación.
    const etiqueta = document.createElement("script")
    etiqueta.src = script
    etiqueta.async = true
    document.body.appendChild(etiqueta)

    return () => {
      etiqueta.remove()
      host.innerHTML = ""
    }
  }, [script, elementoId])

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        // Mientras VTurb arranca, el hueco ya tiene el color del fondo en vez
        // de dar un salto blanco. `minHeight` evita que la tarjeta colapse a
        // cero antes de que el reproductor se dibuje.
        minHeight: 180,
        background: "#05050d",
        borderRadius: 12,
        overflow: "hidden",
      }}
    />
  )
}
