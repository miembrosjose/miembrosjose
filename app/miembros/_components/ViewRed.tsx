"use client"

// LA RED — explorar miembros por país y ciudad.
//
// Reutiliza lo que ya existe: el Avatar de la plataforma, la mensajería en
// /miembros/mensajes/<id> y el perfil en /miembros/u/<id>. No crea un segundo
// chat, ni un segundo perfil, ni otro sistema de tarjetas.
//
// Rendimiento: el filtrado, la búsqueda y la paginación ocurren en SQL. El
// navegador nunca recibe el directorio entero, solo la página que está viendo.

import { useCallback, useEffect, useRef, useState } from "react"
import { ForumFeed } from "./ForumFeed"
import { Leaderboard } from "./Leaderboard"
import { PulsoSemana } from "./PulsoSemana"
import Link from "next/link"
import { Activity, MapPin, Search, MessageCircle, MessageSquare, Users, Globe2, Loader2, X, CalendarDays } from "lucide-react"
import dynamic from "next/dynamic"
import { getAchievementById, getAura, ORDEN_AURAS } from "@/lib/achievements"
import { getAchievementSvg } from "@/lib/achievement-svg"
import { Avatar } from "./Avatar"
import { useView } from "../_lib/view-context"
import type { PaisPunto, CiudadPunto, MiembroPunto } from "./MapaRed"

