"use client"

// Portal de Integración PROFUNDA entre temporadas.
// Estructura: Revelación → Espejo Personal → Espejo del Linaje → Espejo del
// Territorio → (Leyes, sólo T2) → Acción Alquímica → Sello de Integración.
// Cada respuesta se autoguarda PRIVADA en Mi Gran Bitácora (journal-store).
// Nada íntimo se comparte automáticamente al foro.

import { useCallback, useEffect, useRef, useState } from "react"
import { X, ArrowRight, MessageSquare, ShieldCheck, Check, AlertTriangle } from "lucide-react"
import styles from "./season5.module.css"
import { CosmicField } from "./CosmicField"
import type { IntegrationPortalDef, IntegrationAction } from "../_lib/portals-data"
import type { JournalCategory } from "../_lib/journal-store"
import { readAnswer, upsertAnswer } from "../_lib/journal-store"
import { getSeal, hasSeal, unlockSeal } from "../_lib/seals"

type Props = {
  portal: IntegrationPortalDef | null
  onClose: () => void
  /** Avanza a nextSeason (5 = abrir Objetivos). */
  onAdvance: (seasonNum: number) => void
  onGoToForo?: (title: string) => void
}

// Campo editable que autoguarda (privado) en la bitácora.
function JournalField({
  source, sourceLabel, category, prompt, minH = 68,
}: {
  source: string; sourceLabel: string; category: JournalCategory; prompt: string; minH?: number
}) {
  const [value, setValue] = useState("")
  const [saved, setSaved] = useState(true)
  const dirty = useRef(false)

  useEffect(() => { setValue(readAnswer(source, prompt)); setSaved(true); dirty.current = false }, [source, prompt])

  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(() => {
      upsertAnswer({ category, source, sourceLabel, prompt, answer: value, isPrivate: true })
      setSaved(true)
    }, 600)
    return () => clearTimeout(t)
  }, [value, category, source, sourceLabel, prompt])

  return (
    <div className={styles.jField}>
      <label className={styles.jFieldLabel}>
        <span>{prompt}</span>
        <span className={styles.jSaved} style={{ color: value.trim() ? (saved ? "#7ee0a8" : "var(--s5-gold)") : "#6a6f92" }}>
          {value.trim() ? (saved ? <><Check size={11} /> Guardado</> : "Guardando…") : "Privado"}
        </span>
      </label>
      <textarea
        className={styles.jFieldArea}
        style={{ minHeight: minH }}
        value={value}
        placeholder="Escribe aquí… (privado, solo en tu bitácora)"
        onChange={(e) => { setValue(e.target.value); setSaved(false); dirty.current = true }}
      />
    </div>
  )
}

function MirrorBlock({
  label, questions, source, sourceLabel, category,
}: {
  label: string; questions: string[]; source: string; sourceLabel: string; category: JournalCategory
}) {
  return (
    <div className={styles.mirrorBlock}>
      <p className={styles.mirrorLabel}>{label}</p>
      {questions.map((q) => (
        <JournalField key={q} source={source} sourceLabel={sourceLabel} category={category} prompt={q} />
      ))}
    </div>
  )
}

function ActionCard({ portal, action }: { portal: IntegrationPortalDef; action: IntegrationAction }) {
  const source = `${portal.source}_${action.key}`
  const sourceLabel = `${portal.name} · ${action.name}`
  return (
    <article className={styles.actionCard}>
      <p className={styles.actionCardKicker}>Acción alquímica</p>
      <h4 className={styles.actionCardName}>{action.name}</h4>
      {action.instruction.map((p, i) => <p key={i} className={styles.actionCardText}>{p}</p>)}
      <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        {(action.fields ?? []).map((f) => (
          <JournalField key={f} source={source} sourceLabel={sourceLabel} category={action.category} prompt={f} minH={54} />
        ))}
        {action.freeText && (
          <JournalField source={source} sourceLabel={sourceLabel} category={action.category} prompt="Mi registro" minH={110} />
        )}
      </div>
      {action.closing && <p className={styles.actionCardClosing}>{action.closing}</p>}
    </article>
  )
}

