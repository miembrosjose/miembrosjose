"use client"

// OBJETIVOS DE LOS 144.000 — portal de misión.
// Orden: Hero → REVELADOR DE MISIÓN (primero) → Mapa Revelado (resultado) →
// Declaración → 7 Objetivos → Misiones de Custodia → Umbral.
// Ya NO pide llenar el "Mapa de mi Misión": esas preguntas viven en los
// portales de integración y en Mi Gran Bitácora. Aquí es análisis, no formulario.

import { useCallback, useEffect, useRef, useState } from "react"
import { X, ArrowDown, ArrowRight, MessageSquare, Check, Shield, Compass } from "lucide-react"
import styles from "./season5.module.css"
import { CosmicField } from "./CosmicField"
import { BannerVideo } from "./BannerVideo"
import { FORUM_TITLES } from "../_lib/portals-data"
import { readAnswer, upsertAnswer } from "../_lib/journal-store"
import {
  getMissionState, setMissionState, MISSION_STATE_LABELS, MISSIONS_CHANGED_EVENT, type MissionState,
} from "../_lib/missions"
import { unlockSeal } from "../_lib/seals"
import { OBJETIVOS, CUSTODIA, type ObjAction, type CustodiaMision } from "../_lib/objetivos-data"
import { MissionRevealer } from "./MissionRevealer"
import { getLastRevelation, REVELATION_CHANGED_EVENT, type MissionReport } from "../_lib/mission-analysis"

type Props = {
  open: boolean
  onClose: () => void
  onGoToForo?: (title?: string) => void
  onOpenUmbral?: () => void
}

// Campo editable que autoguarda PRIVADO en la bitácora.
function JournalField({ source, sourceLabel, prompt, minH = 56 }: { source: string; sourceLabel: string; prompt: string; minH?: number }) {
  const [value, setValue] = useState("")
  const [saved, setSaved] = useState(true)
  const dirty = useRef(false)
  useEffect(() => { setValue(readAnswer(source, prompt)); setSaved(true); dirty.current = false }, [source, prompt])
  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(() => {
      upsertAnswer({ category: "misiones", source, sourceLabel, prompt, answer: value, isPrivate: true })
      setSaved(true)
    }, 600)
    return () => clearTimeout(t)
  }, [value, source, sourceLabel, prompt])
  return (
    <div className={styles.jField}>
      <label className={styles.jFieldLabel}>
        <span>{prompt}</span>
        <span className={styles.jSaved} style={{ color: value.trim() ? (saved ? "#7ee0a8" : "var(--s5-gold)") : "#6a6f92" }}>
          {value.trim() ? (saved ? <><Check size={11} /> Guardado</> : "Guardando…") : "Privado"}
        </span>
      </label>
      <textarea className={styles.jFieldArea} style={{ minHeight: minH }} value={value}
        placeholder="Escribe aquí… (privado, solo en tu bitácora)"
        onChange={(e) => { setValue(e.target.value); setSaved(false); dirty.current = true }} />
    </div>
  )
}

