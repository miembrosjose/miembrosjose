"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  PANTALLA COMPLETA DE VERDAD
// ═══════════════════════════════════════════════════════════════════════════
//
// Envuelve un reproductor y le pone un botón de pantalla completa propio.
//
// ── POR QUÉ NO VALE EL BOTÓN DEL PROPIO VTURB ─────────────────────────────
// Porque hace una pantalla completa FALSA, por CSS: agranda el vídeo dentro
// de la página, deja la barra de desplazamiento y no gira el teléfono. Con la
// API del navegador, en cambio, el móvil se pone en horizontal y no queda
// nada de la página alrededor, que es lo que se espera al girar el teléfono
// para ver una reunión de dos horas.
//
// ── LAS TRES SITUACIONES QUE HAY QUE CUBRIR ───────────────────────────────
//   1. Navegadores con la API: pantalla completa real sobre el contenedor.
//   2. iPhone: Safari no deja poner en pantalla completa un contenedor, solo
//      el <video> nativo. Se busca ese vídeo —que VTurb esconde dentro de un
//      shadow DOM— y se le pide a él.
//   3. Si tampoco hay vídeo accesible: una pantalla completa fingida por CSS,
//      fijada a los cuatro bordes. No se usan `vw`/`dvh` porque iOS no los
//      recalcula bien al girar, y el vídeo quedaba cortado tras rotar.
//
// ── DE DÓNDE SALE ESTO ────────────────────────────────────────────────────
// De `LazyVideo`, en EpisodesDrawer, donde lleva funcionando en las
// temporadas. Aquí está extraído para que las grabaciones se comporten igual
// sin tocar lo que ya funciona. Cuando haya ocasión, las temporadas deberían
// pasar a usar ESTE, para que no haya dos copias que se separen con el
// tiempo.

import { useCallback, useEffect, useRef, useState } from "react"
import s from "./pantalla-completa.module.css"

/**
 * Busca un <video>, incluso dentro de un shadow DOM.
 *
 * VTurb encapsula su reproductor, así que un `querySelector("video")` normal
 * no lo encuentra: hay que bajar por cada shadow root.
 */
export function buscarVideo(raiz: ParentNode | null): HTMLVideoElement | null {
  if (!raiz) return null
  const directo = (raiz as Element).querySelector?.("video")
  if (directo) return directo as HTMLVideoElement
  const todos = (raiz as Element).querySelectorAll?.("*")
  if (todos) {
    for (const el of Array.from(todos)) {
      const sombra = (el as Element & { shadowRoot?: ShadowRoot | null }).shadowRoot
      if (sombra) {
        const hallado = buscarVideo(sombra)
        if (hallado) return hallado
      }
    }
  }
  return null
}

export function PantallaCompleta({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [real, setReal] = useState(false)
  /** La fingida por CSS, para iPhone. */
  const [fingida, setFingida] = useState(false)

  // ── Girar el teléfono al entrar, soltarlo al salir ──────────────────────
  useEffect(() => {
    function alCambiar() {
      const doc = document as Document & { webkitFullscreenElement?: Element | null }
      const activa =
        (document.fullscreenElement || doc.webkitFullscreenElement) === ref.current
      setReal(activa)

      const orientacion = (screen as unknown as {
        orientation?: { lock?: (o: string) => Promise<void>; unlock?: () => void }
      }).orientation
      if (!orientacion) return
      if (activa) {
        // Android lo respeta; iOS lo ignora por sistema y no pasa nada.
        orientacion.lock?.("landscape").catch(() => {})
      } else {
        try { orientacion.unlock?.() } catch { /* ignora */ }
      }
    }
    document.addEventListener("fullscreenchange", alCambiar)
    document.addEventListener("webkitfullscreenchange", alCambiar)
    return () => {
      document.removeEventListener("fullscreenchange", alCambiar)
      document.removeEventListener("webkitfullscreenchange", alCambiar)
    }
  }, [])

  // Con la fingida, el fondo no debe poder desplazarse.
  useEffect(() => {
    if (!fingida) return
    const antes = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = antes }
  }, [fingida])

  // ── La caja 16:9 centrada, medida sobre el contenedor REAL ──────────────
  // Calcularla con `vw`/`vh` fallaba en iOS: al girar, el sistema tarda en
  // dar las medidas nuevas y el vídeo quedaba descuadrado hasta tocar algo.
  // Por eso se mide el contenedor y se recalcula tras girar, dos veces.
  useEffect(() => {
    const activa = real || fingida
    const nodo = ref.current
    if (!activa || !nodo) return

    function encajar() {
      if (!nodo) return
      const ancho = nodo.clientWidth
      const alto = nodo.clientHeight
      if (!ancho || !alto) return
      let w: number
      let h: number
      if (ancho / alto > 16 / 9) {
        h = alto
        w = Math.round((alto * 16) / 9)
      } else {
        w = ancho
        h = Math.round((ancho * 9) / 16)
      }
      nodo.style.setProperty("--fc-ancho", `${w}px`)
      nodo.style.setProperty("--fc-alto", `${h}px`)
    }

    encajar()
    const t1 = setTimeout(encajar, 250)
    const t2 = setTimeout(encajar, 600)
    window.addEventListener("resize", encajar)
    window.addEventListener("orientationchange", encajar)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener("resize", encajar)
      window.removeEventListener("orientationchange", encajar)
      nodo.style.removeProperty("--fc-ancho")
      nodo.style.removeProperty("--fc-alto")
    }
  }, [real, fingida])

  const alternar = useCallback(() => {
    const nodo = ref.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => void })
      | null
    if (!nodo) return
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null
      webkitExitFullscreen?: () => void
    }

    if (fingida) { setFingida(false); return }

    const actual = document.fullscreenElement || doc.webkitFullscreenElement
    if (actual) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
      else doc.webkitExitFullscreen?.()
    } else if (nodo.requestFullscreen) {
      nodo.requestFullscreen().catch(() => {})
    } else if (nodo.webkitRequestFullscreen) {
      nodo.webkitRequestFullscreen()
    } else {
      // iPhone: el vídeo nativo sí puede, aunque el contenedor no.
      const v = buscarVideo(nodo) as
        | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
        | null
      if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen()
      else setFingida(true)
    }
  }, [fingida])

  // La tecla de escape sale de la fingida; de la real ya se encarga el
  // navegador. Sin esto, en la fingida no habría forma de salir salvo el
  // botón, y en un móvil girado el botón puede quedar donde no se ve.
  useEffect(() => {
    if (!fingida) return
    const alPulsar = (e: KeyboardEvent) => { if (e.key === "Escape") setFingida(false) }
    window.addEventListener("keydown", alPulsar)
    return () => window.removeEventListener("keydown", alPulsar)
  }, [fingida])

  const activa = real || fingida

  return (
    <div ref={ref} className={`${s.caja} ${fingida ? s.fingida : ""}`}>
      {/* Envoltorio propio para poder darle un tamaño EXACTO en pantalla
          completa. Sin él habría que apuntar al primer hijo, que es distinto
          según el formato del código de VTurb. */}
      <div className={s.dentro}>{children}</div>
      <button
        type="button"
        onClick={alternar}
        aria-label={activa ? "Salir de pantalla completa" : "Pantalla completa"}
        title={activa ? "Salir de pantalla completa" : "Pantalla completa"}
        className={s.boton}
      >
        {activa ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 3v3a3 3 0 0 1-3 3H3M21 9h-3a3 3 0 0 1-3-3V3M3 15h3a3 3 0 0 1 3 3v3M15 21v-3a3 3 0 0 1 3-3h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  )
}