export function IntegrationPortal({ portal, onClose, onAdvance, onGoToForo }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [sealed, setSealed] = useState(false)

  useEffect(() => {
    if (!portal) return
    setSealed(hasSeal(portal.sealId))
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    rootRef.current?.scrollTo({ top: 0 })
    return () => { document.body.style.overflow = prev }
  }, [portal])

  useEffect(() => {
    if (!portal) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [portal, onClose])

  const doSeal = useCallback(() => {
    if (!portal) return
    unlockSeal(portal.sealId)
    setSealed(true)
    // Lleva el sello a la vista.
    setTimeout(() => {
      rootRef.current?.querySelector(`.${styles.selloCard}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 60)
  }, [portal])

  if (!portal) return null
  const seal = getSeal(portal.sealId)

  return (
    <div className={styles.overlay} ref={rootRef} role="dialog" aria-label={portal.name}>
      <CosmicField />

      <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar portal">
        <X size={20} />
      </button>

      <div className={styles.inner}>
        {/* HERO */}
        <header className={styles.hero} style={{ minHeight: "auto", paddingTop: "6.5rem", paddingBottom: "1rem" }}>
          <p className={styles.kicker}>{portal.kicker}</p>
          <h1 className={styles.heroTitle} style={{ fontSize: "clamp(1.7rem, 5.5vw, 3.2rem)" }}>{portal.name}</h1>
          <p className={styles.heroSub}>{portal.subtitle}</p>
          <blockquote className={styles.portalFrase}>
            {portal.frase.map((f, i) => <span key={i}>{f}</span>)}
          </blockquote>
        </header>

        {/* REVELACIÓN */}
        <section className={styles.section} style={{ paddingTop: "0.5rem" }}>
          <p className={styles.kicker}>Revelación</p>
          <div className={styles.declaration}>
            {portal.revelacion.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          {portal.caution && (
            <div className={styles.cautionBox}>
              <AlertTriangle size={16} />
              <p>{portal.caution}</p>
            </div>
          )}
        </section>

        {/* ESPEJOS */}
        <section className={styles.section} style={{ paddingTop: 0 }}>
          <p className={styles.kicker}>Espejos de integración</p>
          <h2 className={styles.sectionTitle} style={{ fontSize: "clamp(1.3rem,3.5vw,1.9rem)" }}>MÍRATE EN TRES ESPEJOS</h2>
          <p className={styles.sectionIntro}>
            Todo lo que escribas aquí es <strong>privado</strong> y queda solo en tu bitácora. Responde lo que sientas; puedes volver cuando quieras.
          </p>

          <MirrorBlock
            label="Espejo personal"
            questions={portal.espejoPersonal}
            source={`${portal.source}_personal`}
            sourceLabel={`${portal.name} · Espejo personal`}
            category="historia"
          />
          <MirrorBlock
            label="Espejo del linaje"
            questions={portal.espejoLinaje}
            source={`${portal.source}_linaje`}
            sourceLabel={`${portal.name} · Espejo del linaje`}
            category="linaje"
          />
          {portal.espejoTerritorio && portal.espejoTerritorio.length > 0 && (
            <MirrorBlock
              label="Espejo del territorio"
              questions={portal.espejoTerritorio}
              source={`${portal.source}_territorio`}
              sourceLabel={`${portal.name} · Espejo del territorio`}
              category="territorio"
            />
          )}
        </section>

        {/* LEYES (solo T2) */}
        {portal.laws && portal.laws.length > 0 && (
          <section className={styles.section} style={{ paddingTop: 0 }}>
            <p className={styles.kicker}>Mapa de desprogramación</p>
            <h2 className={styles.sectionTitle} style={{ fontSize: "clamp(1.3rem,3.5vw,1.9rem)" }}>LAS 7 LEYES COMO ESPEJO</h2>
            <div className={styles.lawGrid}>
              {portal.laws.map((law) => (
                <article key={law.n} className={styles.lawCard}>
                  <div className={styles.lawHead}>
                    <span className={styles.lawNum}>{String(law.n).padStart(2, "0")}</span>
                    <h3 className={styles.lawName}>{law.name}</h3>
                  </div>
                  <p className={styles.lawQ}>{law.pregunta}</p>
                  <ul className={styles.lawSub}>
                    {law.profundizacion.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                  <p className={styles.lawAccion}><strong>Acción:</strong> {law.accion}</p>
                  <JournalField
                    source={`${portal.source}_ley_${law.n}`}
                    sourceLabel={`${portal.name} · Ley ${law.name}`}
                    category="linaje"
                    prompt={law.pregunta}
                    minH={54}
                  />
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ACCIONES ALQUÍMICAS */}
        <section className={styles.section} style={{ paddingTop: 0 }}>
          <p className={styles.kicker}>Acción alquímica</p>
          <h2 className={styles.sectionTitle} style={{ fontSize: "clamp(1.3rem,3.5vw,1.9rem)" }}>TRANSFORMAR, NO SOLO COMPRENDER</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem", marginTop: "1.4rem" }}>
            {portal.acciones.map((a) => <ActionCard key={a.key} portal={portal} action={a} />)}
          </div>
        </section>

        {/* SELLO DE INTEGRACIÓN */}
        <section className={styles.section} style={{ paddingTop: 0 }}>
          <div className={`${styles.selloCard} ${sealed ? styles.selloCardOn : ""}`}>
            <span className={styles.selloGlyph}>{seal?.glyph ?? "✷"}</span>
            <p className={styles.selloKicker}>Sello de integración</p>
            <h3 className={styles.selloName}>{seal?.name ?? "Sello"}</h3>
            <p className={styles.selloText}>{seal?.phrase}</p>
            {!sealed ? (
              <button type="button" className={styles.cta} style={{ margin: "0.4rem 0 0", borderColor: "var(--s5-gold)" }} onClick={doSeal}>
                <ShieldCheck size={16} /> Sellar mi integración
              </button>
            ) : (
              <p className={styles.selloDone}><Check size={13} /> Integración sellada</p>
            )}
          </div>

          {/* Botones finales */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem", justifyContent: "center", marginTop: "2rem" }}>
            <button
              type="button"
              className={styles.cta}
              style={{ margin: 0, borderColor: "rgba(167,139,202,0.5)", background: "linear-gradient(135deg, rgba(167,139,202,0.16), rgba(109,74,155,0.14))" }}
              onClick={() => onGoToForo?.(portal.forumTitle)}
            >
              <MessageSquare size={15} /> Compartir en el foro
            </button>
            <button
              type="button"
              className={styles.cta}
              style={{ margin: 0, borderColor: "var(--s5-gold)" }}
              onClick={() => onAdvance(portal.nextSeason)}
            >
              {portal.buttonLabel} <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
