"use client"

// Modal de denúncia de conteúdo (post/reply/comment).
// Substitui o reportModalOverlay do proyecto base.
// POST /api/reports com { target_type, target_id, reason_category, message }.

import { useState, useEffect } from "react"
import { Modal } from "./Modal"
import { api } from "../_lib/api"

export type ReportTarget = {
  type: "forum_post" | "forum_reply" | "episode_comment" | "funnel_feedback"
  id: string
}

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "spam", label: "Spam o publicidad no deseada" },
  { value: "inappropriate", label: "Contenido inapropiado" },
  { value: "harassment", label: "Acoso o intimidación" },
  { value: "offensive", label: "Lenguaje ofensivo" },
  { value: "misleading", label: "Información engañosa" },
  { value: "copyright", label: "Violación de derechos de autor" },
  { value: "other", label: "Otro" },
]

type Props = {
  target: ReportTarget | null
  onClose: () => void
}

export function ReportModal({ target, onClose }: Props) {
  const [category, setCategory] = useState(CATEGORIES[0].value)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Reseta ao abrir/trocar target
  useEffect(() => {
    if (target) {
      setCategory(CATEGORIES[0].value)
      setMessage("")
      setStatus(null)
      setSubmitting(false)
    }
  }, [target])

  async function submit() {
    if (!target) return
    const text = message.trim()
    if (!text) {
      setStatus({ kind: "err", text: "Escribí qué pasó." })
      return
    }
    setSubmitting(true)
    setStatus(null)
    try {
      await api("/api/reports", {
        method: "POST",
        body: {
          target_type: target.type,
          target_id: target.id,
          reason_category: category,
          message: text,
        },
      })
      setStatus({ kind: "ok", text: "✓ Reporte enviado. Gracias." })
      setTimeout(onClose, 1500)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al enviar"
      setStatus({ kind: "err", text: msg })
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title="⚠️ Reportar contenido"
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          style={{
            background: "var(--text-primary)",
            color: "var(--bg-primary)",
            border: "none",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "0.65rem 1.4rem",
            cursor: submitting ? "wait" : "pointer",
            opacity: submitting ? 0.5 : 1,
          }}
        >
          {submitting ? "Enviando..." : "Enviar reporte"}
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem 0" }}>
        <div>
          <label style={labelStyle}>Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>¿Qué pasó?</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            placeholder="Contale al admin qué viste y por qué lo estás reportando..."
            style={{ ...inputStyle, minHeight: 130, resize: "vertical", fontFamily: "var(--font-body)" }}
          />
        </div>
        {status && (
          <div style={{ color: status.kind === "ok" ? "#22c55e" : "#ef4444", fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>
            {status.text}
          </div>
        )}
      </div>
    </Modal>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-mono)",
  fontSize: "0.7rem",
  color: "var(--text-muted)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "0.5rem",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem 0.9rem",
  background: "var(--bg-deep)",
  border: "1px solid var(--border-medium)",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  fontSize: "0.9rem",
  outline: "none",
}
