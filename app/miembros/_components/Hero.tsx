"use client"

// Hero da home com vídeo de fundo cinematográfico.
//
// Comportamento (paridade com area-prototipo.html):
//  - Vídeo começa MUTED + PAUSED (autoplay com som não funciona sem gesture)
//  - Quando user clica "Saltar Intro" no overlay, callback síncrono no shell
//    aciona video.muted=false + video.play() — gesture válido permite áudio
//  - Vídeo SEM loop: ao terminar, fica no último frame
//  - sessionStorage 'copyfilms_hero_ended' rastreia quando terminou —
//    próxima remount (após navegar pra outra view e voltar) restaura último
//    frame em vez de recomeçar
//  - sessionStorage 'copyfilms_intro_seen' indica que intro já foi pulada;
//    se sim, vídeo inicia tocando muted (sem som — não tem gesture aqui)

import { Play, Info } from "lucide-react"
import { forwardRef, useEffect, useRef } from "react"
import styles from "./hero.module.css"

const HERO_VIDEO_URL = "https://cdn.SEU_DOMINIO.com/bannermembros.mp4"
const SESSION_KEY_INTRO = "copyfilms_intro_seen"
const SESSION_KEY_ENDED = "copyfilms_hero_ended"

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
    description = "El método cinematográfico para crear embudos que convierten. Continúa donde lo dejaste y avanza hacia el siguiente capítulo.",
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

    let endedFlag = false
    let introSeen = false
    try {
      endedFlag = sessionStorage.getItem(SESSION_KEY_ENDED) === "1"
      introSeen = sessionStorage.getItem(SESSION_KEY_INTRO) === "1"
    } catch {
      // sessionStorage pode falhar em modo privado
    }

    function applyState() {
      if (!video) return
      if (endedFlag) {
        // Restaura último frame: seek pra fim, mantém muted+paused
        try {
          video.currentTime = Math.max(0, (video.duration || 0) - 0.05)
        } catch {
          // ignora
        }
        video.muted = true
        video.pause()
      } else if (introSeen) {
        // Intro já foi pulada nesta sessão — pode tocar muted (sem gesture pra som)
        video.muted = true
        video.play().catch(() => {
          // Silencioso — vídeo pode falhar a tocar sem motivo claro
        })
      } else {
        // Intro ainda vai rodar — vídeo paused, esperando gesture do "Saltar Intro"
        video.muted = true
        video.pause()
      }
    }

    // Aguarda metadata pra saber duration (pra seek no último frame quando endedFlag)
    if (video.readyState >= 1) {
      applyState()
    } else {
      video.addEventListener("loadedmetadata", applyState, { once: true })
    }

    // IntersectionObserver: pausa o vídeo quando hero sai do viewport
    // (user scrollou pra baixo pra ver temporadas/forum). Decode contínuo de
    // 6.31 MB de WebM em background era a maior fonte de jank no scroll.
    // Re-toca quando volta a ficar visível, MAS não interfere se endedFlag
    // (vídeo já chegou no último frame, deve ficar parado lá).
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!video) return
        if (entry.isIntersecting) {
          // Volta visível — re-toca SE não terminou ainda E intro foi seen
          if (!endedFlag && introSeen && video.paused) {
            video.play().catch(() => {})
          }
        } else {
          // Saiu do viewport — pausa pra economizar CPU/GPU
          if (!video.paused) video.pause()
        }
      },
      { threshold: 0.1 }, // pausa quando <10% do hero está visível
    )
    observer.observe(video)

    return () => {
      video.removeEventListener("loadedmetadata", applyState)
      observer.disconnect()
    }
  }, [])

  function handleEnded() {
    try {
      sessionStorage.setItem(SESSION_KEY_ENDED, "1")
    } catch {
      // ignora
    }
    // Vídeo já fica no último frame por default sem loop — só persistimos a flag
  }

  return (
    <section
      className={styles.hero}
      style={{ display: visible ? "flex" : "none" }}
    >
      <div className={styles.bg}>
        <video
          ref={setRefs}
          muted
          playsInline
          preload="auto"
          onEnded={handleEnded}
          poster=""
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
      </div>

      <div className={styles.content}>
        <span className={styles.badge}>{badge}</span>
        <h1 className={styles.title}>
          {title ? (
            <>{title}</>
          ) : (
            <>
              Copy <em>Film&apos;s</em>
              <br />
              Entrenamiento
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
