"use client"

// Drawer Netflix-style com hero + lista de episódios + player modal embutido.
// Equivalente a renderEpisodes + openVideoPlayer.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { X, Play, Lock, ChevronLeft, ChevronRight, ArrowRight, ExternalLink } from "lucide-react"
import {
  buildConverteaiEmbedUrl,
  getEpisodesBySeason,
  type Episode,
} from "../_lib/episodes"
import {
  getEpisodeProgress,
  isEpisodeUnlocked,
  markEpisodeWatched,
  getWatchedCount,
  type EpisodeProgress,
  type Season,
} from "../_lib/seasons"
import { useEpisodes, type DbEpisode } from "../_lib/use-episodes"
import { useAuth } from "../_lib/auth-context"
import { EpisodeBlocksView } from "./EpisodeBlocksView"
import EpisodioBloque from "@/components/EpisodioBloque"
import EpisodioArchivo from "@/components/EpisodioArchivo"
import MeditationPlayer from "@/components/MeditationPlayer"
import { getSeason1Archivo } from "../_lib/season1-archivos"
import { getSeason1Meditaciones } from "../_lib/season1-meditaciones"
import JerarquiaGalactica from "@/components/JerarquiaGalactica"
import AvisoIniciatico from "@/components/AvisoIniciatico"
import { ALL_PREMIUM_PRODUCTS, KEY_TO_PRODUCT_NAME, type PremiumProduct } from "../_lib/products"
import { EpisodeComments } from "./EpisodeComments"
import { ReportModal, type ReportTarget } from "./ReportModal"
import { InlineEpisodeCheckout } from "./InlineEpisodeCheckout"
import { checkEpisodeAchievements } from "../_lib/achievements-unlock"
import { SpaceBackground } from "./SpaceBackground"
import styles from "./episodes-drawer.module.css"

type Props = {
  season: Season | null
  /** Si se pasa, al abrir la temporada se reproduce directamente ese episodio
   *  (usado por "Continuar viendo" para retomar el último video). */
  initialEpisodeNum?: number | null
  onClose: () => void
  onAdvanceSeason?: (nextSeason: Season) => void
  /** Abre el portal de integración (1..4) de ESTA temporada al terminar el último ep. */
  onOpenIntegration?: (id: number) => void
  onOpenCheckout?: (p: PremiumProduct) => void
  ownedProductNames?: string[]
}

