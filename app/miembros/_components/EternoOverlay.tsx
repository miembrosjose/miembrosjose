"use client"

// Animação fullscreen quando alguém conquista ETERNO (90 días únicos).
// Tier topo "comunitário" — espelho do TopoOverlay mas com música antiga
// (sounds.topoConquista — Shahiera) e tagline própria.
//
// Escuta evento "app:eterno-conquista" com detail { userName, isSelf }.
// Despachado pelo BroadcastProvider quando notif do achievement time_eterno
// chega.

import { useEffect, useRef, useState } from "react"
import { sounds } from "../_lib/sounds"
import { getAchievementById } from "@/lib/achievements"
import styles from "./eterno-overlay.module.css"

const PARTICLE_COUNT = 28
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

export function EternoOverlay() {
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

      setCurrent(item)
      setFlashKey((k) => k + 1)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true))
      })

      // Música antiga "level up Shahiera" — uso compartilhado entre ETERNO
      // e LEYENDA (top tier "comunitário").
      const audio = sounds.topoConquista()

      function exit() {
        setShow(false)
        setTimeout(() => {
          setCurrent(null)
          setParticles([])
          setTimeout(processQueue, QUEUE_GAP_MS)
        }, EXIT_DURATION_MS)
      }

      if (audio) {
        const safetyTimer = setTimeout(exit, 15000)
        const onEnded = () => {
          clearTimeout(safetyTimer)
          audio.removeEventListener("ended", onEnded)
          exit()
        }
        audio.addEventListener("ended", onEnded)
      } else {
        setTimeout(exit, FALLBACK_DURATION_MS)
      }
    }

    function onEternoConquista(e: Event) {
      const ev = e as CustomEvent<{ userName?: string; isSelf?: boolean }>
      queueRef.current.push({
        userName: ev.detail?.userName || "Miembro",
        isSelf: !!ev.detail?.isSelf,
      })
      if (!playingRef.current) processQueue()
    }

    window.addEventListener("app:eterno-conquista", onEternoConquista as EventListener)
    return () => {
      window.removeEventListener("app:eterno-conquista", onEternoConquista as EventListener)
    }
  }, [])

  if (!current) return null

  const ach = getAchievementById("time_eterno")
  const label = current.isSelf
    ? "¡Eres Eterno!"
    : `${current.userName} se volvió Eterno`

  return (
    <>
      <div key={flashKey} className={styles.flash} />
      <div className={`${styles.overlay} ${show ? styles.show : ""}`} aria-hidden="true">
        <div className={styles.card}>
          <div className={styles.tagline}>90 Días en el Estudio</div>
          {ach && (
            <div
              className={styles.badge}
              dangerouslySetInnerHTML={{ __html: ach.svg }}
            />
          )}
          <div className={styles.bigText}>ETERNO</div>
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
