"use client"

// Toast de insignia desbloqueada. Equivalente a showAchievementToast do
// proyecto base (linha 9292). Escuta evento custom "app:achievement-unlock"
// despachado por unlockAchievement (em _lib/achievements-unlock.ts).
//
// Slide-in da direita (transform translateX), 5s visível, slide-out 0.6s,
// remove. Sons: sounds.unlock no aparecer.

import { useEffect, useRef, useState } from "react"
import { getAchievementById, type Achievement, type AchievementTier } from "@/lib/achievements"
import { getSoundForAchievement } from "../_lib/sounds"
import styles from "./achievement-toast.module.css"

const SHOW_MS = 5000
const EXIT_MS = 600
const QUEUE_GAP_MS = 200

const TIER_CLASS: Record<AchievementTier, string> = {
  bronze: styles.tierBronze,
  silver: styles.tierSilver,
  gold: styles.tierGold,
  platinum: styles.tierPlatinum,
  diamond: styles.tierDiamond,
  topo: styles.tierTopo,
}

export function AchievementToast() {
  const [current, setCurrent] = useState<Achievement | null>(null)
  const [show, setShow] = useState(false)

  const queueRef = useRef<string[]>([])
  const playingRef = useRef(false)

  useEffect(() => {
    function processQueue() {
      if (queueRef.current.length === 0) {
        playingRef.current = false
        return
      }
      playingRef.current = true
      const id = queueRef.current.shift()!
      const ach = getAchievementById(id)
      if (!ach) {
        setTimeout(processQueue, 0)
        return
      }

      setCurrent(ach)
      // Próximo tick — show=true ativa transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true))
      })
      // Som específico do achievement (procedural, único por ID).
      // Fallback pra sounds.unlock se ID não estiver no mapping.
      getSoundForAchievement(ach.id)()

      setTimeout(() => {
        setShow(false)
        setTimeout(() => {
          setCurrent(null)
          setTimeout(processQueue, QUEUE_GAP_MS)
        }, EXIT_MS)
      }, SHOW_MS)
    }

    function onUnlock(e: Event) {
      const ev = e as CustomEvent<{ id: string }>
      const id = ev.detail?.id
      if (!id) return
      // Top tier insignias (el_topo, el_estudio, time_eterno, rank_leyenda)
      // mostram fullscreen overlay próprio com música — pular o toast pequeno
      // pra não duplicar visualmente.
      if (id === "el_topo" || id === "el_estudio" || id === "time_eterno" || id === "rank_leyenda") return
      queueRef.current.push(id)
      if (!playingRef.current) processQueue()
    }

    window.addEventListener("app:achievement-unlock", onUnlock as EventListener)
    return () => {
      window.removeEventListener("app:achievement-unlock", onUnlock as EventListener)
    }
  }, [])

  if (!current) return null

  return (
    <div
      className={`${styles.toast} ${TIER_CLASS[current.tier]} ${show ? styles.show : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.frame}>
        <div
          className={styles.icon}
          dangerouslySetInnerHTML={{ __html: current.svg }}
        />
        <div className={styles.content}>
          <div className={styles.eyebrow}>Insignia desbloqueada</div>
          <div className={styles.name}>{current.name}</div>
          <div className={styles.desc}>{current.desc}</div>
        </div>
        <div className={styles.tier}>{current.tier.toUpperCase()}</div>
      </div>
    </div>
  )
}
