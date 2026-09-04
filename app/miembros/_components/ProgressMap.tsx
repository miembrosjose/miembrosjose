"use client"

// MAPA DE PROGRESO — muestra dónde está el usuario en el recorrido y qué sigue.
// Ligero y sin fetch: recibe las temporadas por prop (ya cargadas por el shell)
// y lee el progreso de localStorage (cliente). Reutiliza los helpers de gating
// existentes (isSeasonComplete / isSeasonUnlocked). No añade carga al Worker.

import { useEffect, useMemo, useState } from "react"
import { DoorOpen, Check, Lock, Compass } from "lucide-react"
import {
  getEpisodeProgress, isSeasonComplete, isSeasonUnlocked,
  PROGRESS_CHANGED_EVENT, type Season, type EpisodeProgress,
} from "../_lib/seasons"
import styles from "./progressmap.module.css"

type Props = {
  seasons: Season[]
  onOpenIngreso: () => void
  onOpenSeason: (s: Season) => void
  onOpenObjetivos: () => void
}

type NodeState = "done" | "current" | "avail" | "locked"

export function ProgressMap({ seasons, onOpenIngreso, onOpenSeason, onOpenObjetivos }: Props) {
  const [progress, setProgress] = useState<EpisodeProgress>({})

  useEffect(() => {
    setProgress(getEpisodeProgress())
    const refresh = () => setProgress(getEpisodeProgress())
    window.addEventListener(PROGRESS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(PROGRESS_CHANGED_EVENT, refresh)
  }, [])

  // Cálculo de estados — O(temporadas), trivial.
  const model = useMemo(() => {
    const byNum = (n: number) => seasons.find((s) => s.num === n)
    const seasonState: Record<number, { state: NodeState; complete: boolean; unlocked: boolean; season?: Season }> = {}
    let currentAssigned = false
    for (let n = 1; n <= 4; n++) {
      const s = byNum(n)
      const complete = !!s && isSeasonComplete(s, progress)
      const unlocked = s ? isSeasonUnlocked(s, progress, seasons) : n === 1
      let state: NodeState
      if (complete) state = "done"
      else if (!unlocked) state = "locked"
      else if (!currentAssigned) { state = "current"; currentAssigned = true }
      else state = "avail"
      seasonState[n] = { state, complete, unlocked, season: s }
    }
    const t4complete = seasonState[4].complete
    const objetivoState: NodeState = t4complete ? "current" : "locked"
    // Umbral entre T(i) y T(i+1): superado cuando T(i) está completa.
    const integrationDone = (i: number) => seasonState[i]?.complete
    return { seasonState, objetivoState, integrationDone }
  }, [seasons, progress])

  // Etiqueta "estás aquí"
  const hereLabel = useMemo(() => {
    for (let n = 1; n <= 4; n++) {
      if (model.seasonState[n].state === "current") return `Temporada ${n}`
    }
    if (model.objetivoState === "current") return "Objetivo de Los 144000"
    return "Portal de Ingreso"
  }, [model])

  function seasonLabel(n: number) {
    const s = model.seasonState[n].season
    return s?.name && !/^temporada/i.test(s.name) ? `T${n} · ${s.name}` : `Temporada ${n}`
  }

  const nodeClass = (st: NodeState) =>
    `${styles.node} ${st === "done" ? styles.done : st === "current" ? styles.current : st === "avail" ? styles.avail : styles.locked}`

  return (
    <div className={styles.wrap}>
      <div className={styles.legendRow}>
        <p className={styles.here}>Estás en: <b>{hereLabel}</b></p>
        <div className={styles.legend}>
          <span><i className={styles.dotDone} /> Completado</span>
          <span><i className={styles.dotCurrent} /> Actual</span>
          <span><i className={styles.dotAvail} /> Disponible</span>
          <span><i className={styles.dotLocked} /> Bloqueado</span>
        </div>
      </div>

      <div className={styles.track}>
        {/* Portal de Ingreso */}
        <button type="button" className={styles.step} onClick={onOpenIngreso}>
          <span className={`${styles.node} ${styles.done}`}><DoorOpen size={18} /></span>
          <span className={styles.label}>Portal de Ingreso</span>
        </button>

        {[1, 2, 3, 4].map((n) => {
          const info = model.seasonState[n]
          const locked = info.state === "locked"
          return (
            <div key={n} style={{ display: "contents" }}>
              <span className={`${styles.connector} ${info.state === "done" || model.seasonState[n].unlocked ? styles.done : ""}`} />
              <button
                type="button"
                className={`${styles.step} ${info.state === "current" ? styles.isCurrent : ""} ${locked ? styles.isLocked : ""}`}
                disabled={locked || !info.season}
                onClick={() => info.season && onOpenSeason(info.season)}
                title={locked ? `Completa la Temporada ${n - 1} para desbloquear` : seasonLabel(n)}
              >
                <span className={nodeClass(info.state)}>
                  {info.state === "done" ? <Check size={17} /> : locked ? <Lock size={15} /> : n}
                </span>
                <span className={styles.label}>{seasonLabel(n)}</span>
              </button>

              {/* Umbral de integración tras T1, T2, T3 (marcador, no clickable) */}
              {n < 4 && (
                <div className={styles.diamond} aria-hidden>
                  <span className={`${styles.rhombus} ${model.integrationDone(n) ? styles.done : styles.locked}`} />
                  <span className={styles.label}>Integración</span>
                </div>
              )}
            </div>
          )
        })}

        {/* Objetivo de Los 144000 */}
        <span className={`${styles.connector} ${model.seasonState[4].complete ? styles.done : ""}`} />
        <button
          type="button"
          className={`${styles.step} ${model.objetivoState === "current" ? styles.isCurrent : ""} ${model.objetivoState === "locked" ? styles.isLocked : ""}`}
          disabled={model.objetivoState === "locked"}
          onClick={onOpenObjetivos}
          title={model.objetivoState === "locked" ? "Completa la Temporada 4 para desbloquear" : "Objetivo de Los 144000"}
        >
          <span className={`${styles.node} ${styles.objetivo} ${model.objetivoState === "current" ? styles.current : model.objetivoState === "locked" ? styles.locked : styles.avail}`}>
            {model.objetivoState === "locked" ? <Lock size={16} /> : <Compass size={20} />}
          </span>
          <span className={styles.label}>Objetivo 144000</span>
        </button>
      </div>
    </div>
  )
}
