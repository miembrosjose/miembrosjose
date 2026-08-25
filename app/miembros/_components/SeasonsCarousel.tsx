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
    if (!isSeasonUnlocked(season, progress, seasons)) {
      onLockedClick?.(season)
      return
    }
    onOpenSeason?.(season)
  }

  return (
    <div className={styles.carousel}>
      {seasons.map((season) => {
        const unlocked = isSeasonUnlocked(season, progress, seasons)
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
            <div
              className={styles.thumb}
              // Respaldo: gradiente da temporada por trás do vídeo. Se o vídeo
              // não pinta (ex: iPhone em Modo de Baixo Consumo), a capa fica
              // com cor em vez de preto.
              style={season.gradient ? { background: season.gradient } : undefined}
            >
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

    // CRÍTICO iOS: força o atributo muted no DOM. React nem sempre reflete a
    // prop `muted` como atributo real, e iOS SÓ autoreproduz vídeos muted.
    // Sem isto, play() é bloqueado e o thumb fica preto.
    video.muted = true
    video.defaultMuted = true
    video.setAttribute("muted", "")
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")

    // iOS NÃO pinta o 1º frame de um vídeo pausado — fica preto até dar play.
    // Este helper força a decodificação de um frame com um micro-seek assim que
    // há metadata (readyState>=1), garantindo que apareça imagem mesmo se o
    // autoplay for bloqueado (ex: Modo de Baixo Consumo do iPhone).
    const paintFirstFrame = () => {
      try {
        if (video.readyState >= 1 && video.currentTime < 0.05) {
          video.currentTime = 0.1
        }
      } catch {
        /* ignora */
      }
    }

    // Toca o vídeo muted (autoplay permitido em iOS por estar muted+inline).
    // Se for bloqueado, ao menos pinta um frame (paintFirstFrame).
    const playMuted = () => {
      video.muted = true
      const p = video.play()
      if (p && typeof p.catch === "function") {
        p.catch(paintFirstFrame)
      }
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
      const onReady = () => paintFirstFrame()
      video.addEventListener("loadeddata", onReady)
      paintFirstFrame()
      return () => video.removeEventListener("loadeddata", onReady)
    }

    // Mobile: quando o card entra no viewport, tenta tocar; ao sair, pausa.
    // Além disso, assim que carregar dados (loadeddata) reforça o play/paint —
    // o IntersectionObserver costuma disparar ANTES da metadata estar pronta,
    // então o 1º play() era rejeitado e o thumb ficava preto no iPhone.
    let visible = true
    const onLoaded = () => {
      if (visible) playMuted()
      else paintFirstFrame()
    }
    video.addEventListener("loadeddata", onLoaded)
    video.addEventListener("canplay", onLoaded)
    // Força o download começar (alguns iOS ignoram preload="auto" até interagir).
    try {
      video.load()
    } catch {
      /* ignora */
    }

    if (typeof IntersectionObserver === "undefined") {
      playMuted()
      return () => {
        video.removeEventListener("loadeddata", onLoaded)
        video.removeEventListener("canplay", onLoaded)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (entry.isIntersecting) {
          playMuted()
        } else {
          video.pause()
        }
      },
      { threshold: [0, 0.25] }, // toca assim que aparece no viewport
    )
    observer.observe(video)
    return () => {
      observer.disconnect()
      video.removeEventListener("loadeddata", onLoaded)
      video.removeEventListener("canplay", onLoaded)
    }
  }, [isImage])

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
      preload="auto"
      // iOS antigo precisa do atributo com prefixo pra tocar inline (sem
      // entrar em fullscreen). React repassa atributos desconhecidos.
      {...{ "webkit-playsinline": "true" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <source src={posterSrc} type="video/mp4" />
    </video>
  )
}
