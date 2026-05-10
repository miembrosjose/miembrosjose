"use client"

// Drawer Netflix-style com hero + lista de episódios + player modal embutido.
// Equivalente a renderEpisodes + openVideoPlayer do area-prototipo.html.

import { useEffect, useRef, useState } from "react"
import { X, Play, Lock, ChevronLeft, ChevronRight, ArrowRight, ExternalLink } from "lucide-react"
import {
  buildConverteaiEmbedUrl,
  getEpisodesBySeason,
  type Episode,
} from "../_lib/episodes"
import {
  SEASONS,
  getEpisodeProgress,
  isEpisodeUnlocked,
  markEpisodeWatched,
  getWatchedCount,
  type EpisodeProgress,
  type Season,
} from "../_lib/seasons"
import { ALL_PREMIUM_PRODUCTS, KEY_TO_PRODUCT_NAME, type PremiumProduct } from "../_lib/products"
import { EpisodeComments } from "./EpisodeComments"
import { ReportModal, type ReportTarget } from "./ReportModal"
import { InlineEpisodeCheckout } from "./InlineEpisodeCheckout"
import { checkEpisodeAchievements } from "../_lib/achievements-unlock"
import styles from "./episodes-drawer.module.css"

type Props = {
  season: Season | null
  onClose: () => void
  onAdvanceSeason?: (nextSeason: Season) => void
  onOpenCheckout?: (p: PremiumProduct) => void
  ownedProductNames?: string[]
}

export function EpisodesDrawer({ season, onClose, onAdvanceSeason, onOpenCheckout, ownedProductNames }: Props) {
  const [progress, setProgress] = useState<EpisodeProgress>({})
  const [playingEp, setPlayingEp] = useState<Episode | null>(null)
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
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

  // Trava scroll do body
  useEffect(() => {
    if (!season) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [season])

  if (!season) return null

  const episodes = getEpisodesBySeason(season.num)
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
  const nextSeasonForAdvance: Season | null =
    isLastEpOfSeason && season && season.num < 4
      ? SEASONS.find((s) => s.num === season.num + 1) || null
      : null
  const canAdvanceSeason = !!nextSeasonForAdvance && !nextSeasonForAdvance.external

  function handleAdvanceSeason() {
    if (!playingEp || !season || !nextSeasonForAdvance) return
    // Marca episódio atual como assistido (libera próxima temporada via
    // PROGRESS_CHANGED_EVENT que o SeasonsCarousel escuta).
    markEpisodeWatched(season.num, playingEp.num)
    setProgress(getEpisodeProgress())
    checkEpisodeAchievements(season.num, episodes)
    setPlayingEp(null)
    if (onAdvanceSeason) {
      onAdvanceSeason(nextSeasonForAdvance)
    }
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
                  <div className={styles.studioMark}>COPY FILM&apos;S · TEMPORADA {season.num}</div>
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
                      const unlocked = isEpisodeUnlocked(season.num, ep.num, progress)
                      const isNew = ep.isNew && unlocked && !watchedThis
                      return (
                        <button
                          key={ep.num}
                          type="button"
                          className={`${styles.episodeRow} ${unlocked ? "" : styles.locked}`}
                          onClick={() => {
                            if (!unlocked) {
                              alert("Completa la clase anterior para desbloquear esta")
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
          <div className={styles.playerFullscreen} role="dialog" aria-label={`Episodio ${playingEp.num}`}>
            {/* Layout 2 colunas quando há checkout — esquerda: conteúdo; direita: checkout sticky */}
            <div className={hasCheckout ? styles.playerWithCheckout : undefined}>

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

                {playingEp.intro && (
                  <div
                    className={styles.playerIntro}
                    dangerouslySetInnerHTML={{ __html: playingEp.intro }}
                  />
                )}

                <div className={styles.playerVideoWrap}>
                  <iframe
                    key={playingEp.videoId}
                    src={buildConverteaiEmbedUrl(playingEp.videoId)}
                    allowFullScreen
                    referrerPolicy="origin"
                    title={`Episodio ${playingEp.num} — ${playingEp.title}`}
                  />
                </div>

                {playingEp.notes && (
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
                  {canAdvanceSeason && nextSeasonForAdvance ? (
                    <button
                      type="button"
                      className={`${styles.playerNavBtn} ${styles.playerNavBtnAdvance}`}
                      onClick={handleAdvanceSeason}
                      style={{ textAlign: "right" }}
                    >
                      <small style={{ textAlign: "right" }}>
                        Próxima temporada <ArrowRight size={12} style={{ display: "inline-block", verticalAlign: "middle" }} />
                      </small>
                      <span>
                        TEMPORADA {nextSeasonForAdvance.num} · {nextSeasonForAdvance.name}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.playerNavBtn}
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
                 * cf:owned-products-refresh quando user compra o produto). */}
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
                            <rect x="22" y="28" width="56" height="44" rx="3" fill="none" stroke="#c9a961" strokeWidth="2"/>
                            <path d="M 22 38 L 78 38" stroke="#c9a961" strokeWidth="1.5"/>
                            <circle cx="29" cy="33" r="1.5" fill="#c9a961"/>
                            <circle cx="35" cy="33" r="1.5" fill="#c9a961"/>
                            <circle cx="41" cy="33" r="1.5" fill="#c9a961"/>
                            <polygon points="44,52 58,60 44,68" fill="#c9a961"/>
                            <line x1="32" y1="78" x2="68" y2="78" stroke="#c9a961" strokeWidth="1.5"/>
                            <line x1="40" y1="82" x2="60" y2="82" stroke="#c9a961" strokeWidth="1.2" opacity="0.6"/>
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
                        <Lock size={56} color="#c9a961" strokeWidth={1.5} />
                      </div>
                      <div className="agent-info">
                        <div className="agent-type" style={{ color: "rgba(201,169,97,0.65)" }}>
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
