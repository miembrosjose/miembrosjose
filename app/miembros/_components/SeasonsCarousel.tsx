"use client"

// Carrossel horizontal de temporadas estilo Netflix.
// Migra renderSeasons.
//
// Click em temporada destravada → callback (Fase 5b vai abrir drawer).
// Click em externa (T5 Comunidad VIP) → window.open WhatsApp.
// Click em temporada bloqueada → toast informando.

import { useEffect, useRef, useState } from "react"
import { Lock } from "lucide-react"
import {
  SEASONS,
  getEpisodeProgress,
  isSeasonUnlocked,
  getWatchedCount,
  PROGRESS_CHANGED_EVENT,
  type Season,
  type EpisodeProgress,
} from "../_lib/seasons"
import { unlockAchievement } from "../_lib/achievements-unlock"
import styles from "./seasons.module.css"

type Props = {
  onOpenSeason?: (season: Season) => void
  onLockedClick?: (season: Season) => void
}

export function SeasonsCarousel({ onOpenSeason, onLockedClick }: Props) {
  // Hidrata progresso só no client (localStorage não existe no server)
  const [progress, setProgress] = useState<EpisodeProgress>({})
  useEffect(() => {
    setProgress(getEpisodeProgress())
    // Re-sync quando user assiste novo episódio em outra parte da UI
    // (ex: terminou último ep de T1 dentro do drawer → T2 desbloqueia aqui).
    function refresh() {
      setProgress(getEpisodeProgress())
    }
    window.addEventListener(PROGRESS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(PROGRESS_CHANGED_EVENT, refresh)
  }, [])

  function handleClick(season: Season) {
    if (season.external && season.redirectUrl) {
      // T5 — Comunidad VIP: dispara insignia "Círculo VIP" antes de abrir
      // o WhatsApp. Idempotente, no-op se já desbloqueada.
      unlockAchievement("vip_community")
      window.open(season.redirectUrl, "_blank", "noopener")
      return
    }
    if (!isSeasonUnlocked(season, progress)) {
      onLockedClick?.(season)
      return
    }
    onOpenSeason?.(season)
  }

  return (
    <div className={styles.carousel}>
      {SEASONS.map((season) => {
        const unlocked = isSeasonUnlocked(season, progress)
        const watched = getWatchedCount(season, progress)
        const total = season.episodes
        const pct = total > 0 ? Math.round((watched / total) * 100) : 0

        const epLabel = season.external
          ? `TEMPORADA ${season.num} · COMUNIDAD`
          : `TEMPORADA ${season.num} · ${total} EPS`

        return (
          <button
            key={season.num}
            type="button"
            className={`${styles.card} ${unlocked ? "" : styles.locked}`}
            onClick={() => handleClick(season)}
          >
            <div className={styles.thumb}>
              {season.videoBg && <SeasonVideo src={season.videoBg} />}
              {!season.videoBg && (
                <span className={styles.thumbEmoji}>{season.emoji}</span>
              )}
              {season.starter && (
                <span className={`${styles.badge} ${styles.starter}`}>EMPIEZA AQUÍ</span>
              )}
              {!unlocked && (
                <div className={styles.lockOverlay}>
                  <Lock size={32} />
                </div>
              )}
            </div>
            <div className={styles.info}>
              <div className={styles.epNum}>{epLabel}</div>
              <div className={styles.name}>{season.name}</div>
              {!season.external && (
                <>
                  <div className={styles.meta}>
                    <span>{pct}% completado</span>
                    <span>
                      {watched}/{total} eps
                    </span>
                  </div>
                  <div className={styles.progress}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                </>
              )}
              {season.external && (
                <div className={styles.meta}>
                  <span>Acceso directo</span>
                  <span>Grupo VIP</span>
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Vídeo de fundo do card de temporada — comportamento split por device:
//  - Desktop (com mouse hover): vídeo parado no frame 1, toca no
//    onMouseEnter, pausa + reset no onMouseLeave. User só "paga" CPU
//    quando demonstra interesse passando mouse em cima.
//  - Mobile (sem hover): IntersectionObserver com threshold alto (0.7+) —
//    apenas o card mais centralizado no viewport toca. Demais ficam
//    parados. Resolve jank de scroll vertical (hero → carrossel).
//
// Antes: todos os 5 cards rodavam autoplay quando entravam no viewport
// (threshold 0.25), causando spike de CPU/GPU + jank em mobile.
function SeasonVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    // Detecta device com hover real (desktop com mouse). Mobile + tablet
    // touch retornam false. matchMedia é suportado em todo browser moderno.
    const hasHover =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches

    if (hasHover) {
      // Desktop: handlers de mouse cuidam do play/pause via JSX. Aqui só
      // garante que o vídeo está parado no frame 1 quando montou.
      video.currentTime = 0
      return
    }

    // Mobile: só toca quando >70% do card está visível (= card central
    // do carrossel snap). Demais cards permanecem no frame 1.
    if (typeof IntersectionObserver === "undefined") {
      // Fallback pra browsers super antigos: comportamento conservador
      // (parado). Browsers modernos sempre têm IntersectionObserver.
      video.currentTime = 0
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > 0.7) {
          video.play().catch(() => {})
        } else {
          video.pause()
          video.currentTime = 0
        }
      },
      // Multiple thresholds pra detecção fina de "qual está mais visível"
      { threshold: [0, 0.5, 0.7, 1] },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  // Handlers desktop hover — mobile ignora silenciosamente
  const handleMouseEnter = () => {
    ref.current?.play().catch(() => {})
  }

  const handleMouseLeave = () => {
    const video = ref.current
    if (video) {
      video.pause()
      video.currentTime = 0
    }
  }

  return (
    <video
      ref={ref}
      className={styles.video}
      muted
      loop
      playsInline
      preload="metadata"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}
