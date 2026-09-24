"use client"

// View router client-side — mantém qual "tela" está ativa sem reload.
// Sincroniza com URL via pushState pra back button + share funcionarem.
//
// Views com params (user, producto) carregam params do path:
//   /miembros/u/<id>           → view=user, params.userId
//   /miembros/producto/<slug>  → view=producto, params.slug

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"

export type ViewKey =
  | "inicio"
  | "comunidad"
  | "feed"
  | "perfil"
  | "admin"
  | "user"
  | "producto"
  | "messages"
  | "miembros_lista"
  | "red"

const VALID_VIEWS: ViewKey[] = [
  "inicio",
  "comunidad",
  "feed",
  "perfil",
  "admin",
  "messages",
  "miembros_lista",
  "red",
]

// "biblioteca" es el ancla de la sección que de cara a quien mira se llama
// «Recursos de los 144000». El nombre se quedó del primer diseño y renombrarlo
// rompería los enlaces guardados.
//
// La sección que SÍ se llama «Biblioteca» es "libreria". Dos nombres cruzados
// es feo, y menos feo que migrar la categoría de todos los productos.
export type Anchor = "cursos" | "biblioteca" | "libreria" | "tienda" | "servicios" | null

export type RedTab = "pulso" | "foro" | "lista" | "mapa" | "encuentros"

export type ViewParams = {
  userId?: string
  slug?: string
  /** Pra view "messages": se setado, abre direto a thread com esse user. */
  withUserId?: string
  /**
   * Para la view "red": con qué pestaña abrir.
   *
   * La Red entra siempre por Pulso, y así debe seguir. Pero "Ver todos" desde
   * el anuncio de encuentros de la portada llevaba al Pulso, que no es lo que
   * se pidió: quien pulsa ahí quiere ver los encuentros.
   */
  redTab?: RedTab
  /**
   * Para la view "red" con la pestaña de comunidad: el TÍTULO del tema al que
   * hay que ir.
   *
   * Los portales del Camino llevan a un tema concreto. Cuando el foro era una
   * lista, la pantalla buscaba esa fila por el título. Ahora hay diez
   * espacios, así que el título se resuelve contra el servidor
   * (/api/comunidad/buscar-hilo) y se abre el sitio exacto.
   */
  comunidadTema?: string
}

type ViewContextValue = {
  view: ViewKey
  anchor: Anchor
  params: ViewParams
  setView: (v: ViewKey, anchor?: Anchor, params?: ViewParams) => void
  /** Vuelve a la vista anterior. Si no hay ninguna, va a inicio. */
  volver: () => void
  /** false cuando se llegó por enlace directo: no hay a dónde volver. */
  puedeVolver: boolean
}

const ViewContext = createContext<ViewContextValue>({
  view: "inicio",
  anchor: null,
  params: {},
  setView: () => {},
  volver: () => {},
  puedeVolver: false,
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
  if (path === "/miembros/personas") return { view: "miembros_lista", anchor: null, params: {} }
  if (path === "/miembros/red") return { view: "red", anchor: null, params: {} }

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
  if (clean === "cursos" || clean === "biblioteca" || clean === "tienda" || clean === "servicios") {
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
  if (view === "miembros_lista") return "/miembros/personas"
  // Inicio/comunidad/feed → /miembros + hash
  if (anchor) return `/miembros#${anchor}`
  if (view === "inicio") return "/miembros"
  return `/miembros#${view}`
}

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<ViewKey>("inicio")
  const [anchor, setAnchor] = useState<Anchor>(null)
  const [params, setParams] = useState<ViewParams>({})

  // Cuántas vistas hemos apilado DENTRO de la SPA. Sirve para saber si hay a
  // dónde volver: si alguien llega por un enlace directo a un perfil, la
  // pila está vacía y un history.back() lo sacaría del sitio.
  const profundidad = useRef(0)
  const [puedeVolver, setPuedeVolver] = useState(false)

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
    function alRetroceder() {
      profundidad.current = Math.max(0, profundidad.current - 1)
      setPuedeVolver(profundidad.current > 0)
      syncFromUrl()
    }
    window.addEventListener("popstate", alRetroceder)
    window.addEventListener("hashchange", syncFromUrl)
    return () => {
      window.removeEventListener("popstate", alRetroceder)
      window.removeEventListener("hashchange", syncFromUrl)
    }
  }, [])

  const setView = useCallback(
    (v: ViewKey, a: Anchor = null, p: ViewParams = {}) => {
      const newPath = buildPath(v, a, p)
      const currentPath = window.location.pathname + window.location.hash
      if (currentPath !== newPath) {
        window.history.pushState({ view: v, anchor: a, params: p }, "", newPath)
        profundidad.current += 1
        setPuedeVolver(true)
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

  // Volver = el botón «atrás» del navegador, que es lo que la gente espera.
  // Así se respeta toda la pila —mapa → perfil → otro perfil— sin llevar un
  // historial propio en paralelo que acabaría desincronizado.
  const volver = useCallback(() => {
    if (profundidad.current > 0) window.history.back()
    else setView("inicio")
  }, [setView])

  return (
    <ViewContext.Provider value={{ view, anchor, params, setView, volver, puedeVolver }}>
      {children}
    </ViewContext.Provider>
  )
}

export function useView(): ViewContextValue {
  return useContext(ViewContext)
}
