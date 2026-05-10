"use client"

// Animação fullscreen quando alguém conquista EL TOPO.
// Aparece pro recipient E pros outros users — visual igual,
// só muda o label (recipient: "Conquistaste"; outros: "Fulano conquistó").
//
// Escuta evento "app:topo-conquista" com detail { userName, isSelf }.
// Despachado pelo BroadcastProvider quando notif type=public_insignia_self
// (recipient) ou type=public_insignia (outros) chega com EL TOPO no title.

import { useEffect, useRef, useState } from "react"
import { sounds } from "../_lib/sounds"
import { getAchievementById } from "@/lib/achievements"
import styles from "./topo-overlay.module.css"

const PARTICLE_COUNT = 28
// Fallback durations — usadas quando audio falha ou está mutado.
// Caso normal: dura o tempo da música trumpet (~10s). Sincronizado via onended.
const FALLBACK_DURATION_MS = 4000
const EXIT_DURATION_MS = 400
const QUEUE_GAP_MS = 400

type Particle = {
  id: number
  left: number
  delay: number
  duration: number
}

type QueueItem = {
  userName: string
  isSelf: boolean
}

export function TopoOverlay() {
  const [current, setCurrent] = useState<QueueItem | null>(null)
  const [show, setShow] = useState(false)
  const [flashKey, setFlashKey] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])

  const queueRef = useRef<QueueItem[]>([])
  const playingRef = useRef(false)
  const particleIdRef = useRef(0)

  useEffect(() => {
    function processQueue() {
      const item = queueRef.current.shift()
      if (!item) {
        playingRef.current = false
        return
      }
      playingRef.current = true

      // Spawn partículas
      const next: Particle[] = []
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        next.push({
          id: particleIdRef.current++,
          left: Math.random() * 100,
          delay: Math.random() * 0.7,
          duration: 2.0 + Math.random() * 1.4,
        })
      }
      setParticles(next)

      // Trigger flash + card
      setCurrent(item)
      setFlashKey((k) => k + 1)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true))
      })

      // Som — trumpet victory (música nova). Sincroniza fim do overlay com
      // fim da música pra ficar cinematográfico.
      const audio = sounds.trumpetVictory()

      function exit() {
        setShow(false)
        setTimeout(() => {
          setCurrent(null)
          setParticles([])
          setTimeout(processQueue, QUEUE_GAP_MS)
        }, EXIT_DURATION_MS)
      }

      if (audio) {
        // Espera fim da música. Fallback timeout (15s) se onended falhar.
        const safetyTimer = setTimeout(exit, 15000)
        const onEnded = () => {
          clearTimeout(safetyTimer)
          audio.removeEventListener("ended", onEnded)
          exit()
        }
        audio.addEventListener("ended", onEnded)
      } else {
        // Áudio mutado/bloqueado — usa duration fallback
        setTimeout(exit, FALLBACK_DURATION_MS)
      }
    }

    function onTopoConquista(e: Event) {
      const ev = e as CustomEvent<{ userName?: string; isSelf?: boolean }>
      queueRef.current.push({
        userName: ev.detail?.userName || "Miembro",
        isSelf: !!ev.detail?.isSelf,
      })
      if (!playingRef.current) processQueue()
    }

    window.addEventListener("app:topo-conquista", onTopoConquista as EventListener)
    return () => {
      window.removeEventListener("app:topo-conquista", onTopoConquista as EventListener)
    }
  }, [])

  if (!current) return null

  const ach = getAchievementById("el_topo")
  const label = current.isSelf
    ? "¡Conquistaste el Servicio Premium B!"
    : `${current.userName} conquistó el Servicio Premium B`

  return (
    <>
      <div key={flashKey} className={styles.flash} />
      <div className={`${styles.overlay} ${show ? styles.show : ""}`} aria-hidden="true">
        <div className={styles.card}>
          <div className={styles.tagline}>Insignia Exclusiva</div>
          {ach && (
            <div
              className={styles.badge}
              dangerouslySetInnerHTML={{ __html: ach.svg }}
            />
          )}
          <div className={styles.bigText}>EL TOPO</div>
          <div className={styles.label}>{label}</div>
        </div>
        {particles.map((p) => (
          <span
            key={p.id}
            className={styles.particle}
            style={{
              left: `${p.left}%`,
              top: "100%",
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>
    </>
  )
}
