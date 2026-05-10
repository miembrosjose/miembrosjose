"use client"

// Modal pra editar conteúdo (forum_post, forum_reply, episode_comment).
// Substitui o editContentOverlay do proyecto base.
//
// Endpoints:
//   PUT /api/forum/posts/[id]
//   PUT /api/forum/replies/[id]
//   PUT /api/episode-comments/[id]

import { useState, useEffect } from "react"
import { Modal } from "./Modal"
import { api } from "../_lib/api"

export type EditTarget = {
  type: "forum_post" | "forum_reply" | "episode_comment"
  id: string
  initialBody: string
  initialTitle?: string // só forum_post
  initialTags?: string[] // só forum_post
}

type Props = {
  target: EditTarget | null
  onClose: () => void
  onSaved?: (target: EditTarget, payload: { title?: string; body: string; tags?: string[] }) => void
}

const ENDPOINT_BY_TYPE: Record<EditTarget["type"], (id: string) => string> = {
  forum_post: (id) => `/api/forum/posts/${id}`,
  forum_reply: (id) => `/api/forum/replies/${id}`,
  episode_comment: (id) => `/api/episode-comments/${id}`,
}

export function EditModal({ target, onClose, onSaved }: Props) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [tagsRaw, setTagsRaw] = useState("")
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const showTitleField = target?.type === "forum_post"
  const showTagsField = target?.type === "forum_post"

  useEffect(() => {
    if (target) {
      setTitle(target.initialTitle ?? "")
      setBody(target.initialBody ?? "")
      setTagsRaw((target.initialTags ?? []).join(", "))
      setStatus(null)
      setSubmitting(false)
    }
  }, [target])

  async function submit() {
    if (!target) return
    const cleanBody = body.trim()
    if (!cleanBody) {
      setStatus({ kind: "err", text: "El contenido no puede estar vacío." })
      return
    }
    const cleanTitle = title.trim()
    if (showTitleField && !cleanTitle) {
      setStatus({ kind: "err", text: "El título no puede estar vacío." })
      return
    }
    const tags = showTagsField
      ? tagsRaw
          .split(/[,\n]/)
          .map((t) => t.trim().toUpperCase())
          .filter((t) => t.length > 0 && t.length <= 30)
          .slice(0, 10)
      : undefined

    setSubmitting(true)
    setStatus(null)

    const payload: { title?: string; body: string; tags?: string[] } = { body: cleanBody }
    if (showTitleField) payload.title = cleanTitle
    if (showTagsField) payload.tags = tags

    try {
      await api(ENDPOINT_BY_TYPE[target.type](target.id), {
        method: "PATCH",
        body: payload,
      })
      setStatus({ kind: "ok", text: "✓ Cambios guardados." })
      onSaved?.(target, payload)
      setTimeout(onClose, 1000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar"
      setStatus({ kind: "err", text: msg })
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title="✏️ Editar"
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
          {submitting ? "Guardando..." : "Guardar cambios"}
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem 0" }}>
        {showTitleField && (
          <div>
            <label style={labelStyle}>Título</label>
            <input
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}
        {showTagsField && (
          <div>
            <label style={labelStyle}>
              Tags <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(separadas por coma, máx 10)</span>
            </label>
            <input
              type="text"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="NOVEDADES, ANUNCIOS, COMUNIDAD"
              style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}
            />
          </div>
        )}
        <div>
          <label style={labelStyle}>Contenido</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={5000}
            placeholder="Escribí acá..."
            style={{ ...inputStyle, minHeight: 160, resize: "vertical", fontFamily: "inherit" }}
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
