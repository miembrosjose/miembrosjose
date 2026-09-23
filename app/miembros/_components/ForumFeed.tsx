"use client"

// Feed do fórum — lista paginada de posts + composer no topo + modais
// (edit, report). Substitui o conjunto fetchForumPosts/renderForum/
// openEditModal/openReportModal.

import { useEffect, useRef, useState, useCallback } from "react"
import { SlidersHorizontal, ChevronDown, Compass } from "lucide-react"
import { api } from "../_lib/api"
import { useAuth } from "../_lib/auth-context"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import type { ForumPost as TForumPost, ForumReply } from "../_lib/types"
import { ForumPost } from "./ForumPost"
import { ForumComposer } from "./ForumComposer"
import { EditModal, type EditTarget } from "./EditModal"
import { ReportModal, type ReportTarget } from "./ReportModal"
import { consumeForumTarget, FORUM_GOTO_EVENT } from "../_lib/forum-nav"
import { FORUM_CATEGORIES, categoryLabel  } from "../_lib/report-types"
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
  // Búsqueda + filtro por categoría (tag). El input se "debounce" 350ms para
  // no disparar un fetch por tecla.
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // ── EL TEMARIO DEL CAMINO ────────────────────────────────────────────────
  // Los doce temas fijados son un índice, no una conversación. Al estar
  // fijados ocupaban la entrada entera: quien llegaba veía doce publicaciones
  // del administrador antes que una sola palabra de la comunidad.
  //
  // Ahora la lista de abajo es la conversación, y el temario vive aquí
  // arriba, plegado y en una sola línea. Se abre a voluntad, enseña solo los
  // títulos, y cada título despliega su tema donde está.
  const [temarioAbierto, setTemarioAbierto] = useState(false)
  const [temario, setTemario] = useState<TForumPost[] | null>(null)
  const [temaAbierto, setTemaAbierto] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const feedRef = useRef<HTMLDivElement | null>(null)

  const filtering = debouncedSearch.trim().length > 0 || !!activeTag

  // Construye el query string del feed con búsqueda + tag (y cursor opcional).
  const buildQuery = useCallback((before?: string | null) => {
    const p = new URLSearchParams()
    if (before) p.set("before", before)
    if (debouncedSearch.trim()) p.set("q", debouncedSearch.trim())
    if (activeTag) p.set("tag", activeTag)
    const s = p.toString()
    return s ? `/api/forum/posts?${s}` : "/api/forum/posts"
  }, [debouncedSearch, activeTag])

  // Se pide una sola vez, y solo si alguien abre el temario: quien entra a
  // leer a la comunidad no paga por traerse doce textos que no va a mirar.
  useEffect(() => {
    if (!temarioAbierto || temario !== null) return
    let vivo = true
    api<FeedResponse>("/api/forum/posts?origen=camino&limit=50")
      .then((d) => { if (vivo) setTemario(d.posts || []) })
      .catch(() => { if (vivo) setTemario([]) })
    return () => { vivo = false }
  }, [temarioAbierto, temario])

  // Debounce del input de búsqueda.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Scroll + resalta el post cuyo título coincide (navegación desde portales).
  const scrollToTitle = useCallback((title: string) => {
    const root = feedRef.current
    if (!root) return
    let tries = 0
    const key = title.split(" — ")[0].trim()
    const attempt = () => {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-post-title]"))
      // Exacto primero; si no, por el primer segmento del título (resiliente a
      // pequeñas ediciones del título en el foro).
      const el =
        nodes.find((n) => n.getAttribute("data-post-title") === title) ||
        (key ? nodes.find((n) => (n.getAttribute("data-post-title") || "").startsWith(key)) : undefined)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add(styles.highlight)
        setTimeout(() => el.classList.remove(styles.highlight), 2800)
      } else if (tries++ < 24) {
        setTimeout(attempt, 250)
      }
    }
    attempt()
  }, [])

  // Al montar (o al recibir el evento) atiende un objetivo pendiente.
  useEffect(() => {
    const onEvt = (e: Event) => {
      const d = (e as CustomEvent).detail as { title?: string } | undefined
      if (d?.title) scrollToTitle(d.title)
    }
    window.addEventListener(FORUM_GOTO_EVENT, onEvt)
    const pend = consumeForumTarget()
    if (pend) scrollToTitle(pend)
    return () => window.removeEventListener(FORUM_GOTO_EVENT, onEvt)
  }, [scrollToTitle])

  // Carga inicial (sem cursor) — substitui a lista
  const fetchInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<FeedResponse>(buildQuery())
      setPosts(data.posts || [])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (e) {
      setPosts([])
      setHasMore(false)
      const msg = e instanceof Error ? e.message : "Error desconocido"
      console.warn("[ForumFeed] fetch failed:", msg)
    } finally {
      setLoading(false)
    }
  }, [buildQuery])

  // Próxima página — append na lista
  const fetchMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await api<FeedResponse>(buildQuery(cursor))
      setPosts((prev) => [...prev, ...(data.posts || [])])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (e) {
      console.error("[ForumFeed] erro ao paginar:", e)
    } finally {
      setLoadingMore(false)
    }
  }, [cursor, loadingMore, buildQuery])

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
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const filtroActivo = activeTag ? categoryLabel(activeTag) : null

  return (
    <div ref={feedRef}>
      <ForumComposer onCreate={handleCreate} />

      {/* Buscador + filtro por categoría (tags). Acento dorado sutil. */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en el foro…"
            className={styles.searchInput}
            aria-label="Buscar publicaciones"
          />
          {search && (
            <button type="button" className={styles.searchClear} onClick={() => setSearch("")} aria-label="Limpiar búsqueda">×</button>
          )}
        </div>
        <button
          type="button"
          className={filtroActivo ? styles.filtroBotonOn : styles.filtroBoton}
          onClick={() => setFiltrosAbiertos((v) => !v)}
          aria-expanded={filtrosAbiertos}
        >
          <SlidersHorizontal size={13} aria-hidden />
          {filtroActivo ?? "Temas"}
        </button>
      </div>

      {/* ── El temario del Camino, plegado ──────────────────────────────
          Una sola línea. Dentro, los títulos; cada uno abre su tema donde
          está. Así el índice del Camino sigue a mano sin ser lo primero ni
          lo único que se ve al entrar. */}
      <div className={styles.temario}>
        <button
          type="button"
          className={styles.temarioCabecera}
          onClick={() => setTemarioAbierto((v) => !v)}
          aria-expanded={temarioAbierto}
        >
          <Compass size={14} aria-hidden />
          <span className={styles.temarioTitulo}>Temario del Camino</span>
          <span className={styles.temarioPista}>
            {temario ? `${temario.length} temas` : "los temas de cada temporada"}
          </span>
          <ChevronDown
            size={15}
            aria-hidden
            className={temarioAbierto ? styles.temarioFlechaAbierta : styles.temarioFlecha}
          />
        </button>

        {temarioAbierto && (
          <div className={styles.temarioLista}>
            {temario === null && <p className={styles.temarioCargando}>Cargando el temario…</p>}
            {temario?.length === 0 && (
              <p className={styles.temarioCargando}>Todavía no hay temas fijados.</p>
            )}
            {temario?.map((t) => (
              <div key={t.id}>
                <button
                  type="button"
                  className={temaAbierto === t.id ? styles.temaTituloAbierto : styles.temaTitulo}
                  onClick={() => setTemaAbierto((cur) => (cur === t.id ? null : t.id))}
                  aria-expanded={temaAbierto === t.id}
                >
                  <span>{t.title}</span>
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className={temaAbierto === t.id ? styles.temarioFlechaAbierta : styles.temarioFlecha}
                  />
                </button>
                {temaAbierto === t.id && (
                  <div data-post-title={t.title}>
                    <ForumPost
                      post={t}
                      onEdit={handleEdit}
                      onReport={handleReport}
                      onDelete={handleDelete}
                      onDeleteAdmin={handleDeleteAdmin}
                      onEditReply={handleEditReply}
                      onReportReply={handleReportReply}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Las siete categorías son vocabulario de la casa y ocupaban toda la
          entrada del foro. Plegadas, lo primero que se ve es lo que ha
          escrito la gente; quien quiera filtrar, abre. */}
      {filtrosAbiertos && (
        <div className={styles.tagBar}>
          <button
            type="button"
            className={`${styles.tagChip} ${!activeTag ? styles.tagChipActive : ""}`}
            onClick={() => { setActiveTag(null); setFiltrosAbiertos(false) }}
          >
            Todas
          </button>
          {FORUM_CATEGORIES.map((c) => (
            <button
              key={c.tag}
              type="button"
              className={`${styles.tagChip} ${activeTag === c.tag ? styles.tagChipActive : ""}`}
              onClick={() => { setActiveTag((cur) => (cur === c.tag ? null : c.tag)); setFiltrosAbiertos(false) }}
            >
              {c.label}
            </button>
          ))}
        </div>
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
          <p className={styles.emptyKicker}>{filtering ? "Sin resultados" : "Aún no hay conversación"}</p>
          <p className={styles.emptyMsg}>
            {filtering
              ? "Prueba con otras palabras o quita el filtro de categoría."
              : "Sé la primera persona en abrir una. Si buscas por dónde empezar, el temario del Camino está arriba."}
          </p>
        </div>
      )}

      {!loading && posts.length > 0 && posts.map((post) => (
        <div key={post.id} data-post-title={post.title} style={{ borderRadius: 14 }}>
          <ForumPost
            post={post}
            onEdit={handleEdit}
            onReport={handleReport}
            onDelete={handleDelete}
            onDeleteAdmin={handleDeleteAdmin}
            onEditReply={handleEditReply}
            onReportReply={handleReportReply}
          />
        </div>
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
