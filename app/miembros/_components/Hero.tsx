"use client"

// Hero da home com vídeo de fundo cinematográfico.
//
// Comportamento:
//  - Fundo estilo Netflix: reproduz MUTED em LOOP sempre que o Hero está
//    visível (não congela mais no último frame).
//  - Quando user clica "Saltar Intro" no overlay, callback síncrono no shell
//    aciona video.muted=false + video.play() — gesture válido permite áudio.
//  - Se o autoplay for bloqueado (Modo Bajo Consumo iOS / navegador embebido),
//    pinta um frame-poster (#t=0.1 + seek) em vez de fundo preto.
//  - IntersectionObserver pausa o vídeo quando o Hero sai do viewport (perf) e
//    re-toca ao voltar.

import { Play, Info } from "lucide-react"
import { forwardRef, useEffect, useRef } from "react"
import { HERO_VIDEO_URL } from "../_lib/hero-media"
import styles from "./hero.module.css"

type HeroProps = {
  badge?: string
  title?: string
  description?: string
  progressLabel?: string
  progressPct?: number
  /** Texto do botão primário — "Continuar Viendo" se started, "Asistir" se não. */
  continueLabel?: string
  onContinue?: () => void
  onMoreInfo?: () => void
  visible?: boolean
}

export const Hero = forwardRef<HTMLVideoElement, HeroProps>(function Hero(
  {
    badge = "EN DESTACADO",
    title,
    description = "Durante mucho tiempo olvidaste quién eras para poder llegar hasta aquí. Pero el tiempo del olvido ha concluido. La activación ha comenzado y la frecuencia de los 144,000 vuelve a resonar en aquellos que eligieron estar presentes durante la gran transición.",
    progressLabel = "Temporada — · Episodio —",
    progressPct = 0,
    continueLabel = "Continuar Viendo",
    onContinue,
    onMoreInfo,
    visible = true,
  },
  ref
) {
  // Internal ref usado quando o caller não passa um forwardRef
  const localVideoRef = useRef<HTMLVideoElement | null>(null)

  // Compatível com forwardRef + uso interno: aplica em ambos
  const setRefs = (el: HTMLVideoElement | null) => {
    localVideoRef.current = el
    if (typeof ref === "function") ref(el)
    else if (ref) ref.current = el
  }

  useEffect(() => {
    const video = localVideoRef.current
    if (!video) return

    // Pinta um frame (poster) quando o autoplay é bloqueado (ex: Modo Bajo
    // Consumo do iOS, navegador embebido). Sem isto o fundo fica PRETO. Um
    // pequeno seek força o decode+paint do frame.
    function paintFirstFrame() {
      if (!video) return
      try {
        if (video.readyState >= 1) {
          video.currentTime = Math.min(0.1, (video.duration || 1) - 0.01)
        }
      } catch {
        // ignora
      }
    }

    // Fundo estilo Netflix: reproduz muted em loop. Não congela mais no último
    // frame (antes usava flags de sessão que deixavam o vídeo parado ao voltar).
    function playMuted() {
      if (!video) return
      video.muted = true
      video.play().catch(() => {
        // Autoplay bloqueado (Bajo Consumo iOS / embebido) → ao menos frame
        paintFirstFrame()
      })
    }

    if (video.readyState >= 1) {
      playMuted()
    } else {
      video.addEventListener("loadedmetadata", playMuted, { once: true })
    }

    // IntersectionObserver: pausa o vídeo quando hero sai do viewport
    // (user scrollou pra baixo pra ver temporadas/forum) pra economizar
    // CPU/GPU, e re-toca quando volta a ficar visível.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!video) return
        if (entry.isIntersecting) {
          if (video.paused) playMuted()
        } else {
          if (!video.paused) video.pause()
        }
      },
      { threshold: 0.1 }, // pausa quando <10% do hero está visível
    )
    observer.observe(video)

    return () => {
      video.removeEventListener("loadedmetadata", playMuted)
      observer.disconnect()
    }
  }, [])

  // Toca o vídeo SEMPRE que o Hero fica visível, não importa como o intro
  // terminou (pulado com gesture OU deixado rodar até o fim). Se o autoplay
  // for bloqueado (Bajo Consumo iOS), pelo menos garante o frame-poster.
  useEffect(() => {
    const video = localVideoRef.current
    if (!video || !visible) return
    if (video.paused) {
      video.muted = true
      video.play().catch(() => {
        // Autoplay bloqueado → força o primeiro frame pra não ficar preto
        try {
          if (video.readyState >= 1) {
            video.currentTime = Math.min(0.1, (video.duration || 1) - 0.01)
          }
        } catch {
          // ignora
        }
      })
    }
  }, [visible])

  return (
    <section
      className={styles.hero}
      style={{ display: visible ? "flex" : "none" }}
    >
      <div className={styles.bg}>
        <video
          ref={setRefs}
          muted
          loop
          playsInline
          preload="auto"
        >
          {/* #t=0.1 → iOS usa esse frame como poster quando o autoplay é
              bloqueado (Bajo Consumo/embebido), evitando fundo preto. */}
          <source src={`${HERO_VIDEO_URL}#t=0.1`} type="video/mp4" />
        </video>
      </div>

      <div className={styles.content}>
        <span className={styles.badge}>{badge}</span>
        <h1 className={styles.title}>
          {title ? (
            <>{title}</>
          ) : (
            <>
              Los 144000
            </>
          )}
        </h1>
        <p className={styles.description}>{description}</p>

        <div className={styles.progressInfo}>
          <span>{progressLabel}</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }} />
          </div>
          <span>{Math.round(progressPct)}%</span>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={onContinue}>
            <Play size={18} fill="currentColor" />
            {continueLabel}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onMoreInfo}>
            <Info size={18} />
            Más Información
          </button>
        </div>
      </div>
    </section>
  )
})
