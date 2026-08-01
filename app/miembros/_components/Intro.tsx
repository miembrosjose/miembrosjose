"use client"

// Intro Deep Space Stellar — abertura cinematográfica espacial.
// Sequência (~5s):
//   T+0.0s  Drift: starfield 3D em movimento lento, nebulosa apareceu
//   T+1.0s  Accelerate: estrelas começam a se aproximar mais rápido
//   T+2.0s  Warp: hyperjump, estrelas viram trails em túnel
//   T+3.5s  Flash: singularidade no centro explode em luz
//   T+3.7s  Reveal: logo emerge da explosão com glow
//   T+4.3s  Complete: tagline aparece char-por-char, "PROCEED" pulsa
//
// sessionStorage 'app_intro_seen' impede re-render ao navegar.

import { useEffect, useRef, useState } from "react"
import styles from "./intro.module.css"
import { Starfield } from "./Starfield"

const LOGO_TEXT = "Los 144000"
const TAGLINE = "Fuiste preparado para este momento mucho antes de nacer."
const SESSION_KEY = "app_intro_seen"

type Phase =
  | "drift"
  | "accelerate"
  | "warp"
  | "flash"
  | "reveal"
  | "complete"

type IntroProps = {
  onComplete?: () => void
  onSkip?: () => void
  skip?: boolean
}

export function Intro({ onComplete, onSkip, skip = false }: IntroProps) {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>("drift")
  const [fadeOut, setFadeOut] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)

  const completedRef = useRef(false)

  // Decide no mount se vai mostrar.
  // La intro se muestra SIEMPRE al cargar (salvo skip explícito): su clic/ESC es
  // el gesto que desbloquea el audio del video de miembros. Antes se saltaba si
  // ya se había visto en la sesión (app_intro_seen) — se quitó ese salto.
  useEffect(() => {
    if (skip) {
      completedRef.current = true
      onComplete?.()
      return
    }
    setMounted(true)
    setStartedAt(performance.now())
  }, [skip, onComplete])

  // Timeline de fases
  useEffect(() => {
    if (!mounted) return
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setPhase("accelerate"), 1000))
    timers.push(setTimeout(() => setPhase("warp"), 2000))
    timers.push(setTimeout(() => setPhase("flash"), 3500))
    timers.push(setTimeout(() => setPhase("reveal"), 3700))
    timers.push(setTimeout(() => setPhase("complete"), 4300))

    return () => timers.forEach(clearTimeout)
  }, [mounted])

  function handleSkip() {
    if (completedRef.current) return
    completedRef.current = true
    try {
      sessionStorage.setItem(SESSION_KEY, "1")
    } catch {
      // ignora
    }
    onSkip?.()
    setFadeOut(true)
    setTimeout(() => onComplete?.(), 1000)
  }

  if (!mounted) return null

  const introClasses = [
    styles.intro,
    styles[phase],
    fadeOut && styles.fadeOut,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={introClasses}>
      {/* Camada 1: nebulosa de fundo (gradientes radiais) */}
      <div className={styles.nebula} aria-hidden />

      {/* Camada 2: starfield Canvas 3D */}
      <Starfield startedAt={startedAt} className={styles.canvas} />

      {/* Camada 3: vinheta pra dar profundidade */}
      <div className={styles.vignette} aria-hidden />

      {/* Camada 4: shockwave + singularidade do flash */}
      <div className={styles.shockwave} aria-hidden />
      <div className={styles.singularity} aria-hidden />

      {/* Coordenadas estelares — só durante drift/accelerate */}
      <div className={styles.coords} aria-hidden>
        <div>
          <span className={styles.coordsKey}>RA</span>
          <span className={styles.coordsValue}>17ʰ 45ᵐ 40.0ˢ</span>
        </div>
        <div>
          <span className={styles.coordsKey}>DEC</span>
          <span className={styles.coordsValue}>-29° 00&apos; 28.1&quot;</span>
        </div>
        <div>
          <span className={styles.coordsKey}>SECTOR</span>
          <span className={styles.coordsValue}>SGR A*</span>
        </div>
      </div>
      <div className={`${styles.coords} ${styles.coordsRight}`} aria-hidden>
        <div>
          <span className={styles.coordsKey}>VEL</span>
          <span className={styles.coordsValue}>0.9c</span>
        </div>
        <div>
          <span className={styles.coordsKey}>HDG</span>
          <span className={styles.coordsValue}>312.7°</span>
        </div>
        <div>
          <span className={styles.coordsKey}>OBJ</span>
          <span className={styles.coordsValue}>HOME</span>
        </div>
      </div>

      {/* Camada 5: logo + tagline emergindo */}
      <div className={styles.logoStage}>
        <div className={styles.logo}>{LOGO_TEXT}</div>
        <div className={styles.logoUnderline} aria-hidden />
        <div className={styles.tagline}>
          {TAGLINE.split("").map((char, i) => (
            <span
              key={i}
              className={`${styles.taglineChar} ${char === " " ? styles.space : ""}`}
              style={{ animationDelay: `${i * 35 + 200}ms` }}
            >
              {char === " " ? " " : char}
            </span>
          ))}
        </div>
      </div>

      {/* Skip button */}
      <button type="button" className={styles.skip} onClick={handleSkip}>
        <span className={styles.skipBracket}>[</span>
        <span>ESC</span>
        <span className={styles.skipBracket}>]</span>
        <span>{phase === "complete" ? "PROCEED" : "SKIP"}</span>
      </button>
    </div>
  )
}
