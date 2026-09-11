"use client"

// Cápsula flotante de navegación por etapas para una transmisión.
//
// DOS sistemas juntos:
//  · Etapa conceptual — "04/08 · TÍTULO": qué parte de la enseñanza se atraviesa
//    (detectada por scroll-spy sobre las anclas invisibles .tx-stage del cuerpo).
//  · Progreso real — línea fina bajo la cápsula: % efectivo recorrido dentro de
//    todo el contenido (según scroll, no según nº de etapa).
//
// Interacciones: ☰ abre índice de etapas (scroll suave a cada una); → salta al
// inicio de la siguiente; en la última, ✓ (cierre). Recuerda la posición de
// lectura por transmisión (localStorage) y la restaura al volver.

import { useCallback, useEffect, useRef, useState } from "react"
import type { Stage } from "@/lib/markdown"
import styles from "./progress.module.css"

const ARTICLE_ID = "tx-article"

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export function TransmisionProgress({ slug, stages }: { slug: string; stages: Stage[] }) {
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [indexOpen, setIndexOpen] = useState(false)
  const rafRef = useRef<number | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const storageKey = `tx-pos:${slug}`

  // Restaura posición de lectura al volver.
  useEffect(() => {
    if (stages.length === 0) return
    let saved = 0
    try {
      saved = parseInt(sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey) || "0", 10)
    } catch { saved = 0 }
    if (saved > 200) {
      // Espera un frame a que el layout esté listo.
      const t = setTimeout(() => window.scrollTo({ top: saved, behavior: "auto" }), 60)
      return () => clearTimeout(t)
    }
  }, [slug, stages.length, storageKey])

  const recompute = useCallback(() => {
    const art = document.getElementById(ARTICLE_ID)
    const winH = window.innerHeight
    const y = window.scrollY

    // Progreso real dentro del artículo.
    if (art) {
      const top = art.getBoundingClientRect().top + y
      const end = top + art.offsetHeight - winH
      const raw = (y - top) / Math.max(1, end - top)
      setProgress(clamp(raw, 0, 1))
    }

    // Etapa actual: última ancla cuyo borde superior ya pasó el umbral.
    let idx = 0
    for (let i = 0; i < stages.length; i++) {
      const el = document.getElementById(stages[i].id)
      if (!el) continue
      if (el.getBoundingClientRect().top <= 140) idx = i
      else break
    }
    setCurrent(idx)
    setVisible(y > 240)

    // Guarda posición (throttle).
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, String(Math.round(y)))
        localStorage.setItem(storageKey, String(Math.round(y)))
      } catch { /* ignore */ }
    }, 350)
  }, [stages, storageKey])

  useEffect(() => {
    if (stages.length === 0) return
    const onScroll = () => {
      if (rafRef.current != null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        recompute()
      })
    }
    recompute()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [recompute, stages.length])

  if (stages.length === 0) return null

  const total = stages.length
  const stage = stages[current]
  const isLast = current >= total - 1
  const pad = (n: number) => String(n).padStart(2, "0")

  function goto(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    setIndexOpen(false)
  }

  function next() {
    if (isLast) {
      // Cierre: baja al final de la transmisión (afirmación).
      const art = document.getElementById(ARTICLE_ID)
      if (art) window.scrollTo({ top: art.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 40, behavior: "smooth" })
      return
    }
    goto(stages[current + 1].id)
  }

  return (
    <>
      {indexOpen && (
        <div className={styles.indexSheet} role="dialog" aria-label="Etapas de la transmisión">
          <div className={styles.indexHeader}>
            <span>Recorrido</span>
            <button type="button" onClick={() => setIndexOpen(false)} aria-label="Cerrar">×</button>
          </div>
          <ul className={styles.indexList}>
            {stages.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`${styles.indexItem} ${i === current ? styles.indexItemActive : ""}`}
                  onClick={() => goto(s.id)}
                >
                  <span className={styles.indexNum}>{pad(s.n)}</span>
                  <span className={styles.indexTitle}>{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${styles.capsule} ${visible ? styles.capsuleVisible : ""}`} role="navigation" aria-label="Progreso de la transmisión">
        <div className={styles.row}>
          <button type="button" className={styles.iconBtn} onClick={() => setIndexOpen((v) => !v)} aria-label="Índice de etapas" aria-expanded={indexOpen}>
            ☰
          </button>
          <button type="button" className={styles.label} onClick={() => setIndexOpen((v) => !v)}>
            <span className={styles.count}>{pad(stage.n)}/{pad(total)}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.title}>{stage.title}</span>
          </button>
          <button type="button" className={styles.iconBtn} onClick={next} aria-label={isLast ? "Final" : "Siguiente etapa"}>
            {isLast ? "✓" : "→"}
          </button>
        </div>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.fill} style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
    </>
  )
}