// ssr:false — Leaflet no debe entrar al bundle del Worker (evita el 1102).
const MapaRed = dynamic(() => import("./MapaRed").then((m) => m.MapaRed), {
  ssr: false,
  loading: () => <div style={{ height: "min(68vh,560px)", minHeight: 340, borderRadius: 14, border: "1px solid rgba(217,184,102,0.28)", background: "#05050d", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b90b4", fontSize: "0.8rem" }}>Cargando mapa…</div>,
})
const EncuentrosRed = dynamic(() => import("./EncuentrosRed").then((m) => m.EncuentrosRed), {
  ssr: false,
  loading: () => <p style={{ color: "#8b90b4", fontSize: "0.8rem", padding: "2rem 0" }}>Cargando encuentros…</p>,
})
import styles from "./view-red.module.css"

type Miembro = {
  id: string
  full_name: string
  /** Insignia destacada — de ella salen el aura y la etiqueta del grado. */
  badge_id?: string | null
  username: string | null
  avatar_url: string | null
  city: string | null
  country_code: string
  country: string
  location_label: string | null
  roles: string[]
  member_since: string | null
  is_self: boolean
}

type Pais = { code: string; name: string; flag: string; cities: number }
type Ciudad = { id: number; name: string; admin1: string | null; label: string }
type Resumen = {
  miembros_total: number
  miembros_con_ubicacion: number
  paises: number
  ciudades: number
}

// La función «embajador» NO está aquí a propósito: el Embajador Galáctico ya
// se muestra como insignia y son la misma figura. Tenerla dos veces ponía dos
// etiquetas casi idénticas en la misma tarjeta.
const ROL_CORTO: Record<string, string> = {
  organizador: "Organizador",
  colaborador: "Colaborador",
  cartografo: "Cartógrafo",
  instructor: "Instructor",
}

/** Iniciales para el avatar cuando el miembro no tiene foto. */
function iniciales(nombre: string): string {
  const partes = (nombre || "").trim().split(/\s+/).filter(Boolean).slice(0, 2)
  const ini = partes.map((p) => p.charAt(0).toUpperCase()).join("")
  return ini || "M"
}

/** El aura del emblema destacado de un miembro, si lo tiene. */
function auraDe(m: { badge_id?: string | null }) {
  return getAura(m.badge_id)
}

export function ViewRed() {
  const { setView, params } = useView()

  // El perfil y la mensajería viven en /miembros/u/<id> y /miembros/mensajes/<id>,
  // que son RUTAS distintas de Next: navegar a ellas remonta la shell entera,
  // pierde el mapa y vuelve a lanzar el intro. Aquí se conserva el href real
  // —para clic derecho y pestaña nueva— pero el clic normal solo cambia de
  // vista. Es el mismo patrón que ya usa el Avatar de la plataforma.
  const abrirEnSpa = useCallback(
    (e: React.MouseEvent, vista: "user" | "messages", params: { userId?: string; withUserId?: string }) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      setView(vista, null, params)
    },
    [setView],
  )
  const abrirMiembro = useCallback((id: string) => setView("user", null, { userId: id }), [setView])

  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [paises, setPaises] = useState<Pais[]>([])
  const [ciudades, setCiudades] = useState<Ciudad[]>([])

  const [pais, setPais] = useState("")
  const [ciudad, setCiudad] = useState<number | "">("")
  const [busqueda, setBusqueda] = useState("")

  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [total, setTotal] = useState(0)
  const [cursor, setCursor] = useState<string | null>(null)

  const [cargando, setCargando] = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [error, setError] = useState(false)

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Pestaña y datos del mapa ────────────────────────────────────────────
  // Al entrar a un perfil, ViewRed se desmonta: volver la recrearía en la
  // pestaña «lista» y sin filtros, aunque estuvieras explorando el mapa. Se
  // recuerda en sessionStorage —por pestaña del navegador, sin tocar la base
  // ni el servidor— y se restaura al montar.
  // Siempre Pulso al entrar. Es lo primero que hay que ver, y recordar la
  // última pestaña hacía que cada persona entrara a un sitio distinto.
  const [tab, setTab] = useState<"pulso" | "foro" | "lista" | "mapa" | "encuentros">(
    params.redTab ?? "pulso",
  )

  // Si se vuelve a entrar pidiendo otra pestaña sin que el componente llegue a
  // desmontarse, el valor inicial de arriba ya no se vuelve a evaluar.
  useEffect(() => {
    if (params.redTab) setTab(params.redTab)
  }, [params.redTab])
  const [emblema, setEmblema] = useState(() => leerMemoria().emblema)

  useEffect(() => { guardarMemoria({ emblema }) }, [emblema])
  const [mapaPaises, setMapaPaises] = useState<PaisPunto[]>([])
  const [mapaCiudades, setMapaCiudades] = useState<CiudadPunto[]>([])
  const [mapaEmblemas, setMapaEmblemas] = useState<{ id: string; count: number }[]>([])
  // Miembros ya cargados, por ciudad. Se van acumulando conforme el mapa entra
  // en zonas nuevas: una ciudad ya vista no se vuelve a pedir.
  const [miembrosPorCiudad, setMiembrosPorCiudad] = useState<Map<number, MiembroPunto[]>>(new Map())
  const [cargandoMiembros, setCargandoMiembros] = useState(false)
  const pedidasRef = useRef<Set<number>>(new Set())

  // Entrada desde el mapa: /miembros/red?ciudad=<id> abre esa ciudad ya
  // filtrada. Se lee una sola vez, al montar.
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const c = sp.get("ciudad")
      const p = sp.get("pais")
      if (c && /^[0-9]+$/.test(c)) setCiudad(Number(c))
      if (p && /^[A-Za-z]{2}$/.test(p)) setPais(p.toUpperCase())
    } catch { /* sin querystring no pasa nada */ }
  }, [])

  // ── Cabecera: resumen real + países disponibles ─────────────────────────
  useEffect(() => {
    let vivo = true
    Promise.all([
      fetch("/api/red/miembros", { method: "POST", credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/red/ciudades", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([r, p]) => {
        if (!vivo) return
        if (r?.resumen) setResumen(r.resumen)
        if (p?.paises) setPaises(p.paises)
      })
      .catch(() => { /* la cabecera es accesoria: no rompe la vista */ })
    return () => { vivo = false }
  }, [])

  // ── Ciudades del país elegido ───────────────────────────────────────────
  useEffect(() => {
    if (!pais) { setCiudades([]); setCiudad(""); return }
    let vivo = true
    fetch(`/api/red/ciudades?pais=${encodeURIComponent(pais)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vivo) setCiudades(d?.ciudades || []) })
      .catch(() => { if (vivo) setCiudades([]) })
    return () => { vivo = false }
  }, [pais])

  // ── Consulta principal ──────────────────────────────────────────────────
  const cargar = useCallback(
    async (opts?: { append?: boolean; cursor?: string | null }) => {
      const append = opts?.append === true
      append ? setCargandoMas(true) : setCargando(true)
      setError(false)
      try {
        const p = new URLSearchParams()
        if (pais) p.set("pais", pais)
        if (ciudad !== "") p.set("ciudad", String(ciudad))
        if (busqueda.trim()) p.set("q", busqueda.trim())
        if (emblema) p.set("emblema", emblema)
        if (append && opts?.cursor) p.set("cursor", opts.cursor)

        const r = await fetch(`/api/red/miembros?${p.toString()}`, { credentials: "include" })
        if (!r.ok) throw new Error("miembros")
        const d = await r.json()

        setMiembros((prev) => (append ? [...prev, ...(d.miembros || [])] : d.miembros || []))
        setTotal(d.total || 0)
        setCursor(d.next_cursor || null)
      } catch {
        setError(true)
        if (!append) setMiembros([])
      } finally {
        append ? setCargandoMas(false) : setCargando(false)
      }
    },
    [pais, ciudad, busqueda, emblema],
  )

  // Filtros y búsqueda con retardo, para no consultar en cada tecla.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => { cargar() }, 250)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [cargar])

  // Recuento por emblema. Va en SU PROPIO efecto y SIEMPRE sin filtro.
  //
  // Antes se aprovechaba la respuesta filtrada y solo se guardaba cuando no
  // había filtro. Con el filtro recordado entre visitas, al volver ya venía
  // puesto, el recuento no se cargaba nunca, y sin recuento no se dibujaba
  // ninguna pastilla: el filtro quedaba echado sin forma de quitarlo.
  // Los recuentos se piden AL MONTAR, no al abrir el mapa. Las pastillas se
    // comparten con la lista desde que dejaron de vivir solo en el mapa; con la
    // condición de pestaña salían a cero hasta pasar por el mapa una vez.
  useEffect(() => {
    let vivo = true
    fetch("/api/red/mapa", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vivo && d) setMapaEmblemas(d.emblemas || []) })
      .catch(() => { /* las pastillas saldrán a cero */ })
    return () => { vivo = false }
  }, [])

  // Los puntos del mapa, estos sí según el filtro activo.
  useEffect(() => {
    if (tab !== "mapa") return
    let vivo = true
    const qs = emblema ? `?emblema=${encodeURIComponent(emblema)}` : ""
    fetch(`/api/red/mapa${qs}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo || !d) return
        setMapaPaises(d.paises || [])
        setMapaCiudades(d.ciudades || [])
      })
      .catch(() => { /* el mapa queda vacío; no rompe la vista */ })
    return () => { vivo = false }
  }, [tab, emblema])

  // El mapa avisa qué ciudades han entrado en pantalla; aquí se piden las que
  // aún no se tienen. Sin clics: acercarse basta para que salgan las caras.
  const necesitaCiudades = useCallback(
    async (ids: number[]) => {
      const nuevas = ids.filter((id) => !pedidasRef.current.has(id))
      if (nuevas.length === 0) return
      nuevas.forEach((id) => pedidasRef.current.add(id))
      setCargandoMiembros(true)
      try {
        const resultados = await Promise.all(
          nuevas.map(async (id) => {
            const p = new URLSearchParams({ nivel: "miembros", ciudad: String(id) })
            if (emblema) p.set("emblema", emblema)
            const r = await fetch(`/api/red/mapa?${p.toString()}`, { credentials: "include" })
            const d = r.ok ? await r.json() : null
            return [id, (d?.miembros || []) as MiembroPunto[]] as const
          }),
        )
        setMiembrosPorCiudad((prev) => {
          const m = new Map(prev)
          for (const [id, lista] of resultados) m.set(id, lista)
          return m
        })
      } catch {
        // Si falla, se permite reintentar al volver a entrar en la zona.
        nuevas.forEach((id) => pedidasRef.current.delete(id))
      } finally {
        setCargandoMiembros(false)
      }
    },
    [emblema],
  )

  // Cambiar de emblema invalida lo cargado: los miembros son otros.
  const limpiarMapa = useCallback(() => {
    pedidasRef.current.clear()
    setMiembrosPorCiudad(new Map())
  }, [])

  const hayFiltros = pais !== "" || ciudad !== "" || busqueda.trim() !== ""

  function limpiar() {
    setPais("")
    setCiudad("")
    setBusqueda("")
  }

  return (
    <div className={styles.view}>
      <main className={styles.main}>
        {/* ── Cabecera ──────────────────────────────────────────────── */}
        <header className={styles.header}>
          <p className={styles.kicker}>La Red</p>
          <h1 className={styles.title}>Explorar la Red</h1>
          <p className={styles.lead}>
            Miembros de 144 mil repartidos por el planeta. En el mapa aparecen quienes
            eligieron compartir su ciudad.
          </p>

          {resumen && (
            <div className={styles.stats}>
              <div className={styles.stat}>
                {/* El total, no los que están en el mapa. Enseñar aquí solo a
                    quienes comparten su ciudad hacía parecer que la Red tenía
                    un miembro cuando tenía dos. */}
                <span className={styles.statNum}>{resumen.miembros_total.toLocaleString("es-419")}</span>
                <span className={styles.statLabel}>
                  {resumen.miembros_total === 1 ? "miembro" : "miembros"}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{resumen.paises}</span>
                <span className={styles.statLabel}>{resumen.paises === 1 ? "país" : "países"}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{resumen.ciudades}</span>
                <span className={styles.statLabel}>{resumen.ciudades === 1 ? "ciudad" : "ciudades"}</span>
              </div>
            </div>
          )}
        </header>

        {/* ── Lista o mapa ──────────────────────────────────────────── */}
        {/* La Red absorbió lo que era "Comunidad": el foro es ahora una
            pestaña más, no una sección aparte que sonaba a lo mismo.
            Orden por vida: donde pasa algo primero, el territorio al final. */}
        <div className={styles.tabs} role="tablist" aria-label="Secciones de la Red">
          <button
            type="button" role="tab" aria-selected={tab === "pulso"}
            onClick={() => setTab("pulso")}
            className={`${styles.tab} ${tab === "pulso" ? styles.tabOn : ""}`}
          >
            <Activity size={13} aria-hidden /> Pulso
          </button>
          <button
            type="button" role="tab" aria-selected={tab === "foro"}
            onClick={() => setTab("foro")}
            className={`${styles.tab} ${tab === "foro" ? styles.tabOn : ""}`}
          >
            <MessageSquare size={13} aria-hidden /> Foro
          </button>
          <button
            type="button" role="tab" aria-selected={tab === "encuentros"}
            onClick={() => setTab("encuentros")}
            className={`${styles.tab} ${tab === "encuentros" ? styles.tabOn : ""}`}
          >
            <CalendarDays size={13} aria-hidden /> Encuentros
          </button>
          <button
            type="button" role="tab" aria-selected={tab === "lista"}
            onClick={() => setTab("lista")}
            className={`${styles.tab} ${tab === "lista" ? styles.tabOn : ""}`}
          >
            <Users size={13} aria-hidden /> Miembros
          </button>
          <button
            type="button" role="tab" aria-selected={tab === "mapa"}
            onClick={() => setTab("mapa")}
            className={`${styles.tab} ${tab === "mapa" ? styles.tabOn : ""}`}
          >
            <Globe2 size={13} aria-hidden /> Mapa
          </button>
        </div>

        {/* Las pastillas del Camino valen para las DOS pestañas: filtran el
            mapa y ahora también el listado. Antes vivían dentro del mapa, y
            listaban cualquier insignia que alguien tuviera destacada. La lista
            es fija: el Embajador y los cinco grados, siempre en el mismo
            orden, incluidos los que están a cero. */}
        {tab !== "encuentros" && tab !== "foro" && tab !== "pulso" && (
          (() => {
            const conteos = new Map(mapaEmblemas.map((e) => [e.id, e.count]))
            // Se muestran las seis SIEMPRE, también las que están a cero.
            // Son las categorías del Camino: forman un recorrido y esconder
            // las vacías haría que la lista cambiara de forma sola.
            return (
            <div className={styles.emblemas}>
              <button
                type="button"
                onClick={() => { setEmblema(""); limpiarMapa() }}
                className={`${styles.emblema} ${emblema === "" ? styles.emblemaOn : ""}`}
              >
                Todos
              </button>
              {ORDEN_AURAS.map((id) => {
                const ach = getAchievementById(id)
                const aura = getAura(id)
                if (!ach || !aura) return null
                const activo = emblema === id
                const n = conteos.get(id) ?? 0
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={n === 0 && !activo}
                    onClick={() => { setEmblema(id); limpiarMapa() }}
                    className={`${styles.emblema} ${activo ? styles.emblemaOn : ""}`}
                    title={n === 0 ? `${ach.name} — nadie todavía` : ach.desc}
                    style={activo
                      ? { borderColor: aura.color, color: aura.color2, boxShadow: `0 0 14px ${aura.color}55` }
                      : n === 0
                        ? { borderColor: "rgba(243,246,250,0.08)", opacity: 0.45, cursor: "default" }
                        : { borderColor: `${aura.color}55` }}
                  >
                    {ach.name} <span className={styles.emblemaNum}>{n}</span>
                  </button>
                )
              })}
            </div>
            )
          })()
        )}

        {tab === "pulso" ? (
          <PulsoSemana />
        ) : tab === "foro" ? (
          <div className={styles.foroGrid}>
            <Leaderboard />
            <div style={{ minWidth: 0 }}>
              <ForumFeed />
            </div>
          </div>
        ) : tab === "encuentros" ? (
          <EncuentrosRed />
        ) : tab === "mapa" ? (
          <>

            <MapaRed
              paises={mapaPaises}
              ciudades={mapaCiudades}
              miembrosPorCiudad={miembrosPorCiudad}
              cargando={cargandoMiembros}
              onNecesitaCiudades={necesitaCiudades}
              onAbrirMiembro={abrirMiembro}
            />
          </>
        ) : (
        <>
        {/* ── Filtros ───────────────────────────────────────────────── */}
        <div className={styles.filtros}>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} aria-hidden />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre…"
              className={styles.search}
              autoComplete="off"
              aria-label="Buscar miembros por nombre"
            />
            {busqueda && (
              <button type="button" onClick={() => setBusqueda("")} className={styles.searchClear} aria-label="Limpiar búsqueda">
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.selects}>
            <select
              value={pais}
              onChange={(e) => { setPais(e.target.value); setCiudad("") }}
              className={styles.select}
              aria-label="Filtrar por país"
            >
              <option value="">Todos los países</option>
              {paises.map((p) => (
                <option key={p.code} value={p.code}>{p.flag} {p.name}</option>
              ))}
            </select>

            <select
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value === "" ? "" : Number(e.target.value))}
              className={styles.select}
              disabled={!pais}
              aria-label="Filtrar por ciudad"
            >
              <option value="">{pais ? "Todas las ciudades" : "Ciudad — elige antes un país"}</option>
              {ciudades.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {hayFiltros && (
            <button type="button" onClick={limpiar} className={styles.limpiar}>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* ── Recuento ──────────────────────────────────────────────── */}
        {!cargando && !error && (
          <p className={styles.count}>
            <Users size={14} aria-hidden />
            {total.toLocaleString("es-419")} {total === 1 ? "miembro" : "miembros"}
            {ciudad !== "" && ciudades.find((c) => c.id === ciudad)
              ? ` en ${ciudades.find((c) => c.id === ciudad)!.name}`
              : pais
                ? ` en ${paises.find((p) => p.code === pais)?.name ?? ""}`
                : ""}
          </p>
        )}

        {/* ── Resultados ────────────────────────────────────────────── */}
        {cargando ? (
          <div className={styles.estado}>
            <Loader2 size={20} className={styles.spin} aria-hidden />
            <p>Cargando la Red…</p>
          </div>
        ) : error ? (
          <div className={styles.estado}>
            <p className={styles.errorTxt}>No se pudo cargar la Red.</p>
            <button type="button" onClick={() => cargar()} className={styles.reintentar}>
              Reintentar
            </button>
          </div>
        ) : miembros.length === 0 ? (
          <div className={styles.estado}>
            <Globe2 size={22} className={styles.vacioIcon} aria-hidden />
            {hayFiltros ? (
              <>
                <p className={styles.vacioTitle}>Todavía no hay miembros aquí</p>
                <p className={styles.vacioTxt}>
                  Prueba con otro país o ciudad. La Red crece cada semana.
                </p>
                <button type="button" onClick={limpiar} className={styles.reintentar}>
                  Ver toda la Red
                </button>
              </>
            ) : (
              <>
                <p className={styles.vacioTitle}>La Red está empezando a dibujarse</p>
                <p className={styles.vacioTxt}>
                  Aún nadie ha compartido su ciudad. Completa la tuya en tu perfil y sé
                  el primero en aparecer.
                </p>
                <Link href="/miembros/perfil" className={styles.reintentar}>
                  Completar mi ubicación
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <ul className={styles.grid}>
              {miembros.map((m) => (
                <li key={m.id} className={styles.card}>
                  <Link
                    href={`/miembros/u/${m.id}`}
                    className={styles.cardMain}
                    onClick={(e) => abrirEnSpa(e, "user", { userId: m.id })}
                  >
                    {/* El aura del grado envuelve la foto también aquí: en el
                        listado se reconoce a alguien por el color antes que
                        por el texto. */}
                    <span
                      className={styles.cardAvatarWrap}
                      style={auraDe(m) ? {
                        boxShadow: `0 0 0 2px ${auraDe(m)!.color2}, 0 0 14px ${auraDe(m)!.color}99`,
                      } : undefined}
                    >
                      <Avatar
                        className={styles.cardAvatar}
                        author={{
                          user_id: m.id,
                          author_name: m.full_name,
                          author_username: m.username,
                          author_avatar: iniciales(m.full_name),
                          author_avatar_url: m.avatar_url,
                        }}
                      />
                      {/* La insignia destacada, colgada del retrato: es lo que
                          identifica a alguien de un vistazo en el listado. */}
                      {(() => {
                        const ach = m.badge_id ? getAchievementById(m.badge_id) : undefined
                        if (!ach) return null
                        return (
                          <span
                            className={styles.cardBadge}
                            title={ach.name}
                            aria-hidden
                            dangerouslySetInnerHTML={{ __html: getAchievementSvg(ach.id) }}
                          />
                        )
                      })()}
                    </span>
                    <span className={styles.cardInfo}>
                      <span className={styles.cardName}>{m.full_name}</span>
                      {m.username && <span className={styles.cardUser}>@{m.username}</span>}
                      {/* Sin ubicación compartida no se pinta la línea: un
                          icono de lugar sin lugar parece un dato que falta. */}
                      {m.location_label && (
                        <span className={styles.cardLoc}>
                          <MapPin size={11} aria-hidden />
                          {m.location_label}
                        </span>
                      )}
                      {/* Dónde va cada quien en el Camino, o su distinción.
                          Es lo que cuenta de un miembro a primera vista. */}
                      {(() => {
                        const a = auraDe(m)
                        const ach = m.badge_id ? getAchievementById(m.badge_id) : undefined
                        if (!a || !ach) return null
                        return (
                          <span className={styles.cardGrado} style={{ color: a.color2, borderColor: `${a.color}66` }}>
                            {ach.name}
                          </span>
                        )
                      })()}
                      {m.roles.length > 0 && (
                        <span className={styles.cardRoles}>
                          {m.roles.filter((r) => ROL_CORTO[r]).map((r) => (
                            <span key={r} className={styles.rol}>{ROL_CORTO[r]}</span>
                          ))}
                        </span>
                      )}
                    </span>
                  </Link>

                  {!m.is_self && (
                    <Link
                      href={`/miembros/mensajes/${m.id}`}
                      className={styles.msgBtn}
                      onClick={(e) => abrirEnSpa(e, "messages", { withUserId: m.id })}
                      aria-label={`Escribir a ${m.full_name}`}
                    >
                      <MessageCircle size={14} aria-hidden />
                      <span>Mensaje</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {cursor && (
              <div className={styles.masWrap}>
                <button
                  type="button"
                  onClick={() => cargar({ append: true, cursor })}
                  disabled={cargandoMas}
                  className={styles.mas}
                >
                  {cargandoMas ? "Cargando…" : "Ver más miembros"}
                </button>
              </div>
            )}
          </>
        )}
        </>
        )}
      </main>
    </div>
  )
}

// ── Memoria de la vista ────────────────────────────────────────────────────
// Ya NO se recuerda la pestaña: La Red entra siempre por Pulso. Solo se
// conserva el filtro de emblema, que sí es una elección que molesta repetir.
//
// sessionStorage puede lanzar (ventana privada, cookies bloqueadas) o venir
// vacío. Todo acceso va envuelto: la vista tiene que funcionar igual sin él.
const MEMORIA = "red:vista"
type Memoria = { emblema: string }

function leerMemoria(): Memoria {
  const vacia: Memoria = { emblema: "" }
  if (typeof window === "undefined") return vacia
  try {
    const crudo = window.sessionStorage.getItem(MEMORIA)
    if (!crudo) return vacia
    const m = JSON.parse(crudo) as Partial<Memoria>
    return { emblema: typeof m.emblema === "string" ? m.emblema : "" }
  } catch { return vacia }
}

function guardarMemoria(m: Memoria) {
  try { window.sessionStorage.setItem(MEMORIA, JSON.stringify(m)) } catch { /* noop */ }
}
