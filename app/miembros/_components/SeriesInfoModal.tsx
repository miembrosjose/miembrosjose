"use client"

// Modal "Más información" estilo Netflix — hero video + título por cima +
// barra de progresso + botões round + metadata grid embaixo. Substitui o
// Modal genérico que era plano e sem identidade.

import { useEffect, useMemo, useState } from "react"
import { Play, X } from "lucide-react"
import { computeResumePoint, computeOverallProgressPct } from "../_lib/seasons"
import { getEpisodesBySeason } from "../_lib/episodes"
import { useSeriesInfo } from "../_lib/use-series-info"
import { useSeasons } from "../_lib/use-seasons"
import { useAuth } from "../_lib/auth-context"
import { HERO_VIDEO_URL } from "../_lib/hero-media"
import { InlineEditableField } from "./InlineEditableField"
import styles from "./series-info-modal.module.css"


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

  // Metadados editáveis (banco — admin edita inline) + total real de temporadas
  const { isAdmin } = useAuth()
  const { info, update: updateInfo } = useSeriesInfo()
  const { seasons } = useSeasons()
  const totalSeasons = seasons.length
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

        {/* Hero — mesmo vídeo do Hero principal, parado no PRIMEIRO frame
            (não toca, sem áudio). currentTime=0 é o default depois do
            metadata carregar; preload="metadata" garante que o frame 0
            aparece sem baixar o vídeo inteiro. */}
        <div className={styles.hero}>
          <video
            className={styles.heroVideo}
            src={HERO_VIDEO_URL}
            preload="metadata"
            muted
            playsInline
            // Sem autoPlay, sem controls, sem loop → fica congelado no frame 0
            onLoadedMetadata={(e) => {
              (e.currentTarget as HTMLVideoElement).currentTime = 0
            }}
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.studioMark}>Los 144000 · Estudio</span>
            <h2 className={styles.title}>
              Los 144000
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
            </div>
          </div>
        </div>

        {/* Metadata grid */}
        <div className={styles.info}>
          <div className={styles.infoMain}>
            <div className={styles.metaLine}>
              <span>{info.year}</span>
              <span>
                {totalSeasons} {totalSeasons === 1 ? "temporada" : "temporadas"}
              </span>
            </div>

            <div className={styles.episodeBlock}>
              <h3 className={styles.episodeLabel}>
                T{resume.season}:E{resume.episode}
                {currentEpisode?.title ? ` "${currentEpisode.title}"` : ""}
              </h3>
              <p className={styles.description}>
                <InlineEditableField
                  value={info.description}
                  canEdit={isAdmin}
                  onSave={(v) => updateInfo({ description: v })}
                  multiline
                  placeholder="Descripción de la serie..."
                />
              </p>
            </div>
          </div>

          <aside className={styles.infoAside}>
            <div className={styles.asideGroup}>
              <span className={styles.asideLabel}>Elenco: </span>
              <span className={styles.asideValue}>
                <InlineEditableField
                  value={info.cast_text}
                  canEdit={isAdmin}
                  onSave={(v) => updateInfo({ cast_text: v })}
                  placeholder="Elenco..."
                />
              </span>
            </div>
            <div className={styles.asideGroup}>
              <span className={styles.asideLabel}>Géneros: </span>
              <span className={styles.asideValue}>
                <InlineEditableField
                  value={info.genres}
                  canEdit={isAdmin}
                  onSave={(v) => updateInfo({ genres: v })}
                  placeholder="Géneros separados por coma..."
                />
              </span>
            </div>
            <div className={styles.asideGroup}>
              <span className={styles.asideLabel}>Esta serie es: </span>
              <span className={styles.asideValue}>
                <InlineEditableField
                  value={info.kind}
                  canEdit={isAdmin}
                  onSave={(v) => updateInfo({ kind: v })}
                  placeholder="Tipo de serie..."
                />
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
