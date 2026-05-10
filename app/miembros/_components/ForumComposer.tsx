"use client"

// Composer pra criar post novo no fórum.
// Equivalente ao bloco openForumComposer/submitForumPost do proyecto base.

import { useState } from "react"
import { Plus } from "lucide-react"
import { api } from "../_lib/api"
import type { ForumPost as TForumPost } from "../_lib/types"
import { FileUploader } from "./FileUploader"
import styles from "./forum.module.css"

const TITLE_MAX = 200
const BODY_MAX = 5000
const TAG_MAX_LEN = 30
const MAX_TAGS = 5

type ComposerProps = {
  onCreate?: (post: TForumPost) => void
}

export function ForumComposer({ onCreate }: ComposerProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [tagsRaw, setTagsRaw] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setTitle("")
    setBody("")
    setTagsRaw("")
    setImageUrl(null)
    setOpen(false)
  }

  async function submit() {
    const cleanTitle = title.trim()
    const cleanBody = body.trim()
    if (!cleanTitle || !cleanBody || submitting) return

    const tags = tagsRaw
      .split(/[,\n]/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0 && t.length <= TAG_MAX_LEN)
      .slice(0, MAX_TAGS)

    setSubmitting(true)
    try {
      const data = await api<{ post: TForumPost }>("/api/forum/posts", {
        method: "POST",
        body: {
          title: cleanTitle,
          body: cleanBody,
          tags,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        },
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
        Abrir conversación
      </button>
    )
  }

  return (
    <div className={styles.composer}>
      <input
        type="text"
        placeholder="Título de la conversación"
        maxLength={TITLE_MAX}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Comparte tu idea, dudas o avances..."
        maxLength={BODY_MAX}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <input
        type="text"
        placeholder="Tags separados por coma (ej: COPY, OFERTA, EMBUDO)"
        value={tagsRaw}
        onChange={(e) => setTagsRaw(e.target.value)}
      />
      <FileUploader value={imageUrl} onChange={setImageUrl} label="Adjuntar imagen o video (opcional)" />
      <div className={styles.composerActions}>
        <button type="button" className={styles.btnGhost} onClick={reset}>
          Cancelar
        </button>
        <button
          type="button"
          className={styles.btnConfirm}
          onClick={submit}
          disabled={submitting || !title.trim() || !body.trim()}
        >
          Publicar
        </button>
      </div>
    </div>
  )
}
