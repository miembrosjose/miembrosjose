"use client"

// Galeria "Compartir aprendizaje" — vídeos de membros ensinando coisas do funil.
// Estilo YouTube: grid de cards com thumbnail (= primeiro frame do vídeo), click
// abre modal com player. Filtros: recente / popular + tag.

import { useCallback, useEffect, useState } from "react"
import { Play, ThumbsUp, ThumbsDown, MessageSquare, Eye, Plus, X, Tag, Send, Trash2 } from "lucide-react"
import { useAuth } from "../_lib/auth-context"
import { useView } from "../_lib/view-context"
import { api } from "../_lib/api"
import { buildAvatarLetters } from "../_lib/format"
import styles from "./view-lecciones.module.css"

type Author = {
  full_name: string
  username: string | null
  avatar_url: string | null
  featured_badge_id: string | null
  is_admin: boolean
}

type Lesson = {
  id: string
  user_id: string
  title: string
  description: string | null
  video_url: string
  tags: string[]
  likes_count: number
  dislikes_count: number
  views_count: number
  created_at: string
  viewer_vote: "like" | "dislike" | null
  author: Author
}

type Feedback = {
  id: string
  user_id: string
  parent_id: string | null
  author_name: string
  author_username: string | null
  author_avatar: string
  author_avatar_url: string | null
  author_is_admin: boolean
  body: string
  created_at: string
}

type Sort = "recent" | "popular"

const formatCount = (n: number) => {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(".0", "")}k`
  return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`
}

export function ViewLecciones() {
  const { user } = useAuth()
  const { setView } = useView()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<Sort>("recent")
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort })
      if (tagFilter) params.set("tag", tagFilter)
      const data = await api<{ lessons: Lesson[] }>(`/api/lessons?${params}`)
      setLessons(data.lessons || [])
    } catch {
      setLessons([])
    } finally {
      setLoading(false)
    }
  }, [sort, tagFilter])

  useEffect(() => {
    refetch()
  }, [refetch])

  if (!user) return null

  return (
    <div>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <p className={styles.kicker}>Compartir aprendizaje</p>
            <h1 className={styles.title}>
              Lecciones de la <span className={styles.titleAccent}>comunidad</span>
            </h1>
            <p className={styles.subtitle}>
              Videos cortos de miembros enseñando cómo construyeron partes de su embudo.
              Aprende con quien ya hizo. Comparte lo que aprendiste.
            </p>
          </div>
          <button
            type="button"
            className={styles.shareBtn}
            onClick={() => setShowUpload(true)}
          >
            <Plus size={14} /> Compartir mi lección
          </button>
        </header>

        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.filterBtn} ${sort === "recent" ? styles.active : ""}`}
            onClick={() => setSort("recent")}
          >
            Recientes
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${sort === "popular" ? styles.active : ""}`}
            onClick={() => setSort("popular")}
          >
            Populares
          </button>
          {tagFilter && (
            <div className={styles.tagFilter}>
              <Tag size={11} /> #{tagFilter}
              <button
                type="button"
                className={styles.tagFilterClose}
                onClick={() => setTagFilter(null)}
                aria-label="Quitar filtro"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className={styles.empty}>Cargando lecciones...</p>
        ) : lessons.length === 0 ? (
          <div className={styles.empty}>
            {tagFilter ? (
              <>Sin lecciones con el tag <strong>#{tagFilter}</strong>.</>
            ) : (
              <>Aún no hay lecciones publicadas. ¡Sé el primero en compartir!</>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onOpen={() => setOpenLesson(lesson)}
                onTagClick={(t) => setTagFilter(t)}
                onAuthorClick={() => setView("user", null, { userId: lesson.user_id })}
              />
            ))}
          </div>
        )}
      </div>

      {openLesson && (
        <LessonModal
          lesson={openLesson}
          onClose={() => setOpenLesson(null)}
          onTagClick={(t) => {
            setTagFilter(t)
            setOpenLesson(null)
          }}
          onAuthorClick={() => {
            setView("user", null, { userId: openLesson.user_id })
            setOpenLesson(null)
          }}
          onUpdate={(updated) => {
            setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
            setOpenLesson(updated)
          }}
        />
      )}

      {showUpload && (
        <LessonUploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false)
            // Lessão vai pra fila de aprovação — não aparece imediatamente no feed
          }}
        />
      )}
    </div>
  )
}

// ─── CARD ──────────────────────────────────────────────────────────────

