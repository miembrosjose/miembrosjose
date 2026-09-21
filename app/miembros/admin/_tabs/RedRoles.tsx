"use client"

// ROLES DE LA RED — Embajadores Galácticos y funciones de la Red.
//
// DOS COSAS DISTINTAS, Y CONVIENE NO MEZCLARLAS
//   · El EMBAJADOR GALÁCTICO es una INSIGNIA. Se ve: tiñe el aura de esa
//     persona en el mapa y en su perfil. Vive en user_unlocked_achievements.
//   · Las FUNCIONES (Organizador, Facilitador…) son PERMISOS. No se ven, se
//     ejercen: abren herramientas. Viven en network_role_assignments y las
//     comprueba la RLS de la base de datos, no el navegador.
//
//   Antes ambas salían como pastillas iguales en la misma fila y, como existe
//   además la función «Embajador de 144 mil», la palabra Embajador aparecía
//   dos veces sin forma de saber cuál era cuál. Aquí van separadas, con
//   nombres completos y un estado marcado que se lee de un vistazo.

import { useCallback, useEffect, useState } from "react"
import { Search, Loader2, Check, Plus, X, Users, Globe2, ChevronDown } from "lucide-react"
import { getAchievementById } from "@/lib/achievements"
import { getAchievementSvg } from "@/lib/achievement-svg"
import { AdminCard, AdminEmptyState, inputCls, labelCls } from "./_shared"
import { SolicitudesRed } from "./SolicitudesRed"

type RolCode = "organizador" | "cartografo" | "colaborador" | "instructor"

const ROLES: Array<{ code: RolCode; nombre: string; que_hace: string; estado: string; activo: boolean }> = [
  {
    code: "organizador",
    nombre: "Organizador de Encuentros",
    que_hace: "Convoca encuentros presenciales en su ciudad y gestiona quién asiste.",
    estado: "Activo — la base de datos ya lo exige para crear encuentros",
    activo: true,
  },
  // La función «embajador» del catálogo NO se ofrece aquí: es la misma figura
  // que la insignia Embajador Galáctico de arriba, y tenerlas por separado
  // ponía dos etiquetas casi idénticas sobre la misma persona. La fila sigue
  // en la base de datos por si algún día se separan; simplemente no se concede.
  {
    code: "colaborador",
    nombre: "Colaborador",
    que_hace: "Aporta investigación, material o apoyo para el Archivo.",
    estado: "Abierta — se puede solicitar desde Los Objetivos",
    activo: true,
  },
  {
    code: "instructor",
    nombre: "Instructor de Los 144.000",
    que_hace: "Conduce la formación de un grupo de contacto durante los dieciséis encuentros del Umbral.",
    estado: "Abierta — se puede solicitar desde Los Objetivos",
    activo: true,
  },
  {
    code: "cartografo",
    nombre: "Cartógrafo",
    que_hace: "Propone y documenta lugares para el Mapa Cósmico.",
    estado: "Abierta — se puede solicitar desde Los Objetivos",
    activo: true,
  },
]

const EMBAJADOR_ID = "embajador_galactico"

type Miembro = {
  id: string
  full_name: string
  username: string | null
  avatar_url: string | null
  email: string | null
  location_label: string
  country_code: string | null
  en_directorio: boolean
  visible_en_mapa: boolean
  roles: string[]
  es_embajador: boolean
}

type MiembroDeRol = {
  user_id: string
  full_name: string
  username: string | null
  avatar_url: string | null
  country: string | null
}

type Embajador = {
  user_id: string
  full_name: string
  country: string | null
  avatar_url: string | null
}

