"use client"

// REVELADOR DE MISIÓN — primer bloque de Objetivos de Los 144.000.
// Analiza (con IA de Claude si está configurada, o localmente en el dispositivo)
// la bitácora del usuario y devuelve una lectura de su misión. Muestra el
// progreso real de la bitácora para motivar a completarla. Español neutral.

import { useCallback, useEffect, useState } from "react"
import { Sparkles, ShieldCheck, Save, FileDown, ArrowRight, BookOpen, RotateCcw } from "lucide-react"
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

function downloadReport(r: MissionReport) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>Revelador de Misión — Los 144.000</title>
<style>@page{margin:22mm 18mm;}body{font-family:Georgia,serif;color:#1a1a24;line-height:1.65;}
h1{font-size:24px;letter-spacing:1px;color:#6d4a9b;border-bottom:2px solid #c9a86b;padding-bottom:8px;}
h2{font-size:14px;color:#b8934a;letter-spacing:1px;margin:22px 0 4px;}p{font-size:13px;margin:0 0 6px;}
.frase{font-style:italic;font-size:15px;color:#6d4a9b;}</style></head><body>
<h1>Revelador de Misión · Los 144.000</h1>
<h2>1 · Patrón central detectado</h2><p>${esc(r.patternText)}</p>
<h2>2 · Herida que se está transformando</h2><p>${esc(r.herida)}</p>
<h2>3 · Medicina que puedes ofrecer</h2><p>${esc(r.medicina)}</p>
<h2>4 · Territorio que te llama</h2><p>${esc(r.territorio)}</p>
<h2>5 · Objetivo más activo en ti</h2><p>${esc(r.objetivo)}</p>
<h2>6 · Primera misión recomendada</h2><p>${esc(r.primeraMision)}</p>
<h2>7 · Frase de misión personal</h2><p class="frase">“${esc(r.frase)}”</p>
<h2>8 · Siguientes 3 pasos</h2><p>${r.pasos.map((p, i) => `${i + 1}. ${esc(p)}`).join("<br/>")}</p>
<script>window.onload=function(){setTimeout(function(){window.print();},250);};</script>
</body></html>`
  const w = window.open("", "_blank", "width=820,height=1000")
  if (!w) { alert("Permite las ventanas emergentes para descargar tu análisis."); return }
  w.document.open(); w.document.write(html); w.document.close()
}

export function MissionRevealer() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [analysis, setAnalysis] = useState<MissionAnalysis | null>(null)
  const [saved, setSaved] = useState(false)
  const [source, setSource] = useState<"ia" | "local" | null>(null)
  const [started, setStarted] = useState<Set<string>>(new Set())
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
        setSource("ia"); setChanged(false); setPhase("result"); return
      }
      if (data?.configured && data?.sufficient === false) {
        setAnalysis({ sufficient: false, entryCount: entries.length }); setPhase("insufficient"); return
      }
    } catch { /* proveedor caído → local */ }
    const local = analyzeMission()
    setAnalysis(local); setSource("local")
    if (local.sufficient) {
      saveLastRevelation(local.report, { answered: totalAnswered(), source: "local" })
      setChanged(false); setPhase("result")
    } else setPhase("insufficient")
  }, [])

  const save = useCallback(() => {
    if (!analysis || !analysis.sufficient) return
    const fecha = new Date().toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })
    upsertAnswer({
      category: "revelaciones", source: "revelador_mision", sourceLabel: "Revelador de Misión",
      prompt: `Lectura de misión · ${fecha}`, answer: reportToText(analysis.report), isPrivate: true,
    })
    setSaved(true)
  }, [analysis])

  // Registra una acción de misión en la bitácora (sección Mis Misiones) y la abre.
  const registerAction = useCallback((objetivo: string, accion: string, idx: number) => {
    upsertAnswer({
      category: "misiones", source: `accion_revelador_${idx}`, sourceLabel: `Acción de misión · ${objetivo}`,
      prompt: objetivo, answer: accion, isPrivate: true,
    })
    setStarted((prev) => new Set(prev).add(String(idx)))
    openGrandJournal("misiones")
  }, [])

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

        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "1.4rem 0" }}>
            <div className={styles.revealerFrase} style={{ fontSize: "1rem" }}>Leyendo tu bitácora…</div>
            <p className={styles.revealerHint} style={{ marginTop: "0.8rem" }}>Reconociendo el patrón entre tu historia, tu linaje y tu territorio.</p>
          </div>
        )}

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

              {/* 2 · Códigos detectados */}
              {report.codigos?.length > 0 && (
                <div className={styles.revealerCard}>
                  <div className={styles.revealerCardNum}>Códigos detectados en tu bitácora</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", marginTop: "0.3rem" }}>
                    {report.codigos.map((c, i) => (
                      <div key={i} className={styles.codigoRow}>
                        <span className={styles.codigoNombre}>{c.nombre}</span>
                        <span className={styles.codigoFlow}><em>{c.veneno}</em> → <strong>{c.medicina}</strong> → {c.servicio}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3 · Los 4 pilares de tu servicio */}
              {(report.planoPersonal || report.planoLinaje || report.planoTerritorio || report.planoRed) && (
                <div className={styles.revealerCard}>
                  <div className={styles.revealerCardNum}>Los 4 pilares de tu servicio</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginTop: "0.4rem" }}>
                    {[
                      { l: "Misión personal — sanación, perdón y medicina interior", t: report.planoPersonal, tab: "historia" },
                      { l: "Misión con el linaje — árbol, patrones heredados y nueva generación", t: report.planoLinaje, tab: "linaje" },
                      { l: "Misión con el territorio — raíz, memoria ancestral y custodia", t: report.planoTerritorio, tab: "territorio" },
                      { l: "Misión con la Red — comunidad, transmisión, servicio y contacto", t: report.planoRed, tab: "" },
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

              {/* 4 · Cómo se activan en ti los 5 objetivos */}
              {report.objetivos5?.length > 0 && (
                <div className={styles.revealerCard}>
                  <div className={styles.revealerCardNum}>Cómo se activan en ti los objetivos de Los 144.000</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "0.4rem" }}>
                    {report.objetivos5.map((o, i) => (
                      <div key={i}>
                        <p className={styles.pilarLabel}>{i + 1}. {o.label}</p>
                        <p className={styles.revealerBody}>{o.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5 · Punto de entrada a tu servicio */}
              {report.puntoEntrada && (
                <div className={styles.revealerCard} style={{ borderLeft: "3px solid var(--s5-gold)" }}>
                  <div className={styles.revealerCardNum}>Punto de entrada a tu servicio</div>
                  <p className={styles.revealerBody}>{report.puntoEntrada}</p>
                </div>
              )}

              {/* 7 · Frase de misión personal */}
              {report.frase && (
                <div className={styles.revealerCard}>
                  <div className={styles.revealerCardNum}>Frase de misión personal</div>
                  <p className={styles.revealerFrase}>“{report.frase}”</p>
                </div>
              )}
            </div>

            {/* 6 · Acciones de misión (por los 5 objetivos) */}
            {report.acciones5?.length > 0 && (
              <div style={{ marginTop: "1.8rem" }}>
                <p className={styles.kicker} style={{ marginBottom: "0.8rem" }}>Acciones de misión · próximos actos de servicio</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {report.acciones5.map((a, i) => (
                    <div key={i} className={styles.revealerCard} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <div className={styles.revealerCardNum} style={{ marginBottom: 2 }}>{a.objetivo}</div>
                        <div style={{ color: "#eef1fb", lineHeight: 1.6 }}>{a.accion}</div>
                      </div>
                      <button type="button" className={styles.missionShare} style={{ padding: "0.6rem 1rem" }}
                        onClick={() => registerAction(a.objetivo, a.accion, i)} disabled={started.has(String(i))}>
                        {started.has(String(i)) ? "Registrada" : <>Registrar en mi bitácora <ArrowRight size={13} /></>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.pasos.length > 0 && (
              <div className={styles.revealerCard} style={{ marginTop: "1.4rem" }}>
                <div className={styles.revealerCardNum}>Siguientes pasos</div>
                <ol className={styles.revealerSteps}>{report.pasos.map((p, i) => <li key={i}>{p}</li>)}</ol>
              </div>
            )}

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