function MissionCard({ m, onGoToForo }: { m: CustodiaMision; onGoToForo?: (t?: string) => void }) {
  const [state, setState] = useState<MissionState>("no_iniciada")
  useEffect(() => { setState(getMissionState(m.id)) }, [m.id])
  const change = useCallback((next: MissionState) => {
    setMissionState(m.id, next); setState(next)
    if (next === "integrada" && m.sealId) unlockSeal(m.sealId)
  }, [m.id, m.sealId])
  const source = `custodia_${m.id}`
  const sourceLabel = `Misión de Custodia · ${m.title}`
  const stateColor = state === "integrada" ? "#7ee0a8" : state === "en_proceso" ? "var(--s5-gold)" : "#8b90b4"
  return (
    <article className={styles.actionCard}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.8rem" }}>
        <p className={styles.actionCardKicker}><Shield size={12} style={{ verticalAlign: "middle" }} /> Misión {String(m.n).padStart(2, "0")}</p>
        <span className={styles.jSaved} style={{ color: stateColor }}>
          {state === "integrada" ? <><Check size={11} /> Integrada</> : MISSION_STATE_LABELS[state]}
        </span>
      </div>
      <h4 className={styles.actionCardName}>{m.title}</h4>
      <p className={styles.actionCardText}>{m.text}</p>
      <p className={styles.actionCardText} style={{ color: "var(--s5-gold-soft)" }}><strong>Acción:</strong> {m.action}</p>
      <div style={{ marginTop: "0.8rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {m.fields.map((f) => <JournalField key={f} source={source} sourceLabel={sourceLabel} prompt={f} />)}
      </div>
      <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        <span className={styles.jSaved} style={{ color: "#8b90b4" }}>Estado:</span>
        {(["no_iniciada", "en_proceso", "integrada"] as MissionState[]).map((s) => (
          <button key={s} type="button" onClick={() => change(s)} className={styles.stateChip}
            style={state === s ? { borderColor: "var(--s5-gold)", background: "rgba(217,184,102,0.14)", color: "var(--s5-gold-soft)" } : undefined}>
            {MISSION_STATE_LABELS[s]}
          </button>
        ))}
      </div>
      <div style={{ marginTop: "0.9rem", display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
        {m.result && <span className={styles.missionResult}>{m.result}{m.sealId && state === "integrada" ? " · sello desbloqueado" : ""}</span>}
        {m.foro && (
          <button type="button" className={styles.missionShare} onClick={() => onGoToForo?.(m.foro)}>
            <MessageSquare size={12} /> Compartir como reporte (opcional)
          </button>
        )}
      </div>
    </article>
  )
}

// Mapa Revelado de mi Misión — síntesis del último análisis (no es formulario).
function MapaRevelado() {
  const [rev, setRev] = useState<MissionReport | null>(null)
  useEffect(() => {
    const load = () => setRev(getLastRevelation()?.report ?? null)
    load()
    window.addEventListener(REVELATION_CHANGED_EVENT, load)
    return () => window.removeEventListener(REVELATION_CHANGED_EVENT, load)
  }, [])
  const items: { label: string; text: string }[] = rev ? [
    { label: "Lo que vengo a sanar", text: rev.herida },
    { label: "Patrón central", text: rev.patternText },
    { label: "La medicina que puedo ofrecer", text: rev.medicina },
    { label: "El territorio que me llama", text: rev.territorio },
    { label: "Objetivo más activo en mí", text: rev.objetivo },
    { label: "Misión recomendada", text: rev.primeraMision },
  ] : []
  return (
    <section className={`${styles.section} ${styles.reveal}`}>
      <p className={styles.kicker}>Síntesis de tu proceso</p>
      <h2 className={styles.sectionTitle}><Compass size={20} style={{ verticalAlign: "-3px", marginRight: 8, color: "var(--s5-gold)" }} />MAPA REVELADO DE MI MISIÓN</h2>
      {rev ? (
        <div className={styles.mapaRevelado}>
          {items.map((it) => (
            <div key={it.label} className={styles.mapaItem}>
              <p className={styles.mapaItemLabel}>{it.label}</p>
              <p className={styles.mapaItemText}>{it.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.mapaEmpty}>
          Tu mapa de misión aparecerá aquí cuando el Revelador de Misión tenga suficiente información en tu bitácora.
        </p>
      )}
    </section>
  )
}

export function Season5Portal({ open, onClose, onGoToForo, onOpenUmbral }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const revealerRef = useRef<HTMLDivElement>(null)
  const misionesRef = useRef<HTMLDivElement>(null)
  const [bannerVideo, setBannerVideo] = useState<string>("")

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    rootRef.current?.scrollTo({ top: 0 })
    return () => { document.body.style.overflow = prev }
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
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const [, force] = useState(0)
  useEffect(() => {
    if (!open) return
    const h = () => force((n) => n + 1)
    window.addEventListener(MISSIONS_CHANGED_EVENT, h)
    return () => window.removeEventListener(MISSIONS_CHANGED_EVENT, h)
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

  const scrollTo = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])
  const goForo = useCallback((title?: string) => { onClose(); onGoToForo?.(title) }, [onClose, onGoToForo])
  const handleObjAction = useCallback((act: ObjAction) => {
    if (act === "foro_nodos") goForo(FORUM_TITLES.nodos)
    else if (act === "foro_objetivos") goForo(FORUM_TITLES.objetivos)
    else if (act === "umbral") { onClose(); onOpenUmbral?.() }
    else scrollTo(misionesRef)
  }, [goForo, onClose, onOpenUmbral, scrollTo])

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
            <button type="button" className={styles.cta} onClick={() => scrollTo(revealerRef)}>
              Revelar mi misión <ArrowDown size={15} />
            </button>
          </div>
        </header>

        {/* REVELADOR DE MISIÓN (primero) */}
        <div ref={revealerRef}>
          <MissionRevealer onGoToMisiones={() => scrollTo(misionesRef)} />
        </div>

        {/* MAPA REVELADO */}
        <MapaRevelado />

        {/* DECLARACIÓN */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <p className={styles.kicker}>Manifiesto</p>
          <h2 className={styles.sectionTitle}>DECLARACIÓN DE LOS 144.000</h2>
          <div className={styles.declaration}>
            <p>Los 144.000 no representan una élite separada de la humanidad.</p>
            <p className={styles.declBig}>Representan una frecuencia de responsabilidad.</p>
            <p>Cada miembro es llamado a recordar, sostener, irradiar y servir. Su tarea no termina al comprender la historia cósmica de la Tierra: también debe redescubrir la memoria sagrada de su territorio, sus ancestros y sus heridas colectivas.</p>
          </div>
        </section>

        {/* LOS 7 OBJETIVOS */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <p className={styles.kicker}>Código de Misión</p>
          <h2 className={styles.sectionTitle}>LOS 7 OBJETIVOS DE LOS 144.000</h2>
          <p className={styles.sectionIntro}>Las temporadas activaron la memoria. <strong>Estos objetivos muestran cómo esa memoria se convierte en misión.</strong></p>
          <div className={styles.constellation}>
            {OBJETIVOS.map((o) => (
              <article key={o.n} className={styles.seal}>
                <div className={styles.sealMedal}><span>{o.n}</span></div>
                <div className={styles.sealBody}>
                  <div className={styles.sealNum}>Objetivo {String(o.n).padStart(2, "0")}</div>
                  <h3 className={styles.sealTitle}>{o.title}</h3>
                  <p className={styles.sealPhrase}>{o.phrase}</p>
                  <p className={styles.sealText}>{o.text}</p>
                  <button type="button" className={styles.sealAction} onClick={() => handleObjAction(o.act)}>
                    <ArrowRight size={13} /> {o.actionLabel}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* MISIONES DE CUSTODIA */}
        <section className={`${styles.section} ${styles.reveal}`} ref={misionesRef}>
          <p className={styles.kicker}>De la memoria al acto</p>
          <h2 className={styles.sectionTitle}>MISIONES DE CUSTODIA</h2>
          <p className={styles.sectionIntro}>
            No son tareas. Son actos de custodia que puedes atravesar a tu ritmo. Cada una tiene un estado
            —<em>No iniciada · En proceso · Integrada</em>— y algunas encienden un sello. Registra en privado; comparte solo si lo decides.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginTop: "1.4rem" }}>
            {CUSTODIA.map((m) => <MissionCard key={m.id} m={m} onGoToForo={goForo} />)}
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