export function EpisodesDrawer({ season, initialEpisodeNum, onClose, onOpenIntegration, onOpenCheckout, ownedProductNames }: Props) {
  const { isAdmin } = useAuth()
  const [progress, setProgress] = useState<EpisodeProgress>({})
  const [playingEp, setPlayingEp] = useState<Episode | null>(null)
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  // Compuerta del aviso iniciático (Episodio 2): se reinicia al cambiar de episodio.
  const [gatePassed, setGatePassed] = useState(false)
  const playerScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setGatePassed(false)
  }, [playingEp?.id])
  // Al pasar la compuerta, subir al inicio del episodio (el video), no dejarlo abajo.
  useEffect(() => {
    if (!gatePassed) return
    requestAnimationFrame(() => {
      playerScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
      try { window.scrollTo({ top: 0, behavior: "smooth" }) } catch {}
    })
  }, [gatePassed])
  const notesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!season) return
    setProgress(getEpisodeProgress())
  }, [season])

  // Esc fecha drawer ou player (player tem prioridade)
  useEffect(() => {
    if (!season) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (playingEp) closePlayer()
      else onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [season, playingEp, onClose])

  // Trava scroll do body — versión iOS-safe. En iOS Safari, `overflow:hidden`
  // en el body NO impide el scroll táctil del fondo (el usuario "mueve la
  // pantalla de fondo"). Se fija el body con position:fixed + top negativo para
  // conservar la posición, y se restaura al cerrar.
  useEffect(() => {
    if (!season) return
    const scrollY = window.scrollY
    const body = document.body
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"
    body.style.overflow = "hidden"
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.left = prev.left
      body.style.right = prev.right
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      window.scrollTo(0, scrollY)
    }
  }, [season])

  // Episódios do banco (Supabase) — só se a season tem id (vem do banco).
  // Quando season vem do fallback estático (sem id), cai no array hardcoded.
  const seasonId = (season as Season & { id?: string })?.id ?? null
  const { episodes: dbEpisodes } = useEpisodes(seasonId ?? null)

  const episodes = useMemo<Episode[]>(() => {
    if (!season) return []
    if (seasonId && dbEpisodes.length > 0) {
      return dbEpisodes.map(dbEpToEpisode)
    }
    return getEpisodesBySeason(season.num)
  }, [season, seasonId, dbEpisodes])

  // "Continuar viendo": al abrir la temporada con un episodio inicial, reproduce
  // directamente ese episodio (el último no completado). Se dispara al cambiar de
  // temporada/episodio inicial o cuando los episodios terminan de cargar. Cerrar
  // el player NO re-dispara (las deps no cambian), así el usuario puede navegar.
  useEffect(() => {
    if (!season || initialEpisodeNum == null || episodes.length === 0) return
    const target = episodes.find((e) => e.num === initialEpisodeNum)
    if (target?.videoId) setPlayingEp(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, initialEpisodeNum, episodes.length])

  if (!season) return null
  const watched = getWatchedCount(season, progress)
  const total = season.episodes
  const pct = total > 0 ? Math.round((watched / total) * 100) : 0
  const firstUnplayed = episodes.find((e) => !progress[`s${season.num}_e${e.num}`])
  const continueEp = firstUnplayed || episodes[0]

  function openPlayer(ep: Episode) {
    if (!ep.videoId) {
      alert(`▶ Episodio ${ep.num} aún no tiene video disponible`)
      return
    }
    setPlayingEp(ep)
  }

  function closePlayer() {
    if (playingEp) {
      // Marca assistido ao fechar
      markEpisodeWatched(season!.num, playingEp.num)
      setProgress(getEpisodeProgress())
      checkEpisodeAchievements(season!.num, episodes)
    }
    setPlayingEp(null)
  }

  function navigate(direction: 1 | -1) {
    if (!playingEp) return
    const target = episodes.find((e) => e.num === playingEp.num + direction)
    if (!target?.videoId) return
    // Marca o atual como visto antes de mover
    markEpisodeWatched(season!.num, playingEp.num)
    setProgress(getEpisodeProgress())
    checkEpisodeAchievements(season!.num, episodes)
    setPlayingEp(target)
  }

  const prevEp = playingEp ? episodes.find((e) => e.num === playingEp.num - 1) : null
  const nextEp = playingEp ? episodes.find((e) => e.num === playingEp.num + 1) : null

  // Pode oferecer "próxima temporada" quando está no último ep da T1/T2/T3.
  // T4 → T5 não conta porque T5 é grupo de WhatsApp externo.
  const isLastEpOfSeason = playingEp != null && nextEp == null && episodes.length > 0
  // Nombre del portal de integración de cada temporada.
  const INTEGRATION_NAME: Record<number, string> = {
    1: "Portal del Compromiso",
    2: "Portal de la Desprogramación Cósmica",
    3: "Portal de la Memoria y la Dignidad",
    4: "Portal de la Alquimia Solar",
  }
  // Al terminar el último episodio de T1–T4, el botón lleva a la INTEGRACIÓN de
  // esta temporada (ya no a la siguiente temporada).
  const showIntegrationBtn = isLastEpOfSeason && !!season && season.num >= 1 && season.num <= 4 && !!onOpenIntegration

  function handleGoIntegration() {
    if (!playingEp || !season) return
    // Marca el último episodio como visto (completa la temporada → habilita la
    // integración y desbloquea Misión/Contacto al llegar a T4).
    markEpisodeWatched(season.num, playingEp.num)
    setProgress(getEpisodeProgress())
    checkEpisodeAchievements(season.num, episodes)
    setPlayingEp(null)
    onOpenIntegration?.(season.num)
  }

  return (
    <>
      {/* Modal Netflix com hero + lista de episódios — escondido quando player aberto */}
      {!playingEp && (
        <div
          className={styles.drawer}
          role="dialog"
          aria-label={`Temporada ${season.num}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          {/* Fondo de estrellas — sticky, pinnado al top del scroller para
              cubrir toda la altura (márgenes y detrás del modal transparente). */}
          <SpaceBackground variant="sticky" zIndex={0} />
          <div className={styles.modal}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X size={22} />
            </button>
              <div className={styles.hero}>
                <div className={styles.heroBg} style={{ background: season.gradient }} />
                {season.videoBg && (
                  <video className={styles.heroVideo} autoPlay muted loop playsInline preload="metadata">
                    <source src={season.videoBg} type="video/mp4" />
                  </video>
                )}
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                  <div className={styles.studioMark}>Los 144000 · TEMPORADA {season.num}</div>
                  <h1 className={styles.heroTitle}>{season.name}</h1>
                  <div className={styles.heroMetaLine}>
                    {total > 0 && (
                      <>
                        <div className={styles.heroProgressBar}>
                          <div className={styles.heroProgressFill} style={{ width: `${pct}%` }} />
                        </div>
                        <span>
                          {watched}/{total} eps · {pct}%
                        </span>
                      </>
                    )}
                  </div>
                  <div className={styles.heroActions}>
                    {continueEp && (
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => openPlayer(continueEp)}
                      >
                        <Play size={20} fill="currentColor" />
                        {watched > 0 ? "Continuar" : "Comenzar"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <section className={styles.episodesSection}>
                <header className={styles.episodesHeader}>
                  <h2>Episodios</h2>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    {total} EPS
                  </span>
                </header>

                {episodes.length === 0 ? (
                  <div className={styles.empty}>
                    Esta temporada se desbloquea al completar la anterior
                  </div>
                ) : (
                  <div className={styles.episodesList}>
                    {episodes.map((ep) => {
                      const watchedThis = !!progress[`s${season.num}_e${ep.num}`]
                      // Admin: todos los episodios desbloqueados (revisión/gestión).
                      const unlocked = isAdmin || isEpisodeUnlocked(season.num, ep.num, progress)
                      const isNew = ep.isNew && unlocked && !watchedThis
                      return (
                        <button
                          key={ep.num}
                          type="button"
                          className={`${styles.episodeRow} ${unlocked ? "" : styles.locked}`}
                          onClick={() => {
                            if (!unlocked) {
                              alert("Completa el episodio anterior para desbloquear este.")
                              return
                            }
                            openPlayer(ep)
                          }}
                        >
                          <div className={styles.epNumber}>{ep.num}</div>
                          <div
                            className={styles.epThumb}
                            style={ep.thumb ? { backgroundImage: `url(${ep.thumb})` } : undefined}
                          >
                            <div className={styles.epThumbProgress} style={{ width: watchedThis ? "100%" : "0%" }} />
                            <div className={styles.epThumbOverlay}>
                              {unlocked ? <Play size={36} fill="white" /> : <Lock size={32} color="white" />}
                            </div>
                          </div>
                          <div className={styles.epInfo}>
                            <div className={styles.epHeader}>
                              <h4 className={styles.epTitle}>{ep.title}</h4>
                              {isNew && <span className={styles.epBadgeNew}>NUEVO</span>}
                            </div>
                            <p className={styles.epDesc}>{ep.desc}</p>
                          </div>
                          <div className={styles.epDuration}>{ep.duration}</div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
          </div>
        </div>
      )}

      {/* Player FULLSCREEN separado — overlay sólido cobrindo a tela inteira */}
      {playingEp && (() => {
        // Resolve checkout inline (se o episódio tiver inlineCheckoutKey).
        // Renderiza componente nativo InlineEpisodeCheckout = mesma logica
        // do ProductCheckoutModal da Tienda Premium: BuyButton tenta 1-click
        // primeiro, fallback Stripe Elements deferred so se 1-click falhar.
        const checkoutProductName = playingEp.inlineCheckoutKey
          ? KEY_TO_PRODUCT_NAME[playingEp.inlineCheckoutKey]
          : null
        const checkoutProduct = checkoutProductName
          ? ALL_PREMIUM_PRODUCTS.find((p) => p.name === checkoutProductName)
          : null
        const hasCheckout = !!checkoutProduct

        return (
          <div ref={playerScrollRef} className={styles.playerFullscreen} role="dialog" aria-label={`Episodio ${playingEp.num}`}>
            {/* Fondo de estrellas — pinnado al top del scroller para llenar los
                márgenes vacíos de la vista de notas. Contenido va con z-index encima. */}
            <SpaceBackground variant="sticky" zIndex={0} />
            {/* Layout 2 colunas quando há checkout — esquerda: conteúdo; direita: checkout sticky */}
            <div className={hasCheckout ? styles.playerWithCheckout : undefined} style={{ position: "relative", zIndex: 1 }}>

              {/* ── Coluna principal (sempre presente) ─────────────── */}
              <div className={hasCheckout ? styles.playerMain : undefined}>
                <header className={styles.playerHeader}>
                  <div>
                    <div className={styles.playerEpNum}>
                      EP {String(playingEp.num).padStart(2, "0")} · TEMPORADA {season.num}
                    </div>
                    <h2 className={styles.playerTitle}>{playingEp.title}</h2>
                  </div>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={closePlayer}
                    aria-label="Cerrar player"
                    style={{ position: "static" }}
                  >
                    <X size={22} />
                  </button>
                </header>

                {/* Aviso iniciático (compuerta) — solo "Los 144.000: frecuencia y responsabilidad".
                    Al tocar "Continuar" se revela el contenido (video, bloques, comentarios). */}
                {playingEp.title === "Los 144.000: frecuencia y responsabilidad" && !gatePassed && (
                  <AvisoIniciatico onContinue={() => setGatePassed(true)} />
                )}

                {(playingEp.title !== "Los 144.000: frecuencia y responsabilidad" || gatePassed) && (
                <>

                {/* BLOCKS acima do vídeo (admin-editáveis, vêm do banco). */}
                {playingEp.id && (
                  <EpisodeBlocksView episodeId={playingEp.id} position="above_video" />
                )}

                {/* Intro legado (array estático) — só renderiza se não tem blocks above. */}
                {playingEp.intro && !playingEp.id && (
                  <div
                    className={styles.playerIntro}
                    dangerouslySetInnerHTML={{ __html: playingEp.intro }}
                  />
                )}

                <LazyVideo className={styles.playerVideoWrap}>
                  {(() => {
                    const raw = playingEp.videoId
                    // 0. Snippet del web component <vturb-smartplayer> → player
                    //    NATIVO (fullscreen real vía Fullscreen API).
                    if (raw && /<vturb-smartplayer/i.test(raw)) {
                      return <VturbSmartPlayer key={raw} snippet={raw} />
                    }
                    // 1. Snippet completo do ConverteAI/VTurb (HTML+script) →
                    //    extrai accountId/videoId e usa URL embed.
                    const converteaiEmbed = tryExtractConverteaiEmbed(raw)
                    if (converteaiEmbed) {
                      return (
                        <iframe
                          key={converteaiEmbed}
                          src={converteaiEmbed}
                          allowFullScreen
                          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                          referrerPolicy="origin"
                          title={`Episodio ${playingEp.num} — ${playingEp.title}`}
                        />
                      )
                    }
                    // 2. Arquivo direto (.mp4/.webm/.mov) → <video> HTML5
                    if (isDirectVideoUrl(raw)) {
                      return (
                        <video
                          key={raw}
                          src={raw}
                          controls
                          playsInline
                          autoPlay
                          style={{ width: "100%", height: "100%" }}
                        />
                      )
                    }
                    // 3. URL http(s) qualquer (YouTube, Vimeo, Bunny, etc) →
                    //    <iframe src={url}>
                    if (isExternalEmbedUrl(raw)) {
                      return (
                        <iframe
                          key={raw}
                          src={raw}
                          allowFullScreen
                          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
                          referrerPolicy="strict-origin-when-cross-origin"
                          title={`Episodio ${playingEp.num} — ${playingEp.title}`}
                        />
                      )
                    }
                    // 4. Fallback: assume ID curto ConverteAI legado
                    return (
                      <iframe
                        key={raw}
                        src={buildConverteaiEmbedUrl(raw)}
                        allowFullScreen
                        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                        referrerPolicy="origin"
                        title={`Episodio ${playingEp.num} — ${playingEp.title}`}
                      />
                    )
                  })()}
                </LazyVideo>

                {/* Bloques José + Sergel DESPUÉS del video — anclado por TÍTULO
                    (no por número) para no romperse si se renumera el episodio. */}
                {playingEp.title === "Los 144.000: frecuencia y responsabilidad" && (
                  <EpisodioBloque part="sergel" />
                )}

                {/* Bloque "La Jerarquía Galáctica" (Temporada 2) — anclado por
                    TÍTULO para no romperse si se renumera el episodio. */}
                {playingEp.title === "La jerarquía galáctica" && (
                  <JerarquiaGalactica />
                )}

                {/* Archivos de Sergel — Temporada 1, episodios 3 a 7. Mismo
                    lenguaje visual que el Cap. 2 (EpisodioBloque). Selección por
                    nº de episodio + palabras clave del título. Ep. 1 y 2 intactos. */}
                {season.num === 1 && (() => {
                  const archivo = getSeason1Archivo(playingEp.num, playingEp.title)
                  return archivo ? <EpisodioArchivo content={archivo} /> : null
                })()}

                {/* Meditaciones complementarias (debajo del archivo). Incluidas
                    (con membresía) y/o premium (bloqueadas), según el episodio. */}
                {season.num === 1 && (() => {
                  const meds = getSeason1Meditaciones(playingEp.num, playingEp.title)
                  if (!meds.length) return null
                  return (
                    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 1.5rem 3.5rem" }}>
                      {meds.map((m) => (
                        <MeditationPlayer key={m.id} meditation={m} />
                      ))}
                    </div>
                  )
                })()}

                {/* BLOCKS abaixo do vídeo (admin-editáveis). */}
                {playingEp.id && (
                  <EpisodeBlocksView episodeId={playingEp.id} position="below_video" />
                )}

                {/* Notes legado (array estático) — só renderiza se não tem blocks below. */}
                {playingEp.notes && !playingEp.id && (
                  <div
                    ref={notesRef}
                    className={styles.playerNotes}
                    dangerouslySetInnerHTML={{ __html: playingEp.notes }}
                  />
                )}

                <div className={styles.playerNav}>
                  <button
                    type="button"
                    className={styles.playerNavBtn}
                    onClick={() => navigate(-1)}
                    disabled={!prevEp?.videoId}
                  >
                    <small>
                      <ChevronLeft size={12} style={{ display: "inline-block", verticalAlign: "middle" }} /> Anterior
                    </small>
                    <span>
                      {prevEp?.videoId
                        ? `EP ${String(prevEp.num).padStart(2, "0")} · ${prevEp.title}`
                        : "— inicio de temporada —"}
                    </span>
                  </button>
                  {showIntegrationBtn && season ? (
                    <button
                      type="button"
                      className={`${styles.playerNavBtn} ${styles.playerNavBtnAdvance}`}
                      onClick={handleGoIntegration}
                      style={{ textAlign: "right" }}
                    >
                      <small style={{ textAlign: "right" }}>
                        Pasar a la integración <ArrowRight size={12} style={{ display: "inline-block", verticalAlign: "middle" }} />
                      </small>
                      <span>
                        {INTEGRATION_NAME[season.num]}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.playerNavBtn} ${styles.playerNavBtnNext}`}
                      onClick={() => navigate(1)}
                      disabled={!nextEp?.videoId}
                      style={{ textAlign: "right" }}
                    >
                      <small style={{ textAlign: "right" }}>
                        Siguiente <ChevronRight size={12} style={{ display: "inline-block", verticalAlign: "middle" }} />
                      </small>
                      <span>
                        {nextEp?.videoId
                          ? `EP ${String(nextEp.num).padStart(2, "0")} · ${nextEp.title}`
                          : "— final de temporada —"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Agent card — visual identico ao Estratega/Copywriter, mas com
                 * 2 estados: UNLOCKED (clickable, abre agente) ou LOCKED
                 * (icone cadeado + "Bloqueado", muda automatico via
                 * app:owned-products-refresh quando user compra o produto). */}
                {playingEp.agentUrl && playingEp.agentProductName && (() => {
                  const isOwned = ownedProductNames?.includes(playingEp.agentProductName) ?? false
                  const agentDesc = playingEp.desc || "Tu copiloto especializado para esta etapa."
                  const lockedCardStyle: React.CSSProperties = {
                    cursor: "default",
                    pointerEvents: "auto",
                  }
                  const lockedCtaStyle: React.CSSProperties = {
                    background: "rgba(80, 80, 90, 0.4)",
                    borderColor: "rgba(120, 120, 130, 0.5)",
                    color: "rgba(245, 245, 247, 0.6)",
                    cursor: "default",
                  }
                  if (isOwned) {
                    return (
                      <a
                        href={playingEp.agentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="agent-card"
                        style={{ marginTop: "1.5rem" }}
                      >
                        <div className="agent-icon">
                          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <rect x="22" y="28" width="56" height="44" rx="3" fill="none" stroke="#6D4A9B" strokeWidth="2"/>
                            <path d="M 22 38 L 78 38" stroke="#6D4A9B" strokeWidth="1.5"/>
                            <circle cx="29" cy="33" r="1.5" fill="#6D4A9B"/>
                            <circle cx="35" cy="33" r="1.5" fill="#6D4A9B"/>
                            <circle cx="41" cy="33" r="1.5" fill="#6D4A9B"/>
                            <polygon points="44,52 58,60 44,68" fill="#6D4A9B"/>
                            <line x1="32" y1="78" x2="68" y2="78" stroke="#6D4A9B" strokeWidth="1.5"/>
                            <line x1="40" y1="82" x2="60" y2="82" stroke="#6D4A9B" strokeWidth="1.2" opacity="0.6"/>
                          </svg>
                        </div>
                        <div className="agent-info">
                          <div className="agent-type">Agente GPT · Mini VSL</div>
                          <h4>{playingEp.agentProductName}</h4>
                          <p>{agentDesc}</p>
                        </div>
                        <span className="agent-cta">
                          Abrir Agente
                          <ExternalLink size={14} />
                        </span>
                      </a>
                    )
                  }
                  return (
                    <div
                      className="agent-card"
                      style={{ marginTop: "1.5rem", ...lockedCardStyle }}
                      aria-disabled="true"
                    >
                      <div className="agent-icon" style={{ opacity: 0.55 }}>
                        <Lock size={56} color="#6D4A9B" strokeWidth={1.5} />
                      </div>
                      <div className="agent-info">
                        <div className="agent-type" style={{ color: "rgba(109,74,155,0.65)" }}>
                          Agente GPT · Bloqueado
                        </div>
                        <h4 style={{ opacity: 0.85 }}>{playingEp.agentProductName}</h4>
                        <p style={{ opacity: 0.85 }}>
                          Compra este agente para desbloquearlo. Acceso inmediato — sin recargar la página.
                        </p>
                      </div>
                      <span className="agent-cta" style={lockedCtaStyle}>
                        <Lock size={12} />
                        Bloqueado
                      </span>
                    </div>
                  )
                })()}

                <EpisodeComments
                  seasonNum={season.num}
                  episodeNum={playingEp.num}
                  onReport={(commentId) => setReportTarget({ type: "episode_comment", id: commentId })}
                />
                </>
                )}
              </div>

              {/* ── Coluna checkout (sticky na direita) ───────────────
               * InlineEpisodeCheckout = mesma logica do ProductCheckoutModal:
               * BuyButton tenta 1-click primeiro, so abre form se falhar. */}
              {hasCheckout && checkoutProduct && (
                <div className={styles.playerCheckoutSide}>
                  <InlineEpisodeCheckout product={checkoutProduct} />
                </div>
              )}

            </div>
          </div>
        )
      })()}

      <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />
    </>
  )
}

