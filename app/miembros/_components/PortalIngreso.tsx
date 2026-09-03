"use client"

// PORTAL DE INGRESO — la entrada ceremonial a todo el camino de Los 144.000.
// No es un episodio ni una clase: es una puerta. Se abre como overlay antes
// de la Temporada 1.

import { useCallback, useEffect, useRef, useState } from "react"
import { X, ArrowDown, ArrowRight, PenLine, MessageSquare } from "lucide-react"
import styles from "./season5.module.css"
import { CosmicField } from "./CosmicField"
import { PortalJournal, type JournalDef } from "./PortalJournal"
import { FORUM_TITLES } from "../_lib/portals-data"

type Props = {
  open: boolean
  onClose: () => void
  /** Entra a la Temporada 1 (cierra el portal y abre el drawer). */
  onEnterT1: () => void
  /** Lleva al tema del foro de ingreso. */
  onGoToForo?: (title: string) => void
}

// La Gran Invocación — estrofas.
const INVOCATION = [
  "Desde el punto de Luz en la Mente de Dios\nQue afluya luz a las mentes humanas\nQue la Luz descienda a la Tierra.",
  "Desde el punto de Amor en el Corazón de Dios\nQue afluya amor a los corazones humanos\nQue Aquél que Viene retorne a la Tierra.",
  "Desde el centro donde la Voluntad de Dios es conocida\nQue el propósito guíe a todas las pequeñas voluntades humanas\nEl propósito que los Maestros conocen y sirven.",
  "Desde el centro que llamamos la raza humana\nQue se realice el Plan de Amor y de Luz\nY selle la puerta donde se halla el mal.",
  "Que la Luz, el Amor y el Poder restablezcan el Plan en la Tierra.",
]

const HOW = [
  { n: 1, name: "RECIBE LA MEMORIA", text: "Las primeras temporadas abren archivos de conciencia. No las recorras con prisa. Cada transmisión contiene una llave." },
  { n: 2, name: "INTEGRA LO RECIBIDO", text: "Entre temporadas encontrarás portales de integración. Ahí la información deja de ser teoría y comienza a tocar tu vida." },
  { n: 3, name: "REGISTRA TU PROCESO", text: "Usa la bitácora para escribir sueños, señales, comprensiones, resistencias, emociones y cambios interiores." },
  { n: 4, name: "RESPONDE AL LLAMADO", text: "El camino no termina en aprender. Conduce a misión, territorio, comunidad, servicio y preparación para el contacto." },
]

const INGRESO_QUESTIONS = [
  "¿Por qué siento que llegué a este camino?",
  "¿Qué busco realmente al entrar en Los 144.000?",
  "¿Estoy dispuesto a recibir información sin perder discernimiento?",
]

const INGRESO_TEMPLATE =
  "BITÁCORA DE INGRESO\n\n" +
  INGRESO_QUESTIONS.map((q) => `• ${q}\n`).join("\n") +
  "\n— Escribe aquí tu punto de partida —\n"

