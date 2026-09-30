"use client"

// PORTAL DE INGRESO — la entrada ceremonial a todo el camino de Los 144.000.
// No es un episodio ni una clase: es una puerta. Se abre como overlay antes
// de la Temporada 1.

import { useCallback, useEffect, useRef, useState } from "react"
import { X, ArrowDown, ArrowRight, MessageSquare, Check, ChevronDown } from "lucide-react"
import styles from "./season5.module.css"
import { CosmicField } from "./CosmicField"
import { BannerVideo } from "./BannerVideo"
import { FORUM_TITLES } from "../_lib/portals-data"
import { readAnswer, upsertAnswer } from "../_lib/journal-store"

// Campo de la Bitácora de Ingreso — autoguarda PRIVADO en MI CAMINO.
function IngresoField({ prompt }: { prompt: string }) {
  const [value, setValue] = useState("")
  const [saved, setSaved] = useState(true)
  const dirty = useRef(false)
  useEffect(() => { setValue(readAnswer("ingreso", prompt)); setSaved(true); dirty.current = false }, [prompt])
  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(() => {
      upsertAnswer({ category: "camino", source: "ingreso", sourceLabel: "Portal de Ingreso", prompt, answer: value, isPrivate: true })
      setSaved(true)
    }, 600)
    return () => clearTimeout(t)
  }, [value, prompt])
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
        value={value}
        placeholder="Escribe aquí… (privado, solo en tu bitácora)"
        onChange={(e) => { setValue(e.target.value); setSaved(false); dirty.current = true }}
      />
    </div>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  /** Entra a la Temporada 1 (cierra el portal y abre el drawer). */
  onEnterT1: () => void
  /** Lleva al tema del foro de ingreso. */
  onGoToForo?: (title: string) => void
}

// La Gran Invocación — estrofas.
//
// Texto corregido por José el 29-09-2026. La versión anterior era otra
// redacción («Aquél que Viene», «las pequeñas voluntades humanas») y le
// faltaba el cierre entero.
const INVOCATION = [
  "Desde el punto de Luz en la Mente de Dios\nQue afluya luz a las mentes de los seres humanos\nQue la Luz descienda a la tierra.",
  "Desde el punto de amor en el Corazón de Dios\nQue afluya amor a los corazones de los seres humanos\nQue Cristo retorne a la tierra.",
  "Desde el centro donde la Voluntad de Dios es conocida\nQue el propósito guíe las voluntades de los seres humanos\nEl propósito que los Maestros conocen y sirven.",
  "Desde el centro que llamamos la raza humana\nQue se realice el Plan de Amor y de Luz\nY se selle la puerta donde se halle el mal.",
  "Que la luz, el amor y el poder restablezcan\nel Plan Divino en la Tierra.",
  "¡Así es, así sea, así será y hecho está!\nY que todos cumplamos con nuestra parte\nen esta sagrada misión de amor.",
]

// ── LA RUTA, EN DOS ETAPAS ────────────────────────────────────────────────
// Antes eran cinco tarjetas sueltas, todas abiertas a la vez. Dos problemas:
// no se veía dónde termina el camino de formación y dónde empieza lo que
// viene después, y el muro de texto era lo primero que aparecía.
//
// Ahora es una lista desplegable con un solo paso abierto. Los títulos se leen
// de un vistazo —que es lo que hace falta para hacerse una idea— y el detalle
// está a un toque de quien lo quiera.
type Paso = { n: number; name: string; text: string }

const ETAPA_1: Paso[] = [
  { n: 1, name: "RECONÓCETE", text: "Reconoce tu origen, tu configuración y el llamado que te trajo hasta aquí." },
  { n: 2, name: "RECIBE LA MEMORIA", text: "Las primeras temporadas abren archivos de conciencia. No avances con prisa. Cada transmisión contiene una llave." },
  { n: 3, name: "INTEGRA LO RECIBIDO", text: "Entre temporadas encontrarás portales de integración. Allí la información deja de ser teoría y comienza a tocar tu historia, tus heridas, tus creencias y tu propósito." },
  { n: 4, name: "REGISTRA TU PROCESO", text: "La bitácora no es una tarea. Es tu archivo personal. Allí quedará la huella de lo que despertó en ti." },
  { n: 5, name: "RECONOCE TUS PATRONES", text: "El camino también abre procesos de desprogramación: creencias heredadas, heridas familiares, memorias de abandono, escasez, abuso, miedo, no pertenencia y desconexión." },
]

const ETAPA_2: Paso[] = [
  { n: 6, name: "RESPONDE DESDE TU TERRITORIO", text: "Tu misión no ocurre lejos. Comienza en el lugar donde vives, en tu linaje, en tu ciudad y en la memoria de la Tierra que te rodea." },
  { n: 7, name: "CONTACTO", text: "Conformar grupos afines de encuentro y de contacto extraterrestre." },
  { n: 8, name: "SERVIR", text: "Comprender tu tarea planetaria y prepararte para cumplirla." },
]

const INGRESO_QUESTIONS = [
  "¿Por qué siento que llegué a este camino?",
  "¿Qué busco realmente al entrar en Los 144.000?",
  "¿Estoy dispuesto a recibir información sin perder el discernimiento?",
]

