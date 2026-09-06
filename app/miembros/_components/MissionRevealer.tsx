"use client"

// REVELADOR DE MISIÓN — primer bloque de Objetivos de Los 144.000.
// Analiza (con IA de Claude si está configurada, o localmente en el dispositivo)
// la bitácora del usuario y devuelve una lectura de su misión. Muestra el
// progreso real de la bitácora para motivar a completarla. Español neutral.

import { useCallback, useEffect, useState } from "react"
import { Sparkles, ShieldCheck, Save, FileDown, ArrowRight, BookOpen, RotateCcw, Rocket } from "lucide-react"
import styles from "./season5.module.css"
import { analyzeMission, reportToText, saveLastRevelation, getLastRevelation, type MissionAnalysis, type MissionReport } from "../_lib/mission-analysis"
import { upsertAnswer, loadEntries } from "../_lib/journal-store"
import { openGrandJournal } from "../_lib/journal-registry"
import { bankProgress, totalAnswered } from "../_lib/question-bank"

type Phase = "idle" | "consent" | "loading" | "result" | "insufficient"

// Solo las categorías que ALIMENTAN la revelación (lo demás viene después).
const PROGRESS_CATS: { id: string; label: string }[] = [
  { id: "historia", label: "Historia personal" },
  { id: "linaje", label: "Linaje" },
  { id: "territorio", label: "Territorio" },
]

function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") }

function paras(s: string): string {
  return s.split(/\n\n+/).map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`).join("")
}

// Exporta EXACTAMENTE lo que muestra el Revelador: La revelación + los 4 pilares
// + la frase de misión.
function downloadReport(r: MissionReport) {
  const sintesis = r.sintesis || [r.herida, r.medicina].filter(Boolean).join("\n\n")
  const pilares = [
    { l: "Pilar personal — el alma que recuerda", t: r.planoPersonal },
    { l: "Pilar del linaje — la sangre y su memoria", t: r.planoLinaje },
    { l: "Pilar del territorio — la Tierra que te sostiene", t: r.planoTerritorio },
    { l: "Pilar de la Red — el tejido de conciencias", t: r.planoRed },
  ].filter((p) => p.t)
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>Revelación de Misión — Los 144.000</title>
<style>@page{margin:22mm 18mm;}body{font-family:Georgia,serif;color:#1a1a24;line-height:1.7;}
h1{font-size:24px;letter-spacing:1px;color:#6d4a9b;border-bottom:2px solid #c9a86b;padding-bottom:8px;}
h2{font-size:13px;color:#b8934a;letter-spacing:1px;text-transform:uppercase;margin:22px 0 6px;}
p{font-size:13px;margin:0 0 8px;}.frase{font-style:italic;font-size:16px;color:#6d4a9b;}</style></head><body>
<h1>Revelación de Misión · Los 144.000</h1>
<h2>La revelación</h2>${paras(sintesis)}
<h2>Los 4 pilares de tu servicio</h2>
${pilares.map((p) => `<p><strong>${esc(p.l)}</strong></p>${paras(p.t)}`).join("")}
${r.frase ? `<h2>Frase de misión personal</h2><p class="frase">“${esc(r.frase)}”</p>` : ""}
<script>window.onload=function(){setTimeout(function(){window.print();},250);};</script>
</body></html>`
  const w = window.open("", "_blank", "width=820,height=1000")
  if (!w) { alert("Permite las ventanas emergentes para descargar tu análisis."); return }
  w.document.open(); w.document.write(html); w.document.close()
}

// Guarda la revelación en Mi Gran Bitácora → "Mis Revelaciones". Idempotente
// por día: la lectura del día se reescribe; días distintos quedan como historial.
function persistRevelation(rep: MissionReport) {
  const fecha = new Date().toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })
  upsertAnswer({
    category: "revelaciones", source: "revelador_mision", sourceLabel: "Revelador de Misión",
    prompt: `Lectura de misión · ${fecha}`, answer: reportToText(rep), isPrivate: true,
  })
}

