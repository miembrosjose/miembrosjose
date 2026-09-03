"use client"

// EL CAMINO INICIÁTICO — mapa de ruta de Los 144.000.
// Timeline vivo que enlaza: Portal de Ingreso → Temporadas 1-4 con portales
// de integración entre ellas → Objetivos (Temporada 5) → Umbral del Contacto.
// No reemplaza el carrusel de temporadas: le da una lectura de camino.

import { useEffect, useState } from "react"
import { DoorOpen, Sparkles, Compass, Lock } from "lucide-react"
import { useSeasons } from "../_lib/use-seasons"
import {
  getEpisodeProgress, getWatchedCount, PROGRESS_CHANGED_EVENT, type Season,
} from "../_lib/seasons"
import { INTEGRATION_PORTALS } from "../_lib/portals-data"
import styles from "./routemap.module.css"

type Props = {
  onOpenIngreso: () => void
  onOpenIntegration: (id: 1 | 2 | 3) => void
  onOpenSeason: (s: Season) => void
  onOpenObjetivos: () => void
}

export function RouteMap({ onOpenIngreso, onOpenIntegration, onOpenSeason, onOpenObjetivos }: Props) {
  const { seasons } = useSeasons()
  const [progress, setProgress] = useState<Record<string, { watched_at: string }>>({})

  useEffect(() => {
    setProgress(getEpisodeProgress())
    const refresh = () => setProgress(getEpisodeProgress())
    window.addEventListener(PROGRESS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(PROGRESS_CHANGED_EVENT, refresh)
  }, [])

  const seasonByNum = (n: number) => seasons.find((s) => s.num === n)

  function SeasonStep({ num }: { num: number }) {
    const season = seasonByNum(num)
    const name = season?.name || `Temporada ${num}`
    const total = season?.episodes ?? 0
    const watched = season ? getWatchedCount(season, progress) : 0
    const pct = total > 0 ? Math.round((watched / total) * 100) : 0
    const done = total > 0 && watched >= total
    return (
      <button
        type="button"
        className={styles.step}
        onClick={() => { if (season) onOpenSeason(season) }}
      >
        <span className={`${styles.node} ${styles.nodeSeason}`}>{num}</span>
        <span className={styles.card}>
          <span className={`${styles.kind} ${styles.kindSeason}`}>Temporada {num}</span>
          <span className={styles.name}>{name}</span>
          {total > 0 ? (
            <>
              <span className={`${styles.status} ${done ? styles.statusDone : ""}`}>
                {done ? "Completada" : `${pct}% · ${watched}/${total} eps`}
              </span>
              <span className={styles.bar}><span className={styles.barFill} style={{ width: `${pct}%` }} /></span>
            </>
          ) : (
            <span className={styles.status}>Episodios · videos</span>
          )}
        </span>
      </button>
    )
  }

  function IntegrationStep({ id }: { id: 1 | 2 | 3 }) {
    const p = INTEGRATION_PORTALS.find((x) => x.id === id)!
    return (
      <button type="button" className={styles.step} onClick={() => onOpenIntegration(id)}>
        <span className={`${styles.node} ${styles.nodeIntegration}`}><Sparkles size={16} /></span>
        <span className={styles.card}>
          <span className={`${styles.kind} ${styles.kindIntegration}`}>Portal de Integración</span>
          <span className={styles.name} style={{ fontSize: "0.98rem" }}>{titleCase(p.name)}</span>
          <span className={styles.sub}>{p.frase.join(" ")}</span>
        </span>
      </button>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        {/* Portal de Ingreso */}
        <button type="button" className={styles.step} onClick={onOpenIngreso}>
          <span className={`${styles.node} ${styles.nodePortal}`}><DoorOpen size={20} /></span>
          <span className={styles.card}>
            <span className={`${styles.kind} ${styles.kindPortal}`}>Portal de Ingreso</span>
            <span className={styles.name}>Antes del Llamado</span>
            <span className={styles.sub}>La entrada ceremonial al camino. Acuerdo de entrada y bitácora inicial.</span>
          </span>
        </button>

        <SeasonStep num={1} />
        <IntegrationStep id={1} />
        <SeasonStep num={2} />
        <IntegrationStep id={2} />
        <SeasonStep num={3} />
        <IntegrationStep id={3} />
        <SeasonStep num={4} />

        {/* Objetivos (Temporada 5) */}
        <button type="button" className={styles.step} onClick={onOpenObjetivos}>
          <span className={`${styles.node} ${styles.nodeMission}`}><Compass size={20} /></span>
          <span className={styles.card}>
            <span className={`${styles.kind} ${styles.kindMission}`}>Portal de Misión</span>
            <span className={styles.name}>Objetivos de Los 144.000</span>
            <span className={styles.sub}>Misión planetaria, territorio y memoria sagrada. Los 7 objetivos, misión territorial y área de integración.</span>
          </span>
        </button>

        {/* Umbral del Contacto (próximamente) */}
        <div className={styles.step} data-soon="true">
          <span className={`${styles.node} ${styles.nodeUmbral}`}><Lock size={18} /></span>
          <span className={styles.card}>
            <span className={`${styles.kind} ${styles.kindUmbral}`}>Próximamente</span>
            <span className={styles.name}>El Umbral del Contacto</span>
            <span className={styles.sub}>Prácticas, meditaciones y preparación interior para que el contacto se vuelva una responsabilidad sostenida.</span>
            <span className={`${styles.status} ${styles.statusSoon}`}>En preparación</span>
          </span>
        </div>
      </div>
    </div>
  )
}

function titleCase(upper: string): string {
  return upper
    .toLowerCase()
    .replace(/\b([a-záéíóúñ])/g, (m) => m.toUpperCase())
}
