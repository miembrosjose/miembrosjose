"use client"

// OBJETIVOS DE LOS 144.000 — portal de misión. Conecta la sanación personal
// con la misión territorial y planetaria: Declaración → Mapa de mi Misión →
// 7 Objetivos (con acción) → Misiones de Custodia (con estados y sellos).
// Todo lo que la persona escribe se autoguarda PRIVADO en Mi Gran Bitácora.

import { useCallback, useEffect, useRef, useState } from "react"
import {
  X, ArrowDown, ArrowRight, MessageSquare, Check, Compass, Shield, ShieldCheck,
} from "lucide-react"
import styles from "./season5.module.css"
import { CosmicField } from "./CosmicField"
import { BannerVideo } from "./BannerVideo"
import { FORUM_TITLES } from "../_lib/portals-data"
import { readAnswer, upsertAnswer, type JournalCategory } from "../_lib/journal-store"
import {
  getMissionState, setMissionState, MISSION_STATE_LABELS, MISSIONS_CHANGED_EVENT,
  type MissionState,
} from "../_lib/missions"
import { unlockSeal, type SealId } from "../_lib/seals"

type Props = {
  open: boolean
  onClose: () => void
  onGoToForo?: (title?: string) => void
  onOpenUmbral?: () => void
}

// ── Campo editable que autoguarda PRIVADO en la bitácora ────────────────
function JournalField({
  source, sourceLabel, category, prompt, minH = 56,
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

// ── Los 7 objetivos ──────────────────────────────────────────────────
type ObjAction = "foro_nodos" | "foro_objetivos" | "misiones" | "umbral"
const OBJETIVOS: { n: number; title: string; phrase: string; text: string; actionLabel: string; act: ObjAction }[] = [
  {
    n: 1, title: "FORMAR COMUNIDAD DE BASE",
    phrase: "El llamado se fortalece cuando varias conciencias sostienen una misma frecuencia.",
    text: "Crear grupos de sintonía, afinidad y propósito —físicos, virtuales o mentales— donde varias personas estudian, meditan, registran y sirven a un mismo objetivo. Aquí nacen los nodos de Los 144.000.",
    actionLabel: "Crear o buscar un nodo", act: "foro_nodos",
  },
  {
    n: 2, title: "IRRADIAR LA CLAVE DEL RECUERDO",
    phrase: "Quien recuerda se convierte en punto de irradiación.",
    text: "La Clave del Recuerdo se activó en las temporadas anteriores. Ahora debe irradiarse: transmitir, compartir los archivos, recordar la verdadera historia de la Tierra desde coherencia y servicio. El miembro no impone. Irradia.",
    actionLabel: "Compartir una enseñanza sin imponer", act: "foro_objetivos",
  },
  {
    n: 3, title: "REDESCUBRIR LA HISTORIA SAGRADA DEL TERRITORIO",
    phrase: "Cada lugar guarda una parte de la memoria planetaria.",
    text: "Mirar el propio territorio con nuevos ojos: montañas, ríos, ciudades, templos, cuevas, linajes y misiones olvidadas. La verdadera historia también está escrita en la tierra que pisamos.",
    actionLabel: "Crear mi ficha de territorio", act: "misiones",
  },
  {
    n: 4, title: "CONVERTIRSE EN GUARDIÁN DEL LUGAR",
    phrase: "La misión planetaria comienza donde cada alma fue sembrada.",
    text: "Ser guardián no es poseer un lugar: es escucharlo, respetarlo, limpiarlo, recordarlo y servirlo. Cada miembro puede ser un punto de custodia que sostiene luz en su entorno.",
    actionLabel: "Elegir mi punto de custodia", act: "misiones",
  },
  {
    n: 5, title: "ATRAVESAR LA CATASTRO-FE",
    phrase: "La gran prueba será sostener fe y discernimiento en medio del caos.",
    text: "En un tiempo de sobreinformación, falsas señales y distorsiones, el miembro aprende a sostener centro, voluntad, fe y discernimiento cuando el mundo se llena de ruido.",
    actionLabel: "Aplicar filtro de discernimiento", act: "misiones",
  },
  {
    n: 6, title: "PREPARARSE PARA EL CONTACTO CON LOS GUÍAS",
    phrase: "El contacto maduro comienza cuando la intención se ordena hacia el servicio.",
    text: "Limpiar intención, ordenar la mente, abrir el corazón, fortalecer discernimiento y sanar el miedo. El contacto no alimenta la identidad espiritual: es una responsabilidad dentro del Plan.",
    actionLabel: "Entrar al Umbral del Contacto", act: "umbral",
  },
  {
    n: 7, title: "REENCONTRARSE CON LA HERMANDAD BLANCA Y CUSTODIAR LOS ARCHIVOS",
    phrase: "La memoria vuelve cuando existe una red capaz de custodiarla.",
    text: "Preparar a la humanidad para reencontrarse conscientemente con la Gran Hermandad Blanca de los Retiros Interiores y custodiar la memoria sin convertirla en poder, dogma o separación.",
    actionLabel: "Registrar mi compromiso con los archivos", act: "misiones",
  },
]

// ── Mapa de mi Misión ──────────────────────────────────────────────────
const MAPA_QUESTIONS = [
  "¿Qué vine a sanar en mí?",
  "¿Qué patrón vine a cortar en mi linaje?",
  "¿Qué herida se repite en mi familia?",
  "¿Qué memoria de abuso, abandono, escasez, culpa, miedo, rechazo, silencio, control o no merecimiento reconozco en mi historia?",
  "¿Qué parte de mi vida puede convertirse en servicio?",
  "¿Qué territorio vine a custodiar?",
  "¿Qué herida colectiva reconozco en el lugar donde vivo?",
  "¿Qué medicina puedo ofrecer a la Red?",
  "¿Qué misión concreta puedo iniciar en este momento?",
]

// ── Misiones de Custodia ────────────────────────────────────────────────
type CustodiaMision = {
  id: string; n: number; title: string; text: string; action: string
  fields: string[]; result: string; sealId?: SealId; foro?: string
}
const CUSTODIA: CustodiaMision[] = [
  {
    id: "m1_historia", n: 1, title: "MI HISTORIA ANTES DEL TERRITORIO",
    text: "Antes de investigar la historia del lugar, reconozco la historia que vive en mí.",
    action: "Completa el Mapa de mi Misión (arriba) y sintetiza aquí lo esencial.",
    fields: ["Mi síntesis personal:"], result: "Primera síntesis personal.",
  },
  {
    id: "m2_territorio", n: 2, title: "ESCUCHAR EL TERRITORIO",
    text: "El territorio no es un escenario. Es un archivo vivo.",
    action: "Investiga historia ancestral, pueblos antiguos, lugares sagrados y heridas colectivas del lugar donde vivo.",
    fields: ["Lugar / territorio:", "Pueblos antiguos y sitios sagrados:", "Herida colectiva que reconozco:"],
    result: "Ficha de territorio.", sealId: "territorio", foro: FORUM_TITLES.territorio,
  },
  {
    id: "m3_linaje", n: 3, title: "RECONOCER EL LINAJE",
    text: "El árbol familiar muestra patrones que la Red pide transformar.",
    action: "Registra una creencia heredada, una herida repetida y una nueva decisión consciente.",
    fields: ["Creencia heredada:", "Herida repetida:", "Nueva decisión consciente:"],
    result: "Reporte privado de linaje.",
  },
  {
    id: "m4_punto", n: 4, title: "IDENTIFICAR UN PUNTO DE CUSTODIA",
    text: "Cada guardián necesita reconocer un lugar concreto donde sostener presencia.",
    action: "Elige un río, montaña, árbol, iglesia antigua, cueva, parque, cerro, lago, volcán, plaza o punto natural cercano.",
    fields: ["Mi punto de custodia:", "Por qué lo elijo:"], result: "Punto de custodia elegido.",
  },
  {
    id: "m5_sanar", n: 5, title: "SANAR UNA HERIDA DEL LUGAR",
    text: "La custodia comienza cuando el recuerdo se convierte en acto.",
    action: "Realiza una oración, meditación, limpieza, ofrenda sencilla, investigación, acto de perdón, servicio o cuidado del espacio.",
    fields: ["Acción de custodia realizada:", "Comprensión recibida:"],
    result: "Reporte de custodia.", sealId: "guardian", foro: FORUM_TITLES.territorio,
  },
  {
    id: "m6_irradiar", n: 6, title: "IRRADIAR LA CLAVE DEL RECUERDO",
    text: "Quien recuerda se convierte en punto de irradiación.",
    action: "Comparte una enseñanza de Los 144.000 a una persona, grupo o red social desde humildad y claridad.",
    fields: ["A quién / dónde compartí:", "Qué enseñanza irradié:"], result: "Registro de irradiación.",
    foro: FORUM_TITLES.objetivos,
  },
  {
    id: "m7_nodo", n: 7, title: "FORMAR O ACTIVAR UN NODO",
    text: "La Red se fortalece cuando la memoria deja de estar aislada.",
    action: "Invita a dos o más personas a una lectura, meditación, conversación consciente o práctica en común.",
    fields: ["Ciudad o territorio:", "Práctica realizada y participantes:", "Próximo paso:"],
    result: "Reporte de nodo.", sealId: "nodo", foro: FORUM_TITLES.nodos,
  },
]

function MissionCard({ m, onGoToForo }: { m: CustodiaMision; onGoToForo?: (t?: string) => void }) {
  const [state, setState] = useState<MissionState>("no_iniciada")
  useEffect(() => { setState(getMissionState(m.id)) }, [m.id])

  const change = useCallback((next: MissionState) => {
    setMissionState(m.id, next)
    setState(next)
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
        {m.fields.map((f) => (
          <JournalField key={f} source={source} sourceLabel={sourceLabel} category="misiones" prompt={f} />
        ))}
      </div>

      {/* Estado de la misión */}
      <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        <span className={styles.jSaved} style={{ color: "#8b90b4" }}>Estado:</span>
        {(["no_iniciada", "en_proceso", "integrada"] as MissionState[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => change(s)}
            className={styles.stateChip}
            style={state === s
              ? { borderColor: "var(--s5-gold)", background: "rgba(217,184,102,0.14)", color: "var(--s5-gold-soft)" }
              : undefined}
          >
            {MISSION_STATE_LABELS[s]}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "0.9rem", display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
        {m.result && (
          <span className={styles.missionResult}>{m.result}{m.sealId && state === "integrada" ? " · sello desbloqueado" : ""}</span>
        )}
        {m.foro && (
          <button type="button" className={styles.missionShare} onClick={() => onGoToForo?.(m.foro)}>
            <MessageSquare size={12} /> Compartir como reporte (opcional)
          </button>
        )}
      </div>
    </article>
  )
}

export function Season5Portal({ open, onClose, onGoToForo, onOpenUmbral }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const objetivosRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<HTMLDivElement>(null)
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
      .then((d) => {
        if (cancelled || !d?.overrides) return
        setBannerVideo((d.overrides as Record<string, string>)["portal.objetivos.video"] || "")
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // Re-render al cambiar estados de misión (para reflejar sellos, etc.)
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
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(styles.revealIn); io.unobserve(e.target) } }),
      { root, threshold: 0.1 },
    )
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
            <p className={styles.kicker}>Portal de Misión · Los 144.000</p>
            <h1 className={styles.heroTitle}>OBJETIVOS DE<br />LOS 144.000</h1>
            <p className={styles.heroSub}>Misión planetaria, territorio y memoria sagrada</p>
            <div className={styles.heroLead}>
              <span className={styles.heroLeadHi}>Has recibido la memoria. Ahora comienza la misión.</span>
              Pero la misión no empieza lejos. Empieza en ti. En tu historia. En tu herida. En tu linaje. En el
              territorio donde fuiste sembrado.
              <br /><br />
              Nadie puede limpiar la Red desde afuera si no reconoce lo que la Red le mostró dentro de su propia vida.
            </div>
            <blockquote className={styles.portalFrase} style={{ marginTop: "1.4rem" }}>
              <span>LO QUE VINE A SANAR EN MÍ</span>
              <span>REVELA QUÉ PARTE DE LA RED VINE A LIMPIAR.</span>
            </blockquote>
            <button type="button" className={styles.cta} onClick={() => scrollTo(mapaRef)}>
              Trazar mi mapa <ArrowDown size={15} />
            </button>
          </div>
        </header>

        {/* MAPA DE MI MISIÓN */}
        <section className={`${styles.section} ${styles.reveal}`} ref={mapaRef}>
          <p className={styles.kicker}>El centro</p>
          <h2 className={styles.sectionTitle}><Compass size={20} style={{ verticalAlign: "-3px", marginRight: 8, color: "var(--s5-gold)" }} />MAPA DE MI MISIÓN</h2>
          <p className={styles.sectionIntro}>
            Antes de servir al territorio, reconoce tu propio mapa interior. La misión no se inventa: se revela cuando
            miras con honestidad qué herida se repitió, qué patrón heredaste, qué memoria carga tu territorio y qué
            medicina puedes entregar. Todo aquí es <strong>privado</strong>.
          </p>
          <div className={styles.mirrorBlock} style={{ marginTop: "1.4rem" }}>
            {MAPA_QUESTIONS.map((q) => (
              <JournalField key={q} source="mapa_mision" sourceLabel="Mapa de mi Misión" category="misiones" prompt={q} />
            ))}
          </div>
        </section>

        {/* DECLARACIÓN */}
        <section className={`${styles.section} ${styles.reveal}`} style={{ paddingTop: 0 }}>
          <p className={styles.kicker}>Manifiesto</p>
          <h2 className={styles.sectionTitle}>DECLARACIÓN DE LOS 144.000</h2>
          <div className={styles.declaration}>
            <p>Los 144.000 no representan una élite separada de la humanidad.</p>
            <p className={styles.declBig}>Representan una frecuencia de responsabilidad.</p>
            <p>Cada miembro es llamado a recordar, sostener, irradiar y servir. Su tarea no termina al comprender la historia cósmica de la Tierra: también debe redescubrir la memoria sagrada de su territorio, sus ancestros y sus heridas colectivas.</p>
          </div>
        </section>

        {/* LOS 7 OBJETIVOS */}
        <section className={`${styles.section} ${styles.reveal}`} ref={objetivosRef} style={{ paddingTop: 0 }}>
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
        <section className={`${styles.section} ${styles.reveal}`} ref={misionesRef} style={{ paddingTop: 0 }}>
          <p className={styles.kicker}>De la memoria al acto</p>
          <h2 className={styles.sectionTitle}><ShieldCheck size={20} style={{ verticalAlign: "-3px", marginRight: 8, color: "var(--s5-gold)" }} />MISIONES DE CUSTODIA</h2>
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