export function PortalIngreso({ open, onClose, onEnterT1, onGoToForo }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const howRef = useRef<HTMLDivElement>(null)
  const [journal, setJournal] = useState<JournalDef | null>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    rootRef.current?.scrollTo({ top: 0 })
    return () => { document.body.style.overflow = prev }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (journal) setJournal(null)
      else onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, journal, onClose])

  const scrollToHow = useCallback(() => {
    howRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  if (!open) return null

  return (
    <div className={styles.overlay} ref={rootRef} role="dialog" aria-label="Portal de Ingreso">
      <CosmicField />

      <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar portal">
        <X size={20} />
      </button>

      <div className={styles.inner}>
        {/* HERO */}
        <header className={styles.hero}>
          <p className={styles.kicker}>Portal de Ingreso · Antes del Llamado</p>
          <h1 className={styles.heroTitle}>PORTAL DE INGRESO</h1>
          <p className={styles.heroSub}>Antes del Llamado</p>
          <div className={styles.heroLead}>
            <span className={styles.heroLeadHi}>Antes de escuchar el Llamado, detente.</span>
            Los 144.000 no son solamente una serie de transmisiones. Son un camino de memoria, responsabilidad y
            preparación interior.
            <br /><br />
            Aquí comienza una ruta que te llevará por el recuerdo del alma, la estructura del cosmos, la historia
            oculta de la Tierra, los archivos solares, la misión territorial, la comunidad de base y la preparación
            para el contacto.
            <br /><br />
            <strong>No entres buscando solamente información. Entra dispuesto a recordar, integrar y responder.</strong>
          </div>
          <button type="button" className={styles.cta} onClick={scrollToHow}>
            Comenzar el Camino <ArrowDown size={15} />
          </button>
          <div className={styles.scrollHint} aria-hidden />
        </header>

        {/* LA GRAN INVOCACIÓN */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <p className={styles.kicker}>Invocación sagrada</p>
          <h2 className={styles.sectionTitle}>LA GRAN INVOCACIÓN</h2>
          <div className={styles.invocation}>
            <div className={styles.invocationRule} aria-hidden />
            {INVOCATION.map((stanza, i) => (
              <p key={i} className={styles.invocationStanza}>
                {stanza.split("\n").map((line, j) => (
                  <span key={j}>{line}{j < stanza.split("\n").length - 1 ? <br /> : null}</span>
                ))}
              </p>
            ))}
          </div>
        </section>

        {/* CÓMO RECORRER */}
        <section className={`${styles.section} ${styles.reveal}`} ref={howRef}>
          <p className={styles.kicker}>La ruta</p>
          <h2 className={styles.sectionTitle}>CÓMO RECORRER LOS 144.000</h2>
          <div className={styles.howGrid}>
            {HOW.map((h) => (
              <article key={h.n} className={styles.howCard}>
                <span className={styles.howNum}>{String(h.n).padStart(2, "0")}</span>
                <h3 className={styles.howName}>{h.name}</h3>
                <p className={styles.howText}>{h.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ACUERDO DE ENTRADA */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <p className={styles.kicker}>Compromiso</p>
          <h2 className={styles.sectionTitle}>ACUERDO DE ENTRADA</h2>
          <div className={styles.creed}>
            <p>Al iniciar este camino, no se te pide creer ciegamente.</p>
            <p>Se te pide observar, discernir, sentir, estudiar, practicar y sostener una actitud limpia frente a la información que recibes.</p>
            <p>Los 144.000 no buscan fanatismo, superioridad ni dependencia espiritual.</p>
            <p className={styles.declBig} style={{ color: "var(--s5-gold-soft)" }}>
              Buscan seres humanos capaces de recordar con humildad, servir con claridad y caminar con responsabilidad.
            </p>
          </div>
        </section>

        {/* BITÁCORA DE INGRESO */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <p className={styles.kicker}>Punto de partida</p>
          <h2 className={styles.sectionTitle}>BITÁCORA DE INGRESO</h2>
          <div className={styles.questionCard} style={{ marginTop: "1.4rem" }}>
            <p className={styles.questionCardTitle}>Antes de entrar, responde para ti</p>
            <ul className={styles.questionList}>
              {INGRESO_QUESTIONS.map((q) => <li key={q}>{q}</li>)}
            </ul>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem", marginTop: "1.6rem" }}>
              <button
                type="button"
                className={styles.cta}
                style={{ margin: 0 }}
                onClick={() => setJournal({
                  key: "ingreso",
                  title: "Bitácora de Ingreso",
                  sub: "Tu punto de partida en el camino. Se guarda en este dispositivo.",
                  template: INGRESO_TEMPLATE,
                })}
              >
                <PenLine size={15} /> Abrir mi bitácora
              </button>
              <button
                type="button"
                className={styles.cta}
                style={{ margin: 0, borderColor: "rgba(167,139,202,0.5)", background: "linear-gradient(135deg, rgba(167,139,202,0.16), rgba(109,74,155,0.14))" }}
                onClick={() => onGoToForo?.(FORUM_TITLES.ingreso)}
              >
                <MessageSquare size={15} /> Presentarme en el foro
              </button>
            </div>
          </div>

          {/* Botón final */}
          <div style={{ textAlign: "center", marginTop: "2.6rem" }}>
            <button
              type="button"
              className={styles.cta}
              style={{ margin: 0, padding: "1.05rem 2.6rem", borderColor: "var(--s5-gold)" }}
              onClick={onEnterT1}
            >
              Entrar a la Temporada 1 <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>

      {journal && <PortalJournal def={journal} onClose={() => setJournal(null)} />}
    </div>
  )
}