function LessonCard({
  lesson,
  onOpen,
  onTagClick,
  onAuthorClick,
}: {
  lesson: Lesson
  onOpen: () => void
  onTagClick: (tag: string) => void
  onAuthorClick: () => void
}) {
  const initials = buildAvatarLetters(lesson.author.full_name)
  return (
    <div className={styles.card} role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === "Enter") onOpen() }}>
      <div className={styles.cardThumb}>
        {/* Vídeo silencioso paused = thumbnail. Browser renderiza o primeiro frame. */}
        <video
          className={styles.cardVideo}
          src={lesson.video_url}
          preload="metadata"
          muted
          playsInline
        />
        <div className={styles.cardPlayOverlay}>
          <div className={styles.cardPlayIcon}>
            <Play size={24} fill="white" />
          </div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAuthorClick()
          }}
          className={styles.cardAvatar}
          aria-label="Ver perfil del autor"
        >
          {lesson.author.avatar_url ? (
            <img src={lesson.author.avatar_url} alt="" />
          ) : (
            initials
          )}
        </button>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{lesson.title}</h3>
          <span className={styles.cardAuthor}>{lesson.author.full_name}</span>
          <div className={styles.cardMeta}>
            <span><Eye size={11} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />{formatCount(lesson.views_count)}</span>
            <span><ThumbsUp size={11} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />{formatCount(lesson.likes_count)}</span>
          </div>
          {lesson.tags && lesson.tags.length > 0 && (
            <div className={styles.cardTags}>
              {lesson.tags.slice(0, 3).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={styles.tag}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTagClick(t)
                  }}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MODAL DE PLAYER ───────────────────────────────────────────────────

function LessonModal({
  lesson,
  onClose,
  onTagClick,
  onAuthorClick,
  onUpdate,
}: {
  lesson: Lesson
  onClose: () => void
  onTagClick: (tag: string) => void
  onAuthorClick: () => void
  onUpdate: (l: Lesson) => void
}) {
  const { user } = useAuth()
  const initials = buildAvatarLetters(lesson.author.full_name)
  const [voting, setVoting] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Feedback[] | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)

  // Carrega feedbacks quando modal abre
  useEffect(() => {
    let cancelled = false
    api<{ feedbacks: Feedback[] }>(`/api/lessons/${lesson.id}/feedback`)
      .then((data) => {
        if (!cancelled) setFeedbacks(data.feedbacks || [])
      })
      .catch(() => {
        if (!cancelled) setFeedbacks([])
      })
    return () => { cancelled = true }
  }, [lesson.id])

  const vote = async (target: "like" | "dislike") => {
    if (voting) return
    setVoting(true)
    // Optimistic
    const wasLike = lesson.viewer_vote === "like"
    const wasDislike = lesson.viewer_vote === "dislike"
    const newVote: "like" | "dislike" | null = lesson.viewer_vote === target ? null : target

    let likes = lesson.likes_count
    let dislikes = lesson.dislikes_count
    if (wasLike) likes -= 1
    if (wasDislike) dislikes -= 1
    if (newVote === "like") likes += 1
    if (newVote === "dislike") dislikes += 1

    const optimistic: Lesson = {
      ...lesson,
      viewer_vote: newVote,
      likes_count: Math.max(0, likes),
      dislikes_count: Math.max(0, dislikes),
    }
    onUpdate(optimistic)
    try {
      const data = await api<{ vote: "like" | "dislike" | null; likes_count: number; dislikes_count: number }>(
        `/api/lessons/${lesson.id}/react`,
        { method: "POST", body: JSON.stringify({ vote: target }) },
      )
      onUpdate({ ...optimistic, viewer_vote: data.vote, likes_count: data.likes_count, dislikes_count: data.dislikes_count })
    } catch {
      onUpdate(lesson) // rollback
    } finally {
      setVoting(false)
    }
  }

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = feedbackText.trim()
    if (!body || posting) return
    setPosting(true)
    try {
      const data = await api<{ feedback: Feedback }>(`/api/lessons/${lesson.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ body, parent_id: replyTo }),
      })
      setFeedbacks((prev) => [...(prev || []), data.feedback])
      setFeedbackText("")
      setReplyTo(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setPosting(false)
    }
  }

  const deleteFeedback = async (fid: string) => {
    if (!confirm("¿Eliminar este comentario?")) return
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/feedback?fid=${fid}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setFeedbacks((prev) => (prev || []).filter((f) => f.id !== fid))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  // Threads: top-level + replies aninhadas
  const topLevel = (feedbacks || []).filter((f) => !f.parent_id)
  const repliesByParent = new Map<string, Feedback[]>()
  for (const f of feedbacks || []) {
    if (f.parent_id) {
      const arr = repliesByParent.get(f.parent_id) || []
      arr.push(f)
      repliesByParent.set(f.parent_id, arr)
    }
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className={styles.modalPlayer}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={lesson.video_url} controls autoPlay playsInline />
        </div>
        <div className={styles.modalBody}>
          <h2 className={styles.modalTitle}>{lesson.title}</h2>

          <div className={styles.modalAuthorRow}>
            <button
              type="button"
              onClick={onAuthorClick}
              className={styles.cardAvatar}
              aria-label="Ver perfil"
            >
              {lesson.author.avatar_url ? <img src={lesson.author.avatar_url} alt="" /> : initials}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <button
                type="button"
                onClick={onAuthorClick}
                className={styles.modalAuthorName}
                style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: "inherit", textAlign: "left" }}
              >
                {lesson.author.full_name}
              </button>
              <div className={styles.modalAuthorMeta}>
                {formatCount(lesson.views_count)} vistas · {new Date(lesson.created_at).toLocaleDateString("es-419")}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => vote("like")}
                disabled={voting}
                className={`${styles.modalLikeBtn} ${lesson.viewer_vote === "like" ? styles.liked : ""}`}
                aria-label="Me gusta"
              >
                <ThumbsUp size={14} fill={lesson.viewer_vote === "like" ? "currentColor" : "none"} />
                {formatCount(lesson.likes_count)}
              </button>
              <button
                type="button"
                onClick={() => vote("dislike")}
                disabled={voting}
                className={`${styles.modalLikeBtn} ${lesson.viewer_vote === "dislike" ? styles.disliked : ""}`}
                aria-label="No me gusta"
              >
                <ThumbsDown size={14} fill={lesson.viewer_vote === "dislike" ? "currentColor" : "none"} />
                {formatCount(lesson.dislikes_count)}
              </button>
            </div>
          </div>

          {lesson.description && (
            <p className={styles.modalDescription}>{lesson.description}</p>
          )}

          {lesson.tags && lesson.tags.length > 0 && (
            <div className={styles.modalTags}>
              {lesson.tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={styles.tag}
                  onClick={() => onTagClick(t)}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          {/* COMENTARIOS */}
          <section style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 1rem", fontFamily: "var(--font-display)", fontSize: "0.95rem", color: "var(--text-primary)" }}>
              <MessageSquare size={14} />
              Comentarios
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {feedbacks ? feedbacks.length : "..."}
              </span>
            </h3>

            <form onSubmit={submitFeedback} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", alignItems: "flex-end" }}>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={replyTo ? "Responder..." : "Comparte tu comentario..."}
                rows={2}
                maxLength={2000}
                disabled={posting}
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.85rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                  minHeight: 56,
                }}
              />
              <button
                type="submit"
                disabled={posting || !feedbackText.trim()}
                style={{
                  background: "var(--accent-red)",
                  border: "1px solid var(--accent-red)",
                  color: "white",
                  padding: "0.55rem 0.8rem",
                  cursor: posting || !feedbackText.trim() ? "not-allowed" : "pointer",
                  opacity: posting || !feedbackText.trim() ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 56,
                }}
                aria-label="Enviar"
              >
                <Send size={14} />
              </button>
            </form>
            {replyTo && (
              <div style={{ marginTop: "-0.875rem", marginBottom: "1rem", fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Respondiendo · <button type="button" onClick={() => setReplyTo(null)} style={{ background: "transparent", border: "none", color: "var(--accent-red)", cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              </div>
            )}

            {feedbacks === null ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>Cargando...</p>
            ) : topLevel.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                Sin comentarios todavía. ¡Sé el primero!
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {topLevel.map((fb) => (
                  <FeedbackItem
                    key={fb.id}
                    feedback={fb}
                    replies={repliesByParent.get(fb.id) || []}
                    canDelete={fb.user_id === user?.id}
                    onReply={(id) => {
                      setReplyTo(id)
                      setFeedbackText("")
                    }}
                    onDelete={deleteFeedback}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function FeedbackItem({
  feedback,
  replies,
  canDelete,
  onReply,
  onDelete,
}: {
  feedback: Feedback
  replies: Feedback[]
  canDelete: boolean
  onReply: (id: string) => void
  onDelete: (id: string) => void
}) {
  const initials = feedback.author_avatar
  return (
    <div>
      <FeedbackBubble feedback={feedback} initials={initials} canDelete={canDelete} onDelete={onDelete} onReply={() => onReply(feedback.id)} />
      {replies.length > 0 && (
        <div style={{ marginLeft: "2.5rem", marginTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.625rem", borderLeft: "1px solid var(--border-subtle)", paddingLeft: "0.875rem" }}>
          {replies.map((r) => (
            <FeedbackBubble key={r.id} feedback={r} initials={r.author_avatar} canDelete={canDelete} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function FeedbackBubble({
  feedback,
  initials,
  canDelete,
  onDelete,
  onReply,
}: {
  feedback: Feedback
  initials: string
  canDelete: boolean
  onDelete: (id: string) => void
  onReply?: () => void
}) {
  return (
    <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
      <span style={{ flex: "0 0 auto", width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #1a1a24, #0a0a0f)", border: feedback.author_is_admin ? "1.5px solid #fff" : "1px solid var(--border-subtle)", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: "0.65rem", fontWeight: 700, color: "var(--accent-gold)", fontFamily: "var(--font-display)" }}>
        {feedback.author_avatar_url ? (
          <img src={feedback.author_avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          initials
        )}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{feedback.author_name}</span>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {new Date(feedback.created_at).toLocaleDateString("es-419", { day: "2-digit", month: "2-digit" })}
          </span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>
          {feedback.body}
        </p>
        <div style={{ display: "flex", gap: "0.875rem", marginTop: "0.375rem" }}>
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", fontFamily: "var(--font-mono)", padding: 0 }}
            >
              Responder
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(feedback.id)}
              style={{ background: "transparent", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: "0.65rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: 0 }}
              aria-label="Eliminar"
            >
              <Trash2 size={10} /> Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MODAL DE UPLOAD ───────────────────────────────────────────────────

function LessonUploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) { setError("Título obligatorio"); return }
    if (!file) { setError("Selecciona un video"); return }

    setSubmitting(true)
    setProgress(0)

    try {
      // 1. Upload do vídeo
      const fd = new FormData()
      fd.append("file", file)
      const uploadRes = await fetch("/api/lessons/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${uploadRes.status}`)
      }
      const { video_url } = (await uploadRes.json()) as { video_url: string }

      setProgress(70)

      // 2. Cria lesson (vai pra fila de aprovação)
      const tags = tagsInput
        .split(/[,\s]+/)
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean)

      const createRes = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          video_url,
          tags,
        }),
      })
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${createRes.status}`)
      }

      setProgress(100)
      setSuccess("¡Listo! Tu lección está en revisión y será publicada en breve.")
      setTimeout(() => {
        onSuccess()
      }, 1800)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al publicar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", maxWidth: 560 }}
      >
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Cerrar" disabled={submitting}>
          <X size={18} />
        </button>
        <div className={styles.modalBody} style={{ paddingTop: "2.5rem" }}>
          <h2 className={styles.modalTitle}>Compartir mi lección</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
            Sube un video corto enseñando algo que aprendiste. Tu lección pasa por una breve revisión antes de aparecer en la galería.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.4rem", fontFamily: "var(--font-mono)" }}>
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                disabled={submitting}
                placeholder="Ej: Cómo configuré mi VSL en 30 minutos"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.75rem",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.4rem", fontFamily: "var(--font-mono)" }}>
                Descripción (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                disabled={submitting}
                placeholder="Cuenta brevemente qué se aprende en este video..."
                style={{
                  width: "100%",
                  padding: "0.625rem 0.75rem",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                  minHeight: 80,
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.4rem", fontFamily: "var(--font-mono)" }}>
                Tags (separa con espacios o comas, máx 5)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={submitting}
                placeholder="vsl avatar copy edicion"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.75rem",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.4rem", fontFamily: "var(--font-mono)" }}>
                Video * (MP4, WebM, MOV — máx 100MB)
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={submitting}
                style={{ width: "100%", color: "var(--text-secondary)", fontSize: "0.85rem" }}
              />
              {file && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem", fontFamily: "var(--font-mono)" }}>
                  {file.name} · {(file.size / 1024 / 1024).toFixed(1)}MB
                </p>
              )}
            </div>

            {error && (
              <div style={{ padding: "0.625rem 0.875rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fca5a5", fontSize: "0.8rem" }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: "0.625rem 0.875rem", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.4)", color: "#86efac", fontSize: "0.8rem" }}>
                {success}
              </div>
            )}
            {submitting && progress > 0 && progress < 100 && (
              <div style={{ width: "100%", height: 4, background: "rgba(255, 255, 255, 0.08)" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent-red)", transition: "width 0.3s" }} />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !!success}
              style={{
                background: "var(--accent-red)",
                border: "1px solid var(--accent-red)",
                color: "white",
                padding: "0.75rem 1.5rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                fontFamily: "var(--font-mono)",
                cursor: submitting || !!success ? "not-allowed" : "pointer",
                opacity: submitting || !!success ? 0.6 : 1,
                marginTop: "0.5rem",
              }}
            >
              {submitting ? "Publicando..." : success ? "Enviado ✓" : "Publicar lección"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