export function RedRoles() {
  const [conteos, setConteos] = useState<Record<string, number>>({})
  const [embajadores, setEmbajadores] = useState<Embajador[]>([])

  const [busqueda, setBusqueda] = useState("")
  const [resultados, setResultados] = useState<Miembro[]>([])
  const [buscando, setBuscando] = useState(false)

  const [guardando, setGuardando] = useState<string | null>(null)
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)

  // Rol abierto para gestionar, con su gente dentro.
  const [rolAbierto, setRolAbierto] = useState<RolCode | null>(null)
  const [gente, setGente] = useState<MiembroDeRol[]>([])
  const [cargandoGente, setCargandoGente] = useState(false)

  const insignia = getAchievementById(EMBAJADOR_ID)

  // ── Carga ───────────────────────────────────────────────────────────────
  const cargarConteos = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/red/roles", { credentials: "include" })
      if (!r.ok) return
      const d = await r.json()
      setConteos(d.counts || {})
    } catch { /* el recuento es accesorio */ }
  }, [])

  const cargarEmbajadores = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/red/embajador", { credentials: "include" })
      if (!r.ok) return
      const d = await r.json()
      setEmbajadores(d.embajadores || [])
    } catch { /* accesorio */ }
  }, [])

  useEffect(() => { cargarConteos(); cargarEmbajadores() }, [cargarConteos, cargarEmbajadores])

  const cargarGente = useCallback(async (code: RolCode) => {
    setCargandoGente(true)
    try {
      const r = await fetch(`/api/admin/red/roles?role=${code}`, { credentials: "include" })
      if (!r.ok) throw new Error("listar")
      const d = await r.json()
      setGente(d.members || [])
    } catch {
      setGente([])
    } finally {
      setCargandoGente(false)
    }
  }, [])

  const alternarRol = useCallback((code: RolCode) => {
    if (rolAbierto === code) { setRolAbierto(null); setGente([]); return }
    setRolAbierto(code)
    setGente([])
    cargarGente(code)
  }, [rolAbierto, cargarGente])

  // ── Búsqueda ────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = busqueda.trim()
    if (q.length < 2) { setResultados([]); return }
    let vivo = true
    setBuscando(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/red/buscar?q=${encodeURIComponent(q)}`, { credentials: "include" })
        if (!r.ok) throw new Error("buscar")
        const d = await r.json()
        if (vivo) setResultados(d.miembros || [])
      } catch {
        if (vivo) setResultados([])
      } finally {
        if (vivo) setBuscando(false)
      }
    }, 300)
    return () => { vivo = false; clearTimeout(t) }
  }, [busqueda])

  // ── Conceder y retirar ──────────────────────────────────────────────────
  const cambiarRol = useCallback(
    async (userId: string, nombre: string, role: RolCode, action: "grant" | "revoke") => {
      setGuardando(`${userId}:${role}`)
      setAviso(null)
      try {
        const r = await fetch("/api/admin/red/roles", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, role, action }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d?.error || "No se pudo actualizar")

        // Se usa la lista que devuelve el servidor, no una suposición local.
        setResultados((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, roles: d.roles || [] } : m)),
        )
        const rol = ROLES.find((x) => x.code === role)
        setAviso({
          tipo: "ok",
          texto: action === "grant"
            ? `${nombre} ya puede ejercer como ${rol?.nombre ?? role}.`
            : `Se retiró la función de ${rol?.nombre ?? role} a ${nombre}.`,
        })
        cargarConteos()
        if (rolAbierto === role) cargarGente(role)
      } catch (e) {
        setAviso({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo actualizar" })
      } finally {
        setGuardando(null)
      }
    },
    [cargarConteos, rolAbierto, cargarGente],
  )

  const cambiarEmbajador = useCallback(
    async (userId: string, nombre: string, conceder: boolean) => {
      setGuardando(`${userId}:emb`)
      setAviso(null)
      try {
        const r = await fetch("/api/admin/red/embajador", {
          method: conceder ? "POST" : "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d?.error || "No se pudo actualizar")

        setResultados((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, es_embajador: conceder } : m)),
        )
        setAviso({
          tipo: "ok",
          texto: conceder
            ? `${nombre} es Embajador Galáctico. Se le destacó la insignia para que se vea en el mapa.`
            : `Se retiró el Embajador Galáctico a ${nombre}.`,
        })
        cargarEmbajadores()
      } catch (e) {
        setAviso({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo actualizar" })
      } finally {
        setGuardando(null)
      }
    },
    [cargarEmbajadores],
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Lo primero: si hay gente esperando respuesta, se atiende antes que nada. */}
      <SolicitudesRed onCambio={() => { cargarConteos(); if (rolAbierto) cargarGente(rolAbierto) }} />

      {aviso && (
        <p
          role="status"
          className={`border px-4 py-3 text-xs [font-family:var(--font-geist-sans)] ${
            aviso.tipo === "ok"
              ? "border-emerald-700/40 bg-emerald-950/20 text-emerald-300"
              : "border-red-900/40 bg-red-950/20 text-red-300"
          }`}
        >
          {aviso.texto}
        </p>
      )}

      {/* ── Embajadores Galácticos ─────────────────────────────────────── */}
      <AdminCard
        title="Embajadores Galácticos · insignia"
        description="Representan a la Red en su país. No se desbloquea avanzando: la concedes tú. Se ve — tiñe su aura en el mapa y en su perfil."
        accent="gold"
      >
        {embajadores.length === 0 ? (
          <AdminEmptyState
            icon={<Globe2 size={22} />}
            title="Todavía no hay embajadores"
            description="Búscalos abajo y concédeles la insignia."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {embajadores.map((e) => (
              <div key={e.user_id} className="flex items-center gap-3 border border-[#3b82f6]/35 bg-[#3b82f6]/5 p-3">
                {insignia && (
                  <span className="h-9 w-9 shrink-0" aria-hidden dangerouslySetInnerHTML={{ __html: getAchievementSvg(insignia.id) }} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
                    {e.full_name}
                  </p>
                  <p className="truncate text-xs text-[#7ee8fa] [font-family:var(--font-geist-sans)]">
                    {e.country || "Sin país declarado"}
                  </p>
                </div>
                {/* Se retira desde aquí mismo: antes había que volver a buscar
                    a la persona en el buscador de abajo. */}
                <button
                  type="button"
                  disabled={guardando === `${e.user_id}:emb`}
                  onClick={() => cambiarEmbajador(e.user_id, e.full_name, false)}
                  aria-label={`Retirar Embajador Galáctico a ${e.full_name}`}
                  title="Retirar"
                  className="shrink-0 border border-[#2a2a36] p-1.5 text-[#6a6a7a] transition-colors hover:border-red-900 hover:text-red-300 disabled:cursor-wait disabled:opacity-60"
                >
                  {guardando === `${e.user_id}:emb`
                    ? <Loader2 size={13} className="animate-spin" />
                    : <X size={13} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* ── Funciones ──────────────────────────────────────────────────── */}
      <AdminCard
        title="Funciones de la Red · permisos"
        description="Tareas con herramientas propias, no rangos. Pulsa una para ver y gestionar quién la sostiene."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((rol) => {
            const abierto = rolAbierto === rol.code
            const n = conteos[rol.code] ?? 0
            return (
              <div
                key={rol.code}
                className={`border transition-colors ${
                  abierto ? "border-[#6D4A9B] bg-[#6D4A9B]/10 sm:col-span-2" : "border-[#1a1a24] bg-[#000000]/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => alternarRol(rol.code)}
                  aria-expanded={abierto}
                  className="flex w-full items-start gap-3 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
                      {rol.nombre}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#8b90b4] [font-family:var(--font-geist-sans)]">
                      {rol.que_hace}
                    </p>
                    <p
                      className={`mt-1.5 text-[10px] uppercase tracking-[0.14em] [font-family:var(--font-geist-sans)] ${
                        rol.activo ? "text-emerald-400/80" : "text-[#6a6a7a]"
                      }`}
                    >
                      {rol.estado}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#6D4A9B]">{n}</span>
                    <ChevronDown
                      size={14}
                      className={`text-[#6a6a7a] transition-transform ${abierto ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </span>
                </button>

                {abierto && (
                  <div className="border-t border-[#1a1a24] px-4 py-3">
                    {cargandoGente ? (
                      <p className="flex items-center gap-2 text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                        <Loader2 size={13} className="animate-spin" /> Cargando…
                      </p>
                    ) : gente.length === 0 ? (
                      <p className="text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                        Nadie sostiene esta función. Búscalo abajo para concedérsela.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {gente.map((g) => (
                          <li key={g.user_id} className="flex items-center gap-3">
                            <Retrato url={g.avatar_url} nombre={g.full_name} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
                                {g.full_name}
                              </p>
                              <p className="truncate text-[11px] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                                {g.username ? `@${g.username}` : ""}
                                {g.username && g.country ? " · " : ""}
                                {g.country || ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={guardando === `${g.user_id}:${rol.code}`}
                              onClick={() => cambiarRol(g.user_id, g.full_name, rol.code, "revoke")}
                              aria-label={`Retirar ${rol.nombre} a ${g.full_name}`}
                              title="Retirar"
                              className="shrink-0 border border-[#2a2a36] p-1.5 text-[#6a6a7a] transition-colors hover:border-red-900 hover:text-red-300 disabled:cursor-wait disabled:opacity-60"
                            >
                              {guardando === `${g.user_id}:${rol.code}`
                                ? <Loader2 size={12} className="animate-spin" />
                                : <X size={12} />}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </AdminCard>

      {/* ── Buscador ───────────────────────────────────────────────────── */}
      <AdminCard
        title="Conceder o retirar"
        description="Busca por nombre, usuario o correo. Alcanza a toda la plataforma, incluso a quien todavía no publicó su ciudad."
      >
        <label htmlFor="buscar-miembro" className={labelCls}>Miembro</label>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a7a]" aria-hidden />
          <input
            id="buscar-miembro"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, @usuario o correo…"
            className={`${inputCls} pl-10`}
            autoComplete="off"
          />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {buscando && (
            <p className="flex items-center gap-2 text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              <Loader2 size={13} className="animate-spin" /> Buscando…
            </p>
          )}

          {!buscando && busqueda.trim().length >= 2 && resultados.length === 0 && (
            <AdminEmptyState
              icon={<Users size={22} />}
              title="Sin resultados"
              description="Nadie coincide con esa búsqueda. Prueba con el correo de la cuenta."
            />
          )}

          {resultados.map((m) => (
            <div key={m.id} className="border border-[#1a1a24] bg-[#0f0f17]/60 p-4">
              <div className="flex items-center gap-3">
                <Retrato url={m.avatar_url} nombre={m.full_name} grande />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
                    {m.full_name}
                  </p>
                  <p className="truncate text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                    {m.username ? `@${m.username} · ` : ""}{m.email || m.location_label}
                  </p>
                  {!m.visible_en_mapa && (
                    <p className="truncate text-[10px] text-[#b08456] [font-family:var(--font-geist-sans)]">
                      {m.en_directorio
                        ? "No aparece en el mapa: tiene su ciudad oculta"
                        : "No aparece en el mapa: sin ubicación declarada"}
                    </p>
                  )}
                </div>
              </div>

              {/* La insignia va en su propia fila, con su nombre completo: es
                  otra cosa que las funciones y no debe confundirse con la
                  función «Embajador de 144 mil» que aparece más abajo. */}
              <div className="mt-3 border-t border-[#1a1a24] pt-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                  Insignia
                </p>
                <Pastilla
                  puesto={m.es_embajador}
                  ocupado={guardando === `${m.id}:emb`}
                  onClick={() => cambiarEmbajador(m.id, m.full_name, !m.es_embajador)}
                  color="#7ee8fa"
                  titulo={m.es_embajador ? "Retirar la insignia de Embajador Galáctico" : "Conceder la insignia de Embajador Galáctico"}
                >
                  Embajador Galáctico
                </Pastilla>
              </div>

              <div className="mt-3 border-t border-[#1a1a24] pt-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                  Funciones
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((rol) => {
                    const puesto = m.roles.includes(rol.code)
                    return (
                      <Pastilla
                        key={rol.code}
                        puesto={puesto}
                        ocupado={guardando === `${m.id}:${rol.code}`}
                        onClick={() => cambiarRol(m.id, m.full_name, rol.code, puesto ? "revoke" : "grant")}
                        color="#c4a8ff"
                        titulo={`${puesto ? "Retirar" : "Conceder"}: ${rol.que_hace}`}
                      >
                        {rol.nombre}
                      </Pastilla>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  )
}

/**
 * Pastilla con estado visible: un tilde cuando está puesta, un más cuando no.
 * Antes solo cambiaba el color del borde y no se distinguía cuál estaba activa.
 */
function Pastilla({
  children, puesto, ocupado, onClick, color, titulo,
}: {
  children: React.ReactNode
  puesto: boolean
  ocupado: boolean
  onClick: () => void
  color: string
  titulo: string
}) {
  return (
    <button
      type="button"
      disabled={ocupado}
      onClick={onClick}
      title={titulo}
      aria-pressed={puesto}
      className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
      style={
        puesto
          ? { borderColor: color, background: `${color}22`, color }
          : { borderColor: "#2a2a36", background: "transparent", color: "#8b90b4" }
      }
    >
      {ocupado ? <Loader2 size={11} className="animate-spin" /> : puesto ? <Check size={11} /> : <Plus size={11} />}
      {children}
    </button>
  )
}

function Retrato({ url, nombre, grande }: { url: string | null; nombre: string; grande?: boolean }) {
  const tam = grande ? "h-10 w-10" : "h-8 w-8"
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={`${tam} shrink-0 rounded-full object-cover`} />
  }
  return (
    <span className={`${tam} flex shrink-0 items-center justify-center rounded-full border border-[#2a2a36] text-xs text-[#8b90b4]`}>
      {nombre.slice(0, 1).toUpperCase()}
    </span>
  )
}
