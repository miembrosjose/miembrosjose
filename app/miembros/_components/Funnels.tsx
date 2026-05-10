"use client"

// Funnels — grid de funnels da comunidade + popup com detalhes/feedbacks +
// composer pra criar novo. Equivalente a fetchUserFunnels/openFunnelPopup do
// proyecto base (linhas 9806-10200).
//
// Versão Fase 5d: composer aceita URL de imagem direta (em vez de upload).
// Upload de arquivo + conversão webp ficam pra Fase 6 polish (reusa
// /api/forum/upload-image que já existe).

import { useEffect, useState, useCallback } from "react"
import { Plus, X, ThumbsUp, ThumbsDown, MessageCircle, Trash2, ExternalLink, ExternalLink as OpenIcon } from "lucide-react"
import { api } from "../_lib/api"
import { useAuth } from "../_lib/auth-context"
import { useView } from "../_lib/view-context"
import { renderRichBody, timeAgoEs } from "../_lib/format"
import { AvatarBadge } from "./Avatar"
import type { Funnel, FunnelFeedback } from "../_lib/types"
import { FileUploader } from "./FileUploader"
import styles from "./funnels.module.css"
import viewStyles from "./view-funnels.module.css"

const NICHES = [
  "COACHING",
  "CONSULTORIA",
  "ECOMMERCE",
  "INFOPRODUTO",
  "LOCAL",
  "AGENCIA",
  "EDUCACION",
  "SALUD",
  "FITNESS",
  "FINANZAS",
  "INMOBILIARIA",
  "OTRO",
]

