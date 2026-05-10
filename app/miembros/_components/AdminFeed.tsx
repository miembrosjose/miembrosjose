"use client"

// Feed do Estudio (admin) — posts publicados pelo creador (não confundir com fórum).
// Equivalente ao bloco fetchFeedPosts/renderFeed/admin composer do area-prototipo.html
// (linhas 11939-12092). Sem replies — só leitura, com reactions inline.
//
// Admin: pode criar/deletar via composer. Não-admin: só lê.

import { useEffect, useState, useCallback } from "react"
import { Plus, Trash2 } from "lucide-react"
import { api } from "../_lib/api"
import { useAuth } from "../_lib/auth-context"
import { renderRichBody, timeAgoEs } from "../_lib/format"
import type { FeedPost } from "../_lib/types"
import styles from "./admin-feed.module.css"

type TypeKey = "content" | "challenge" | "tip" | "bonus"

const FEED_TYPES: Record<TypeKey, { emoji: string; label: string }> = {
  content:   { emoji: "🎬", label: "Nuevo contenido" },
  challenge: { emoji: "🏆", label: "Desafío" },
  tip:       { emoji: "💡", label: "Tip" },
  bonus:     { emoji: "🎁", label: "Bono exclusivo" },
}

export function AdminFeed() {
  const { isAdmin } = useAuth()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<{ posts: FeedPost[] }>("/api/feed-posts")
      setPosts(data.posts || [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar esta publicación?")) return
    try {
      await api(`/api/admin/feed-posts?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      alert(`No se pudo borrar: ${msg}`)
    }
  }

  return (
    <div>
      {isAdmin && !composerOpen && (
        <button type="button" className={styles.openBtn} onClick={() => setComposerOpen(true)}>
          <Plus size={14} />
          Nueva publicación del Estudio
        </button>
      )}

      {isAdmin && composerOpen && (
        <Composer
          onClose={() => setComposerOpen(false)}
          onPublished={() => {
            setComposerOpen(false)
            fetchPosts()
          }}
        />
      )}

      {loading && (
        <div className={styles.empty}>
          <p className={styles.emptyKicker}>Cargando...</p>
        </div>
      )}

      {error && !loading && (
        <div className={styles.empty}>
          <p className={styles.emptyKicker}>Error</p>
          <p className={styles.emptyMsg}>{error}</p>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyKicker}>Aún no hay publicaciones del creador</p>
          <p className={styles.emptyMsg}>Pronto recibirás novedades exclusivas.</p>
        </div>
      )}

      {!loading && posts.map((p) => (
        <article key={p.id} className={`${styles.post} ${p.pinned ? styles.pinned : ""}`}>
          <header className={styles.postHeader}>
            <div className={styles.avatar}>{p.author_avatar}</div>
            <div className={styles.meta}>
              <div className={styles.name}>
                {p.author_name}
                <span className={styles.creatorBadge}>CREADOR</span>
              </div>
              <div className={styles.time}>{timeAgoEs(p.created_at)}</div>
            </div>
            <div className={styles.typeBadge}>
              {p.type_emoji} {p.type_label}
            </div>
            {isAdmin && (
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => handleDelete(p.id)}
                title="Borrar (admin)"
              >
                <Trash2 size={14} />
              </button>
            )}
          </header>
          <h3 className={styles.title}>{p.title}</h3>
          <div
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: renderRichBody(p.body) }}
          />
          {p.reactions && p.reactions.length > 0 && (
            <div className={styles.reactions}>
              {p.reactions.map((r, i) => (
                <span key={i} className={styles.reaction}>
                  {r[0]} <strong>{r[1]}</strong>
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

function Composer({ onClose, onPublished }: { onClose: () => void; onPublished: () => void }) {
  const [typeKey, setTypeKey] = useState<TypeKey>("content")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [pinned, setPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  async function submit() {
    if (!title.trim() || !body.trim() || submitting) return
    setSubmitting(true)
    setStatus({ kind: "ok", text: "Publicando..." })
    try {
      const t = FEED_TYPES[typeKey]
      await api("/api/admin/feed-posts", {
        method: "POST",
        body: {
          title: title.trim(),
          body: body.trim(),
          type_key: typeKey,
          type_emoji: t.emoji,
          type_label: t.label,
          pinned,
        },
      })
      setStatus({ kind: "ok", text: "✓ Publicado" })
      setTimeout(onPublished, 800)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error"
      setStatus({ kind: "err", text: msg })
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.composer}>
      <h3>Nueva publicación del Estudio</h3>

      <div className={styles.types}>
        {(Object.entries(FEED_TYPES) as [TypeKey, { emoji: string; label: string }][]).map(([k, v]) => (
          <button
            key={k}
            type="button"
            className={`${styles.typeBtn} ${typeKey === k ? styles.active : ""}`}
            onClick={() => setTypeKey(k)}
          >
            <span>{v.emoji}</span>
            {v.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Título"
        maxLength={200}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Contenido del aviso..."
        maxLength={5000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <label className={styles.pinnedRow}>
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        Fijar en el tope
      </label>

      <div className={styles.actions}>
        {status && (
          <span className={status.kind === "ok" ? styles.statusOk : styles.statusErr} style={{ marginRight: "auto" }}>
            {status.text}
          </span>
        )}
        <button type="button" className={styles.cancelBtn} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className={styles.submitBtn}
          onClick={submit}
          disabled={submitting || !title.trim() || !body.trim()}
        >
          Publicar
        </button>
      </div>
    </div>
  )
}
