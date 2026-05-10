"use client"

// Animação cinematográfica de level-up. Equivalente a triggerLevelUpAnimation
// + processLevelUpQueue.
//
// Escuta o evento custom "app:level-up" (despachado pelo XpBadge quando detecta
// xp.level > previous.level) e enfileira animações 1 por vez. Cada animação:
//   - Flash branco fullscreen (0.8s)
//   - Card central com tagline + LV X grande + partículas douradas
//   - Som procedural via sounds.levelUp
//   - Auto-fecha em 3s, depois processa próxima da fila

import { useEffect, useRef, useState } from "react"
import { sounds } from "../_lib/sounds"
import styles from "./level-up.module.css"

const PARTICLE_COUNT = 24
const SHOW_DURATION_MS = 3000
const EXIT_DURATION_MS = 350
const QUEUE_GAP_MS = 400

type Particle = {
  id: number
  left: number
  delay: number
  duration: number
}

export function LevelUpOverlay() {
  const [currentLevel, setCurrentLevel] = useState<number | null>(null)
  const [show, setShow] = useState(false)
  const [flashKey, setFlashKey] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])

  const queueRef = useRef<number[]>([])
  const playingRef = useRef(false)
  const particleIdRef = useRef(0)

  useEffect(() => {
    function processQueue() {
      if (queueRef.current.length === 0) {
        playingRef.current = false
        return
      }
      playingRef.current = true
      const lv = queueRef.current.shift()!

      // Respeita pref própria: se desligou level_up, pula animação
      const prefs = (window as unknown as {
        NOTIF_PREFS?: { own?: { level_up?: boolean } }
      }).NOTIF_PREFS
      if (prefs?.own?.level_up === false) {
        setTimeout(processQueue, 0)
        return
      }

      // Spawn partículas
      const next: Particle[] = []
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        next.push({
          id: particleIdRef.current++,
          left: Math.random() * 100,
          delay: Math.random() * 0.6,
          duration: 1.8 + Math.random() * 1.2,
        })
      }
      setParticles(next)

      // Trigger flash + card
      setCurrentLevel(lv)
      setFlashKey((k) => k + 1)
      // Próximo tick — show=true ativa transition do card
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true))
      })

      // Som
      sounds.levelUp()

      // Auto-fecha
      setTimeout(() => {
        setShow(false)
        setTimeout(() => {
          setCurrentLevel(null)
          setParticles([])
          setTimeout(processQueue, QUEUE_GAP_MS)
        }, EXIT_DURATION_MS)
      }, SHOW_DURATION_MS)
    }

    function onLevelUp(e: Event) {
      const ev = e as CustomEvent<{ level: number }>
      const lv = ev.detail?.level
      if (typeof lv !== "number") return
      queueRef.current.push(lv)
      if (!playingRef.current) processQueue()
    }

    window.addEventListener("app:level-up", onLevelUp as EventListener)
    return () => {
      window.removeEventListener("app:level-up", onLevelUp as EventListener)
    }
  }, [])

  if (currentLevel === null) return null

  return (
    <>
      <div key={flashKey} className={styles.flash} />
      <div className={`${styles.overlay} ${show ? styles.show : ""}`} aria-hidden="true">
        <div className={styles.card}>
          <div className={styles.tagline}>Level Up</div>
          <div className={styles.bigNumber}>LV {currentLevel}</div>
          <div className={styles.label}>¡Subiste de nivel!</div>
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