// Converte um registro do banco pro tipo Episode esperado pelo drawer.
// Trata video_url como videoId (player decide entre embed/HTML5 video).
function dbEpToEpisode(db: DbEpisode): Episode {
  return {
    id: db.id,
    num: db.num,
    videoId: db.video_url || "",
    title: db.title,
    desc: db.description || "",
    duration: "",
    thumb: db.thumb_url || undefined,
  }
}

// Monta el player SOLO cuando entra en viewport (IntersectionObserver). Con el
// autoplay del vturb activado, el video arranca al deslizar hasta él. El espacio
// se reserva con aspect-ratio en .playerVideoWrap para que el layout no salte.
// Busca un <video> incluso dentro de shadow DOM (VTurb puede encapsularlo).
function findVideoDeep(root: ParentNode | null): HTMLVideoElement | null {
  if (!root) return null
  const direct = (root as Element).querySelector?.("video")
  if (direct) return direct as HTMLVideoElement
  const els = (root as Element).querySelectorAll?.("*")
  if (els) {
    for (const el of Array.from(els)) {
      const sr = (el as Element & { shadowRoot?: ShadowRoot | null }).shadowRoot
      if (sr) {
        const found = findVideoDeep(sr)
        if (found) return found
      }
    }
  }
  return null
}

