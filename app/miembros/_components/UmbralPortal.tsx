"use client"

// UMBRAL DEL CONTACTO — última puerta del camino, tras la Temporada 4.
// Todo su contenido es configurable por el admin vía site_texts (umbral.*):
// título, subtítulo, introducción, cuerpo, botón opcional y video de fondo.
// Solo se abre cuando el admin lo publica (umbral.enabled = "si"); el gate de
// Temporada 4 se resuelve en el carrusel (aquí ya llega abierto).

import { useEffect, useRef, useState } from "react"
import { X, ArrowRight } from "lucide-react"
import styles from "./season5.module.css"
import u from "./umbral-secciones.module.css"
import { CosmicField } from "./CosmicField"
import { openExternal } from "../_lib/url-helpers"
import { getSiteTextDefault } from "@/lib/site-texts"
import { ENCUENTROS, FORMACIONES } from "../_lib/umbral-programa"

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
  // Encuentro desplegado en el programa. Solo uno a la vez: con dieciséis,
  // abrirlos todos devolvería el muro de texto que queríamos evitar.
  const [abierto, setAbierto] = useState<number | null>(1)

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
        {/* HERO — sin banner de video: la portada distraía de lo que aquí
            hay que entender, que es cómo funciona la formación. */}
        <header className={u.hero}>
          <p className={u.heroKicker}>El siguiente umbral · Los 144.000</p>
          <h1 className={u.heroTitulo}>{cfg.title}</h1>
          <p className={u.heroSub}>{cfg.tagline}</p>
          <p className={u.heroLinea}>
            Grupos de contacto en vivo. Dieciséis encuentros, uno por semana,
            durante cuatro meses.
          </p>
        </header>

        {/* CÓMO SE ENTRA — el modelo de tandas, que es lo que más se
            malinterpreta: no se repite el ciclo, se entra en el siguiente. */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <div className={u.encabezado}>
            <span className={u.numeroSeccion}>01 · Cómo se entra</span>
            <h2 className={u.tituloSeccion}>Se entra por tandas</h2>
            <p className={u.bajada}>
              Al terminar las cuatro temporadas no se empieza de inmediato: se espera
              a que abra la siguiente formación. Cada grupo recorre el ciclo una vez,
              de principio a fin, con las mismas personas.
            </p>
            <p className={u.donde}>
              <span className={u.dondeEtiqueta}>En vivo por Zoom</span>
              El día, el horario y la duración de cada encuentro se anuncian dentro
              del grupo correspondiente.
            </p>
          </div>

          <div className={u.tandas}>
            {FORMACIONES.map((f) => (
              <div key={f.cuando} className={`${u.tanda} ${f.primera ? u.tandaPrimera : ""}`}>
                <span className={u.tandaPunto} aria-hidden />
                <span className={u.tandaNota}>{f.nota}</span>
                <span className={u.tandaCuando}>{f.cuando}</span>
              </div>
            ))}
          </div>

          <p className={u.apunte}>
            Cada cuatro meses empieza la formación de un nuevo grupo de contacto.
          </p>
        </section>

        {/* El botón aparece dos veces: aquí, para quien ya lo tiene claro y
            no necesita leerse el programa entero, y de nuevo al final. */}
        <div className={u.unirseArriba}>
          <Unirse cfg={cfg} margen="0" />
        </div>

        {/* EL PROGRAMA — dieciséis encuentros, en acordeón */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <div className={u.encabezado}>
            <span className={u.numeroSeccion}>02 · El programa</span>
            <h2 className={u.tituloSeccion}>Dieciséis encuentros</h2>
            <p className={u.bajada}>
              Uno por semana. Cada uno se apoya en el anterior: el orden no es una
              sugerencia, es la estructura misma del entrenamiento.
            </p>
          </div>

          <ol className={u.programa}>
            {ENCUENTROS.map((e) => {
              const esta = abierto === e.n
              return (
                <li key={e.n} className={`${u.encuentro} ${esta ? u.encuentroOn : ""}`}>
                  <button
                    type="button"
                    className={u.encuentroBoton}
                    aria-expanded={esta}
                    onClick={() => setAbierto(esta ? null : e.n)}
                  >
                    <span className={u.encuentroNum}>{String(e.n).padStart(2, "0")}</span>
                    <span className={u.encuentroTitulo}>{e.titulo}</span>
                    <span className={u.encuentroSigno} aria-hidden>{esta ? "−" : "+"}</span>
                  </button>
                  {esta && <p className={u.encuentroTexto}>{e.texto}</p>}
                </li>
              )
            })}
          </ol>

          <p className={u.apunte}>Dieciséis semanas · unos cuatro meses</p>
        </section>

        {/* CIERRE */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <div className={u.cierre}>
            {cfg.intro && <p className={u.cierreTexto}>{cfg.intro}</p>}
            {blocks.length > 0 && (
              <blockquote className={u.cierreFrase}>
                {blocks.map((b, i) => (
                  <span key={i}>
                    {b.split("\n").map((line, j) => (
                      <span key={j}>{line}{j < b.split("\n").length - 1 ? <br /> : null}</span>
                    ))}
                  </span>
                ))}
              </blockquote>
            )}
            <Unirse cfg={cfg} margen="1.8rem 0 0" />
          </div>
        </section>
      </div>
    </div>
  )
}

/** El botón que lleva a la comunidad. Solo aparece si hay enlace configurado. */
function Unirse({ cfg, margen }: { cfg: UmbralConfig; margen: string }) {
  if (!cfg.ctaLabel || !cfg.ctaUrl) return null
  return (
    <button
      type="button"
      className={styles.cta}
      style={{ margin: margen, borderColor: "var(--s5-gold)" }}
      onClick={() => openExternal(cfg.ctaUrl)}
    >
      {cfg.ctaLabel} <ArrowRight size={15} />
    </button>
  )
}
