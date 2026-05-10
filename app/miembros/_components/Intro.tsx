"use client"

// Intro Voyager Transmission — abertura cinematográfica espacial.
// Sequência (~5s):
//   T+0.0s : preto + ruído CRT, status "ACQUIRING SIGNAL"
//   T+0.3s : crosshair cresce, telemetria popula
//   T+0.8s : "SIGNAL LOCKED" pisca, carrier wave começa
//   T+1.5s : scan vertical varre a tela
//   T+2.5s : logo decodifica scan-line por scan-line
//   T+3.5s : logo nítido, tagline aparece char-por-char
//   T+5.0s : estado final, "[ ESC ] PRESS TO PROCEED" pulsa
//
// sessionStorage 'app_intro_seen' impede re-render ao navegar.

import { useEffect, useRef, useState } from "react"
import styles from "./intro.module.css"

const LOGO_TEXT = "[BRAND_NAME]"
const TAGLINE = "[BRAND_TAGLINE]"
const SESSION_KEY = "app_intro_seen"

type Phase =
  | "idle"        // 0ms — só ruído + status acquiring
  | "acquired"    // 300ms — crosshair + telemetria
  | "locked"      // 800ms — signal locked + carrier wave
  | "scanning"    // 1500ms — scan beam varre
  | "decoding"    // 2200ms — glitch RGB
  | "revealing"   // 2500ms — logo aparece scan-line por scan-line
  | "complete"    // 3500ms — logo nítido + tagline + skip pulsando

type IntroProps = {
  onComplete?: () => void
  onSkip?: () => void
  skip?: boolean
}

