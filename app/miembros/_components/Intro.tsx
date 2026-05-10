"use client"

// Intro cinematográfica que abre a área de membros.
// Sequência (extraída do proyecto base startIntroSequence):
//   T+0.0s : initial render (escuro, letterbox fechado)
//   T+0.3s : bars-open (letterbox slide pra fora)
//   T+0.8s : lights-on + studio-show + skip button visível
//   T+2.5s : flash branco BANG
//   T+2.75s: logo-show (letras revealed com stagger)
//   T+4.5s : tagline-show (typewriter)
//   ∞      : permanece no último frame até user clicar Saltar
//
// sessionStorage 'app_intro_seen': se já viu nessa sessão, intro nem
// renderiza (navegações pra /perfil e voltar não re-disparam).
//
// Áudio (drone + tick) será adicionado na Fase 4 com sons. Fase 2 é só visual.

import { ArrowRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import styles from "./intro.module.css"

const LOGO_TEXT = "[BRAND_NAME]"
const TAGLINE = "[BRAND_TAGLINE]"
const SESSION_KEY = "app_intro_seen"

type IntroProps = {
  onComplete?: () => void
  // SÍNCRONO no click handler do botão "Saltar Intro" — usado pra disparar
  // play do vídeo do Hero com som (gesture do user válido neste tick).
  // Se chamado em setTimeout, perde o gesture e browser bloqueia áudio.
  onSkip?: () => void
  // Pula a renderização e dispara onComplete imediatamente — útil pra dev
  // ou quando o caller quer forçar pular.
  skip?: boolean
}

export function Intro({ onComplete, onSkip, skip = false }: IntroProps) {
  const [mounted, setMounted] = useState(false)
  const [barsOpen, setBarsOpen] = useState(false)
  const [lightsOn, setLightsOn] = useState(false)
  const [studioShow, setStudioShow] = useState(false)
  const [logoShow, setLogoShow] = useState(false)
  const [taglineShow, setTaglineShow] = useState(false)
  const [flashActive, setFlashActive] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  const completedRef = useRef(false)

  // Decide no mount se vai mostrar — evita flash da intro pra quem já viu.
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
      // sessionStorage pode falhar em modo privado — segue mostrando intro
    }
    setMounted(true)
  }, [skip, onComplete])

  // Timeline de animações sequenciais.
  useEffect(() => {
    if (!mounted) return
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setBarsOpen(true), 300))
    timers.push(
      setTimeout(() => {
        setLightsOn(true)
        setStudioShow(true)
      }, 800),
    )
    timers.push(
      setTimeout(() => {
        setFlashActive(true)
        timers.push(setTimeout(() => setLogoShow(true), 250))
      }, 2500),
    )
    timers.push(setTimeout(() => setTaglineShow(true), 4500))

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
    // SÍNCRONO no click — gesture do user válido neste tick.
    // Shell usa pra disparar video.muted=false + video.play() com som.
    onSkip?.()
    setFadeOut(true)
    // Aguarda animação de fade-out terminar antes de avisar o pai pra
    // remover a intro do DOM
    setTimeout(() => onComplete?.(), 1500)
  }

  if (!mounted) return null

  // Compõe className do intro com estados ativos
  const introClasses = [
    styles.intro,
    barsOpen && styles.barsOpen,
    lightsOn && styles.lightsOn,
    studioShow && styles.studioShow,
    logoShow && styles.logoShow,
    taglineShow && styles.taglineShow,
    fadeOut && styles.fadeOut,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={introClasses}>
      <div className={`${styles.letterbox} ${styles.letterboxTop}`} />
      <div className={`${styles.letterbox} ${styles.letterboxBottom}`} />

      <div className={`${styles.lightLeak} ${styles.lightLeakTopRight}`} />
      <div className={`${styles.lightLeak} ${styles.lightLeakBottomLeft}`} />
      <div className={styles.lensFlare} />
      <div className={styles.smoke} />

      <div className={styles.studioMark}>[BRAND_NAME]</div>
      <div className={styles.frameCounter}>CH 01 · BIENVENIDO · 24FPS</div>

      <button type="button" className={styles.skip} onClick={handleSkip}>
        Saltar intro
        <ArrowRight size={14} />
      </button>

      <div className={styles.logo}>
        {LOGO_TEXT.split("").map((char, i) => (
          <span key={i} style={{ animationDelay: `${i * 80}ms` }}>
            {char === " " ? " " : char}
          </span>
        ))}
      </div>

      <div className={styles.tagline}>{TAGLINE}</div>

      <div className={`${styles.flash} ${flashActive ? styles.flashActive : ""}`} />
    </div>
  )
}
