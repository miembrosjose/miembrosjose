"use client"

// Comentários por episódio (renderizado dentro do EpisodesDrawer abaixo do player).
// Equivalente a fetchEpisodeComments + renderEpisodeComments do proyecto base
// (linhas 12345-12545). Suporta replies (1 nível), like/dislike e delete admin.

import { useEffect, useState, useCallback } from "react"
import { ThumbsUp, ThumbsDown, MessageCircle, AlertTriangle, Trash2 } from "lucide-react"
import { api } from "../_lib/api"
import { useAuth } from "../_lib/auth-context"
import { useView } from "../_lib/view-context"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { renderRichBody, timeAgoEs, buildAvatarLetters } from "../_lib/format"
import { AvatarBadge } from "./Avatar"
import type { EpisodeComment } from "../_lib/types"
import styles from "./episode-comments.module.css"

const TEXT_MAX = 500

type Props = {
  seasonNum: number
  episodeNum: number
  onReport?: (commentId: string) => void
}

export function EpisodeComments({ seasonNum, episodeNum, onReport }: Props) {
  const { user, isAdmin } = useAuth()
  const { setView } = useView()
  const goToUser = (userId: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setView("user", null, { userId })
  }
  const [comments, setComments] = useState<EpisodeComment[] | null>(null)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyOpen, setReplyOpen] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  const meta = (user?.user_metadata as { full_name?: string; name?: string; avatar_url?: string }) || {}
  const fullName = meta.full_name || meta.name || user?.email?.split("@")[0] || "Miembro"
  const initials = buildAvatarLetters(fullName)
  const avatarUrl = meta.avatar_url || null

  const fetchComments = useCallback(async () => {
    try {
      const data = await api<{ comments: EpisodeComment[] }>(
        `/api/episode-comments?season=${seasonNum}&episode=${episodeNum}`,
      )
      setComments(data.comments || [])
    } catch {
      setComments([])
    }
  }, [seasonNum, episodeNum])

  useEffect(() => {
    setComments(null)
    fetchComments()
  }, [fetchComments])

  // Realtime — INSERT/UPDATE/DELETE em episode_comments do episodio atual.
  // Filtra por season_num + episode_num. INSERT refetcha (precisa de author
  // info via JOIN); UPDATE/DELETE atualiza local.
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel(`episode-comments:${seasonNum}-${episodeNum}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "episode_comments",
          // Postgres_changes só aceita 1 filter — usa season_num.
          // Filtra episode_num no client (linha abaixo).
          filter: `season_num=eq.${seasonNum}`,
        },
        (payload) => {
          const n = payload.new as { episode_num?: number }
          if (n?.episode_num !== episodeNum) return
          fetchComments() // refetch pra trazer author/avatar/badge
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "episode_comments",
          filter: `season_num=eq.${seasonNum}`,
        },
        (payload) => {
          const upd = payload.new as Partial<EpisodeComment> & { id: string; episode_num?: number }
          if (upd.episode_num !== episodeNum) return
          setComments((prev) => (prev || []).map((c) => (c.id === upd.id ? { ...c, ...upd } : c)))
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "episode_comments",
          filter: `season_num=eq.${seasonNum}`,
        },
        (payload) => {
          const oldId = (payload.old as { id?: string; episode_num?: number })?.id
          if (!oldId) return
          // Cascade: remove o comment + replies dele
          setComments((prev) => (prev || []).filter((c) => c.id !== oldId && c.parent_comment_id !== oldId))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [seasonNum, episodeNum, fetchComments])

  // Separa raízes e replies
  const roots = (comments || []).filter((c) => !c.parent_comment_id)
  const repliesByParent = (comments || []).reduce<Record<string, EpisodeComment[]>>((acc, c) => {
    if (c.parent_comment_id) {
      ;(acc[c.parent_comment_id] = acc[c.parent_comment_id] || []).push(c)
    }
    return acc
  }, {})

  async function submitNew() {
    const clean = text.trim()
    if (!clean || submitting) return
    setSubmitting(true)
    try {
      const data = await api<{ comment: EpisodeComment }>("/api/episode-comments", {
        method: "POST",
        body: { season: seasonNum, episode: episodeNum, text: clean },
      })
      setComments((prev) => [data.comment, ...(prev || [])])
      setText("")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      alert(`No se pudo publicar: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function submitReply(parentId: string) {
    const clean = replyText.trim()
    if (!clean) return
    try {
      const data = await api<{ comment: EpisodeComment }>("/api/episode-comments", {
        method: "POST",
        body: { season: seasonNum, episode: episodeNum, text: clean, parent_comment_id: parentId },
      })
      setComments((prev) => [...(prev || []), data.comment])
      setReplyText("")
      setReplyOpen(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      alert(`No se pudo responder: ${msg}`)
    }
  }

  async function reactComment(commentId: string, vote: "like" | "dislike") {
    // Optimistic — atualiza local imediatamente, refetch silencioso pra confirmar
    setComments((prev) =>
      (prev || []).map((c) => {
        if (c.id !== commentId) return c
        const wasLike = c.my_vote === "like"
        const wasDislike = c.my_vote === "dislike"
        let likes = c.likes_count || 0
        let dislikes = c.dislikes_count || 0
        let newVote: "like" | "dislike" | null = vote
        if (vote === "like") {
          if (wasLike) {
            likes -= 1
            newVote = null
          } else {
            likes += 1
            if (wasDislike) dislikes -= 1
          }
        } else {
          if (wasDislike) {
            dislikes -= 1
            newVote = null
          } else {
            dislikes += 1
            if (wasLike) likes -= 1
          }
        }
        return { ...c, likes_count: likes, dislikes_count: dislikes, my_vote: newVote }
      }),
    )
    try {
      await api(`/api/episode-comments/${commentId}/react`, {
        method: "POST",
        body: { vote },
      })
    } catch {
      fetchComments() // rollback via refetch
    }
  }

  async function deleteAdmin(commentId: string) {
    if (!confirm("¿Borrar este comentario? (admin)")) return
    try {
      await api("/api/admin/comments/delete", {
        method: "POST",
        body: { id: commentId },
      })
      // Remove o comment + suas replies
      setComments((prev) => (prev || []).filter((c) => c.id !== commentId && c.parent_comment_id !== commentId))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      alert(`No se pudo borrar: ${msg}`)
    }
  }

  // Self-delete — autor deleta próprio comentário/reply.
  async function deleteSelf(commentId: string) {
    if (!confirm("¿Borrar tu comentario?")) return
    try {
      await api(`/api/episode-comments/${commentId}`, { method: "DELETE" })
      // Remove o comment + suas replies (caso seja root)
      setComments((prev) => (prev || []).filter((c) => c.id !== commentId && c.parent_comment_id !== commentId))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      alert(`No se pudo borrar: ${msg}`)
    }
  }

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h3 className={styles.title}>Comentarios</h3>
        <span className={styles.count}>{comments === null ? "—" : comments.length}</span>
      </header>

      {/* Form de novo comentário */}
      <div className={styles.formWrap}>
        <div className={styles.form}>
          <div className={styles.formAvatar}>
            {avatarUrl ? <img src={avatarUrl} alt="" loading="lazy" /> : initials}
          </div>
          <div className={styles.formBody}>
            <textarea
              placeholder="Comparte tu pensamiento sobre este episodio..."
              maxLength={TEXT_MAX}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className={styles.formActions}>
              <span className={styles.charcount}>{text.length}/{TEXT_MAX}</span>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={submitNew}
                disabled={submitting || !text.trim()}
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      {comments === null && (
        <div className={styles.empty}>Cargando comentarios...</div>
      )}
      {comments !== null && roots.length === 0 && (
        <div className={styles.empty}>Sé el primero en comentar este episodio</div>
      )}
      {comments !== null && roots.length > 0 && (
        <div className={styles.list}>
          {roots.map((c) => {
            const replies = repliesByParent[c.id] || []
            const isReplyFormOpen = replyOpen === c.id
            return (
              <article key={c.id} className={styles.item}>
                <a href={`/miembros/u/${c.user_id}`} onClick={goToUser(c.user_id)} className={styles.avatar} style={{ position: "relative" }}>
                  {c.author_avatar_url ? (
                    <img src={c.author_avatar_url} alt="" loading="lazy" />
                  ) : (
                    c.author_avatar
                  )}
                  <AvatarBadge badgeId={c.author_badge_id} />
                </a>
                <div className={styles.body}>
                  <div className={styles.meta}>
                    <a href={`/miembros/u/${c.user_id}`} onClick={goToUser(c.user_id)} className={styles.author}>
                      {c.author_name}
                      {c.author_username && (
                        <span className={styles.username}> @{c.author_username}</span>
                      )}
                    </a>
                    <span className={styles.date}>{timeAgoEs(c.created_at)}</span>
                    {/* Autor pode deletar próprio comentário (cascade nas replies) */}
                    {!!user && user.id === c.user_id && !isAdmin && (
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => deleteSelf(c.id)}
                        title="Borrar"
                        aria-label="Borrar"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => deleteAdmin(c.id)}
                        title="Borrar (admin)"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div
                    className={styles.text}
                    dangerouslySetInnerHTML={{ __html: renderRichBody(c.text) }}
                  />
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={`${styles.likeBtn} ${c.my_vote === "like" ? styles.active : ""}`}
                      onClick={() => reactComment(c.id, "like")}
                    >
                      <ThumbsUp size={12} /> {c.likes_count || 0}
                    </button>
                    <button
                      type="button"
                      className={`${styles.dislikeBtn} ${c.my_vote === "dislike" ? styles.active : ""}`}
                      onClick={() => reactComment(c.id, "dislike")}
                    >
                      <ThumbsDown size={12} /> {c.dislikes_count || 0}
                    </button>
                    <button
                      type="button"
                      className={styles.replyBtn}
                      onClick={() => {
                        setReplyOpen(isReplyFormOpen ? null : c.id)
                        setReplyText("")
                      }}
                    >
                      <MessageCircle size={12} /> Responder
                    </button>
                    {onReport && (!user || user.id !== c.user_id) && (
                      <button
                        type="button"
                        className={styles.reportBtn}
                        onClick={() => onReport(c.id)}
                        title="Reportar"
                      >
                        <AlertTriangle size={12} />
                      </button>
                    )}
                  </div>

                  {isReplyFormOpen && (
                    <div className={styles.replyForm}>
                      <textarea
                        placeholder="Escribí tu respuesta..."
                        maxLength={TEXT_MAX}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.replySubmit}
                        onClick={() => submitReply(c.id)}
                        disabled={!replyText.trim()}
                      >
                        Enviar
                      </button>
                    </div>
                  )}

                  {replies.length > 0 && (
                    <div className={styles.replies}>
                      {replies.map((r) => (
                        <div key={r.id} className={`${styles.item} ${styles.isReply}`}>
                          <a href={`/miembros/u/${r.user_id}`} onClick={goToUser(r.user_id)} className={styles.avatar} style={{ width: 28, height: 28, position: "relative" }}>
                            {r.author_avatar_url ? (
                              <img src={r.author_avatar_url} alt="" loading="lazy" />
                            ) : (
                              r.author_avatar
                            )}
                            <AvatarBadge badgeId={r.author_badge_id} />
                          </a>
                          <div className={styles.body}>
                            <div className={styles.meta}>
                              <a href={`/miembros/u/${r.user_id}`} onClick={goToUser(r.user_id)} className={styles.author}>
                                {r.author_name}
                              </a>
                              <span className={styles.date}>{timeAgoEs(r.created_at)}</span>
                              {/* Autor pode deletar própria reply */}
                              {!!user && user.id === r.user_id && !isAdmin && (
                                <button
                                  type="button"
                                  className={styles.deleteBtn}
                                  onClick={() => deleteSelf(r.id)}
                                  title="Borrar"
                                  aria-label="Borrar"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  type="button"
                                  className={styles.deleteBtn}
                                  onClick={() => deleteAdmin(r.id)}
                                  title="Borrar (admin)"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                              {/* Report na reply (não tinha antes — só pra outros users) */}
                              {onReport && (!user || user.id !== r.user_id) && (
                                <button
                                  type="button"
                                  className={styles.reportBtn}
                                  onClick={() => onReport(r.id)}
                                  title="Reportar"
                                  aria-label="Reportar"
                                >
                                  <AlertTriangle size={12} />
                                </button>
                              )}
                            </div>
                            <div
                              className={styles.text}
                              dangerouslySetInnerHTML={{ __html: renderRichBody(r.text) }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
