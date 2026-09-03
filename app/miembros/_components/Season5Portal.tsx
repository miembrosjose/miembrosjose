"use client"

// TEMPORADA 5 — Portal de Misión "Objetivos de los 144.000".
// NO es un layout de episodios: es una experiencia tipo portal iniciático /
// manifiesto / mapa de misión. Se abre como overlay fullscreen desde el
// carrusel de temporadas cuando el usuario entra a la Temporada 5.

import { useCallback, useEffect, useRef, useState } from "react"
import {
  X, ArrowDown, BookOpen, Map as MapIcon, MessageSquare, Share2, Lock, Check,
} from "lucide-react"
import styles from "./season5.module.css"
import { PortalJournal, type JournalDef } from "./PortalJournal"
import { CosmicField } from "./CosmicField"
import { FORUM_TITLES } from "../_lib/portals-data"

type Props = {
  open: boolean
  onClose: () => void
  /** Navega al foro (cierra el portal); opcionalmente a un tema concreto. */
  onGoToForo?: (title?: string) => void
}

// ── Los 7 objetivos ──────────────────────────────────────────────────
const OBJETIVOS = [
  {
    n: 1,
    title: "FORMAR COMUNIDAD DE BASE",
    phrase: "El llamado se fortalece cuando varias conciencias sostienen una misma frecuencia.",
    text:
      "Formar comunidad de base significa crear grupos de sintonía, afinidad y propósito. Una comunidad puede ser física, virtual o mental. Nace cuando varias personas estudian, meditan, registran, sirven y visualizan un mismo objetivo. Aquí comienzan los nodos de Los 144.000: puntos vivos de conciencia reunidos para sostener memoria, practicar discernimiento, compartir experiencias y servir al despertar humano sin fanatismo, superioridad ni dependencia.",
  },
  {
    n: 2,
    title: "IRRADIAR LA CLAVE DEL RECUERDO",
    phrase: "Quien recuerda se convierte en punto de irradiación.",
    text:
      "La Clave del Recuerdo fue activada a través del camino recorrido en las temporadas anteriores. Ahora debe irradiarse. Irradiar la memoria significa transmitir la información, compartir los archivos, hablar del Plan Cósmico, recordar la verdadera historia de la Tierra y hacerlo desde coherencia, servicio y responsabilidad. El miembro de Los 144.000 no impone. Irradia.",
  },
  {
    n: 3,
    title: "REDESCUBRIR LA HISTORIA SAGRADA DEL TERRITORIO",
    phrase: "Cada lugar guarda una parte de la memoria planetaria.",
    text:
      "Los miembros están llamados a mirar su territorio con nuevos ojos. Cada montaña, río, valle, ciudad, templo, cueva, desierto, lago o antiguo camino puede guardar memorias de pueblos, linajes, pactos, heridas, custodias y misiones olvidadas. Redescubrir la historia del territorio significa estudiar la memoria visible e invisible del lugar donde cada uno vive. La verdadera historia de la humanidad no está solamente en los grandes archivos cósmicos: también está escrita en la tierra que pisamos.",
  },
  {
    n: 4,
    title: "CONVERTIRSE EN GUARDIANES DEL LUGAR",
    phrase: "La misión planetaria comienza donde cada alma fue sembrada.",
    text:
      "Ser guardián del territorio no significa poseer un lugar. Significa escucharlo, respetarlo, limpiarlo, recordarlo y servirlo. Cada miembro puede convertirse en un punto de custodia: alguien que ora, medita, investiga, protege, honra y sostiene luz en su propio entorno. La Hermandad Blanca trabaja desde los retiros interiores, pero necesita seres conscientes en la superficie que actúen como puentes entre la memoria interna de la Tierra y la vida cotidiana de la humanidad.",
  },
  {
    n: 5,
    title: "ATRAVESAR LA CATASTRO-FE",
    phrase: "La gran prueba será sostener fe y discernimiento en medio del caos.",
    text:
      "La catastro-fe representa la evaluación de la fe frente a la confusión, el miedo, la sobreinformación, las falsas señales y las distorsiones espirituales. En este tiempo habrá mucha información disponible, pero no toda será verdadera. Muchas personas se extraviarán siguiendo mensajes atractivos, promesas rápidas o señales que alimentan expectativas personales. El miembro de Los 144.000 debe aprender a sostener centro, voluntad, fe y discernimiento cuando el mundo se llene de ruido.",
  },
  {
    n: 6,
    title: "PREPARARSE PARA EL CONTACTO CON LOS GUÍAS",
    phrase: "El contacto maduro comienza cuando la intención se ordena hacia el servicio.",
    text:
      "El contacto con Guías, Instructores, civilizaciones estelares y la Hermandad Blanca requiere preparación interior: limpiar intención, ordenar la mente, abrir el corazón, fortalecer discernimiento, sanar miedo, evitar dependencia y comprender que toda experiencia auténtica debe conducir a mayor servicio. El contacto no es una experiencia para alimentar identidad espiritual. Es una responsabilidad dentro del Plan.",
  },
  {
    n: 7,
    title: "REENCONTRARSE CON LA HERMANDAD BLANCA Y CUSTODIAR LOS ARCHIVOS",
    phrase: "La memoria vuelve cuando existe una red capaz de custodiarla.",
    text:
      "El objetivo mayor es preparar a la humanidad para reencontrarse conscientemente con la Gran Hermandad Blanca de los Retiros Interiores. Este encuentro representa el ingreso de la humanidad a una nueva responsabilidad: ocupar simbólicamente el lugar de la civilización número 33, primero como discípula de la Hermandad Blanca y luego como instructora del Nuevo Tiempo. Se vincula con el Libro de las Vestiduras Blancas: el retorno de la verdadera historia de la Tierra y los archivos preservados después de Atlántida. Recibir los archivos significa custodiar la memoria sin convertirla en poder, dogma, ego espiritual o separación.",
  },
]

