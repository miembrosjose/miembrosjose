"use client"

// View router client-side — mantém qual "tela" está ativa sem reload.
// Sincroniza com URL via pushState pra back button + share funcionarem.
//
// 8 views (todas dentro do mesmo SPA — sem rotas Next.js separadas):
//   inicio, comunidad, feed, funnels, perfil, admin, user, producto
//
// Views com params (user, producto) carregam params do path:
//   /miembros/u/<id>           → view=user, params.userId
//   /miembros/producto/<slug>  → view=producto, params.slug

import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type ViewKey =
  | "inicio"
  | "comunidad"
  | "feed"
  | "funnels"
  | "perfil"
  | "admin"
  | "user"
  | "producto"
  | "messages"
  | "lecciones"
  | "miembros_lista"

const VALID_VIEWS: ViewKey[] = [
  "inicio",
  "comunidad",
  "feed",
  "funnels",
  "perfil",
  "admin",
  "messages",
  "lecciones",
  "miembros_lista",
]

export type Anchor = "cursos" | "tienda" | "servicios" | null

export type ViewParams = {
  userId?: string
  slug?: string
  /** Pra view "messages": se setado, abre direto a thread com esse user. */
  withUserId?: string
}

type ViewContextValue = {
  view: ViewKey
  anchor: Anchor
  params: ViewParams
  setView: (v: ViewKey, anchor?: Anchor, params?: ViewParams) => void
}

const ViewContext = createContext<ViewContextValue>({
  view: "inicio",
  anchor: null,
  params: {},
  setView: () => {},
})

type ParseResult = { view: ViewKey; anchor: Anchor; params: ViewParams }

function parsePath(pathname: string, hash: string): ParseResult {
  // Path-based routing tem prioridade — preserva URLs compartilháveis:
  //   /miembros                  → inicio
  //   /miembros/perfil           → perfil
  //   /miembros/admin            → admin
  //   /miembros/u/<id>           → user
  //   /miembros/producto/<slug>  → producto
  // Quando path é só /miembros (ou /miembros/), olha hash:
  //   #comunidad/#feed/#funnels  → view
  //   #cursos/#tienda/#servicios → inicio + anchor
  const path = pathname.replace(/\/+$/, "")

  if (path === "/miembros/perfil") return { view: "perfil", anchor: null, params: {} }
  if (path === "/miembros/admin") return { view: "admin", anchor: null, params: {} }
  if (path === "/miembros/mensajes") return { view: "messages", anchor: null, params: {} }
  if (path === "/miembros/lecciones") return { view: "lecciones", anchor: null, params: {} }
  if (path === "/miembros/personas") return { view: "miembros_lista", anchor: null, params: {} }

  const mensajesMatch = path.match(/^\/miembros\/mensajes\/([^/]+)$/)
  if (mensajesMatch)
    return { view: "messages", anchor: null, params: { withUserId: mensajesMatch[1] } }

  const userMatch = path.match(/^\/miembros\/u\/([^/]+)$/)
  if (userMatch) return { view: "user", anchor: null, params: { userId: userMatch[1] } }

  const productoMatch = path.match(/^\/miembros\/producto\/([^/]+)$/)
  if (productoMatch) return { view: "producto", anchor: null, params: { slug: productoMatch[1] } }

  // Path = /miembros (ou /miembros/) → checa hash
  const clean = hash.replace(/^#/, "").toLowerCase()
  if (!clean) return { view: "inicio", anchor: null, params: {} }
  if ((VALID_VIEWS as string[]).includes(clean)) {
    return { view: clean as ViewKey, anchor: null, params: {} }
  }
  if (clean === "cursos" || clean === "tienda" || clean === "servicios") {
    return { view: "inicio", anchor: clean, params: {} }
  }
  return { view: "inicio", anchor: null, params: {} }
}

function buildPath(view: ViewKey, anchor: Anchor, params: ViewParams): string {
  // Reverso de parsePath. Mantém URLs limpas e compartilháveis.
  if (view === "perfil") return "/miembros/perfil"
  if (view === "admin") return "/miembros/admin"
  if (view === "user" && params.userId) return `/miembros/u/${params.userId}`
  if (view === "producto" && params.slug) return `/miembros/producto/${params.slug}`
  if (view === "messages")
    return params.withUserId ? `/miembros/mensajes/${params.withUserId}` : "/miembros/mensajes"
  if (view === "lecciones") return "/miembros/lecciones"
  if (view === "miembros_lista") return "/miembros/personas"
  // Inicio/comunidad/feed/funnels → /miembros + hash
  if (anchor) return `/miembros#${anchor}`
  if (view === "inicio") return "/miembros"
  return `/miembros#${view}`
}

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<ViewKey>("inicio")
  const [anchor, setAnchor] = useState<Anchor>(null)
  const [params, setParams] = useState<ViewParams>({})

  // Sync inicial + popstate (back/forward do browser)
  useEffect(() => {
    function syncFromUrl() {
      const parsed = parsePath(window.location.pathname, window.location.hash)
      setViewState(parsed.view)
      setAnchor(parsed.anchor)
      setParams(parsed.params)
      requestAnimationFrame(() => {
        if (parsed.anchor) {
          const el = document.getElementById(parsed.anchor)
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" })
            return
          }
        }
        window.scrollTo({ top: 0, behavior: "smooth" })
      })
    }
    syncFromUrl()
    window.addEventListener("popstate", syncFromUrl)
    window.addEventListener("hashchange", syncFromUrl)
    return () => {
      window.removeEventListener("popstate", syncFromUrl)
      window.removeEventListener("hashchange", syncFromUrl)
    }
  }, [])

  const setView = useCallback(
    (v: ViewKey, a: Anchor = null, p: ViewParams = {}) => {
      const newPath = buildPath(v, a, p)
      const currentPath = window.location.pathname + window.location.hash
      if (currentPath !== newPath) {
        window.history.pushState({ view: v, anchor: a, params: p }, "", newPath)
      }
      setViewState(v)
      setAnchor(a)
      setParams(p)
      requestAnimationFrame(() => {
        if (a) {
          const el = document.getElementById(a)
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" })
            return
          }
        }
        window.scrollTo({ top: 0, behavior: "smooth" })
      })
    },
    []
  )

  return (
    <ViewContext.Provider value={{ view, anchor, params, setView }}>
      {children}
    </ViewContext.Provider>
  )
}

export function useView(): ViewContextValue {
  return useContext(ViewContext)
}
