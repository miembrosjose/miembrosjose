"use client"

// Portal de Integración entre temporadas. Overlay breve (no video, no episodio):
// frase central, texto de integración, bitácora de 3 preguntas, una acción
// concreta y un botón para avanzar a la siguiente temporada.

import { useEffect, useState } from "react"
import { X, ArrowRight, Sparkles, PenLine, MessageSquare } from "lucide-react"
import styles from "./season5.module.css"
import { PortalJournal, type JournalDef } from "./PortalJournal"
import { CosmicField } from "./CosmicField"
import type { IntegrationPortalDef } from "../_lib/portals-data"

type Props = {
  portal: IntegrationPortalDef | null
  onClose: () => void
  /** Avanza a la temporada nextSeason (cierra el portal y abre el drawer). */
  onAdvance: (seasonNum: number) => void
  /** Lleva al tema del foro de este portal. */
  onGoToForo?: (title: string) => void
}

export function IntegrationPortal({ portal, onClose, onAdvance, onGoToForo }: Props) {
  const [journal, setJournal] = useState<JournalDef | null>(null)

  useEffect(() => {
    if (!portal) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [portal])

  useEffect(() => {
    if (!portal) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (journal) setJournal(null)
      else onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [portal, journal, onClose])

  if (!portal) return null

  return (
    <div className={styles.overlay} role="dialog" aria-label={portal.name}>
      <CosmicField />

      <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar portal">
        <X size={20} />
      </button>

      <div className={styles.inner}>
        <header className={styles.hero} style={{ minHeight: "auto", paddingTop: "7rem", paddingBottom: "1rem" }}>
          <p className={styles.kicker}>{portal.kicker}</p>
          <h1 className={styles.heroTitle} style={{ fontSize: "clamp(1.8rem, 6vw, 3.4rem)" }}>{portal.name}</h1>
          <blockquote className={styles.portalFrase}>
            {portal.frase.map((f, i) => <span key={i}>{f}</span>)}
          </blockquote>
        </header>

        <section className={styles.section} style={{ paddingTop: "1rem" }}>
          <div className={styles.declaration}>
            {portal.text.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          {/* Bitácora del portal */}
          <div className={styles.questionCard} style={{ marginTop: "1.8rem" }}>
            <p className={styles.questionCardTitle}>Bitácora · preguntas de integración</p>
            <ul className={styles.questionList}>
              {portal.questions.map((q) => <li key={q}>{q}</li>)}
            </ul>
          </div>

          {/* Acción concreta */}
          <div className={styles.actionBox}>
            <span className={styles.actionIcon}><Sparkles size={20} /></span>
            <div>
              <p className={styles.actionLabel}>Acción de este portal</p>
              <p className={styles.actionText}>{portal.action}</p>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem", marginTop: "2rem", alignItems: "center" }}>
            <button
              type="button"
              className={styles.cta}
              style={{ margin: 0 }}
              onClick={() => setJournal({
                key: portal.journalKey,
                title: portal.name,
                sub: "Registra tus respuestas y tu declaración de intención. Se guarda en este dispositivo.",
                template: bitacoraTemplate(portal),
              })}
            >
              <PenLine size={15} /> Abrir mi bitácora
            </button>
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
              style={{ margin: 0, borderColor: "rgba(111,155,240,0.55)", background: "linear-gradient(135deg, rgba(111,155,240,0.18), rgba(109,74,155,0.16))" }}
              onClick={() => onAdvance(portal.nextSeason)}
            >
              {portal.buttonLabel} <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>

      {journal && <PortalJournal def={journal} onClose={() => setJournal(null)} />}
    </div>
  )
}

function bitacoraTemplate(portal: IntegrationPortalDef): string {
  return (
    `${portal.name}\n\n` +
    portal.questions.map((q) => `• ${q}\n`).join("\n") +
    `\nAcción: ${portal.action}\n\n— Escribe aquí —\n`
  )
}