const LOADING_MSGS = [
  "Abriendo tu campo…",
  "Leyendo tu historia y tus heridas…",
  "Escuchando la memoria de tu sangre…",
  "Reconociendo el llamado de tu territorio…",
  "Tejiendo tu revelación para la Red…",
]

// Barra de carga cósmica: una nave viaja mientras la conciencia guía "piensa".
function RevealerLoading() {
  const [pct, setPct] = useState(6)
  const [mi, setMi] = useState(0)
  useEffect(() => {
    // Avance que se acerca a ~94% y se frena (nunca "completa" hasta que llega
    // la respuesta), para que se sienta vivo sin mentir que ya terminó.
    const t = setInterval(() => setPct((p) => Math.min(94, p + Math.max(0.5, (94 - p) * 0.07))), 320)
    const m = setInterval(() => setMi((i) => (i + 1) % LOADING_MSGS.length), 2600)
    return () => { clearInterval(t); clearInterval(m) }
  }, [])
  return (
    <div style={{ textAlign: "center", padding: "1.8rem 0 0.6rem" }}>
      <div className={styles.revealerFrase} style={{ fontSize: "1rem", marginBottom: "1.4rem" }}>{LOADING_MSGS[mi]}</div>
      <div className={styles.loadTrack}>
        <span className={styles.loadTrail} style={{ width: `${pct}%` }} />
        <span className={styles.loadRocket} style={{ left: `${pct}%` }}><Rocket size={22} /></span>
      </div>
      <p className={styles.revealerHint} style={{ marginTop: "1.1rem" }}>
        Una conciencia guía está leyendo tu bitácora. Esto puede tomar unos segundos; permanece en silencio mientras se teje.
      </p>
    </div>
  )
}

