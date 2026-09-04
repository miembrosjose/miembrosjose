"use client"

// REVELADOR DE MISIÓN — dentro de Objetivos de Los 144.000.
// Analiza (en el dispositivo, privado) Mi Gran Bitácora y devuelve una lectura
// de misión. No es un chatbot: es un espejo. Nada se envía a servidores ni se
// publica en el foro.

import { useCallback, useState } from "react"
import { Sparkles, ShieldCheck, Save, FileDown, ArrowRight, RotateCcw, BookOpen } from "lucide-react"
import styles from "./season5.module.css"
import { analyzeMission, reportToText, type MissionAnalysis, type MissionReport } from "../_lib/mission-analysis"
import { upsertAnswer } from "../_lib/journal-store"
import { openGrandJournal } from "../_lib/journal-registry"

type Phase = "idle" | "consent" | "result" | "insufficient"

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

const SECTION_DEFS: { key: keyof MissionReport | "pasos"; n: number; title: string }[] = [
  { key: "patternText", n: 1, title: "Patrón central detectado" },
  { key: "herida", n: 2, title: "Herida que se está transformando" },
  { key: "medicina", n: 3, title: "Medicina que puedes ofrecer" },
  { key: "territorio", n: 4, title: "Territorio que te llama" },
  { key: "objetivo", n: 5, title: "Objetivo de Los 144.000 más activo en ti" },
  { key: "primeraMision", n: 6, title: "Primera misión recomendada" },
  { key: "frase", n: 7, title: "Frase de misión personal" },
  { key: "pasos", n: 8, title: "Siguientes 3 pasos" },
]

export function MissionRevealer({ onGoToMisiones }: { onGoToMisiones?: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [analysis, setAnalysis] = useState<MissionAnalysis | null>(null)
  const [saved, setSaved] = useState(false)

  const reveal = useCallback(() => {
    const a = analyzeMission()
    setAnalysis(a)
    setPhase(a.sufficient ? "consent" : "insufficient")
  }, [])

  const confirm = useCallback(() => setPhase("result"), [])

  const save = useCallback(() => {
    if (!analysis || !analysis.sufficient) return
    const fecha = new Date().toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })
    upsertAnswer({
      category: "revelaciones",
      source: "revelador_mision",
      sourceLabel: "Revelador de Misión",
      prompt: `Lectura de misión · ${fecha}`,
      answer: reportToText(analysis.report),
      isPrivate: true,
    })
    setSaved(true)
  }, [analysis])

  const reset = useCallback(() => { setPhase("idle"); setSaved(false) }, [])

  const report = analysis && analysis.sufficient ? analysis.report : null

  return (
    <section className={`${styles.section} ${styles.reveal}`} style={{ paddingTop: 0 }}>
      <p className={styles.kicker}>Inteligencia de misión</p>
      <h2 className={styles.sectionTitle}><Sparkles size={20} style={{ verticalAlign: "-3px", marginRight: 8, color: "var(--s5-gold)" }} />REVELADOR DE MISIÓN</h2>
      <p className={styles.sectionIntro}>
        La misión no se inventa. Se revela cuando tu historia, tu linaje, tus heridas, tu territorio y tus acciones
        comienzan a mostrar un mismo patrón. El Revelador analiza tu bitácora personal para ayudarte a comprender qué
        parte de la Red estás llamado a sanar, custodiar o fortalecer.
      </p>

      <div className={styles.revealerBox}>
        {phase === "idle" && (
          <div style={{ textAlign: "center" }}>
            <p className={styles.revealerHint}>Subtítulo: inteligencia de análisis para reconocer tu servicio dentro de la Red.</p>
            <button type="button" className={styles.cta} style={{ margin: "0.4rem auto 0", borderColor: "var(--s5-gold)" }} onClick={reveal}>
              <Sparkles size={16} /> Revelar mi misión en la Red
            </button>
          </div>
        )}

        {phase === "consent" && (
          <div>
            <div className={styles.cautionBox} style={{ marginTop: 0 }}>
              <ShieldCheck size={16} />
              <p>Tu bitácora contiene información personal. Este análisis se realiza de forma <strong>privada, en tu propio dispositivo</strong>: tus respuestas no se envían a ningún servidor ni se publican en el foro. Se usan solo para crear tu lectura de misión.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", justifyContent: "center", marginTop: "1.4rem" }}>
              <button type="button" className={styles.cta} style={{ margin: 0, borderColor: "var(--s5-gold)" }} onClick={confirm}>
                Acepto y revelar mi misión <ArrowRight size={15} />
              </button>
              <button type="button" className={styles.stateChip} style={{ padding: "0.7rem 1.2rem" }} onClick={reset}>Cancelar</button>
            </div>
          </div>
        )}

        {phase === "insufficient" && (
          <div>
            <p className={styles.revealerBody}>
              Aún no existe suficiente información en tu bitácora para revelar con claridad tu misión dentro de la Red.
              Para activar este análisis, completa primero algunos registros en: <strong>Integración del Llamado, Desprogramación Cósmica, Memoria y Dignidad, Alquimia Solar, Mi Historia Personal y Mi Territorio.</strong>
            </p>
            <p className={styles.revealerBody} style={{ fontStyle: "italic", color: "var(--s5-gold-soft)" }}>La misión se revela cuando tu historia deja huellas suficientes para ser leída.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", justifyContent: "center", marginTop: "1.2rem" }}>
              <button type="button" className={styles.cta} style={{ margin: 0, borderColor: "var(--s5-gold)" }} onClick={() => openGrandJournal()}>
                <BookOpen size={15} /> Completar mi bitácora
              </button>
              <button type="button" className={styles.stateChip} style={{ padding: "0.7rem 1.2rem" }} onClick={reset}>Volver</button>
            </div>
          </div>
        )}

        {phase === "result" && report && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {SECTION_DEFS.map((s) => (
                <div key={s.n} className={styles.revealerCard}>
                  <div className={styles.revealerCardNum}>{String(s.n).padStart(2, "0")} · {s.title}</div>
                  {s.key === "pasos" ? (
                    <ol className={styles.revealerSteps}>
                      {report.pasos.map((p, i) => <li key={i}>{p}</li>)}
                    </ol>
                  ) : s.key === "frase" ? (
                    <p className={styles.revealerFrase}>“{report.frase}”</p>
                  ) : (
                    <p className={styles.revealerBody}>{report[s.key] as string}</p>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem", justifyContent: "center", marginTop: "1.6rem" }}>
              <button type="button" className={styles.cta} style={{ margin: 0, borderColor: "var(--s5-gold)" }} onClick={save} disabled={saved}>
                <Save size={15} /> {saved ? "Guardado en tu bitácora" : "Guardar en mi bitácora"}
              </button>
              <button type="button" className={styles.missionShare} style={{ padding: "0.7rem 1.1rem" }} onClick={() => downloadReport(report)}>
                <FileDown size={13} /> Descargar análisis
              </button>
              {onGoToMisiones && (
                <button type="button" className={styles.missionShare} style={{ padding: "0.7rem 1.1rem" }} onClick={onGoToMisiones}>
                  <ShieldCheck size={13} /> Crear misión de custodia
                </button>
              )}
              <button type="button" className={styles.stateChip} style={{ padding: "0.7rem 1.1rem" }} onClick={reset}>
                <RotateCcw size={12} /> No guardar
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
