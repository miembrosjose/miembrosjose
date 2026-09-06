"use client"

// OBJETIVOS DE LOS 144.000 — portal de misión.
// Estructura: Hero → REVELADOR DE MISIÓN (persistente; contiene la revelación,
// los 4 pilares, cómo se activan los 5 objetivos, punto de entrada y acciones)
// → LOS OBJETIVOS DE LOS 144.000 (los 5, COLECTIVOS) → Manifiesto → Umbral.

import { useCallback, useEffect, useRef, useState } from "react"
import { X, ArrowDown, ArrowRight } from "lucide-react"
import styles from "./season5.module.css"
import { CosmicField } from "./CosmicField"
import { BannerVideo } from "./BannerVideo"
import { OBJETIVOS_5 } from "../_lib/objetivos-data"
import { getLastRevelation, REVELATION_CHANGED_EVENT, type MissionReport } from "../_lib/mission-analysis"
import { MissionRevealer } from "./MissionRevealer"

type Props = {
  open: boolean
  onClose: () => void
  onGoToForo?: (title?: string) => void
  onOpenUmbral?: () => void
}

export function Season5Portal({ open, onClose, onOpenUmbral }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const revealerRef = useRef<HTMLDivElement>(null)
  const [bannerVideo, setBannerVideo] = useState<string>("")
  const [reveal, setReveal] = useState<MissionReport | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    setReveal(getLastRevelation()?.report ?? null)
    const onRev = () => setReveal(getLastRevelation()?.report ?? null)
    window.addEventListener(REVELATION_CHANGED_EVENT, onRev)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    rootRef.current?.scrollTo({ top: 0 })
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCloseRef.current() }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(REVELATION_CHANGED_EVENT, onRev)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch("/api/site-texts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.overrides) setBannerVideo((d.overrides as Record<string, string>)["portal.objetivos.video"] || "") })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll(`.${styles.reveal}`))
    const revealAll = () => els.forEach((el) => el.classList.add(styles.revealIn))
    if (typeof IntersectionObserver === "undefined") { revealAll(); return }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(styles.revealIn); io.unobserve(e.target) } }), { root, threshold: 0.1 })
    els.forEach((el) => io.observe(el))
    const t = setTimeout(revealAll, 900)
    return () => { io.disconnect(); clearTimeout(t) }
  }, [open])

  const scrollToRevealer = useCallback(() => {
    revealerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  if (!open) return null

  return (
    <div className={styles.overlay} ref={rootRef} role="dialog" aria-label="Objetivos de los 144.000">
      <CosmicField />
      <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar portal"><X size={20} /></button>

      <div className={styles.inner}>
        {/* HERO */}
        <header className={styles.hero}>
          {bannerVideo && (
            <div className={styles.bannerLayer} aria-hidden>
              <BannerVideo src={bannerVideo} className={styles.bannerMedia} />
              <span className={styles.bannerVeil} />
            </div>
          )}
          <div className={styles.heroInner}>
            <p className={styles.kicker}>Portal de Misión · Los 144.000</p>
            <h1 className={styles.heroTitle}>OBJETIVOS DE<br />LOS 144.000</h1>
            <p className={styles.heroSub}>Misión planetaria, territorio y memoria sagrada</p>
            <blockquote className={styles.portalFrase} style={{ marginTop: "1.4rem" }}>
              <span>LO QUE VINE A SANAR EN MÍ</span>
              <span>REVELA QUÉ PARTE DE LA RED VINE A LIMPIAR.</span>
            </blockquote>
            <button type="button" className={styles.cta} onClick={scrollToRevealer}>
              Revelar mi misión <ArrowDown size={15} />
            </button>
          </div>
        </header>

        {/* REVELADOR DE MISIÓN (persistente) */}
        <div ref={revealerRef}>
          <MissionRevealer />
        </div>

        {/* LOS OBJETIVOS DE LOS 144.000 (colectivos) */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <p className={styles.kicker}>Arquitectura de misión</p>
          <h2 className={styles.sectionTitle}>LOS OBJETIVOS DE LOS 144.000</h2>
          <p className={styles.sectionIntro}>
            Estos objetivos son <strong>colectivos</strong>: no son opcionales, no son caminos separados, no son
            etiquetas individuales. Son la arquitectura de misión de todos los miembros de la Red.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginTop: "1.6rem" }}>
            {OBJETIVOS_5.map((o) => {
              const activacion = reveal?.objetivos5?.find((x) => x.id === o.id)?.texto
              return (
                <article key={o.id} className={styles.actionCard}>
                  <p className={styles.actionCardKicker}>Objetivo {o.n}</p>
                  <h4 className={styles.actionCardName}>{o.title}</h4>
                  <p className={styles.sealPhrase} style={{ margin: "0.2rem 0 0.7rem" }}>{o.frase}</p>
                  {o.texto.map((p, i) => <p key={i} className={styles.actionCardText}>{p}</p>)}
                  {activacion && (
                    <div className={styles.planoReveal} style={{ marginTop: "1rem" }}>
                      <p className={styles.pilarLabel}>Cómo se activa en ti</p>
                      <p>{activacion}</p>
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          {/* Bloque destacado: todos participan */}
          <div className={styles.declaration} style={{ marginTop: "1.8rem" }}>
            <p className={styles.declBig}>Todos los miembros participan de los cinco objetivos.</p>
            <p>
              La Revelación de Misión no asigna un único objetivo a la persona. Todos los miembros de Los 144.000 están
              llamados a formar comunidad, irradiar la memoria, sanar territorio, prepararse para el contacto y custodiar
              los archivos del Plan.
            </p>
            <p>
              Lo que la Revelación muestra es <strong>por dónde comienza el servicio</strong> de cada persona, qué herida
              se está transformando en medicina y cómo esa medicina puede aportar a la Red.
            </p>
          </div>
        </section>

        {/* MANIFIESTO — ser sol en la Tierra */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <p className={styles.kicker}>Manifiesto</p>
          <h2 className={styles.sectionTitle}>SER SOL EN LA TIERRA</h2>
          <div className={styles.declaration}>
            <p>Los 144.000 no son una élite separada de la humanidad.</p>
            <p className={styles.declBig}>Son una frecuencia de responsabilidad.</p>
            <p>
              Vivir en coherencia, ser sol en la Tierra y sanar la memoria —personal, ancestral, del territorio y de la
              Red—. Cada quien limpia en la Red aquello que primero reconoció y transformó en su propia vida.
            </p>
          </div>
        </section>

        {/* UMBRAL */}
        <section className={styles.reveal}>
          <div className={styles.umbral}>
            <p className={styles.kicker} style={{ display: "inline-block" }}>El siguiente umbral</p>
            <h2 className={styles.sectionTitle}>EL UMBRAL DEL CONTACTO</h2>
            <p>El contacto no comienza mirando al cielo. Comienza cuando la intención se ordena, la mente se aquieta, el corazón se limpia y el servicio se vuelve más importante que la experiencia.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem", justifyContent: "center", marginTop: "1.6rem" }}>
              <button type="button" className={styles.cta} style={{ margin: 0, borderColor: "var(--s5-gold)" }} onClick={() => { onClose(); onOpenUmbral?.() }}>
                Entrar al Umbral del Contacto <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