export function Funnels() {
  const { isAdmin } = useAuth()
  const { setView } = useView()
  const goToUser = (userId: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setView("user", null, { userId })
  }
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [loading, setLoading] = useState(true)
  const [composerOpen, setComposerOpen] = useState(false)
  const [openFunnel, setOpenFunnel] = useState<Funnel | null>(null)

  const fetchFunnels = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ funnels: Funnel[] }>("/api/funnels")
      setFunnels(data.funnels || [])
    } catch {
      setFunnels([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFunnels()
  }, [fetchFunnels])

  async function handleDeleteAdmin(id: string) {
    if (!confirm("¿Borrar este funnel?")) return
    try {
      await api(`/api/admin/funnels?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      setFunnels((prev) => prev.filter((f) => f.id !== id))
    } catch {
      alert("Error al borrar")
    }
  }

  function handleCreate(funnel: Funnel) {
    setFunnels((prev) => [funnel, ...prev])
    setComposerOpen(false)
  }

  function handleVoteUpdate(updatedFunnel: Funnel) {
    setFunnels((prev) => prev.map((f) => (f.id === updatedFunnel.id ? updatedFunnel : f)))
    if (openFunnel?.id === updatedFunnel.id) setOpenFunnel(updatedFunnel)
  }

  // Niches únicas presentes nos funnels (pra dropdown filter)
  const availableNiches = Array.from(new Set(funnels.map((f) => f.niche).filter(Boolean))).sort()
  const [nicheFilter, setNicheFilter] = useState<string>("")
  const [sort, setSort] = useState<"recent" | "popular">("recent")

  let displayed = [...funnels]
  if (nicheFilter) displayed = displayed.filter((f) => f.niche === nicheFilter)
  if (sort === "popular") {
    displayed.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
  } else {
    displayed.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
  }

  return (
    <div className={viewStyles.wrap}>
      <header className={viewStyles.header}>
        <div className={viewStyles.headerLeft}>
          <p className={viewStyles.kicker}>Tu funnel aquí</p>
          <h1 className={viewStyles.title}>
            Funnels de la <span className={viewStyles.titleAccent}>comunidad</span>
          </h1>
          <p className={viewStyles.subtitle}>
            Mira los funnels que otros miembros han construido. Inspírate, da feedback y comparte el tuyo.
          </p>
        </div>
        <button
          type="button"
          className={viewStyles.shareBtn}
          onClick={() => setComposerOpen(true)}
        >
          <Plus size={14} /> Compartir mi funnel
        </button>
      </header>

      {composerOpen && (
        <FunnelComposer onClose={() => setComposerOpen(false)} onCreated={handleCreate} />
      )}

      <div className={viewStyles.filters}>
        <button
          type="button"
          className={`${viewStyles.filterBtn} ${sort === "recent" ? viewStyles.active : ""}`}
          onClick={() => setSort("recent")}
        >
          Recientes
        </button>
        <button
          type="button"
          className={`${viewStyles.filterBtn} ${sort === "popular" ? viewStyles.active : ""}`}
          onClick={() => setSort("popular")}
        >
          Populares
        </button>
        {availableNiches.length > 0 && (
          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className={viewStyles.nicheFilter}
          >
            <option value="">Todos los nichos</option>
            {availableNiches.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p className={viewStyles.empty}>Cargando funnels...</p>
      ) : displayed.length === 0 ? (
        <div className={viewStyles.empty}>
          {nicheFilter
            ? <>Sin funnels en el nicho <strong>{nicheFilter}</strong>.</>
            : <>Aún no hay funnels compartidos. ¡Sé el primero!</>
          }
        </div>
      ) : (
        <div className={viewStyles.grid}>
          {displayed.map((f) => (
            <div
              key={f.id}
              role="button"
              tabIndex={0}
              className={viewStyles.card}
              onClick={() => setOpenFunnel(f)}
              onKeyDown={(e) => { if (e.key === "Enter") setOpenFunnel(f) }}
            >
              {f.approved === false && <span className={viewStyles.pendingBadge}>En revisión</span>}
              {isAdmin && (
                <span
                  className={viewStyles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteAdmin(f.id)
                  }}
                  title="Borrar (admin)"
                >
                  <Trash2 size={13} />
                </span>
              )}
              <div
                className={viewStyles.cardThumb}
                style={{ backgroundImage: `url('${f.image_url}')` }}
              >
                <div className={viewStyles.cardThumbOverlay}>
                  <div className={viewStyles.cardOpenIcon}>
                    <OpenIcon size={20} />
                  </div>
                </div>
              </div>
              <div className={viewStyles.cardBody}>
                <button
                  type="button"
                  className={viewStyles.cardAvatar}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (f.user_id) goToUser(f.user_id)(e as unknown as React.MouseEvent)
                  }}
                  aria-label="Ver autor"
                >
                  {f.author_avatar_url ? (
                    <img src={f.author_avatar_url} alt="" loading="lazy" />
                  ) : (
                    f.author_avatar || "?"
                  )}
                </button>
                <div className={viewStyles.cardInfo}>
                  <h3 className={viewStyles.cardTitle}>{f.name}</h3>
                  <span className={viewStyles.cardAuthor}>{f.author_name}</span>
                  <div className={viewStyles.cardMeta}>
                    <span><ThumbsUp size={11} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />{f.likes_count || 0}</span>
                    <span><MessageCircle size={11} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />{f.feedbacks_count || 0}</span>
                  </div>
                  {f.niche && <span className={viewStyles.cardNiche}>{f.niche}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {openFunnel && (
        <FunnelPopup
          funnel={openFunnel}
          onClose={() => setOpenFunnel(null)}
          onVoteUpdate={handleVoteUpdate}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Composer
// ─────────────────────────────────────────────────────────────────────────

function FunnelComposer({ onClose, onCreated }: { onClose: () => void; onCreated: (f: Funnel) => void }) {
  const [name, setName] = useState("")
  const [niche, setNiche] = useState("")
  const [url, setUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  async function submit() {
    // Validação granular: lista exatamente quais campos faltam.
    const missing: string[] = []
    if (!name.trim()) missing.push("nombre")
    if (!niche) missing.push("nicho")
    if (!url.trim()) missing.push("URL")
    if (!imageUrl.trim()) missing.push("thumbnail")
    if (missing.length > 0) {
      const last = missing.pop()
      const text = missing.length === 0
        ? `Completa el campo: ${last}`
        : `Completa los campos: ${missing.join(", ")} y ${last}`
      setStatus({ kind: "err", text })
      return
    }
    setSubmitting(true)
    try {
      const data = await api<{ funnel: Funnel }>("/api/funnels", {
        method: "POST",
        body: { name: name.trim(), niche, url: url.trim(), image_url: imageUrl.trim() },
      })
      setStatus({ kind: "ok", text: "✓ Tu funnel está en revisión." })
      setTimeout(() => onCreated(data.funnel), 800)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error"
      setStatus({ kind: "err", text: msg })
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.composer}>
      <h3>Compartir mi funnel</h3>
      <input
        type="text"
        placeholder="Nombre del funnel"
        maxLength={120}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select value={niche} onChange={(e) => setNiche(e.target.value)}>
        <option value="">Selecciona un nicho</option>
        {NICHES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <input
        type="url"
        placeholder="URL del funnel (https://...)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <FileUploader
        value={imageUrl || null}
        onChange={(u) => setImageUrl(u || "")}
        accept="image/*"
        label="Subir thumbnail del funnel"
      />
      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "-0.5rem", fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
        ⓘ Proporción recomendada: <strong style={{ color: "var(--accent-gold)" }}>16:10</strong> (ej: 1280×800px). Imágenes con otras proporciones se recortarán al centro.
      </p>
      <div className={styles.composerActions}>
        {status && (
          <span className={status.kind === "ok" ? styles.statusOk : styles.statusErr} style={{ marginRight: "auto" }}>
            {status.text}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "0.6rem 1.2rem",
            background: "transparent",
            border: "1px solid var(--border-medium)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !name.trim() || !niche || !url.trim() || !imageUrl.trim()}
          style={{
            padding: "0.6rem 1.2rem",
            background: "var(--accent-red)",
            border: "1px solid var(--accent-red-hover)",
            color: "white",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: submitting ? "wait" : "pointer",
            opacity: submitting ? 0.5 : 1,
          }}
        >
          {submitting ? "Enviando..." : "Compartir"}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Popup
// ─────────────────────────────────────────────────────────────────────────

function FunnelPopup({
  funnel,
  onClose,
  onVoteUpdate,
}: {
  funnel: Funnel
  onClose: () => void
  onVoteUpdate: (f: Funnel) => void
}) {
  const [feedbacks, setFeedbacks] = useState<FunnelFeedback[] | null>(null)
  const [text, setText] = useState("")
  const [replyOpen, setReplyOpen] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const { setView } = useView()
  const goToUser = (userId: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    onClose()
    setView("user", null, { userId })
  }

  // Esc fecha
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  // Trava scroll do body
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Carrega feedbacks
  useEffect(() => {
    let alive = true
    api<{ feedbacks: FunnelFeedback[] }>(`/api/funnels/${funnel.id}/feedback`)
      .then((data) => {
        if (alive) setFeedbacks(data.feedbacks || [])
      })
      .catch(() => {
        if (alive) setFeedbacks([])
      })
    return () => {
      alive = false
    }
  }, [funnel.id])

  async function vote(v: "like" | "dislike") {
    const newVote = funnel.viewer_vote === v ? null : v
    try {
      const data = await api<{ funnel: Funnel }>(`/api/funnels/${funnel.id}/react`, {
        method: "POST",
        body: { vote: newVote },
      })
      onVoteUpdate(data.funnel)
    } catch {
      // silent
    }
  }

  async function submitFeedback() {
    const clean = text.trim()
    if (!clean) return
    try {
      const data = await api<{ feedback: FunnelFeedback }>(`/api/funnels/${funnel.id}/feedback`, {
        method: "POST",
        body: { body: clean },
      })
      setFeedbacks((prev) => [data.feedback, ...(prev || [])])
      setText("")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error"
      alert(`No se pudo enviar: ${msg}`)
    }
  }

  async function submitReply(parentId: string) {
    const clean = replyText.trim()
    if (!clean) return
    try {
      const data = await api<{ feedback: FunnelFeedback }>(`/api/funnels/${funnel.id}/feedback`, {
        method: "POST",
        body: { body: clean, parent_feedback_id: parentId },
      })
      setFeedbacks((prev) => [...(prev || []), data.feedback])
      setReplyText("")
      setReplyOpen(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error"
      alert(`No se pudo responder: ${msg}`)
    }
  }

  // Separa raízes/replies
  const roots = (feedbacks || []).filter((f) => !f.parent_feedback_id)
  const repliesByParent = (feedbacks || []).reduce<Record<string, FunnelFeedback[]>>((acc, fb) => {
    if (fb.parent_feedback_id) {
      ;(acc[fb.parent_feedback_id] = acc[fb.parent_feedback_id] || []).push(fb)
    }
    return acc
  }, {})

  return (
    <div className={styles.popupOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button type="button" className={styles.popupClose} onClick={onClose} aria-label="Cerrar">
        <X size={18} />
      </button>
      <div className={styles.popupContent}>
        {/* Lado esquerdo — info do funnel + actions */}
        <div className={styles.popupLeft}>
          <div>
            <h2 className={styles.popupTitle}>{funnel.name}</h2>
            <div className={styles.popupMeta}>
              {funnel.niche} · Por {funnel.author_name}
            </div>
          </div>

          <a href={funnel.url} target="_blank" rel="noopener noreferrer" className={styles.popupCta}>
            <div
              className={styles.popupCtaThumb}
              style={{ backgroundImage: `url('${funnel.image_url}')` }}
            />
            <div className={styles.popupCtaLabel}>
              <ExternalLink size={11} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "0.3rem" }} />
              Abrir funnel
            </div>
          </a>

          <div className={styles.popupActions}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.like} ${funnel.viewer_vote === "like" ? styles.active : ""}`}
              onClick={() => vote("like")}
            >
              <ThumbsUp size={13} /> {funnel.likes_count || 0}
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.dislike} ${funnel.viewer_vote === "dislike" ? styles.active : ""}`}
              onClick={() => vote("dislike")}
            >
              <ThumbsDown size={13} /> {funnel.dislikes_count || 0}
            </button>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", marginLeft: "auto", letterSpacing: "0.1em" }}>
              <MessageCircle size={11} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "0.25rem" }} />
              {funnel.feedbacks_count || 0}
            </span>
          </div>
        </div>

        {/* Lado direito — feedbacks */}
        <div className={styles.popupRight}>
          <div className={styles.feedbacksHeader}>
            <h3 className={styles.feedbacksTitle}>Feedbacks</h3>
            <span className={styles.feedbacksCount}>
              {feedbacks === null ? "—" : feedbacks.length}
            </span>
          </div>

          <div className={styles.feedbackForm}>
            <textarea
              placeholder="Comparte tu feedback sobre este funnel..."
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className={styles.feedbackFormActions}>
              <button
                type="button"
                className={styles.feedbackSubmit}
                onClick={submitFeedback}
                disabled={!text.trim()}
              >
                Enviar
              </button>
            </div>
          </div>

          {feedbacks === null && (
            <div className={styles.empty}>
              <p className={styles.emptyKicker}>Cargando...</p>
            </div>
          )}

          {feedbacks !== null && roots.length === 0 && (
            <div className={styles.empty}>
              <p className={styles.emptyKicker}>Aún no hay feedbacks</p>
              <p className={styles.emptyMsg}>Sé el primero en compartir tu opinión.</p>
            </div>
          )}

          {feedbacks !== null && roots.length > 0 && (
            <div className={styles.feedbackList}>
              {roots.map((fb) => {
                const replies = repliesByParent[fb.id] || []
                const isReplyOpen = replyOpen === fb.id
                return (
                  <div key={fb.id}>
                    <article className={styles.feedbackItem}>
                      <a href={`/miembros/u/${fb.user_id}`} onClick={goToUser(fb.user_id)} className={styles.feedbackAvatar} style={{ position: "relative" }}>
                        {fb.author_avatar_url ? (
                          <img src={fb.author_avatar_url} alt="" loading="lazy" />
                        ) : (
                          fb.author_avatar
                        )}
                        <AvatarBadge badgeId={fb.author_badge_id} />
                      </a>
                      <div className={styles.feedbackBody}>
                        <div className={styles.feedbackMeta}>
                          <a href={`/miembros/u/${fb.user_id}`} onClick={goToUser(fb.user_id)} className={styles.feedbackAuthor}>
                            {fb.author_name}
                          </a>
                          <span className={styles.feedbackTime}>{timeAgoEs(fb.created_at)}</span>
                        </div>
                        <div
                          className={styles.feedbackText}
                          dangerouslySetInnerHTML={{ __html: renderRichBody(fb.body) }}
                        />
                        <button
                          type="button"
                          className={styles.replyBtn}
                          onClick={() => {
                            setReplyOpen(isReplyOpen ? null : fb.id)
                            setReplyText("")
                          }}
                        >
                          {isReplyOpen ? "Cancelar" : "Responder"}
                        </button>
                        {isReplyOpen && (
                          <div className={styles.feedbackForm} style={{ marginTop: "0.5rem" }}>
                            <textarea
                              placeholder="Escribí tu respuesta..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              maxLength={2000}
                            />
                            <div className={styles.feedbackFormActions}>
                              <button
                                type="button"
                                className={styles.feedbackSubmit}
                                onClick={() => submitReply(fb.id)}
                                disabled={!replyText.trim()}
                              >
                                Enviar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                    {replies.map((r) => (
                      <article key={r.id} className={`${styles.feedbackItem} ${styles.isReply}`}>
                        <a href={`/miembros/u/${r.user_id}`} onClick={goToUser(r.user_id)} className={styles.feedbackAvatar} style={{ position: "relative" }}>
                          {r.author_avatar_url ? (
                            <img src={r.author_avatar_url} alt="" loading="lazy" />
                          ) : (
                            r.author_avatar
                          )}
                          <AvatarBadge badgeId={r.author_badge_id} />
                        </a>
                        <div className={styles.feedbackBody}>
                          <div className={styles.feedbackMeta}>
                            <a href={`/miembros/u/${r.user_id}`} onClick={goToUser(r.user_id)} className={styles.feedbackAuthor}>
                              {r.author_name}
                            </a>
                            <span className={styles.feedbackTime}>{timeAgoEs(r.created_at)}</span>
                          </div>
                          <div
                            className={styles.feedbackText}
                            dangerouslySetInnerHTML={{ __html: renderRichBody(r.body) }}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
