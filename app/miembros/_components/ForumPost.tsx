"use client"

// Card de post do fórum + replies expandíveis inline.
// Equivalente ao bloco renderForum().

import { Heart, ThumbsDown, MessageCircle, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { useState, useEffect, memo } from "react"
import { useAuth } from "../_lib/auth-context"
import { api } from "../_lib/api"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { timeAgoEs, renderRichBody, isVideoUrl } from "../_lib/format"
import type { ForumPost as TForumPost, ForumReply } from "../_lib/types"
import { Avatar, AuthorName } from "./Avatar"
import { LikersHoverCard } from "./LikersHoverCard"
import styles from "./forum.module.css"

type ForumPostProps = {
  post: TForumPost
  onEdit?: (post: TForumPost) => void
  onReport?: (post: TForumPost) => void
  onDelete?: (postId: string) => void | Promise<void>
  onDeleteAdmin?: (postId: string) => void | Promise<void>
  onEditReply?: (reply: ForumReply) => void
  onReportReply?: (reply: ForumReply) => void
  onLikeChange?: (postId: string, liked: boolean, count: number) => void
}

function ForumPostInner({ post, onEdit, onReport, onDelete, onDeleteAdmin, onEditReply, onReportReply, onLikeChange }: ForumPostProps) {
  const { user, isAdmin } = useAuth()
  const isOwn = !!user && user.id === post.user_id

  const [repliesOpen, setRepliesOpen] = useState(false)
  const [replies, setReplies] = useState<ForumReply[] | null>(null)
  const [replyText, setReplyText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [liked, setLiked] = useState(!!post.liked_by_me)
  const [disliked, setDisliked] = useState(!!post.disliked_by_me)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [dislikesCount, setDislikesCount] = useState(post.dislikes_count ?? 0)
  const [repliesCount, setRepliesCount] = useState(post.replies_count)

  // Sync estado local quando prop muda (ex: parent re-fetcha)
  useEffect(() => {
    setLiked(!!post.liked_by_me)
    setDisliked(!!post.disliked_by_me)
    setLikesCount(post.likes_count)
    setDislikesCount(post.dislikes_count ?? 0)
    setRepliesCount(post.replies_count)
  }, [post.liked_by_me, post.disliked_by_me, post.likes_count, post.dislikes_count, post.replies_count])

  async function toggleReplies() {
    if (repliesOpen) {
      setRepliesOpen(false)
      return
    }
    setRepliesOpen(true)
    if (!replies) {
      try {
        const data = await api<{ replies: ForumReply[] }>(`/api/forum/posts/${post.id}/replies`)
        setReplies(data.replies || [])
      } catch (e) {
        console.error("[ForumPost] erro ao buscar replies:", e)
        setReplies([])
      }
    }
  }

  // Realtime — replies novas/editadas/deletadas em tempo real quando
  // a thread estiver aberta. Filtra por post_id pra reduzir trafego
  // (só replies desse post chegam pelo channel).
  useEffect(() => {
    if (!repliesOpen) return
    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel(`forum-replies:${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "forum_replies",
          filter: `post_id=eq.${post.id}`,
        },
        async () => {
          // Refetch pra trazer author info via JOIN (postgres_changes só
          // entrega row raw, sem author_name/avatar/badge).
          try {
            const data = await api<{ replies: ForumReply[] }>(`/api/forum/posts/${post.id}/replies`)
            setReplies(data.replies || [])
            setRepliesCount(data.replies?.length ?? 0)
          } catch {}
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "forum_replies",
          filter: `post_id=eq.${post.id}`,
        },
        (payload) => {
          const upd = payload.new as Partial<ForumReply> & { id: string }
          setReplies((prev) => (prev || []).map((r) => (r.id === upd.id ? { ...r, ...upd } : r)))
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "forum_replies",
          filter: `post_id=eq.${post.id}`,
        },
        (payload) => {
          const oldId = (payload.old as { id?: string })?.id
          if (!oldId) return
          setReplies((prev) => (prev || []).filter((r) => r.id !== oldId))
          setRepliesCount((c) => Math.max(0, c - 1))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [repliesOpen, post.id])

  async function submitReply() {
    const text = replyText.trim()
    if (!text || submitting) return
    setSubmitting(true)
    try {
      const data = await api<{ reply: ForumReply; bono_granted?: boolean }>(`/api/forum/posts/${post.id}/replies`, {
        method: "POST",
        body: { body: text },
      })
      setReplies((prev) => [...(prev || []), data.reply])
      setRepliesCount((c) => c + 1)
      setReplyText("")
      // Auto-grant do bonus-ganchos disparou no servidor (post tinha tag BONO
      // e user ainda não tinha o bonus). Sinaliza pro useOwnedProducts hook
      // refetch o estado, que vai detectar o novo produto + chamar
      // checkProductAchievements → unlockAchievement('product_bonus_ganchos')
      // → AchievementToast aparece (notificação privada).
      if (data.bono_granted) {
        window.dispatchEvent(new CustomEvent("app:owned-products-refresh"))
      }
    } catch (e) {
      console.error("[ForumPost] erro ao criar reply:", e)
      const msg = e instanceof Error ? e.message : "Error desconocido"
      alert(`No se pudo publicar: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleLike() {
    // Optimistic update — mutual exclusion: ao curtir, remove dislike se ativo
    const newLiked = !liked
    const newCount = likesCount + (newLiked ? 1 : -1)
    const wasDisliked = disliked
    const newDislikesCount = wasDisliked && newLiked ? dislikesCount - 1 : dislikesCount
    setLiked(newLiked)
    setLikesCount(newCount)
    if (wasDisliked && newLiked) {
      setDisliked(false)
      setDislikesCount(newDislikesCount)
    }
    try {
      await api(`/api/forum/posts/${post.id}/like`, { method: "POST" })
      onLikeChange?.(post.id, newLiked, newCount)
    } catch (e) {
      // revert tudo
      setLiked(!newLiked)
      setLikesCount(likesCount)
      if (wasDisliked && newLiked) {
        setDisliked(true)
        setDislikesCount(dislikesCount)
      }
      console.error("[ForumPost] erro ao toggle like:", e)
    }
  }

  async function toggleDislike() {
    const newDisliked = !disliked
    const newCount = dislikesCount + (newDisliked ? 1 : -1)
    const wasLiked = liked
    const newLikesCount = wasLiked && newDisliked ? likesCount - 1 : likesCount
    setDisliked(newDisliked)
    setDislikesCount(newCount)
    if (wasLiked && newDisliked) {
      setLiked(false)
      setLikesCount(newLikesCount)
    }
    try {
      await api(`/api/forum/posts/${post.id}/dislike`, { method: "POST" })
    } catch (e) {
      setDisliked(!newDisliked)
      setDislikesCount(dislikesCount)
      if (wasLiked && newDisliked) {
        setLiked(true)
        setLikesCount(likesCount)
      }
      console.error("[ForumPost] erro ao toggle dislike:", e)
    }
  }

  return (
    <article className={`${styles.post} ${post.pinned ? styles.pinned : ""}`}>
      <Avatar author={post} className={styles.avatar} />

      <div>
        <div className={styles.authorInfo}>
          <AuthorName author={post} className={styles.authorName} />
          <span className={styles.time}>{timeAgoEs(post.created_at)}</span>
          {post.pinned && <span className={styles.pinnedBadge}>📌 Fijado</span>}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        )}

        <h3 className={styles.title}>{post.title}</h3>
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: renderRichBody(post.body) }}
        />

        {post.image_url && (
          isVideoUrl(post.image_url) ? (
            <video
              src={post.image_url}
              className={`${styles.media} ${styles.video}`}
              controls
              preload="metadata"
              playsInline
            />
          ) : (
            <img src={post.image_url} alt="" className={styles.media} loading="lazy" />
          )
        )}

        <div className={styles.footer}>
          <LikersHoverCard
            endpoint={`/api/forum/posts/${post.id}/likers`}
            count={likesCount}
          >
            <button
              type="button"
              className={`${styles.likeBtn} ${liked ? styles.liked : ""}`}
              onClick={toggleLike}
              aria-label="Like"
            >
              <Heart size={13} fill={liked ? "currentColor" : "none"} />
              <span>{likesCount}</span>
            </button>
          </LikersHoverCard>
          <LikersHoverCard
            endpoint={`/api/forum/posts/${post.id}/dislikers`}
            count={dislikesCount}
          >
            <button
              type="button"
              className={`${styles.dislikeBtn} ${disliked ? styles.disliked : ""}`}
              onClick={toggleDislike}
              aria-label="Dislike"
            >
              <ThumbsDown size={13} fill={disliked ? "currentColor" : "none"} />
              <span>{dislikesCount}</span>
            </button>
          </LikersHoverCard>
          <button
            type="button"
            className={styles.replyBtn}
            onClick={toggleReplies}
            aria-label="Responder"
          >
            <MessageCircle size={13} />
            <span>{repliesCount}</span>
          </button>
          {post.hot && <span className={styles.hot}>🔥 HOT</span>}
          {post.edited_at && <span className={styles.editedTag}>(editado)</span>}
          {isOwn && onEdit && (
            <button type="button" className={styles.editBtn} onClick={() => onEdit(post)} title="Editar">
              <Pencil size={13} />
            </button>
          )}
          {onReport && !isOwn && (
            <button
              type="button"
              className={styles.reportBtn}
              onClick={() => onReport(post)}
              title="Reportar"
              aria-label="Reportar"
            >
              <AlertTriangle size={14} />
            </button>
          )}
          {/* Autor pode deletar próprio post. Admin tem botão separado abaixo. */}
          {isOwn && !isAdmin && onDelete && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => {
                if (confirm("¿Borrar tu publicación?")) onDelete(post.id)
              }}
              title="Borrar"
              aria-label="Borrar"
            >
              <Trash2 size={14} />
            </button>
          )}
          {isAdmin && onDeleteAdmin && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => {
                if (confirm("¿Borrar publicación? (admin)")) onDeleteAdmin(post.id)
              }}
              title="Borrar (admin)"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {repliesOpen && (
          <div className={styles.replies}>
            {replies === null ? (
              <p className={styles.emptyKicker}>Cargando...</p>
            ) : replies.length === 0 ? (
              <p className={styles.emptyMsg}>Sin respuestas aún. Sé el primero.</p>
            ) : (
              replies.map((r) => (
                <ReplyItem
                  key={r.id}
                  reply={r}
                  postId={post.id}
                  onEdit={onEditReply}
                  onReport={onReportReply}
                  onDeleted={(replyId) => {
                    setReplies((prev) => (prev || []).filter((x) => x.id !== replyId))
                    setRepliesCount((c) => Math.max(0, c - 1))
                  }}
                />
              ))
            )}
            <div className={styles.replyForm}>
              <textarea
                placeholder="Escribí tu respuesta..."
                maxLength={2000}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button type="button" onClick={submitReply} disabled={submitting || !replyText.trim()}>
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

type ReplyItemProps = {
  reply: ForumReply
  postId: string
  onEdit?: (reply: ForumReply) => void
  onReport?: (reply: ForumReply) => void
  onDeleted?: (replyId: string) => void
}

function ReplyItem({ reply, postId, onEdit, onReport, onDeleted }: ReplyItemProps) {
  // postId pode ser usado pra invalidar cache no futuro (não usado hoje, manter na assinatura por convenção do parent).
  void postId
  const { user, isAdmin } = useAuth()
  const isOwn = !!user && user.id === reply.user_id

  async function deleteSelf() {
    if (!confirm("¿Borrar tu respuesta?")) return
    try {
      await api(`/api/forum/replies/${reply.id}`, { method: "DELETE" })
      onDeleted?.(reply.id)
    } catch (e) {
      console.error("[ReplyItem] erro ao deletar:", e)
      alert("No se pudo borrar la respuesta.")
    }
  }

  async function deleteAsAdmin() {
    if (!confirm("¿Borrar respuesta? (admin)")) return
    try {
      await api(`/api/forum/replies/${reply.id}`, { method: "DELETE" })
      onDeleted?.(reply.id)
    } catch (e) {
      console.error("[ReplyItem] erro ao deletar (admin):", e)
      alert("No se pudo borrar la respuesta.")
    }
  }

  const [liked, setLiked] = useState(!!reply.liked_by_me)
  const [disliked, setDisliked] = useState(!!reply.disliked_by_me)
  const [likesCount, setLikesCount] = useState(reply.likes_count ?? 0)
  const [dislikesCount, setDislikesCount] = useState(reply.dislikes_count ?? 0)

  useEffect(() => {
    setLiked(!!reply.liked_by_me)
    setDisliked(!!reply.disliked_by_me)
    setLikesCount(reply.likes_count ?? 0)
    setDislikesCount(reply.dislikes_count ?? 0)
  }, [reply.liked_by_me, reply.disliked_by_me, reply.likes_count, reply.dislikes_count])

  async function toggleLike() {
    const newLiked = !liked
    const newCount = likesCount + (newLiked ? 1 : -1)
    const wasDisliked = disliked
    const newDislikesCount = wasDisliked && newLiked ? dislikesCount - 1 : dislikesCount
    setLiked(newLiked)
    setLikesCount(newCount)
    if (wasDisliked && newLiked) {
      setDisliked(false)
      setDislikesCount(newDislikesCount)
    }
    try {
      await api(`/api/forum/replies/${reply.id}/like`, { method: "POST" })
    } catch (e) {
      setLiked(!newLiked)
      setLikesCount(likesCount)
      if (wasDisliked && newLiked) {
        setDisliked(true)
        setDislikesCount(dislikesCount)
      }
      console.error("[ReplyItem] erro ao toggle like:", e)
    }
  }

  async function toggleDislike() {
    const newDisliked = !disliked
    const newCount = dislikesCount + (newDisliked ? 1 : -1)
    const wasLiked = liked
    const newLikesCount = wasLiked && newDisliked ? likesCount - 1 : likesCount
    setDisliked(newDisliked)
    setDislikesCount(newCount)
    if (wasLiked && newDisliked) {
      setLiked(false)
      setLikesCount(newLikesCount)
    }
    try {
      await api(`/api/forum/replies/${reply.id}/dislike`, { method: "POST" })
    } catch (e) {
      setDisliked(!newDisliked)
      setDislikesCount(dislikesCount)
      if (wasLiked && newDisliked) {
        setLiked(true)
        setLikesCount(likesCount)
      }
      console.error("[ReplyItem] erro ao toggle dislike:", e)
    }
  }

  return (
    <div className={styles.reply}>
      <Avatar author={reply} className={styles.replyAvatar} />
      <div>
        <div className={styles.replyMeta}>
          <AuthorName author={reply} className={styles.authorName} />
          <span className={styles.time}>{timeAgoEs(reply.created_at)}</span>
          {reply.edited_at && <span className={styles.editedTag}>(editado)</span>}
        </div>
        <div
          className={styles.replyBody}
          dangerouslySetInnerHTML={{ __html: renderRichBody(reply.body) }}
        />
        <div className={styles.replyFooter}>
          <LikersHoverCard
            endpoint={`/api/forum/replies/${reply.id}/likers`}
            count={likesCount}
          >
            <button
              type="button"
              className={`${styles.likeBtn} ${liked ? styles.liked : ""}`}
              onClick={toggleLike}
              aria-label="Like"
            >
              <Heart size={12} fill={liked ? "currentColor" : "none"} />
              <span>{likesCount}</span>
            </button>
          </LikersHoverCard>
          <LikersHoverCard
            endpoint={`/api/forum/replies/${reply.id}/dislikers`}
            count={dislikesCount}
          >
            <button
              type="button"
              className={`${styles.dislikeBtn} ${disliked ? styles.disliked : ""}`}
              onClick={toggleDislike}
              aria-label="Dislike"
            >
              <ThumbsDown size={12} fill={disliked ? "currentColor" : "none"} />
              <span>{dislikesCount}</span>
            </button>
          </LikersHoverCard>
          {isOwn && onEdit && (
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => onEdit(reply)}
              title="Editar"
              aria-label="Editar"
            >
              <Pencil size={12} />
            </button>
          )}
          {!isOwn && onReport && (
            <button
              type="button"
              className={styles.reportBtn}
              onClick={() => onReport(reply)}
              title="Reportar"
              aria-label="Reportar"
            >
              <AlertTriangle size={13} />
            </button>
          )}
          {/* Autor pode deletar própria reply. Admin abaixo (priority deletado). */}
          {isOwn && !isAdmin && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={deleteSelf}
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
              onClick={deleteAsAdmin}
              title="Borrar (admin)"
              aria-label="Borrar (admin)"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// memo() evita re-renderizar todos os posts quando o ForumFeed re-renderiza
// (ex: ao adicionar 1 post novo, ou ao trocar editTarget/reportTarget).
// Com callbacks estáveis no pai (useCallback), só o post cuja `post` prop
// mudou de fato é re-renderizado.
export const ForumPost = memo(ForumPostInner)