export function MissionRevealer() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [analysis, setAnalysis] = useState<MissionAnalysis | null>(null)
  const [saved, setSaved] = useState(false)
  const [source, setSource] = useState<"ia" | "local" | null>(null)
  const [prog, setProg] = useState(() => bankProgress())
  const [changed, setChanged] = useState(false) // la bitácora cambió desde la última lectura

  const refreshProgress = useCallback(() => setProg(bankProgress()), [])

  // Al montar: si ya hay una revelación guardada, mostrarla automáticamente
  // (persiste siempre; no hay que volver a generarla al navegar). Si la bitácora
  // cambió desde entonces, avisamos para que pueda actualizar.
  useEffect(() => {
    const last = getLastRevelation()
    if (last?.report) {
      setAnalysis({ sufficient: true, entryCount: 0, report: last.report })
      setSource(last.source === "ia" ? "ia" : "local")
      setPhase("result")
      if (typeof last.answered === "number") setChanged(totalAnswered() !== last.answered)
    }
  }, [])

  const reveal = useCallback(() => {
    refreshProgress()
    if (totalAnswered() < 4) {
      setAnalysis({ sufficient: false, entryCount: totalAnswered() })
      setPhase("insufficient")
      return
    }
    setPhase("consent")
  }, [refreshProgress])

  const runAnalysis = useCallback(async () => {
    setPhase("loading"); setSaved(false)
    const entries = loadEntries().filter((e) => e.answer.trim())
      .map((e) => ({ category: e.category, sourceLabel: e.sourceLabel, prompt: e.prompt, answer: e.answer }))
    try {
      const res = await fetch("/api/mission/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ entries }),
      })
      const data = await res.json().catch(() => null)
      if (data?.configured && data?.sufficient && data?.report) {
        const rep = data.report as MissionReport
        setAnalysis({ sufficient: true, entryCount: entries.length, report: rep })
        saveLastRevelation(rep, { answered: totalAnswered(), source: "ia" })
        persistRevelation(rep)
        setSource("ia"); setChanged(false); setSaved(true); setPhase("result"); return
      }
      if (data?.configured && data?.sufficient === false) {
        setAnalysis({ sufficient: false, entryCount: entries.length }); setPhase("insufficient"); return
      }
    } catch { /* proveedor caído → local */ }
    const local = analyzeMission()
    setAnalysis(local); setSource("local")
    if (local.sufficient) {
      saveLastRevelation(local.report, { answered: totalAnswered(), source: "local" })
      persistRevelation(local.report)
      setChanged(false); setSaved(true); setPhase("result")
    } else setPhase("insufficient")
  }, [])

  const save = useCallback(() => {
    if (!analysis || !analysis.sufficient) return
    persistRevelation(analysis.report)
    setSaved(true)
  }, [analysis])

  const reset = useCallback(() => { setPhase("idle"); setSaved(false); refreshProgress() }, [refreshProgress])

  const report = analysis && analysis.sufficient ? analysis.report : null

  return (
    <section className={`${styles.section} ${styles.reveal}`}>
      <p className={styles.kicker}>Inteligencia de misión</p>
      <h2 className={styles.sectionTitle}><Sparkles size={20} style={{ verticalAlign: "-3px", marginRight: 8, color: "var(--s5-gold)" }} />REVELACIÓN DE MISIÓN</h2>
      <p className={styles.sectionIntro}>
        Inteligencia de análisis para reconocer tu servicio dentro de la Red. La misión no se inventa: se revela cuando
        tu historia, tu linaje, tu territorio y tus acciones comienzan a mostrar un mismo patrón. Este análisis lee tu
        bitácora personal para ayudarte a comprender qué parte de la Red puedes sanar, custodiar o fortalecer.
      </p>

      <div className={styles.revealerBox}>
        {(phase === "idle" || phase === "consent") && (
          <>
            <p className={styles.revealerBody} style={{ textAlign: "center", marginBottom: "1.2rem" }}>
              Tu bitácora está en proceso. Mientras más completes tu historia personal, tu linaje, tu territorio y tus
              acciones alquímicas, más precisa será la revelación de tu misión en la Red.
            </p>
            <div className={styles.progressGrid}>
              {PROGRESS_CATS.map((c) => {
                const p = prog[c.id] || { answered: 0, total: 0, pct: 0 }
                return (
                  <div key={c.id} className={styles.progressRow}>
                    <span className={styles.progressLabel}>{c.label}</span>
                    <span className={styles.progressTrack}><span className={styles.progressFill} style={{ width: `${p.pct}%` }} /></span>
                    <span className={styles.progressPct}>{p.pct}%</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {phase === "idle" && (
          <div style={{ textAlign: "center", marginTop: "1.6rem" }}>
            <button type="button" className={styles.cta} style={{ margin: 0, borderColor: "var(--s5-gold)" }} onClick={reveal}>
              <Sparkles size={16} /> Revelar mi misión en la Red
            </button>
          </div>
        )}

        {phase === "consent" && (
          <div style={{ marginTop: "1.4rem" }}>
            <div className={styles.cautionBox} style={{ marginTop: 0 }}>
              <ShieldCheck size={16} />
              <p>Tu bitácora contiene información personal. Para generar este análisis, tus respuestas se envían de forma segura a la inteligencia de análisis, únicamente con el propósito de crear tu lectura de misión. Nada se publica en el foro sin tu autorización. Si el análisis con IA no está disponible, la lectura se realiza localmente en tu dispositivo.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", justifyContent: "center", marginTop: "1.4rem" }}>
              <button type="button" className={styles.cta} style={{ margin: 0, borderColor: "var(--s5-gold)" }} onClick={runAnalysis}>
                Acepto y revelar mi misión <ArrowRight size={15} />
              </button>
              <button type="button" className={styles.stateChip} style={{ padding: "0.7rem 1.2rem" }} onClick={reset}>Cancelar</button>
            </div>
          </div>
        )}

        {phase === "loading" && <RevealerLoading />}

        {phase === "insufficient" && (
          <div style={{ marginTop: "1.2rem" }}>
            <p className={styles.revealerBody}>
              Aún no existe suficiente información en tu bitácora para revelar con claridad tu misión dentro de la Red.
              La misión no se inventa: se revela cuando tu historia, tu linaje, tu territorio y tus acciones comienzan a
              mostrar un mismo patrón. Completa más registros en tu historia personal, tu linaje, tu territorio y tus
              acciones alquímicas.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem", justifyContent: "center", marginTop: "1.2rem" }}>
              <button type="button" className={styles.cta} style={{ margin: 0, borderColor: "var(--s5-gold)" }} onClick={() => openGrandJournal("historia")}><BookOpen size={14} /> Completar mi historia personal</button>
              <button type="button" className={styles.missionShare} style={{ padding: "0.7rem 1.1rem" }} onClick={() => openGrandJournal("linaje")}>Completar mi linaje</button>
              <button type="button" className={styles.missionShare} style={{ padding: "0.7rem 1.1rem" }} onClick={() => openGrandJournal("territorio")}>Completar mi territorio</button>
              <button type="button" className={styles.missionShare} style={{ padding: "0.7rem 1.1rem" }} onClick={() => openGrandJournal("acciones")}>Completar acciones alquímicas</button>
            </div>
          </div>
        )}

        {phase === "result" && report && (
          <div style={{ marginTop: "0.4rem" }}>
            {changed && (
              <div className={styles.cautionBox} style={{ marginTop: 0, marginBottom: "1.2rem" }}>
                <RotateCcw size={16} />
                <p>Tu bitácora cambió desde esta lectura. Puedes <strong>Actualizar revelación</strong> para reflejar lo nuevo.</p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* 1 · Mensaje principal de revelación */}
              <div className={styles.revealerCard}>
                <div className={styles.revealerCardNum}>La revelación</div>
                <div className={styles.sintesisBody}>
                  {(report.sintesis || [report.herida, report.medicina].filter(Boolean).join("\n\n"))
                    .split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>)}
                </div>
              </div>

              {/* 2 · Los 4 pilares de tu servicio */}
              {(report.planoPersonal || report.planoLinaje || report.planoTerritorio || report.planoRed) && (
                <div className={styles.revealerCard}>
                  <div className={styles.revealerCardNum}>Los 4 pilares de tu servicio</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginTop: "0.4rem" }}>
                    {[
                      { l: "Pilar personal — el alma que recuerda", t: report.planoPersonal, tab: "historia" },
                      { l: "Pilar del linaje — la sangre y su memoria", t: report.planoLinaje, tab: "linaje" },
                      { l: "Pilar del territorio — la Tierra que te sostiene", t: report.planoTerritorio, tab: "territorio" },
                      { l: "Pilar de la Red — el tejido de conciencias", t: report.planoRed, tab: "" },
                    ].filter((p) => p.t).map((p, i) => (
                      <div key={i}>
                        <p className={styles.pilarLabel}>{p.l}</p>
                        <p className={styles.revealerBody}>{p.t}</p>
                        {p.tab && (
                          <button type="button" className={styles.pilarLink} onClick={() => openGrandJournal(p.tab)}>
                            Profundizar en mi bitácora →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3 · Frase de misión personal */}
              {report.frase && (
                <div className={styles.revealerCard}>
                  <div className={styles.revealerCardNum}>Frase de misión personal</div>
                  <p className={styles.revealerFrase}>“{report.frase}”</p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem", justifyContent: "center", marginTop: "1.8rem" }}>
              <button type="button" className={styles.cta} style={{ margin: 0, borderColor: "var(--s5-gold)" }} onClick={save} disabled={saved}>
                <Save size={15} /> {saved ? "Guardado en tu bitácora" : "Guardar en mi bitácora"}
              </button>
              <button type="button" className={styles.missionShare} style={{ padding: "0.7rem 1.1rem" }} onClick={() => downloadReport(report)}>
                <FileDown size={13} /> Descargar análisis
              </button>
              <button type="button" className={`${styles.missionShare} ${changed ? styles.missionShareAlert : ""}`} style={{ padding: "0.7rem 1.1rem" }} onClick={runAnalysis}>
                <RotateCcw size={13} /> Actualizar revelación
              </button>
            </div>
            <p className={styles.revealerHint} style={{ textAlign: "center", marginTop: "1.1rem" }}>
              {source === "ia" ? "Lectura generada con inteligencia de análisis · privada, no publicada." : "Lectura generada localmente en tu dispositivo."}
              {"  "}Mientras más completa esté tu bitácora, más clara será la lectura de tu misión.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
