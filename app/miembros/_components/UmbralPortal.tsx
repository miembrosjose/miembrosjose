"use client"

// UMBRAL DEL CONTACTO — última puerta del camino, tras la Temporada 4.
// Todo su contenido es configurable por el admin vía site_texts (umbral.*):
// título, subtítulo, introducción, cuerpo, botón opcional y video de fondo.
// Solo se abre cuando el admin lo publica (umbral.enabled = "si"); el gate de
// Temporada 4 se resuelve en el carrusel (aquí ya llega abierto).

import { useCallback, useEffect, useRef, useState } from "react"
import { X, ArrowRight, MessageSquare } from "lucide-react"
import styles from "./season5.module.css"
import { CosmicField } from "./CosmicField"
import { BannerVideo } from "./BannerVideo"
import { openExternal } from "../_lib/url-helpers"
import { FORUM_TITLES } from "../_lib/portals-data"
import { getSiteTextDefault } from "@/lib/site-texts"

type Props = {
  open: boolean
  onClose: () => void
  onGoToForo?: (title?: string) => void
}

type UmbralConfig = {
  title: string
  tagline: string
  intro: string
  body: string
  ctaLabel: string
  ctaUrl: string
  video: string
}

function readDefaults(): UmbralConfig {
  return {
    title: getSiteTextDefault("umbral.title"),
    tagline: getSiteTextDefault("umbral.tagline"),
    intro: getSiteTextDefault("umbral.intro"),
    body: getSiteTextDefault("umbral.body"),
    ctaLabel: getSiteTextDefault("umbral.cta_label"),
    ctaUrl: getSiteTextDefault("umbral.cta_url"),
    video: getSiteTextDefault("umbral.video"),
  }
}

export function UmbralPortal({ open, onClose, onGoToForo }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [cfg, setCfg] = useState<UmbralConfig>(readDefaults)

  // Carga la configuración editada por el admin (site_texts) al abrir.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch("/api/site-texts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.overrides) return
        const ov = d.overrides as Record<string, string>
        const pick = (k: string, fb: string) => (ov[k] ?? "").trim() || fb
        const def = readDefaults()
        setCfg({
          title: pick("umbral.title", def.title),
          tagline: pick("umbral.tagline", def.tagline),
          intro: pick("umbral.intro", def.intro),
          body: pick("umbral.body", def.body),
          ctaLabel: pick("umbral.cta_label", def.ctaLabel),
          ctaUrl: pick("umbral.cta_url", def.ctaUrl),
          video: pick("umbral.video", def.video),
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])

  // Bloqueo de scroll del body + reset al abrir
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    rootRef.current?.scrollTo({ top: 0 })
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Esc cierra
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // Reveal on scroll
  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>(`.${styles.reveal}`))
    const revealAll = () => els.forEach((el) => el.classList.add(styles.revealIn))
    if (typeof IntersectionObserver === "undefined") { revealAll(); return }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add(styles.revealIn); io.unobserve(e.target) }
      }),
      { root, threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    const t = setTimeout(revealAll, 800)
    return () => { io.disconnect(); clearTimeout(t) }
  }, [open])

  const goForo = useCallback(() => {
    onClose()
    onGoToForo?.(FORUM_TITLES.objetivos)
  }, [onClose, onGoToForo])

  if (!open) return null

  // Párrafos del cuerpo: bloques separados por línea en blanco; dentro de un
  // bloque, los saltos de línea simples se conservan como <br>.
  const blocks = cfg.body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  return (
    <div className={styles.overlay} ref={rootRef} role="dialog" aria-label="El Umbral del Contacto">
      <CosmicField />

      <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar portal">
        <X size={20} />
      </button>

      <div className={styles.inner}>
        {/* HERO */}
        <header className={styles.hero}>
          {cfg.video && (
            <div className={styles.bannerLayer} aria-hidden>
              <BannerVideo src={cfg.video} className={styles.bannerMedia} />
              <span className={styles.bannerVeil} />
            </div>
          )}
          <div className={styles.heroInner}>
            <p className={styles.kicker}>El siguiente umbral · Los 144.000</p>
            <h1 className={styles.heroTitle}>{cfg.title}</h1>
            {cfg.tagline && <p className={styles.heroSub}>{cfg.tagline}</p>}
            {cfg.intro && (
              <div className={styles.heroLead}>
                <span className={styles.heroLeadHi}>Has recorrido el camino. Este es el umbral.</span>
                {cfg.intro}
              </div>
            )}
          </div>
        </header>

        {/* CUERPO */}
        {blocks.length > 0 && (
          <section className={`${styles.section} ${styles.reveal}`}>
            <div className={styles.umbral}>
              <blockquote className={styles.finalQuote}>
                {blocks.map((b, i) => (
                  <span key={i}>
                    {b.split("\n").map((line, j) => (
                      <span key={j}>{line}{j < b.split("\n").length - 1 ? <br /> : null}</span>
                    ))}
                  </span>
                ))}
              </blockquote>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem", justifyContent: "center", marginTop: "2rem" }}>
                {cfg.ctaLabel && cfg.ctaUrl && (
                  <button
                    type="button"
                    className={styles.cta}
                    style={{ margin: 0, borderColor: "var(--s5-gold)" }}
                    onClick={() => openExternal(cfg.ctaUrl)}
                  >
                    {cfg.ctaLabel} <ArrowRight size={15} />
                  </button>
                )}
                <button
                  type="button"
                  className={styles.cta}
                  style={{ margin: 0, borderColor: "rgba(167,139,202,0.5)", background: "linear-gradient(135deg, rgba(167,139,202,0.16), rgba(109,74,155,0.14))" }}
                  onClick={goForo}
                >
                  <MessageSquare size={15} /> Compartir en el foro
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