// ─── Telemetria viva ─────────────────────────────────────────────
function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0")
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const f = Math.floor((ms % 1000) / 41.66) // 24fps frames
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`
}

function randomHex(len = 4): string {
  const chars = "0123456789ABCDEF"
  let out = ""
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)]
  return out
}

function randomFreq(): string {
  // Frequências em GHz oscilando sutilmente em volta de 8.4 GHz (banda X — Voyager real)
  const base = 8.4 + (Math.random() - 0.5) * 0.08
  return base.toFixed(3)
}

function randomSnr(): number {
  // S/N ratio oscilando entre 28-36 dB
  return Math.floor(28 + Math.random() * 8)
}

export function Intro({ onComplete, onSkip, skip = false }: IntroProps) {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [fadeOut, setFadeOut] = useState(false)

  // Telemetria viva
  const [timeStr, setTimeStr] = useState("00:00:00:00")
  const [hex, setHex] = useState("0000")
  const [freq, setFreq] = useState("8.420")
  const [snr, setSnr] = useState(32)

  const completedRef = useRef(false)
  const startedAtRef = useRef<number>(0)

  // Decide no mount se vai mostrar
  useEffect(() => {
    if (skip) {
      completedRef.current = true
      onComplete?.()
      return
    }
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") {
        completedRef.current = true
        onComplete?.()
        return
      }
    } catch {
      // sessionStorage pode falhar em modo privado — segue mostrando
    }
    setMounted(true)
    startedAtRef.current = performance.now()
  }, [skip, onComplete])

  // Timeline de fases
  useEffect(() => {
    if (!mounted) return
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setPhase("acquired"), 300))
    timers.push(setTimeout(() => setPhase("locked"), 800))
    timers.push(setTimeout(() => setPhase("scanning"), 1500))
    timers.push(setTimeout(() => setPhase("decoding"), 2200))
    timers.push(setTimeout(() => setPhase("revealing"), 2500))
    timers.push(setTimeout(() => setPhase("complete"), 3500))

    return () => timers.forEach(clearTimeout)
  }, [mounted])

  // Telemetria viva (atualiza enquanto a intro tá visível)
  useEffect(() => {
    if (!mounted) return
    const tick = setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current
      setTimeStr(formatTime(elapsed))
      setHex(randomHex(4))
      // freq e snr oscilam menos que o hex
      if (Math.random() < 0.3) setFreq(randomFreq())
      if (Math.random() < 0.2) setSnr(randomSnr())
    }, 100)
    return () => clearInterval(tick)
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

  const status = (() => {
    switch (phase) {
      case "idle":      return "ACQUIRING SIGNAL"
      case "acquired":  return "SIGNAL DETECTED"
      case "locked":    return "SIGNAL LOCKED"
      case "scanning":  return "SCANNING"
      case "decoding":  return "DECODING TRANSMISSION"
      case "revealing": return "RENDERING IMAGE"
      case "complete":  return "TRANSMISSION COMPLETE"
    }
  })()

  const banner = phase === "decoding" ? "DECODING TRANSMISSION" : "SIGNAL LOCKED"

  return (
    <div className={introClasses}>
      {/* CRT noise overlay */}
      <div className={styles.noise} aria-hidden />

      {/* Scan beam vertical */}
      <div className={styles.scanBeam} aria-hidden />

      {/* HUD telemetria — top-left */}
      <div className={`${styles.hud} ${styles.hudTopLeft}`} aria-hidden>
        <div>
          <span className={styles.hudKey}>SRC</span>
          <span className={styles.hudCyan}>VOYAGER · DEEP SPACE</span>
        </div>
        <div>
          <span className={styles.hudKey}>FREQ</span>
          <span className={styles.hudValue}>{freq}</span>
          <span className={styles.hudKey}> GHz</span>
        </div>
        <div>
          <span className={styles.hudKey}>S/N</span>
          <span className={styles.hudValue}>{snr}</span>
          <span className={styles.hudKey}> dB</span>
        </div>
        <div>
          <span className={styles.hudKey}>BUF</span>
          <span className={styles.hudValue}>0x{hex}</span>
        </div>
      </div>

      {/* HUD telemetria — top-right */}
      <div className={`${styles.hud} ${styles.hudTopRight}`} aria-hidden>
        <div>
          <span className={styles.hudKey}>T+</span>
          <span className={styles.hudValue}>{timeStr}</span>
        </div>
        <div>
          <span className={styles.hudKey}>LAT</span>
          <span className={styles.hudValue}>34°12&apos;N</span>
        </div>
        <div>
          <span className={styles.hudKey}>LON</span>
          <span className={styles.hudValue}>118°10&apos;W</span>
        </div>
        <div>
          <span className={styles.hudKey}>ALT</span>
          <span className={styles.hudCyan}>24.6 BN km</span>
        </div>
      </div>

      {/* HUD bottom-left — sistema status */}
      <div className={`${styles.hud} ${styles.hudBottomLeft}`} aria-hidden>
        <div>
          <span className={styles.hudKey}>SYS</span>
          <span className={styles.hudValue}>NOMINAL</span>
        </div>
        <div>
          <span className={styles.hudKey}>PWR</span>
          <span className={styles.hudCyan}>97.2%</span>
        </div>
      </div>

      {/* Status line bottom-right */}
      <div className={styles.statusLine} aria-live="polite">
        <span>{status}</span>
        <span className={styles.statusDot} aria-hidden />
      </div>

      {/* Crosshair central */}
      <div className={styles.crosshair} aria-hidden>
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {/* 4 brackets nos cantos */}
          <path className={styles.crosshairBracket}
            d="M 10 22 L 10 10 L 22 10" />
          <path className={styles.crosshairBracket}
            d="M 78 10 L 90 10 L 90 22" />
          <path className={styles.crosshairBracket}
            d="M 90 78 L 90 90 L 78 90" />
          <path className={styles.crosshairBracket}
            d="M 22 90 L 10 90 L 10 78" />
          {/* ticks horizontais e verticais */}
          <line className={styles.crosshairTick} x1="0" y1="50" x2="35" y2="50" />
          <line className={styles.crosshairTick} x1="65" y1="50" x2="100" y2="50" />
          <line className={styles.crosshairTick} x1="50" y1="0" x2="50" y2="35" />
          <line className={styles.crosshairTick} x1="50" y1="65" x2="50" y2="100" />
          {/* center dot */}
          <circle className={styles.crosshairCenter} cx="50" cy="50" r="1.5" />
        </svg>
      </div>

      {/* Carrier wave — sine pulsando embaixo do logo */}
      <div className={styles.carrier} aria-hidden>
        <svg viewBox="0 0 600 60" preserveAspectRatio="none">
          <path className={styles.carrierPath}
            d="M 0 30 Q 25 5, 50 30 T 100 30 T 150 30 T 200 30 T 250 30 T 300 30 T 350 30 T 400 30 T 450 30 T 500 30 T 550 30 T 600 30" />
        </svg>
      </div>

      {/* Banner central — pisca durante locked/decoding */}
      <div className={styles.banner} aria-hidden>{banner}</div>

      {/* Logo principal */}
      <div className={styles.logo}>
        {LOGO_TEXT}
        <div className={styles.logoScanline} aria-hidden />
        <div className={styles.logoUnderline} aria-hidden />
      </div>

      {/* Tagline — char por char */}
      <div className={styles.tagline}>
        {TAGLINE.split("").map((char, i) => (
          <span
            key={i}
            className={`${styles.taglineChar} ${char === " " ? styles.space : ""}`}
            style={{ animationDelay: `${i * 35 + 100}ms` }}
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </div>

      {/* Skip button — estilo console */}
      <button type="button" className={styles.skip} onClick={handleSkip}>
        <span className={styles.skipBracket}>[</span>
        <span>ESC</span>
        <span className={styles.skipBracket}>]</span>
        <span>{phase === "complete" ? "PROCEED" : "ABORT TRANSMISSION"}</span>
      </button>
    </div>
  )
}