/**
 * La ruta, como lista desplegable.
 *
 * Un solo paso abierto a la vez, y el mismo estado para las dos etapas: abrir
 * uno cierra el anterior aunque esté en la otra. Con ocho pasos, permitir
 * todos abiertos devuelve el muro de texto que veníamos a quitar.
 *
 * El primero arranca abierto para que se vea que esto se despliega. Una lista
 * toda cerrada no parece una lista: parece un índice muerto.
 */
function Ruta({
  pasos,
  abierto,
  onAbrir,
}: {
  pasos: Paso[]
  abierto: number
  onAbrir: (n: number) => void
}) {
  return (
    <div className={styles.rutaLista}>
      {pasos.map((p) => {
        const on = abierto === p.n
        return (
          <div key={p.n} className={`${styles.rutaItem} ${on ? styles.rutaItemOn : ""}`}>
            <button
              type="button"
              className={styles.rutaBoton}
              onClick={() => onAbrir(on ? 0 : p.n)}
              aria-expanded={on}
            >
              <span className={styles.rutaNum}>{String(p.n).padStart(2, "0")}</span>
              <span className={styles.rutaName}>{p.name}</span>
              <ChevronDown size={16} className={styles.rutaChevron} aria-hidden />
            </button>
            {on && <p className={styles.rutaTexto}>{p.text}</p>}
          </div>
        )
      })}
    </div>
  )
}

export function PortalIngreso({ open, onClose, onEnterT1, onGoToForo }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  // Qué paso de la ruta está desplegado. 0 = ninguno.
  const [paso, setPaso] = useState(1)
  const aperturaRef = useRef<HTMLDivElement>(null)
  const howRef = useRef<HTMLDivElement>(null)
  // Video de fondo del hero (opcional, gestionado desde admin vía site_texts).
  const [bannerVideo, setBannerVideo] = useState<string>("")

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch("/api/site-texts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.overrides) return
        const v = (d.overrides as Record<string, string>)["portal.ingreso.video"] || ""
        setBannerVideo(v)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])

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
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // Reveal on scroll: las secciones arrancan en opacity:0 (.reveal) y necesitan
  // que se les agregue .revealIn para aparecer. Sin esto quedaban INVISIBLES
  // (bug: La Gran Invocación no se veía). Con fallback: si el observer no
  // dispara, se revela todo igual a los 800ms → nunca queda contenido oculto.
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

  const scrollToApertura = useCallback(() => {
    aperturaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

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
          {bannerVideo && (
            <div className={styles.bannerLayer} aria-hidden>
              <BannerVideo src={bannerVideo} className={styles.bannerMedia} />
              <span className={styles.bannerVeil} />
            </div>
          )}
          <div className={styles.heroInner}>
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
          <button type="button" className={styles.cta} onClick={scrollToApertura}>
            Comenzar el Camino <ArrowDown size={15} />
          </button>
          <div className={styles.scrollHint} aria-hidden />
          </div>
        </header>

        {/* APERTURA DEL ESPACIO — La Gran Invocación */}
        <section className={`${styles.section} ${styles.reveal}`} ref={aperturaRef}>
          <p className={styles.kicker}>Apertura del Espacio</p>
          <h2 className={styles.sectionTitle}>APERTURA DEL ESPACIO</h2>
          <div className={styles.heroLead} style={{ margin: "0 auto 0.4rem", textAlign: "center" }}>
            <span className={styles.heroLeadHi}>Antes de iniciar este camino, abrimos el espacio desde un estado de presencia, respeto y conciencia.</span>
            La Gran Invocación es una oración sagrada con la que aperturamos el uso de esta plataforma. No se recita
            como una fórmula externa, sino como una apertura interior para recibir la memoria con discernimiento,
            humildad y responsabilidad.
          </div>
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
          <div style={{ textAlign: "center", marginTop: "2.2rem" }}>
            <button type="button" className={styles.cta} style={{ margin: 0 }} onClick={scrollToHow}>
              Continuar <ArrowDown size={15} />
            </button>
          </div>
        </section>

        {/* CÓMO RECORRER */}
        <section className={`${styles.section} ${styles.reveal}`} ref={howRef}>
          <p className={styles.kicker}>La ruta</p>
          <h2 className={styles.sectionTitle}>CÓMO RECORRER LOS 144.000</h2>

          <p className={styles.rutaEtapa}>Etapa 1 · El camino de formación</p>
          <Ruta pasos={ETAPA_1} abierto={paso} onAbrir={setPaso} />

          <p className={styles.rutaEtapa}>Etapa 2 · Lo que viene después</p>
          <Ruta pasos={ETAPA_2} abierto={paso} onAbrir={setPaso} />
        </section>

        {/* BITÁCORA DE INGRESO */}
        <section className={`${styles.section} ${styles.reveal}`}>
          <p className={styles.kicker}>Punto de partida</p>
          <h2 className={styles.sectionTitle}>BITÁCORA DE INGRESO</h2>
          <div className={styles.questionCard} style={{ marginTop: "1.4rem" }}>
            <p className={styles.questionCardTitle}>Antes de entrar, responde para ti · se guarda privado en tu bitácora</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginTop: "1rem" }}>
              {INGRESO_QUESTIONS.map((q) => <IngresoField key={q} prompt={q} />)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem", marginTop: "1.4rem" }}>
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
    </div>
  )
}
