"use client"

// Modal "Más información" estilo Netflix — hero video + título por cima +
// barra de progresso + botões round + metadata grid embaixo. Substitui o
// Modal genérico que era plano e sem identidade.

import { useEffect, useMemo, useState } from "react"
import { Play, ThumbsUp, X } from "lucide-react"
import { api } from "../_lib/api"
import { computeResumePoint, computeOverallProgressPct } from "../_lib/seasons"
import { getEpisodesBySeason } from "../_lib/episodes"
import styles from "./series-info-modal.module.css"

const HERO_IMAGE_URL = "https://cdn.SEU_DOMINIO.com/info.webp"

type Props = {
  open: boolean
  onClose: () => void
  /** Callback quando "Continuar/Asistir" é clicado — recebe a (T,E) onde
   *  parar/começar pra abrir o player no episódio certo. */
  onContinue?: (season: number, episode: number) => void
}

export function SeriesInfoModal({
  open,
  onClose,
  onContinue,
}: Props) {
  const [resume, setResume] = useState({ season: 1, episode: 1, hasStarted: false })

  // Recalcula sempre que abre (progress pode ter mudado entre aberturas)
  useEffect(() => {
    if (open) setResume(computeResumePoint())
  }, [open])

  const progressLabel = `Temporada ${resume.season} · Episodio ${resume.episode}`
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const progressPct = useMemo(() => computeOverallProgressPct(), [open])

  const buttonLabel = resume.hasStarted ? "Continuar" : "Asistir"

  // Episódio onde o user vai retomar (ou o primeiro se ainda não começou)
  const currentEpisode = useMemo(() => {
    const eps = getEpisodesBySeason(resume.season)
    return eps.find((e) => e.num === resume.episode) || eps[0] || null
  }, [resume.season, resume.episode])

  // Likes da série — acumulados de todos os users (server-side via /api/series/likes)
  const [likeCount, setLikeCount] = useState(0)
  const [likedByMe, setLikedByMe] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    api<{ count: number; liked_by_me: boolean }>("/api/series/likes")
      .then((data) => {
        if (cancelled) return
        setLikeCount(data.count || 0)
        setLikedByMe(!!data.liked_by_me)
      })
      .catch(() => {
        // silencioso — botão fica como tava
      })
    return () => {
      cancelled = true
    }
  }, [open])

  async function toggleLike() {
    if (likeBusy) return
    setLikeBusy(true)
    // Optimistic
    const newLiked = !likedByMe
    const newCount = likeCount + (newLiked ? 1 : -1)
    setLikedByMe(newLiked)
    setLikeCount(newCount)
    try {
      await api<{ liked: boolean; count: number }>("/api/series/likes", {
        method: "POST",
      }).then((data) => {
        setLikedByMe(!!data.liked)
        setLikeCount(data.count || 0)
      })
    } catch {
      // Revert
      setLikedByMe(!newLiked)
      setLikeCount(likeCount)
    } finally {
      setLikeBusy(false)
    }
  }
  // Esc fecha + trava scroll do body
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  function handleContinue() {
    onClose()
    onContinue?.(resume.season, resume.episode)
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-label="Más información"
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
          <X size={20} />
        </button>

        {/* Hero estático — imagem em vez de vídeo (era só frame inicial mesmo) */}
        <div className={styles.hero}>
          <img
            className={styles.heroVideo}
            src={HERO_IMAGE_URL}
            alt=""
            loading="eager"
            decoding="async"
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.studioMark}>[BRAND_NAME] · Estudio</span>
            <h2 className={styles.title}>
              [BRAND_NAME]
              <br />
              Entrenamiento
            </h2>

            <div className={styles.progressRow}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
                />
              </div>
              <span>{progressLabel}</span>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.btnContinue} onClick={handleContinue}>
                <Play size={20} fill="currentColor" />
                {buttonLabel}
              </button>
              <button
                type="button"
                className={`${styles.btnRound} ${likedByMe ? styles.btnRoundActive : ""}`}
                aria-label="Me gusta"
                aria-pressed={likedByMe}
                title={likedByMe ? "Quitar me gusta" : "Me gusta"}
                onClick={toggleLike}
                disabled={likeBusy}
              >
                <ThumbsUp size={18} fill="none" />
                {likeCount > 0 && (
                  <span className={styles.btnRoundCount}>
                    {likeCount > 999 ? `${Math.floor(likeCount / 100) / 10}k` : likeCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Metadata grid */}
        <div className={styles.info}>
          <div className={styles.infoMain}>
            <div className={styles.metaLine}>
              <span>2026</span>
              <span>5 temporadas</span>
              <span className={styles.hdBadge}>HD</span>
              <span className={styles.ageRating}>+18</span>
            </div>

            <div className={styles.episodeBlock}>
              <h3 className={styles.episodeLabel}>
                T{resume.season}:E{resume.episode}
                {currentEpisode?.title ? ` "${currentEpisode.title}"` : ""}
              </h3>
              <p className={styles.description}>
                El método para crear embudos gamificados que convierten. Domina los
                Agentes GPTs, construye tu estructura con producción de contenido
                audiovisual cinematográfico y entra en la comunidad VIP.
              </p>
            </div>
          </div>

          <aside className={styles.infoAside}>
            <div className={styles.asideGroup}>
              <span className={styles.asideLabel}>Elenco: </span>
              <span className={styles.asideValue}>Michael</span>
            </div>
            <div className={styles.asideGroup}>
              <span className={styles.asideLabel}>Géneros: </span>
              <span className={styles.asideValue}>
                Marketing Digital, Embudos Cinematográficos, Gamificación
              </span>
            </div>
            <div className={styles.asideGroup}>
              <span className={styles.asideLabel}>Esta serie es: </span>
              <span className={styles.asideValue}>Informativa, Estratégica</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