const TERRITORY_QUESTIONS = [
  "¿Cuál es la historia ancestral de mi territorio?",
  "¿Qué pueblos lo habitaron?",
  "¿Qué lugares sagrados existen cerca?",
  "¿Qué heridas colectivas guarda esta tierra?",
  "¿Qué símbolos, mitos o relatos antiguos siguen presentes?",
  "¿Qué puedo hacer para honrar, sanar o custodiar este espacio?",
]

const UNLOCKS = [
  "Razas primordiales", "Ciudades intraterrenas", "Discos solares",
  "Numerología cósmica", "Sanación extraterrestre", "Lugares de contacto",
]

const TERRITORY_TEMPLATE =
  "BITÁCORA DEL TERRITORIO\n\n" +
  TERRITORY_QUESTIONS.map((q) => `• ${q}\n`).join("\n") +
  "\n— Escribe aquí tus hallazgos, señales y compromisos con tu lugar —\n"

export function Season5Portal({ open, onClose, onGoToForo }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const objetivosRef = useRef<HTMLDivElement>(null)
  const [journal, setJournal] = useState<JournalDef | null>(null)

  // Bloqueo de scroll del body + reset scroll al abrir
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    rootRef.current?.scrollTo({ top: 0 })
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Esc cierra (primero la bitácora, luego el portal)
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

  // Reveal on scroll
  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll(`.${styles.reveal}`))
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add(styles.revealIn))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add(styles.revealIn); io.unobserve(e.target) }
        })
      },
      { root, threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [open])

  const scrollToObjetivos = useCallback(() => {
    objetivosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const goForo = useCallback((title?: string) => {
    onClose()
    onGoToForo?.(title)
  }, [onClose, onGoToForo])

  if (!open) return null

  return (
    <div className={styles.overlay} ref={rootRef} role="dialog" aria-label="Objetivos de los 144.000">
      {/* Fondo cósmico */}
      <CosmicField />

      <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar portal">
        <X size={20} />
      </button>

      <div className={styles.inner}>
        {/* ── 1. HERO ── */}
        <header className={styles.hero}>
          <p className={styles.kicker}>Portal de Misión · Los 144.000</p>
          <h1 className={styles.heroTitle}>OBJETIVOS DE<br />LOS 144.000</h1>
          <p className={styles.heroSub}>Misión planetaria · territorio · memoria sagrada</p>
          <div className={styles.heroLead}>
            <span className={styles.heroLeadHi}>Has recibido la memoria. Ahora comienza la misión.</span>
            Las primeras cuatro temporadas abrieron el recuerdo del Plan Cósmico, la estructura del universo,
            los orígenes ocultos de la Tierra y los archivos preservados después de Atlántida.
            Esta nueva etapa no se recorre como una serie de episodios. <strong>Se atraviesa como una decisión interior.</strong>
            <br /><br />
            Los 144.000 existen para sostener una red de conciencia, custodiar la memoria de la Tierra,
            irradiar la Clave del Recuerdo y preparar a la humanidad para un contacto más elevado con los Guías,
            la Hermandad Blanca y los archivos del Plan.
          </div>
          <button type="button" className={styles.cta} onClick={scrollToObjetivos}>
            Entrar a los Objetivos <ArrowDown size={15} />
          </button>
          <div className={styles.scrollHint} aria-hidden />
        </header>

        {/* ── 2. DECLARACIÓN ── */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <p className={styles.kicker}>Manifiesto</p>
          <h2 className={styles.sectionTitle}>DECLARACIÓN DE LOS 144.000</h2>
          <div className={styles.declaration}>
            <p>Los 144.000 no representan una élite separada de la humanidad.</p>
            <p className={styles.declBig}>Representan una frecuencia de responsabilidad.</p>
            <p>
              Cada miembro es llamado a recordar, sostener, irradiar y servir. Su tarea no termina al comprender
              la historia cósmica de la Tierra. También debe redescubrir la memoria sagrada de su propio territorio,
              de sus ancestros, de sus montañas, ríos, ciudades, templos, linajes y heridas colectivas.
            </p>
            <p>El Plan Cósmico no actúa solamente en las estrellas.</p>
            <p className={styles.declLedger}>
              Actúa en la Tierra. Actúa en los pueblos. Actúa en la memoria de los lugares. Actúa en la sangre.
              Actúa en la historia que cada territorio aún guarda.
            </p>
            <p>
              Con el apoyo de la Hermandad Blanca de la Tierra, los miembros de Los 144.000 son llamados a
              convertirse en guardianes conscientes de su lugar: seres capaces de estudiar, meditar, servir,
              escuchar la memoria profunda del planeta y sostener una red de luz allí donde han sido sembrados.
            </p>
          </div>
        </section>

        {/* ── 3. LOS 7 OBJETIVOS ── */}
        <section className={styles.section} ref={objetivosRef}>
          <div className={styles.reveal}>
            <p className={styles.kicker}>Código de Misión</p>
            <h2 className={styles.sectionTitle}>LOS 7 OBJETIVOS DE LOS 144.000</h2>
            <p className={styles.sectionIntro}>
              Las temporadas anteriores activaron la memoria. <strong>Estos objetivos muestran cómo esa memoria se convierte en misión.</strong>
            </p>
          </div>

          <div className={styles.constellation}>
            {OBJETIVOS.map((o) => (
              <article key={o.n} className={`${styles.seal} ${styles.reveal}`}>
                <div className={styles.sealMedal}><span>{o.n}</span></div>
                <div className={styles.sealBody}>
                  <div className={styles.sealNum}>Objetivo {String(o.n).padStart(2, "0")}</div>
                  <h3 className={styles.sealTitle}>{o.title}</h3>
                  <p className={styles.sealPhrase}>{o.phrase}</p>
                  <p className={styles.sealText}>{o.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── 4. MISIÓN TERRITORIAL ── */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <p className={styles.kicker}>Primer acto práctico</p>
          <h2 className={styles.sectionTitle}>MISIÓN TERRITORIAL</h2>
          <div className={styles.territory}>
            <span className={styles.territoryGlow} aria-hidden />
            <p>
              Cada miembro de Los 144.000 debe comenzar por su lugar. Antes de buscar grandes señales en el cielo,
              debe aprender a escuchar la tierra donde vive. Allí hay una memoria que necesita ser reconocida:
              los pueblos que caminaron antes, las heridas que quedaron abiertas, los lugares sagrados olvidados,
              las aguas contaminadas, los cerros custodiados, los templos destruidos, los linajes silenciados y las
              señales que aún permanecen activas.
            </p>
            <p className={styles.territoryHi}>La misión planetaria no comienza lejos. Comienza en el territorio.</p>
            <p>Por eso cada miembro será invitado a crear una bitácora de su lugar:</p>

            <div className={styles.questionCard}>
              <p className={styles.questionCardTitle}>Bitácora del territorio · preguntas guía</p>
              <ul className={styles.questionList}>
                {TERRITORY_QUESTIONS.map((q) => <li key={q}>{q}</li>)}
              </ul>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem", marginTop: "1.6rem" }}>
                <button
                  type="button"
                  className={styles.cta}
                  style={{ margin: 0 }}
                  onClick={() => setJournal({
                    key: "territorio",
                    title: "Bitácora del Territorio",
                    sub: "Investiga y registra la historia sagrada del lugar donde vives: ancestros, símbolos, heridas, puntos de poder y memorias planetarias.",
                    template: TERRITORY_TEMPLATE,
                  })}
                >
                  <MapIcon size={15} /> Abrir mi bitácora del territorio
                </button>
                <button
                  type="button"
                  className={styles.cta}
                  style={{ margin: 0, borderColor: "rgba(167,139,202,0.5)", background: "linear-gradient(135deg, rgba(167,139,202,0.16), rgba(109,74,155,0.14))" }}
                  onClick={() => goForo(FORUM_TITLES.territorio)}
                >
                  <MessageSquare size={15} /> Compartir mi territorio en el foro
                </button>
              </div>
            </div>

            <p style={{ marginTop: "1.6rem" }}>
              Esta misión territorial se realizará con el apoyo de la Hermandad Blanca, los retiros interiores y la
              red de conciencia de Los 144.000.
            </p>
          </div>
        </section>

        {/* ── 5. ÁREA DE INTEGRACIÓN ── */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <p className={styles.kicker}>Comunidad activa</p>
          <h2 className={styles.sectionTitle}>ÁREA DE INTEGRACIÓN</h2>
          <p className={styles.sectionIntro}>
            El inicio de una red viva. No es contenido de temporada: es el espacio donde la misión se practica.
          </p>

          <div className={styles.integrationGrid}>
            <button
              type="button"
              className={styles.intCard}
              onClick={() => setJournal({
                key: "personal",
                title: "Bitácora Personal",
                sub: "Registra comprensiones, sueños, señales, meditaciones, resistencias y cambios interiores.",
              })}
            >
              <span className={styles.intIcon}><BookOpen size={22} /></span>
              <span className={styles.intName}>Bitácora Personal</span>
              <span className={styles.intDesc}>Espacio para registrar comprensiones, sueños, señales, meditaciones, resistencias y cambios interiores.</span>
              <span className={`${styles.intTag} ${styles.intTagLive}`}>Disponible</span>
            </button>

            <button
              type="button"
              className={styles.intCard}
              onClick={() => setJournal({
                key: "territorio",
                title: "Bitácora del Territorio",
                sub: "Investiga y registra la historia sagrada del lugar donde vives: ancestros, símbolos, heridas, puntos de poder y memorias planetarias.",
                template: TERRITORY_TEMPLATE,
              })}
            >
              <span className={styles.intIcon}><MapIcon size={22} /></span>
              <span className={styles.intName}>Bitácora del Territorio</span>
              <span className={styles.intDesc}>Investiga y registra la historia sagrada del lugar donde vives: ancestros, símbolos, heridas, puntos de poder y memorias planetarias.</span>
              <span className={`${styles.intTag} ${styles.intTagLive}`}>Disponible</span>
            </button>

            <button type="button" className={styles.intCard} onClick={() => goForo(FORUM_TITLES.objetivos)}>
              <span className={styles.intIcon}><MessageSquare size={22} /></span>
              <span className={styles.intName}>Foro de la Red</span>
              <span className={styles.intDesc}>Comparte experiencias con otros miembros desde respeto, discernimiento y claridad.</span>
              <span className={`${styles.intTag} ${styles.intTagLive}`}>Ir al foro</span>
            </button>

            <button type="button" className={styles.intCard} onClick={() => goForo(FORUM_TITLES.nodos)}>
              <span className={styles.intIcon}><Share2 size={22} /></span>
              <span className={styles.intName}>Nodos 144.000</span>
              <span className={styles.intDesc}>Encuentra o forma tu comunidad de base (física, virtual o mental) con otros miembros cercanos.</span>
              <span className={`${styles.intTag} ${styles.intTagLive}`}>Encontrar mi nodo</span>
            </button>

            <div className={styles.intCard} data-soon="true">
              <span className={styles.intIcon}><Lock size={22} /></span>
              <span className={styles.intName}>Desbloqueos Futuros</span>
              <span className={styles.intDesc}>Archivos especiales que se abrirán con el tiempo.</span>
              <ul className={styles.unlockList}>
                {UNLOCKS.map((u) => <li key={u}>{u}</li>)}
              </ul>
              <span className={`${styles.intTag} ${styles.intTagSoon}`}>Próximamente</span>
            </div>
          </div>
        </section>

        {/* ── 6. UMBRAL ── */}
        <section className={styles.reveal}>
          <div className={styles.umbral}>
            <p className={styles.kicker} style={{ display: "inline-block" }}>El siguiente umbral</p>
            <h2 className={styles.sectionTitle}>EL SIGUIENTE UMBRAL</h2>
            <p>
              Cuando una persona comprende los objetivos de Los 144.000, puede comenzar su preparación práctica.
              El siguiente espacio no será una temporada de videos. Será un umbral: un camino de prácticas,
              meditaciones, bitácora y preparación interior para que el contacto deje de ser una idea y se convierta
              en una responsabilidad sostenida.
            </p>
            <blockquote className={styles.finalQuote}>
              <span>La memoria fue entregada.</span>
              <span>El territorio debe ser recordado.</span>
              <span>La Red debe sostenerse.</span>
              <span>El contacto vendrá cuando la conciencia pueda responder.</span>
            </blockquote>
            <div className={styles.umbralBtn}>
              <Check size={14} /> Próximamente: El Umbral del Contacto
            </div>
          </div>
        </section>
      </div>

      {journal && <PortalJournal def={journal} onClose={() => setJournal(null)} />}
    </div>
  )
}
