"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  EL REPRODUCTOR DE VTURB
// ═══════════════════════════════════════════════════════════════════════════
//
// Dos caminos, porque VTurb da dos formatos de código y no se portan igual:
//
//   NATIVO (<vturb-smartplayer>) — se carga su script en esta misma página.
//   IFRAME (embed.html) — el reproductor vive en un marco aparte. Se usa
//     cuando el código pegado es del formato clásico, que no trae elemento.
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
import { PantallaCompleta, buscarVideo } from "./PantallaCompleta"

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
    return (
      <PantallaCompleta>
        <PlayerNativo script={script!} elementoId={elementoId!} />
      </PantallaCompleta>
    )
  }

  if (iframe) {
    return (
      <PantallaCompleta>
        <iframe
          src={iframe}
          title={titulo}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      </PantallaCompleta>
    )
  }

  // Ni una cosa ni la otra: la fila está a medias. Se dice, en vez de dejar
  // un rectángulo negro que parece un vídeo que no carga.
  return (
    <div style={{ ...CAJA_16_9, display: "grid", placeItems: "center" }}>
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
 * El hueco para cuando no hay nada que montar.
 *
 * La proporción 16:9 ya no se pone aquí: la pone `PantallaCompleta`, que es
 * quien tiene que poder imponerle un tamaño exacto al reproductor cuando se
 * pasa a pantalla completa. Es también lo que hacen las temporadas.
 *
 * El precio es que una grabación vertical saldría con franjas a los lados.
 * Se asume: estas son grabaciones de reuniones, y una reunión es apaisada.
 */
const CAJA_16_9: React.CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
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
    // Llena la caja entera. Antes solo se le daba el ancho y él ponía su
    // altura, y en pantalla completa eso dejaba el vídeo como una banda: la
    // caja medía lo que debía y el reproductor no la seguía.
    host.innerHTML =
      `<vturb-smartplayer id="${elementoId}" ` +
      `style="display:block;width:100%;height:100%"></vturb-smartplayer>`

    // createElement y no innerHTML: un <script> escrito con innerHTML no se
    // ejecuta nunca. Y se vuelve a añadir en cada montaje para que el
    // reproductor se inicialice de nuevo al abrir otra grabación.
    const etiqueta = document.createElement("script")
    etiqueta.src = script
    etiqueta.async = true
    document.body.appendChild(etiqueta)

    // ── QUE EL CLIC QUE ABRIÓ LA GRABACIÓN SEA EL QUE LA ARRANCA ────────
    // Sin esto hacen falta DOS clics: uno para abrir y otro en el botón de
    // VTurb. El segundo sobra: quien pulsa sobre una grabación ya ha dicho
    // que quiere verla.
    //
    // El navegador deja reproducir con sonido durante unos segundos después
    // de un clic de verdad. El reproductor de VTurb tarda en aparecer, así
    // que se busca el <video> —que vive dentro de un shadow DOM— unas
    // cuantas veces y se le pide que arranque en cuanto exista.
    //
    // Si el navegador lo rechaza, no pasa nada: el botón de VTurb sigue ahí.
    // Por eso el fallo se traga y no se avisa de nada.
    let intentos = 0
    const reloj = window.setInterval(() => {
      intentos++
      const v = buscarVideo(host)
      if (v) {
        window.clearInterval(reloj)
        v.play().catch(() => { /* el navegador prefiere que lo pulsen */ })
      } else if (intentos > 40) {
        // Veinte segundos. Si no apareció, no va a aparecer.
        window.clearInterval(reloj)
      }
    }, 500)

    return () => {
      window.clearInterval(reloj)
      etiqueta.remove()
      host.innerHTML = ""
    }
  }, [script, elementoId])

  // Llena la caja que le da PantallaCompleta. Antes traía su propia altura
  // mínima y crecía con el contenido, y eso impedía fijarle un tamaño en
  // pantalla completa: el vídeo acababa como una banda estrecha.
  return (
    <div ref={hostRef} style={{ width: "100%", height: "100%", background: "#05050d" }} />
  )
}
