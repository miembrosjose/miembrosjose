"use client"

// OBJETIVOS DE LOS 144.000 — portal de misión.
// Estructura limpia y automática, centrada en la Revelación de Misión y en los
// 4 planos de sanación: Personal · Ancestral (linaje) · Territorio · Red.
// La idea: vivir en coherencia, ser sol en la Tierra y sanar la memoria.

import { useCallback, useEffect, useRef, useState } from "react"
import { X, ArrowDown, ArrowRight, Heart, GitBranch, Mountain, Share2 } from "lucide-react"
import styles from "./season5.module.css"
import { CosmicField } from "./CosmicField"
import { BannerVideo } from "./BannerVideo"
import { FORUM_TITLES } from "../_lib/portals-data"
import { entriesByCategory, type JournalCategory } from "../_lib/journal-store"
import { openGrandJournal } from "../_lib/journal-registry"
import { getLastRevelation, REVELATION_CHANGED_EVENT, type MissionReport } from "../_lib/mission-analysis"
import { recommendedMissions } from "../_lib/objetivos-data"
import { setMissionState } from "../_lib/missions"
import { MissionRevealer } from "./MissionRevealer"

type Props = {
  open: boolean
  onClose: () => void
  onGoToForo?: (title?: string) => void
  onOpenUmbral?: () => void
}

function firstAnswer(cat: JournalCategory): string {
  const e = entriesByCategory(cat).find((x) => x.answer.trim())
  if (!e) return ""
  const a = e.answer.trim()
  return a.length > 180 ? a.slice(0, 180) + "…" : a
}

// Los 4 planos de la misión — reflejan lo que YA salió de la bitácora + una
// acción concreta. El plano Red usa la síntesis de la Revelación.
function PlanosMision({
  reveal, onScrollRevealer, onGoToForo, onClose,
}: {
  reveal: MissionReport | null
  onScrollRevealer: () => void
  onGoToForo?: (t?: string) => void
  onClose: () => void
}) {
  const historia = firstAnswer("historia")
  const linaje = firstAnswer("linaje")
  const territorio = firstAnswer("territorio")

  const planos = [
    {
      id: "personal", icon: <Heart size={18} />, title: "Sanar mi memoria personal",
      intent: "Lo que vine a sanar en mí.",
      desc: "Todo servicio verdadero empieza por casa. Aquello que aprendiste a atravesar en tu propia historia —la herida, el miedo, el olvido— se convierte en la primera medicina que puedes ofrecer. Nadie sana la Red desde afuera si no reconoció antes su propio proceso.",
      content: reveal?.planoPersonal || historia,
      empty: "Aún no has registrado tu historia personal. Ábrela y escribe: ahí comienza tu mapa.",
      actionLabel: "Profundizar mi historia", action: () => openGrandJournal("historia"),
    },
    {
      id: "ancestral", icon: <GitBranch size={18} />, title: "Sanar la memoria de mi linaje",
      intent: "El patrón que vine a transformar en mi árbol.",
      desc: "No cargas solo tu historia: cargas la de tu árbol. Investigar tu linaje —sus silencios, sus creencias heredadas, sus heridas repetidas, pero también sus dones— es liberar aquello que llevaba generaciones esperando ser mirado. Lo que termina en ti, ya no se hereda.",
      content: reveal?.planoLinaje || linaje,
      empty: "Gran parte ya la trabajaste en las integraciones. Abre tu bitácora de linaje e investiga qué patrón vino a terminar contigo.",
      actionLabel: "Investigar mi linaje", action: () => openGrandJournal("linaje"),
    },
    {
      id: "territorio", icon: <Mountain size={18} />, title: "Sanar la memoria del territorio",
      intent: "La tierra que vine a custodiar.",
      desc: "El lugar donde vives es un archivo vivo. Custodiar empieza por conocer: averigua los pueblos que caminaron antes, sus aguas y cerros, los lugares sagrados y las heridas colectivas que aún laten. Abre una bitácora de investigación y trae claridad sobre tu tierra.",
      content: reveal?.planoTerritorio || territorio,
      empty: "Abre tu bitácora de territorio e investiga: qué pueblos lo habitaron, qué lugares sagrados existen cerca y qué herida colectiva pide ser honrada.",
      actionLabel: "Investigar mi territorio", action: () => openGrandJournal("territorio"),
    },
    {
      id: "red", icon: <Share2 size={18} />, title: "Ser sol en la Tierra · servir a la Red",
      intent: "La medicina que puedo ofrecer.",
      desc: "Aquí tu historia personal se vuelve servicio. La medicina que naciste para ofrecer no se inventa: se revela cuando los otros tres planos empiezan a sanar. Ser sol en la Tierra es irradiar, desde tu propio proceso, lo que otros aún buscan.",
      content: reveal ? (reveal.planoRed || `${reveal.medicina}${reveal.objetivo ? `\n\nTu objetivo más activo: ${reveal.objetivo}.` : ""}`) : "",
      empty: "Revela tu misión para descubrir cuál es tu servicio concreto dentro de la Red.",
      actionLabel: reveal ? "Iniciar mi servicio" : "Revelar mi misión",
      action: () => {
        if (!reveal) { onScrollRevealer(); return }
        const m = recommendedMissions(reveal.objetivo)[0]
        if (m) { setMissionState(m.id, "en_proceso"); openGrandJournal("misiones") }
        else { onClose(); onGoToForo?.(FORUM_TITLES.nodos) }
      },
    },
  ]

  return (
    <section className={`${styles.section} ${styles.reveal}`}>
      <p className={styles.kicker}>El mapa de tu misión</p>
      <h2 className={styles.sectionTitle}>LOS 4 PLANOS DE LA MISIÓN</h2>
      <p className={styles.sectionIntro}>
        La misión no se inventa: se revela cuando tu historia, tu linaje, tu territorio y tu servicio muestran un mismo
        hilo. Aquí se refleja lo que ya vive en tu bitácora, en cuatro planos que se sanan juntos.
      </p>
      <div className={styles.planoGrid}>
        {planos.map((p) => (
          <article key={p.id} className={styles.actionCard}>
            <p className={styles.actionCardKicker}>{p.icon} {p.intent}</p>
            <h4 className={styles.actionCardName}>{p.title}</h4>
            <p className={styles.actionCardText}>{p.desc}</p>
            {p.content ? (
              <div className={styles.planoReveal}>
                {p.content.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
              </div>
            ) : (
              <p className={styles.actionCardText} style={{ color: "#8b90b4", fontStyle: "italic" }}>{p.empty}</p>
            )}
            <button type="button" className={styles.sealAction} style={{ marginTop: "1rem" }} onClick={p.action}>
              <ArrowRight size={13} /> {p.actionLabel}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export function Season5Portal({ open, onClose, onGoToForo, onOpenUmbral }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const revealerRef = useRef<HTMLDivElement>(null)
  const [bannerVideo, setBannerVideo] = useState<string>("")
  const [reveal, setReveal] = useState<MissionReport | null>(null)
  // onClose puede cambiar de identidad en cada render del shell; lo guardamos en
  // un ref para que el efecto de abrir NO se re-ejecute (eso reseteaba el scroll).
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

        {/* REVELADOR DE MISIÓN (corazón, persistente) */}
        <div ref={revealerRef}>
          <MissionRevealer />
        </div>

        {/* LOS 4 PLANOS DE LA MISIÓN */}
        <PlanosMision reveal={reveal} onScrollRevealer={scrollToRevealer} onGoToForo={onGoToForo} onClose={onClose} />

        {/* DECLARACIÓN — vivir en coherencia, ser sol en la Tierra */}
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
