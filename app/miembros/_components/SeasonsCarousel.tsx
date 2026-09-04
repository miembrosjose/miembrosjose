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
import { openExternal } from "../_lib/url-helpers"
import { unlockAchievement } from "../_lib/achievements-unlock"
import styles from "./seasons.module.css"

type SeasonLike = Season & { id?: string; is_locked?: boolean; checkout_url?: string | null }

type Props = {
  // Temporadas + acceso vienen del shell (una sola instancia de useSeasons /
  // useSeasonAccess en toda la home → evita fetches duplicados al Worker).
  seasons: SeasonLike[]
  hasAccess: (id?: string | null) => boolean
  onOpenSeason?: (season: Season) => void
  onLockedClick?: (season: Season) => void
  // Portales del camino: ingreso (antes de T1) y objetivos (tras T4). Las
  // integraciones NO son cards: se disparan al entrar a la siguiente temporada.
  onOpenIngreso?: () => void
  onOpenObjetivos?: () => void
}

export function SeasonsCarousel({
  seasons,
  hasAccess,
  onOpenSeason,
  onLockedClick,
  onOpenIngreso,
  onOpenObjetivos,
}: Props) {
  // Videos de portada de los portales (Ingreso/Objetivos), gestionados desde
  // admin vía site_texts. Se usan como cover de la tarjeta en el carrusel.
  const [portalMedia, setPortalMedia] = useState<{ ingreso?: string; objetivos?: string }>({})
  useEffect(() => {
    let cancelled = false
    fetch("/api/site-texts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.overrides) return
        const ov = d.overrides as Record<string, string>
        setPortalMedia({ ingreso: ov["portal.ingreso.video"] || "", objetivos: ov["portal.objetivos.video"] || "" })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

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
    // Temporada 5 — Portal de Misión "Objetivos de los 144.000". No abre el
    // drawer de episodios ni un enlace externo: el shell muestra el portal.
    if (season.num === 5) {
      onOpenSeason?.(season)
      return
    }
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

  // Card de una temporada real (T1-T4): mantiene el diseño de video/episodios.
  function renderSeasonCard(season: SeasonLike) {
    const unlocked = isSeasonUnlocked(season, progress, seasons)
    const watched = getWatchedCount(season, progress)
    const total = season.episodes
    const pct = total > 0 ? Math.round((watched / total) * 100) : 0
    const isCommerciallyLocked = !!season.is_locked && !hasAccess(season.id)
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
        onClick={() => handleClick(season)}
      >
        <div
          className={styles.thumb}
          style={season.gradient ? { background: season.gradient } : undefined}
        >
          {season.videoBg && <SeasonVideo src={season.videoBg} />}
          {!season.videoBg && <span className={styles.thumbEmoji}>{season.emoji}</span>}
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
          {!season.external ? (
            <>
              <div className={styles.meta}>
                <span>{pct}% completado</span>
                <span>{watched}/{total} eps</span>
              </div>
              <div className={styles.progress}>
                <div className={styles.progressFill} style={{ width: `${pct}%` }} />
              </div>
            </>
          ) : (
            <div className={styles.meta}>
              <span>Acceso directo</span>
              <span>Grupo VIP</span>
            </div>
          )}
        </div>
      </button>
    )
  }

  // Card de un PORTAL del camino (ingreso, integración, objetivos, umbral).
  function renderPortalCard(cfg: {
    key: string
    variant?: "gold" | "soon"
    badge: string
    badgeGold?: boolean
    epLabel: string
    name: string
    emoji: string
    gradient: string
    metaA: string
    metaB: string
    media?: string
    onClick?: () => void
  }) {
    const variantClass =
      cfg.variant === "gold" ? styles.portalGold : cfg.variant === "soon" ? styles.portalSoon : ""
    return (
      <button
        key={cfg.key}
        type="button"
        className={`${styles.card} ${styles.portalCard} ${variantClass}`}
        onClick={cfg.variant === "soon" ? undefined : cfg.onClick}
      >
        <div className={styles.thumb} style={{ background: cfg.gradient }}>
          {cfg.media
            ? <SeasonVideo src={cfg.media} />
            : <span className={styles.thumbEmoji}>{cfg.emoji}</span>}
          <span className={`${styles.badge} ${styles.portalBadge} ${cfg.badgeGold ? styles.portalBadgeGold : ""}`}>
            {cfg.badge}
          </span>
        </div>
        <div className={styles.info}>
          <div className={styles.epNum}>{cfg.epLabel}</div>
          <div className={styles.name}>{cfg.name}</div>
          <div className={styles.divider} />
          <div className={styles.meta}>
            <span>{cfg.metaA}</span>
            <span>{cfg.metaB}</span>
          </div>
        </div>
      </button>
    )
  }

  const bySeason = (n: number) => seasons.find((s) => s.num === n) as SeasonLike | undefined
  const violet = "linear-gradient(135deg, #14142a 0%, #6D4A9B 100%)"
  const gold = "linear-gradient(135deg, #1a1608 0%, #6D4A9B 55%, #c9a86b 100%)"
  const dim = "linear-gradient(135deg, #0c0c18 0%, #23233a 100%)"

  const s1 = bySeason(1), s2 = bySeason(2), s3 = bySeason(3), s4 = bySeason(4)

  return (
    <div className={styles.carousel}>
      {renderPortalCard({
        key: "ingreso", badge: "PORTAL", epLabel: "PORTAL DE INGRESO",
        name: "Antes del Llamado", emoji: "🚪", gradient: violet,
        metaA: "Ceremonia", metaB: "Entrar", media: portalMedia.ingreso, onClick: onOpenIngreso,
      })}

      {s1 && renderSeasonCard(s1)}
      {s2 && renderSeasonCard(s2)}
      {s3 && renderSeasonCard(s3)}
      {s4 && renderSeasonCard(s4)}

      {renderPortalCard({
        key: "objetivos", variant: "gold", badge: "MISIÓN", badgeGold: true,
        epLabel: "PORTAL DE MISIÓN", name: "Objetivos de Los 144.000",
        emoji: "✵", gradient: gold, metaA: "7 Objetivos", metaB: "Entrar",
        media: portalMedia.objetivos, onClick: onOpenObjetivos,
      })}

      {renderPortalCard({
        key: "umbral", variant: "soon", badge: "PRÓXIMAMENTE", epLabel: "EL SIGUIENTE UMBRAL",
        name: "El Umbral del Contacto", emoji: "🔒", gradient: dim,
        metaA: "En preparación", metaB: "Pronto",
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