function LazyVideo({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  const [isFs, setIsFs] = useState(false)
  // "Pantalla completa" por CSS para iOS (Safari no permite fullscreen real de
  // un contenedor; solo del <video> nativo, que VTurb no siempre expone).
  const [pseudoFs, setPseudoFs] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === "undefined") {
      setShow(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  // Pantalla completa REAL (Fullscreen API) sobre el contenedor del video, con
  // nuestro propio botón. El botón nativo del player VTurb hace un fullscreen
  // "falso" por CSS (deja la barra de scroll y no rota el móvil). Con la API real
  // el navegador muestra solo el video, sin nada de la página, y en móvil
  // bloqueamos la orientación en horizontal (Android; iOS lo ignora por sistema).
  useEffect(() => {
    function onFs() {
      const doc = document as Document & { webkitFullscreenElement?: Element | null }
      const active = (document.fullscreenElement || doc.webkitFullscreenElement) === ref.current
      setIsFs(active)
      const orientation = (screen as unknown as {
        orientation?: { lock?: (o: string) => Promise<void>; unlock?: () => void }
      }).orientation
      if (!orientation) return
      if (active) orientation.lock?.("landscape").catch(() => {})
      else {
        try {
          orientation.unlock?.()
        } catch {
          /* ignora */
        }
      }
    }
    document.addEventListener("fullscreenchange", onFs)
    document.addEventListener("webkitfullscreenchange", onFs)
    return () => {
      document.removeEventListener("fullscreenchange", onFs)
      document.removeEventListener("webkitfullscreenchange", onFs)
    }
  }, [])

  // Bloquea el scroll del body mientras el pseudo-fullscreen (iOS) está activo.
  useEffect(() => {
    if (!pseudoFs) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [pseudoFs])

  // Calcula la caja 16:9 centrada según el tamaño REAL del contenedor (en vez de
  // vw/vh, que iOS no recalcula bien al rotar). Se recalcula al rotar/redimensionar.
  useEffect(() => {
    const active = isFs || pseudoFs
    const node = ref.current
    if (!active || !node) return
    function fit() {
      if (!node) return
      const cw = node.clientWidth
      const ch = node.clientHeight
      if (!cw || !ch) return
      let w: number
      let h: number
      if (cw / ch > 16 / 9) {
        h = ch
        w = Math.round((ch * 16) / 9)
      } else {
        w = cw
        h = Math.round((cw * 9) / 16)
      }
      node.style.setProperty("--fs-w", `${w}px`)
      node.style.setProperty("--fs-h", `${h}px`)
    }
    fit()
    // iOS actualiza las dimensiones tarde tras rotar → recalcular con delay.
    const t1 = setTimeout(fit, 250)
    const t2 = setTimeout(fit, 600)
    window.addEventListener("resize", fit)
    window.addEventListener("orientationchange", fit)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener("resize", fit)
      window.removeEventListener("orientationchange", fit)
      node.style.removeProperty("--fs-w")
      node.style.removeProperty("--fs-h")
    }
  }, [isFs, pseudoFs])

  function toggleFs() {
    const node = ref.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => void })
      | null
    if (!node) return
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null
      webkitExitFullscreen?: () => void
    }

    // Si estamos en pseudo-fullscreen (iOS), salir.
    if (pseudoFs) {
      setPseudoFs(false)
      return
    }

    const current = document.fullscreenElement || doc.webkitFullscreenElement
    if (current) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
      else doc.webkitExitFullscreen?.()
    } else if (node.requestFullscreen) {
      node.requestFullscreen().catch(() => {})
    } else if (node.webkitRequestFullscreen) {
      node.webkitRequestFullscreen()
    } else {
      // iOS: 1º intentar fullscreen nativo del <video> (incl. shadow DOM);
      //      si no hay video accesible, 2º pseudo-fullscreen por CSS.
      const v = findVideoDeep(node) as
        | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
        | null
      if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen()
      else setPseudoFs(true)
    }
  }

  const fsActive = isFs || pseudoFs

  return (
    <div ref={ref} className={`${className ?? ""}${pseudoFs ? ` ${styles.pseudoFs}` : ""}`}>
      {show ? children : null}
      {show && (
        <button
          type="button"
          onClick={toggleFs}
          aria-label={fsActive ? "Salir de pantalla completa" : "Pantalla completa"}
          title={fsActive ? "Salir de pantalla completa" : "Pantalla completa"}
          className="absolute right-2 top-2 z-[10000] flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-black/55 text-white/90 backdrop-blur-sm transition-colors hover:border-[#6D4A9B] hover:text-white"
        >
          {fsActive ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M9 3v3a3 3 0 0 1-3 3H3M21 9h-3a3 3 0 0 1-3-3V3M3 15h3a3 3 0 0 1 3 3v3M15 21v-3a3 3 0 0 1 3-3h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}

function isDirectVideoUrl(s: string): boolean {
  if (!s) return false
  if (!/^https?:\/\//i.test(s.trim())) return false
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(s)
}

function isExternalEmbedUrl(s: string): boolean {
  if (!s) return false
  if (!/^https?:\/\//i.test(s.trim())) return false
  return !isDirectVideoUrl(s)
}

// Detecta snippet completo do ConverteAI/VTurb (HTML+JS colado pelo admin).
// Padrão: scripts.converteai.net/<accountId>/players/<videoId>/v4/player.js
// Retorna a URL embed correta ou null.
function tryExtractConverteaiEmbed(s: string): string | null {
  if (!s) return null
  const m = s.match(
    /scripts\.converteai\.net\/([a-f0-9-]{8,})\/players\/([a-f0-9-]{8,})\/v4\/(?:player|embed)/i,
  )
  if (!m) return null
  return `https://scripts.converteai.net/${m[1]}/players/${m[2]}/v4/embed.html`
}

// Player NATIVO de VTurb: renderiza el web component <vturb-smartplayer> + carga
// su script (el embed oficial que guarda la base). A diferencia del iframe
// embed.html, este usa la Fullscreen API real en la propia página, así que el
// botón de pantalla completa funciona de verdad (no un "fullscreen falso" dentro
// del iframe). El script es cross-origin permitido por CSP (scripts.converteai.net).
function VturbSmartPlayer({ snippet }: { snippet: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const idMatch = snippet.match(/id=["'](vid-[a-z0-9]+)["']/i)
    const srcMatch = snippet.match(/src=["'](https:\/\/scripts\.converteai\.net\/[^"']+\.js)["']/i)
    const playerId = idMatch?.[1]
    const scriptSrc = srcMatch?.[1]
    if (!playerId || !scriptSrc) return

    host.innerHTML = `<vturb-smartplayer id="${playerId}" style="display:block;width:100%;height:100%"></vturb-smartplayer>`
    // createElement (no innerHTML) para que el script se ejecute; se re-agrega en
    // cada episodio para que el player se inicialice de nuevo.
    const script = document.createElement("script")
    script.src = scriptSrc
    script.async = true
    document.body.appendChild(script)

    return () => {
      script.remove()
      host.innerHTML = ""
    }
  }, [snippet])

  return <div ref={hostRef} className={styles.vturbHost} />
}
