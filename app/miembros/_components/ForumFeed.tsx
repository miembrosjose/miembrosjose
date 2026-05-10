"use client"

// Feed do fórum — lista paginada de posts + composer no topo + modais
// (edit, report). Substitui o conjunto fetchForumPosts/renderForum/
// openEditModal/openReportModal.

import { useEffect, useRef, useState, useCallback } from "react"
import { api } from "../_lib/api"
import { useAuth } from "../_lib/auth-context"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import type { ForumPost as TForumPost, ForumReply } from "../_lib/types"
import { ForumPost } from "./ForumPost"
import { ForumComposer } from "./ForumComposer"
import { EditModal, type EditTarget } from "./EditModal"
import { ReportModal, type ReportTarget } from "./ReportModal"
import styles from "./forum.module.css"

type FeedResponse = {
  posts: TForumPost[]
  nextCursor: string | null
}

export function ForumFeed() {
  const { isAdmin } = useAuth()
  const [posts, setPosts] = useState<TForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Carga inicial (sem cursor) — substitui a lista
  const fetchInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<FeedResponse>("/api/forum/posts")
      setPosts(data.posts || [])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      setError(msg)
      console.error("[ForumFeed] erro ao buscar posts:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Próxima página — append na lista
  const fetchMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await api<FeedResponse>(
        `/api/forum/posts?before=${encodeURIComponent(cursor)}`,
      )
      setPosts((prev) => [...prev, ...(data.posts || [])])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (e) {
      console.error("[ForumFeed] erro ao paginar:", e)
    } finally {
      setLoadingMore(false)
    }
  }, [cursor, loadingMore])

  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  // Realtime — INSERT/UPDATE/DELETE em forum_posts. INSERT precisa refetchar
  // pra trazer author info via JOIN (postgres_changes só dá row crua).
  // UPDATE/DELETE atualiza local sem refetch.
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel("forum-posts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "forum_posts" },
        () => {
          // Refetch initial pra trazer author/avatar/badge corretos
          fetchInitial()
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "forum_posts" },
        (payload) => {
          const upd = payload.new as Partial<TForumPost> & { id: string }
          setPosts((prev) =>
            prev.map((p) => (p.id === upd.id ? { ...p, ...upd } : p)),
          )
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "forum_posts" },
        (payload) => {
          const oldId = (payload.old as { id?: string })?.id
          if (!oldId) return
          setPosts((prev) => prev.filter((p) => p.id !== oldId))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchInitial])

  // Scroll infinito: carrega próxima página quando o sentinel entra na viewport.
  // rootMargin "300px" antecipa o fetch antes do user chegar no fim — UX sem
  // pulinho de spinner aparente.
  useEffect(() => {
    if (!hasMore || loading) return
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchMore()
      },
      { rootMargin: "300px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, fetchMore])

  const handleCreate = useCallback((newPost: TForumPost) => {
    setPosts((prev) => [newPost, ...prev])
  }, [])

  // Callbacks estáveis (referência preservada entre renders) pra ForumPost
  // memo() conseguir bail out — sem isso, todo re-render do ForumFeed faria
  // os N posts re-renderizarem mesmo com props "iguais".
  const handleDeleteAdmin = useCallback(async (postId: string) => {
    try {
      await api(`/api/admin/forum/posts?id=${encodeURIComponent(postId)}`, { method: "DELETE" })
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      alert(`No se pudo borrar: ${msg}`)
    }
  }, [])

  // Self-delete — autor deleta próprio post (admin usa handleDeleteAdmin acima).
  const handleDelete = useCallback(async (postId: string) => {
    try {
      await api(`/api/forum/posts/${postId}`, { method: "DELETE" })
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      alert(`No se pudo borrar: ${msg}`)
    }
  }, [])

  const handleEdit = useCallback((post: TForumPost) => {
    setEditTarget({
      type: "forum_post",
      id: post.id,
      initialBody: post.body,
      initialTitle: post.title,
      initialTags: post.tags ?? [],
    })
  }, [])

  const handleReport = useCallback((post: TForumPost) => {
    setReportTarget({ type: "forum_post", id: post.id })
  }, [])

  const handleEditReply = useCallback((reply: ForumReply) => {
    setEditTarget({
      type: "forum_reply",
      id: reply.id,
      initialBody: reply.body,
    })
  }, [])

  const handleReportReply = useCallback((reply: ForumReply) => {
    setReportTarget({ type: "forum_reply", id: reply.id })
  }, [])

  function handleEditSaved(target: EditTarget, payload: { title?: string; body: string; tags?: string[] }) {
    if (target.type !== "forum_post") return
    // Quando admin edita, backend ZERA edited_at — espelhar no UI pra não
    // aparecer "(editado)" instantâneo nem mostrar dado legado de edição
    // anterior por outro user. Outros users marcam normalmente.
    setPosts((prev) =>
      prev.map((p) =>
        p.id === target.id
          ? {
              ...p,
              body: payload.body,
              title: payload.title ?? p.title,
              tags: payload.tags ?? p.tags,
              edited_at: isAdmin ? null : new Date().toISOString(),
            }
          : p,
      ),
    )
  }

  return (
    <div>
      <ForumComposer onCreate={handleCreate} />

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
          <p className={styles.emptyKicker}>Aún no hay publicaciones</p>
          <p className={styles.emptyMsg}>Sé el primero en abrir una conversación.</p>
        </div>
      )}

      {!loading && posts.length > 0 && posts.map((post) => (
        <ForumPost
          key={post.id}
          post={post}
          onEdit={handleEdit}
          onReport={handleReport}
          onDelete={handleDelete}
          onDeleteAdmin={handleDeleteAdmin}
          onEditReply={handleEditReply}
          onReportReply={handleReportReply}
        />
      ))}

      {/* Sentinel pra IntersectionObserver: dispara fetchMore() quando entra
          na viewport (com 300px de antecedência). Some quando não há mais. */}
      {hasMore && !loading && (
        <div ref={loadMoreRef} className={styles.empty}>
          {loadingMore && <p className={styles.emptyKicker}>Cargando más...</p>}
        </div>
      )}

      <EditModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={handleEditSaved}
      />
      <ReportModal
        target={reportTarget}
        onClose={() => setReportTarget(null)}
      />
    </div>
  )
}
