"use client"

// Reacciones + comentarios para una transmisión. Da vida a la página de lectura
// sin dejarla como texto plano. Client-only (fetch autenticado por cookies);
// no engorda el Worker. RLS gobierna permisos reales.

import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "../_lib/api"
import { timeAgoEs } from "../_lib/format"
import { useAuth } from "../_lib/auth-context"
import styles from "./engagement.module.css"

const REACTIONS: { emoji: string; label: string }[] = [
  { emoji: "✨", label: "Resonó" },
  { emoji: "🙏", label: "Gratitud" },
  { emoji: "❤️", label: "Amor" },
  { emoji: "🔥", label: "Fuerza" },
  { emoji: "💫", label: "Me movió" },
]

type Comment = {
  id: string
  user_id: string
  author_name: string | null
  author_avatar: string | null
  body: string
  created_at: string
}

export function TransmisionEngagement({ slug }: { slug: string }) {
  const { user } = useAuth()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [mine, setMine] = useState<string[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [me, setMe] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        api<{ counts: Record<string, number>; mine: string[] }>(`/api/transmissions/${slug}/reactions`),
        api<{ comments: Comment[]; me: string }>(`/api/transmissions/${slug}/comments`),
      ])
      setCounts(r.counts || {})
      setMine(r.mine || [])
      setComments(c.comments || [])
      setMe(c.me || null)
    } catch {
      /* silencioso */
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function toggle(emoji: string) {
    // Optimista.
    const active = mine.includes(emoji)
    setMine((p) => (active ? p.filter((e) => e !== emoji) : [...p, emoji]))
    setCounts((p) => ({ ...p, [emoji]: Math.max(0, (p[emoji] || 0) + (active ? -1 : 1)) }))
    try {
      await api(`/api/transmissions/${slug}/reactions`, { method: "POST", body: { emoji } })
    } catch {
      // revierte si falla
      setMine((p) => (active ? [...p, emoji] : p.filter((e) => e !== emoji)))
      setCounts((p) => ({ ...p, [emoji]: Math.max(0, (p[emoji] || 0) + (active ? 1 : -1)) }))
    }
  }

  async function submit() {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const { comment } = await api<{ comment: Comment }>(`/api/transmissions/${slug}/comments`, {
        method: "POST",
        body: { body: text },
      })
      setComments((p) => [comment, ...p])
      setDraft("")
      if (taRef.current) taRef.current.style.height = "auto"
    } catch {
      /* silencioso */
    } finally {
      setSending(false)
    }
  }

  async function remove(id: string) {
    const prev = comments
    setComments((p) => p.filter((c) => c.id !== id))
    try {
      await api(`/api/transmissions/${slug}/comments?id=${id}`, { method: "DELETE" })
    } catch {
      setComments(prev)
    }
  }

  function autoGrow(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }

  const meta = (user?.user_metadata || {}) as { full_name?: string; username?: string; avatar_url?: string }
  const myName = meta.full_name || meta.username || "Tú"
  const myAvatar = typeof meta.avatar_url === "string" ? meta.avatar_url : null

  return (
    <section className={styles.wrap} aria-label="Reacciones y comentarios">
      {/* ── Reacciones ── */}
      <div className={styles.reactions}>
        <span className={styles.reactionsLabel}>¿Qué resonó en ti?</span>
        <div className={styles.reactionRow}>
          {REACTIONS.map(({ emoji, label }) => {
            const active = mine.includes(emoji)
            const n = counts[emoji] || 0
            return (
              <button
                key={emoji}
                type="button"
                className={`${styles.reaction} ${active ? styles.reactionActive : ""}`}
                onClick={() => toggle(emoji)}
                aria-pressed={active}
                title={label}
              >
                <span className={styles.reactionEmoji}>{emoji}</span>
                {n > 0 && <span className={styles.reactionCount}>{n}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Comentarios ── */}
      <div className={styles.comments}>
        <h2 className={styles.commentsTitle}>
          Conversación{comments.length > 0 && <span className={styles.commentsN}>{comments.length}</span>}
        </h2>

        <div className={styles.composer}>
          <div className={styles.avatar} aria-hidden="true">
            {myAvatar ? <img src={myAvatar} alt="" loading="lazy" /> : (myName.charAt(0).toUpperCase())}
          </div>
          <div className={styles.composerBody}>
            <textarea
              ref={taRef}
              className={styles.textarea}
              placeholder="Comparte lo que esta transmisión despertó en ti…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onInput={autoGrow}
              rows={2}
              maxLength={2000}
            />
            <div className={styles.composerActions}>
              <button
                type="button"
                className={styles.submit}
                onClick={submit}
                disabled={!draft.trim() || sending}
              >
                {sending ? "Enviando…" : "Comentar"}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.state}>Cargando conversación…</div>
        ) : comments.length === 0 ? (
          <div className={styles.state}>Sé el primero en dejar una reflexión.</div>
        ) : (
          <ul className={styles.list}>
            {comments.map((c) => (
              <li key={c.id} className={styles.comment}>
                <div className={styles.avatar} aria-hidden="true">
                  {c.author_avatar ? <img src={c.author_avatar} alt="" loading="lazy" /> : (c.author_name || "M").charAt(0).toUpperCase()}
                </div>
                <div className={styles.commentBody}>
                  <div className={styles.commentHead}>
                    <span className={styles.commentAuthor}>{c.author_name || "Miembro"}</span>
                    <span className={styles.commentTime}>{timeAgoEs(c.created_at)}</span>
                    {me === c.user_id && (
                      <button type="button" className={styles.delete} onClick={() => remove(c.id)} title="Eliminar">
                        Eliminar
                      </button>
                    )}
                  </div>
                  <p className={styles.commentText}>{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
