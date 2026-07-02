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
  getEpisodeProgress,
  isSeasonUnlocked,
  getWatchedCount,
  PROGRESS_CHANGED_EVENT,
  type Season,
  type EpisodeProgress,
} from "../_lib/seasons"
import { useSeasons } from "../_lib/use-seasons"
import { useSeasonAccess } from "../_lib/use-season-access"
import { openExternal } from "../_lib/url-helpers"
import { unlockAchievement } from "../_lib/achievements-unlock"
import styles from "./seasons.module.css"

type Props = {
  onOpenSeason?: (season: Season) => void
  onLockedClick?: (season: Season) => void
}

export function SeasonsCarousel({ onOpenSeason, onLockedClick }: Props) {
  // Temporadas vêm do banco via useSeasons (fallback no array estático
  // SEASONS quando user não está logado ou banco vazio). Re-fetcha
  // automaticamente quando admin cria/edita/remove via modal.
  const { seasons } = useSeasons()
  const { hasAccess } = useSeasonAccess()

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

  function handleClick(season: Season & { id?: string; is_locked?: boolean; checkout_url?: string | null }) {
    if (season.external && season.redirectUrl) {
      // T5 — Comunidad VIP: dispara insignia "Círculo VIP" antes de abrir
      // o WhatsApp. Idempotente, no-op se já desbloqueada.
      unlockAchievement("vip_community")
      openExternal(season.redirectUrl)
      return
    }
    // Bloqueio admin (configurável): se a temporada está bloqueada E o user
    // não tem acesso liberado, redireciona pro checkout configurado.
    if (season.is_locked && !hasAccess(season.id) && season.checkout_url) {
      openExternal(season.checkout_url)
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
      {seasons.map((season) => {
        const unlocked = isSeasonUnlocked(season, progress)
        const watched = getWatchedCount(season, progress)
        const total = season.episodes
        const pct = total > 0 ? Math.round((watched / total) * 100) : 0

        // Bloqueio comercial (admin definiu como bloqueada E o user não tem acesso)
        const seasonAny = season as Season & {
          id?: string
          is_locked?: boolean
          checkout_url?: string | null
        }
        const isCommerciallyLocked =
          !!seasonAny.is_locked && !hasAccess(seasonAny.id)

        const epLabel = season.external
          ? `TEMPORADA ${season.num} · COMUNIDAD`
          : `TEMPORADA ${season.num} · ${total} EPS`

        return (
          <button
            key={season.id || season.num}
            type="button"
            data-num={String(season.num).padStart(2, "0")}
            className={`${styles.card} ${unlocked ? "" : styles.locked}`}
            style={
              isCommerciallyLocked
                ? { filter: "grayscale(1) brightness(0.7)", cursor: "pointer" }
                : undefined
            }
            onClick={() => handleClick(seasonAny)}
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
              <div className={styles.divider} />
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
  // Detecta se é IMAGEM (upload via Mídia → convertido pra WebP) ou VÍDEO.
  // Admin pode subir foto OU vídeo; só vídeo precisa do player com autoplay.
  const isImage = /\.(webp|png|jpe?g|gif|avif)(\?|$)/i.test(src)
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (isImage) return
    const video = ref.current
    if (!video) return

    // Pinta o primeiro frame como "poster" mesmo pausado. iOS Safari com
    // preload=metadata deixa o vídeo preto/vazio até tocar — por isso os
    // banners não apareciam no mobile. Um pequeno seek força o decode +
    // paint do frame. Complementa o media fragment (#t=0.1) no <source>.
    const paintPoster = () => {
      try {
        if (video.paused && video.readyState >= 1 && video.currentTime === 0) {
          video.currentTime = 0.1
        }
      } catch {
        /* alguns browsers rejeitam seek antes de metadata; ignora */
      }
    }
    video.addEventListener("loadedmetadata", paintPoster)
    video.addEventListener("loadeddata", paintPoster)
    // Tenta já (caso metadata tenha carregado antes do listener)
    paintPoster()

    const cleanupPoster = () => {
      video.removeEventListener("loadedmetadata", paintPoster)
      video.removeEventListener("loadeddata", paintPoster)
    }

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
      return cleanupPoster
    }

    // Mobile: só toca quando >70% do card está visível (= card central
    // do carrossel snap). Demais cards permanecem no frame 1.
    if (typeof IntersectionObserver === "undefined") {
      // Fallback pra browsers super antigos: comportamento conservador
      // (parado). Browsers modernos sempre têm IntersectionObserver.
      video.currentTime = 0
      return cleanupPoster
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > 0.7) {
          video.play().catch(() => {})
        } else {
          video.pause()
          // Volta ao frame-poster (0.1) em vez de 0 preto no iOS
          video.currentTime = 0.1
        }
      },
      // Multiple thresholds pra detecção fina de "qual está mais visível"
      { threshold: [0, 0.5, 0.7, 1] },
    )
    observer.observe(video)
    return () => {
      observer.disconnect()
      cleanupPoster()
    }
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

  if (isImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={styles.video} loading="lazy" />
  }

  // Media fragment #t=0.1 → iOS Safari usa esse frame como poster quando o
  // vídeo está pausado (senão fica preto até tocar). Não anexa se já houver #.
  const posterSrc = src.includes("#") ? src : `${src}#t=0.1`

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
      <source src={posterSrc} type="video/mp4" />
    </video>
  )
}
