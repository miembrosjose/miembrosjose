"use client"

// Composer del foro — dos modos:
//  · Conversación: post libre con categorías del camino.
//  · Reporte para la Red: versión consciente y VOLUNTARIA de un aporte, con
//    plantilla por tipo (custodia, linaje, territorio, señales, nodo).
// La bitácora privada NUNCA se publica automáticamente: esto es una decisión
// explícita de la persona.

import { useState } from "react"
import { Plus, BookLock, Send } from "lucide-react"
import { api } from "../_lib/api"
import type { ForumPost as TForumPost } from "../_lib/types"
import { FileUploader } from "./FileUploader"
import { FORUM_CATEGORIES, REPORT_TYPES, buildReportBody, type ReportType } from "../_lib/report-types"
import styles from "./forum.module.css"

const TITLE_MAX = 200
const BODY_MAX = 5000
const TAG_MAX_LEN = 30
const MAX_TAGS = 5

type ComposerProps = { onCreate?: (post: TForumPost) => void }
type Mode = "post" | "report"

export function ForumComposer({ onCreate }: ComposerProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("post")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [tagsRaw, setTagsRaw] = useState("")
  const [cats, setCats] = useState<Set<string>>(new Set())
  const [reportType, setReportType] = useState<ReportType | null>(null)
  const [reportValues, setReportValues] = useState<Record<string, string>>({})
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setMode("post"); setTitle(""); setBody(""); setTagsRaw("")
    setCats(new Set()); setReportType(null); setReportValues({})
    setImageUrl(null); setOpen(false)
  }

  function toggleCat(tag: string) {
    setCats((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag); else next.add(tag)
      return next
    })
  }

  function keywordTags(): string[] {
    return tagsRaw
      .split(/[,\n]/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0 && t.length <= TAG_MAX_LEN)
  }

  async function submit() {
    if (submitting) return
    const cleanTitle = title.trim()
    let finalBody = ""
    let tags: string[] = []

    if (mode === "report") {
      if (!reportType || !cleanTitle) return
      const entries = reportType.fields.map((f) => ({ label: f, value: reportValues[f] || "" }))
      if (!entries.some((e) => e.value.trim())) { alert("Completa al menos un campo del reporte."); return }
      finalBody = buildReportBody(reportType.label, entries)
      tags = [reportType.categoryTag, ...keywordTags()].slice(0, MAX_TAGS)
    } else {
      finalBody = body.trim()
      if (!cleanTitle || !finalBody) return
      tags = [...Array.from(cats), ...keywordTags()].slice(0, MAX_TAGS)
    }

    setSubmitting(true)
    try {
      const data = await api<{ post: TForumPost }>("/api/forum/posts", {
        method: "POST",
        body: { title: cleanTitle, body: finalBody, tags, ...(imageUrl ? { image_url: imageUrl } : {}) },
      })
      onCreate?.(data.post)
      reset()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      alert(`No se pudo publicar: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button type="button" className={styles.openComposer} onClick={() => setOpen(true)}>
        <Plus size={14} />
        Abrir conversación o reporte
      </button>
    )
  }

  const canSubmit = mode === "report"
    ? !!reportType && !!title.trim()
    : !!title.trim() && !!body.trim()

  return (
    <div className={styles.composer}>
      {/* Selector de modo */}
      <div className={styles.modeRow}>
        <button type="button" className={`${styles.modeBtn} ${mode === "post" ? styles.modeBtnOn : ""}`} onClick={() => setMode("post")}>
          Conversación
        </button>
        <button type="button" className={`${styles.modeBtn} ${mode === "report" ? styles.modeBtnOn : ""}`} onClick={() => setMode("report")}>
          <Send size={12} /> Reporte para la Red
        </button>
      </div>

      {mode === "report" && (
        <div className={styles.reportNote}>
          <BookLock size={14} />
          <span>Un reporte es una versión consciente y voluntaria de lo que decides aportar. Tu bitácora privada no se comparte: aquí solo va lo que tú eliges.</span>
        </div>
      )}

      <input
        type="text"
        placeholder={mode === "report" ? "Título del reporte (ej: Río Mapocho — memoria y custodia)" : "Título de la conversación"}
        maxLength={TITLE_MAX}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {mode === "post" ? (
        <>
          <textarea
            placeholder="Comparte tu experiencia, comprensión o pregunta…"
            maxLength={BODY_MAX}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className={styles.catPick}>
            <span className={styles.catPickLabel}>Categoría</span>
            <div className={styles.catPickChips}>
              {FORUM_CATEGORIES.map((c) => (
                <button
                  key={c.tag}
                  type="button"
                  className={`${styles.tagChip} ${cats.has(c.tag) ? styles.tagChipActive : ""}`}
                  onClick={() => toggleCat(c.tag)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.catPick}>
            <span className={styles.catPickLabel}>Tipo de reporte</span>
            <div className={styles.catPickChips}>
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  className={`${styles.tagChip} ${reportType?.id === rt.id ? styles.tagChipActive : ""}`}
                  onClick={() => { setReportType(rt); setReportValues({}) }}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>
          {reportType && (
            <div className={styles.reportFields}>
              <p className={styles.reportIntro}>{reportType.intro} · Categoría: <strong>{FORUM_CATEGORIES.find((c) => c.tag === reportType.categoryTag)?.label}</strong></p>
              {reportType.fields.map((f) => (
                <label key={f} className={styles.reportField}>
                  <span>{f}</span>
                  <textarea
                    rows={2}
                    value={reportValues[f] || ""}
                    onChange={(e) => setReportValues((prev) => ({ ...prev, [f]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          )}
        </>
      )}

      <input
        type="text"
        placeholder="Palabras clave opcionales (ej: AGUA, PERDÓN, MONTAÑA)"
        value={tagsRaw}
        onChange={(e) => setTagsRaw(e.target.value)}
      />
      <FileUploader value={imageUrl} onChange={setImageUrl} label="Adjuntar imagen o video (opcional)" />

      <div className={styles.composerActions}>
        <button type="button" className={styles.btnGhost} onClick={reset}>Cancelar</button>
        <button type="button" className={styles.btnConfirm} onClick={submit} disabled={submitting || !canSubmit}>
          {mode === "report" ? "Publicar reporte" : "Publicar"}
        </button>
      </div>
    </div>
  )
}
