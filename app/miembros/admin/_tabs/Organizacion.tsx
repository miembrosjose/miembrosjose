"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  CENTRO DE ORGANIZACIÓN · la semana y el mes
// ═══════════════════════════════════════════════════════════════════════════
//
// ── PARA QUÉ EXISTE ESTA PANTALLA ──────────────────────────────────────────
// Para sentarse los dos una vez por semana, abrirla, y saber en diez segundos
// qué hay que hacer, qué se hizo y qué se atrasó. No es un gestor de
// proyectos: es la hoja que se mira en la reunión.
//
// ── POR QUÉ EL CHECKLIST NO ES OTRA LISTA ──────────────────────────────────
// «El checklist de esta semana» son las actividades cuya fecha cae en esta
// semana. No hay dos sitios donde anotar lo mismo, así que no pueden
// contradecirse: reprogramar una actividad la mueve de semana sola.
//
// ── Y POR QUÉ «ATRASADA» NO SE GUARDA ──────────────────────────────────────
// Se deduce: pendiente y con la fecha pasada. Guardarlo exigiría un proceso
// que fuera marcando cada noche, y el día que ese proceso fallara la pantalla
// diría que todo va bien.

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertTriangle, Calendar, Check, CheckSquare, ChevronLeft, ChevronRight,
  LayoutGrid, List as ListIcon, Loader2, Mail, MessageSquare, Plus, Trash2, X,
} from "lucide-react"
import { inputCls, labelCls } from "./_shared"
import { OrganizacionGuiones } from "./OrganizacionGuiones"
import { OrganizacionPlan, OrganizacionResultados } from "./OrganizacionPlan"

// ── Vocabulario ────────────────────────────────────────────────────────────
// Duplicado del servidor a propósito: importar lib/marketing arrastraría al
// navegador el cliente de Supabase. Son dos listas de etiquetas, y quien
// valida sigue siendo el servidor.

type Categoria =
  | "reel" | "carrusel" | "historias" | "guion" | "contenido_miembros"
  | "correo" | "notificacion" | "comunidad" | "transmision" | "protocolo"
  | "reunion" | "resultados" | "efemeride" | "otra"

/**
 * Las categorías, agrupadas como se habla de ellas en la reunión.
 *
 * El orden importa: el checklist de la semana sale en este orden, y es el
 * mismo en el que uno va preguntando «¿y las publicaciones?, ¿y los guiones?».
 */
const GRUPOS: Array<{ titulo: string; cats: Categoria[] }> = [
  { titulo: "Publicaciones", cats: ["reel", "carrusel", "historias"] },
  { titulo: "Guiones", cats: ["guion"] },
  { titulo: "Área de miembros", cats: ["contenido_miembros", "comunidad"] },
  { titulo: "Experiencias en vivo", cats: ["transmision", "protocolo"] },
  { titulo: "Comunicación", cats: ["correo", "notificacion"] },
  { titulo: "Gestión", cats: ["reunion", "resultados", "otra"] },
]

const ETIQUETA: Record<Categoria, string> = {
  reel: "Reel", carrusel: "Carrusel", historias: "Historias",
  guion: "Guion", contenido_miembros: "Contenido de miembros",
  correo: "Correo", notificacion: "Notificación", comunidad: "Comunidad",
  transmision: "Transmisión", protocolo: "Protocolo de contacto",
  reunion: "Reunión", resultados: "Resultados", efemeride: "Efeméride",
  otra: "Otra",
}

/** Un color por grupo, discreto. El violeta de la casa manda. */
const COLOR: Record<Categoria, string> = {
  reel: "#8d6bc4", carrusel: "#8d6bc4", historias: "#8d6bc4",
  guion: "#c9a86b",
  contenido_miembros: "#5fa8d3", comunidad: "#5fa8d3",
  transmision: "#d98080", protocolo: "#d98080",
  correo: "#7ec8a0", notificacion: "#7ec8a0",
  reunion: "#8a8fa8", resultados: "#8a8fa8", otra: "#8a8fa8",
  efemeride: "#5a5a6a",
}

type Actividad = {
  id: string
  titulo: string
  categoria: Categoria
  ambito: "publico" | "miembros" | "interno"
  eje: string | null
  campana: string
  fecha: string
  fecha_entrega: string | null
  estado: "pendiente" | "en_curso" | "hecha" | "cancelada"
  responsable_id: string | null
  notas: string
  enlaces: Array<{ titulo: string; url: string }>
  checklist: Array<{ texto: string; hecha: boolean }>
  es_referencia: boolean
}

type Miembro = { id: string; nombre: string }

type Modo = "lista" | "calendario"

/**
 * Una actividad que el generador del plan creó y nadie ha tocado todavía.
 *
 * ── POR QUÉ SE MIRAN SEIS COSAS Y NO SOLO EL TÍTULO ──────────────────────
 * Porque el atajo «borrar las sin definir» tiene que ser seguro de pulsar
 * sin leer la lista antes. Si bastara con el título, bastaría también con
 * que alguien hubiese escrito las notas o asignado a una persona —trabajo
 * de verdad— para que eso desapareciera sin aviso. En cuanto hay una sola
 * señal de que alguien pasó por ahí, deja de contar como vacía.
 */
function sinDefinir(a: Actividad): boolean {
  return (
    a.titulo.trim() === "Por definir" &&
    a.estado === "pendiente" &&
    !a.responsable_id &&
    !a.notas.trim() &&
    a.checklist.length === 0 &&
    a.enlaces.length === 0
  )
}

// ── Fechas, sin librería ───────────────────────────────────────────────────
//
// ── POR QUÉ TODO VA EN TEXTO «AAAA-MM-DD» ─────────────────────────────────
// Porque una actividad ocurre un DÍA, no un instante. En cuanto se mete un
// `Date` de por medio aparece la zona horaria, y una actividad del día 1
// guardada a medianoche se ve como del 31 en media España. El texto no tiene
// ese problema: el día 1 es el día 1 en todas partes.

function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function sumarDias(iso: string, n: number): string {
  const [a, m, d] = iso.split("-").map(Number)
  const f = new Date(Date.UTC(a, m - 1, d + n))
  return f.toISOString().slice(0, 10)
}

/** El lunes de la semana a la que pertenece esa fecha. */
function lunesDe(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number)
  const f = new Date(Date.UTC(a, m - 1, d))
  // getUTCDay: 0 es domingo. Aquí la semana empieza en lunes.
  const desplazamiento = (f.getUTCDay() + 6) % 7
  return sumarDias(iso, -desplazamiento)
}

function dia(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-419", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  })
}

function mesLargo(iso: string): string {
  const [a, m] = iso.split("-").map(Number)
  return new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString("es-419", {
    month: "long", year: "numeric", timeZone: "UTC",
  })
}

// ═══════════════════════════════════════════════════════════════════════════

export function Organizacion() {
  const [vista, setVista] = useState<
    "semana" | "mes" | "guiones" | "resultados" | "plan"
  >("semana")
  const [esPropietario, setEsPropietario] = useState(false)
  // Cuántos esperan revisión. Se pide aparte y en segundo plano: es un
  // número de la cabecera, no debe retrasar el calendario si tarda.
  const [porAprobar, setPorAprobar] = useState<number | null>(null)
  // El ancla: el lunes de la semana que se mira, o el día 1 del mes.
  const [ancla, setAncla] = useState(() => lunesDe(hoyISO()))

  const [actividades, setActividades] = useState<Actividad[]>([])
  const [equipo, setEquipo] = useState<Miembro[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState<Actividad | "nueva" | null>(null)

  // ── BORRAR VARIAS ─────────────────────────────────────────────────────
  // El modo existe porque la casilla de la izquierda ya significa «hecha».
  // Poner una segunda casilla al lado para «seleccionada» es la clase de
  // pantalla en la que se acaba marcando lo que no era. Mientras se
  // selecciona, la casilla cambia de significado y no hay dos cosas que
  // marcar a la vez.
  // ── LISTA O CALENDARIO ────────────────────────────────────────────────
  // Se recuerda por separado para cada vista porque se usan para cosas
  // distintas: la semana se trabaja en lista —marcar, repartir, borrar— y
  // el mes se mira en rejilla para ver cómo queda repartido. Un solo ajuste
  // compartido obligaría a cambiarlo cada vez que se salta de una a otra.
  const [modos, setModos] = useState<{ semana: Modo; mes: Modo }>({
    semana: "lista",
    mes: "calendario",
  })
  const modo: Modo = vista === "mes" ? modos.mes : modos.semana

  const [seleccionando, setSeleccionando] = useState(false)
  const [marcadas, setMarcadas] = useState<string[]>([])
  const [borrando, setBorrando] = useState(false)

  const [desde, hasta] = useMemo(() => {
    if (vista === "semana") return [ancla, sumarDias(ancla, 6)]
    const [a, m] = ancla.split("-").map(Number)
    const primero = `${a}-${String(m).padStart(2, "0")}-01`
    const ultimo = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10)
    return [primero, ultimo]
  }, [vista, ancla])

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await fetch(
        `/api/admin/marketing/actividades?desde=${desde}&hasta=${hasta}`,
        { credentials: "include" },
      )
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo cargar")
      setActividades(j.actividades || [])
      setEquipo(j.equipo || [])
      setEsPropietario(j.esPropietario === true)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar")
    } finally {
      setCargando(false)
    }
  }, [desde, hasta])

  useEffect(() => { void cargar() }, [cargar])

  // Al cambiar de semana o de vista se suelta lo marcado. Si no, se puede
  // acabar borrando lo de la semana pasada con la de esta en pantalla: el
  // servidor obedecería, porque los identificadores siguen siendo válidos.
  useEffect(() => { setMarcadas([]); setSeleccionando(false) }, [desde, hasta, vista])

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/admin/marketing/guiones?estado=revision", { credentials: "include" })
        if (!r.ok) return   // sin la tabla todavía: la cifra se queda sin enseñar
        const j = await r.json()
        setPorAprobar((j.guiones || []).length)
      } catch { /* el calendario funciona igual */ }
    })()
  }, [vista])

  // ── EL CUMPLIMIENTO ─────────────────────────────────────────────────────
  // Las referencias no cuentan: una luna llena no es una tarea que nadie
  // tenga que completar, y meterla en el reparto bajaría el porcentaje por
  // algo que no se puede hacer. Lo cancelado tampoco: dejó de pedirse.
  const cifras = useMemo(() => {
    const reales = actividades.filter((a) => !a.es_referencia && a.estado !== "cancelada")
    const hechas = reales.filter((a) => a.estado === "hecha").length
    const hoy = hoyISO()
    const atrasadas = reales.filter((a) => a.estado !== "hecha" && a.fecha < hoy).length
    return {
      total: reales.length,
      hechas,
      pendientes: reales.length - hechas,
      atrasadas,
      pct: reales.length ? Math.round((hechas / reales.length) * 100) : null,
    }
  }, [actividades])

  const mover = (n: number) => {
    if (vista === "semana") { setAncla(sumarDias(ancla, n * 7)); return }
    const [a, m] = ancla.split("-").map(Number)
    const f = new Date(Date.UTC(a, m - 1 + n, 1))
    setAncla(f.toISOString().slice(0, 10))
  }

  // Lo que se puede marcar son las tareas. Las efemérides van en su propia
  // tira arriba y no son trabajo de nadie, así que «todas» no se las lleva.
  const tareas = useMemo(() => actividades.filter((a) => !a.es_referencia), [actividades])
  const vacias = useMemo(() => tareas.filter(sinDefinir), [tareas])

  const alternar = (id: string) =>
    setMarcadas((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))

  const borrar = async (ids: string[], queSon: string) => {
    if (ids.length === 0) return
    if (!window.confirm(`¿Borrar ${ids.length === 1 ? "" : ids.length + " "}${queSon}?\n\nNo se puede deshacer.`)) return

    setBorrando(true)
    try {
      const r = await fetch("/api/admin/marketing/actividades", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo borrar")

      // Se quitan de la pantalla sin volver a pedir la lista: ya sabemos
      // cuáles eran, y recargarla entera para quitar tres filas parpadea.
      const fuera = new Set(ids)
      setActividades((v) => v.filter((a) => !fuera.has(a.id)))
      setMarcadas((v) => v.filter((x) => !fuera.has(x)))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar")
      void cargar()
    } finally {
      setBorrando(false)
    }
  }

  const cambiar = async (id: string, cambios: Partial<Actividad>) => {
    // Se pinta ya y se guarda después: marcar una casilla y esperar medio
    // segundo a que responda el servidor hace que la reunión se atasque.
    setActividades((v) => v.map((a) => (a.id === id ? { ...a, ...cambios } : a)))
    try {
      const r = await fetch(`/api/admin/marketing/actividades/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      })
      if (!r.ok) throw new Error()
    } catch {
      // No se guardó: se vuelve a leer para no dejar la pantalla diciendo
      // algo que la base no sabe.
      void cargar()
      setError("No se pudo guardar ese cambio.")
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#F3F6FA] [font-family:var(--font-cinzel,serif)]">
            Organización
          </h2>
          <p className="mt-1 max-w-lg text-sm text-[#8a8fa8]">
            Qué hay que hacer, cuándo, y si se hizo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditando("nueva")}
          className="inline-flex shrink-0 items-center justify-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30"
        >
          <Plus size={14} /> Nueva actividad
        </button>
      </header>

      {/* ── LAS CUATRO CIFRAS ─────────────────────────────────────────────
          Lo primero que se mira al abrir, y lo único que hace falta saber
          antes de entrar en detalle. */}
      {/* Las cifras son del calendario. En resultados y en plan no
          significan nada, y una cifra que no viene a cuento se acaba
          leyendo mal. */}
      {(vista === "semana" || vista === "mes") && (
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cifra valor={cifras.pct === null ? "—" : `${cifras.pct}%`} etiqueta="cumplimiento" destacada />
        <Cifra valor={String(cifras.hechas)} etiqueta="completadas" />
        <Cifra valor={String(cifras.pendientes)} etiqueta="pendientes" />
        <Cifra
          valor={String(cifras.atrasadas)}
          etiqueta="atrasadas"
          alerta={cifras.atrasadas > 0}
        />
      </section>
      )}

      {/* La pregunta que trae al dueño a esta pantalla. Solo asoma cuando
          hay algo esperando: un cero permanente deja de leerse. */}
      {porAprobar !== null && porAprobar > 0 && vista !== "guiones" && (
        <button
          type="button"
          onClick={() => setVista("guiones")}
          className="flex w-full items-center gap-3 border border-[#3a2a5a] bg-[#1a1228]/60 p-4 text-left transition-colors hover:bg-[#1a1228]"
        >
          <MessageSquare size={16} className="shrink-0 text-[#c3b2e0]" />
          <span className="text-sm text-[#d7c9ee]">
            <strong>{porAprobar}</strong>{" "}
            {porAprobar === 1 ? "guion espera" : "guiones esperan"} tu revisión.
          </span>
        </button>
      )}

      {/* ── NAVEGACIÓN ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#14141e] py-3">
        <div className="flex items-center gap-1">
          {(["semana", "mes", "guiones", "resultados", "plan"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setVista(v)
                // Semana y resultados se anclan al lunes; mes y plan, al dia 1.
                if (v === "semana" || v === "resultados") {
                  setAncla(lunesDe(hoyISO()))
                } else if (v === "mes" || v === "plan") {
                  setAncla(`${hoyISO().slice(0, 7)}-01`)
                }
              }}
              className={`border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                vista === v
                  ? "border-[#6D4A9B] bg-[#6D4A9B]/10 text-[#c3b2e0]"
                  : "border-[#1f1f2c] text-[#7a7a8a] hover:border-[#2f2f42]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {vista !== "guiones" && <div className="flex items-center gap-3">
          <button type="button" onClick={() => mover(-1)} className="text-[#7a7a8a] hover:text-[#F3F6FA]" aria-label="Anterior">
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[11rem] text-center text-sm text-[#F3F6FA]">
            {vista === "semana"
              ? `${dia(desde)} — ${dia(hasta)}`
              : mesLargo(ancla)}
          </span>
          <button type="button" onClick={() => mover(1)} className="text-[#7a7a8a] hover:text-[#F3F6FA]" aria-label="Siguiente">
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => setAncla(vista === "semana" ? lunesDe(hoyISO()) : `${hoyISO().slice(0, 7)}-01`)}
            className="text-[11px] uppercase tracking-[0.15em] text-[#7a7a8a] underline underline-offset-2 hover:text-[#F3F6FA]"
          >
            hoy
          </button>

          {/* Lista o rejilla, para las dos vistas. Antes la semana solo
              existía en lista y el mes solo en rejilla, y eso dejaba fuera
              las dos combinaciones útiles: repasar el mes entero como lista
              —que es donde se puede marcar y borrar de verdad— y ver la
              semana repartida por días. */}
          <div className="ml-2 flex border border-[#1f1f2c]">
            {(["lista", "calendario"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModos((v) => ({ ...v, [vista === "mes" ? "mes" : "semana"]: m }))}
                aria-pressed={modo === m}
                title={m === "lista" ? "Ver como lista" : "Ver como calendario"}
                className={`px-2 py-1.5 transition-colors ${
                  modo === m
                    ? "bg-[#6D4A9B]/25 text-[#c3b2e0]"
                    : "text-[#6a6a7a] hover:text-[#a0a0b0]"
                }`}
              >
                {m === "lista" ? <ListIcon size={14} /> : <LayoutGrid size={14} />}
              </button>
            ))}
          </div>
        </div>}
      </div>

      {/* ── LIMPIAR ───────────────────────────────────────────────────────
          El generador del plan deja la semana llena de «Por definir», y
          hasta ahora quitarlos era abrir cada uno y borrarlo desde dentro:
          tres clics por fila, veinte filas. Borrar ya se podía; lo que no
          había era una forma razonable de llegar a ello. */}
      {(vista === "semana" || vista === "mes") && !cargando && tareas.length > 0 && (
        seleccionando ? (
          <div className="flex flex-wrap items-center gap-2 border border-[#3a2a5a] bg-[#1a1228]/60 px-3 py-2.5">
            <span className="mr-1 text-xs text-[#d7c9ee]">
              <strong>{marcadas.length}</strong>{" "}
              {marcadas.length === 1 ? "marcada" : "marcadas"}
            </span>

            {/* «Todas» son las de la semana o las del mes según dónde estés,
                nunca las del calendario entero. Por eso lo dice. */}
            <Atajo onClick={() => setMarcadas(tareas.map((a) => a.id))}>
              Todas las de {vista === "mes" ? "el mes" : "la semana"} ({tareas.length})
            </Atajo>
            {/* El que de verdad se va a usar, y por eso dice cuántas son
                ANTES de pulsarlo. */}
            {vacias.length > 0 && (
              <Atajo onClick={() => setMarcadas(vacias.map((a) => a.id))}>
                Sin definir ({vacias.length})
              </Atajo>
            )}
            {marcadas.length > 0 && (
              <Atajo onClick={() => setMarcadas([])}>Ninguna</Atajo>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled={marcadas.length === 0 || borrando}
                onClick={() => void borrar(marcadas, marcadas.length === 1 ? "esta actividad" : "actividades")}
                className="inline-flex items-center gap-2 border border-[#4a1f2a] bg-[#1a0d12]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e0a0b0] transition-colors hover:border-red-500/60 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {borrando ? (
                  <><Loader2 size={12} className="animate-spin" /> Borrando…</>
                ) : (
                  <><Trash2 size={12} /> Borrar</>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setSeleccionando(false); setMarcadas([]) }}
                className="text-[11px] uppercase tracking-[0.15em] text-[#7a7a8a] underline underline-offset-2 hover:text-[#F3F6FA]"
              >
                salir
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSeleccionando(true)}
              className="inline-flex items-center gap-2 border border-[#2a2a3a] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#8a8fa8] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0]"
            >
              <CheckSquare size={12} /> Seleccionar para borrar
            </button>
            {/* El atajo de un solo golpe, fuera del modo: es justo lo que se
                hace nada más generar un plan y ver la semana llena. */}
            {vacias.length > 0 && (
              <button
                type="button"
                disabled={borrando}
                onClick={() => void borrar(vacias.map((a) => a.id), "actividades sin definir")}
                className="text-[11px] text-[#7a7a8a] underline underline-offset-2 transition-colors hover:text-[#e0a0b0] disabled:opacity-40"
              >
                borrar las {vacias.length} sin definir de {vista === "mes" ? "este mes" : "esta semana"}
              </button>
            )}
          </div>
        )
      )}

      {error && (
        <div className="flex items-start gap-3 border border-red-900 bg-red-950/20 p-3 text-xs text-red-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {vista === "guiones" ? (
        <OrganizacionGuiones equipo={equipo} />
      ) : vista === "resultados" ? (
        <OrganizacionResultados semana={ancla} />
      ) : vista === "plan" ? (
        <OrganizacionPlan mes={ancla} esPropietario={esPropietario} />
      ) : cargando ? (
        <div className="flex items-center gap-2 py-12 text-sm text-[#7a7a8a]">
          <Loader2 size={15} className="animate-spin" /> Cargando…
        </div>
      ) : modo === "lista" ? (
        <VistaLista
          actividades={actividades}
          equipo={equipo}
          onCambiar={cambiar}
          onAbrir={setEditando}
          seleccionando={seleccionando}
          marcadas={marcadas}
          onAlternar={alternar}
          onBorrarUna={(a) => void borrar([a.id], `«${a.titulo}»`)}
        />
      ) : (
        <VistaCalendario
          desde={desde}
          hasta={hasta}
          actividades={actividades}
          onAbrir={setEditando}
          seleccionando={seleccionando}
          marcadas={marcadas}
          onAlternar={alternar}
          onBorrarUna={(a) => void borrar([a.id], `«${a.titulo}»`)}
        />
      )}

      {editando && (
        <EditorActividad
          actividad={editando === "nueva" ? null : editando}
          equipo={equipo}
          fechaPorDefecto={vista === "semana" ? ancla : desde}
          onCerrar={() => setEditando(null)}
          onGuardado={() => { setEditando(null); void cargar() }}
        />
      )}
    </div>
  )
}

/** Los atajos de la barra de selección. Todos iguales, para que se lean
    como lo que son: formas de marcar, no acciones que hagan nada. */
function Atajo({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-[#2a2a3a] px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-[#8a8fa8] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0]"
    >
      {children}
    </button>
  )
}

function Cifra({ valor, etiqueta, destacada, alerta }: {
  valor: string; etiqueta: string; destacada?: boolean; alerta?: boolean
}) {
  return (
    <div className={`border p-4 ${alerta ? "border-[#3a2a1a] bg-[#1a1208]/40" : "border-[#1a1a24] bg-[#0d0d16]/40"}`}>
      <p className={`text-2xl font-semibold tabular-nums [font-family:var(--font-cinzel,serif)] ${
        alerta ? "text-[#e6cf95]" : destacada ? "text-[#c3b2e0]" : "text-[#F3F6FA]"
      }`}>
        {valor}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-[#6a6a7a]">{etiqueta}</p>
    </div>
  )
}

// ── LA SEMANA ──────────────────────────────────────────────────────────────

// ── LA LISTA ───────────────────────────────────────────────────────────────
//
// Sirve igual para siete días que para un mes: agrupa por bloques de trabajo
// y no por fechas, así que el rango que le llegue no cambia cómo se lee.

function VistaLista({
  actividades, equipo, onCambiar, onAbrir,
  seleccionando, marcadas, onAlternar, onBorrarUna,
}: {
  actividades: Actividad[]
  equipo: Miembro[]
  onCambiar: (id: string, c: Partial<Actividad>) => void
  onAbrir: (a: Actividad) => void
  seleccionando: boolean
  marcadas: string[]
  onAlternar: (id: string) => void
  onBorrarUna: (a: Actividad) => void
}) {
  const hoy = hoyISO()
  const nombre = (id: string | null) =>
    id ? equipo.find((m) => m.id === id)?.nombre ?? "—" : null

  const referencias = actividades.filter((a) => a.es_referencia)

  return (
    <div className="space-y-6">
      {/* Las efemérides arriba y aparte: son el contexto del que se parte al
          planificar, no trabajo pendiente. */}
      {referencias.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border border-[#1a1a24] bg-[#0d0d16]/40 px-4 py-3">
          <Calendar size={13} className="text-[#6a6a7a]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">En estas fechas cae</span>
          {referencias.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onAbrir(r)}
              className="text-xs text-[#8a8fa8] underline underline-offset-2 hover:text-[#c3b2e0]"
            >
              {r.titulo}
            </button>
          ))}
        </div>
      )}

      {GRUPOS.map((g) => {
        const suyas = actividades.filter(
          (a) => !a.es_referencia && g.cats.includes(a.categoria),
        )
        if (suyas.length === 0) return null

        return (
          <section key={g.titulo}>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
              {g.titulo}
            </h3>
            <div className="space-y-1">
              {suyas.map((a) => {
                const hecha = a.estado === "hecha"
                const atrasada = !hecha && a.estado !== "cancelada" && a.fecha < hoy
                const marcada = marcadas.includes(a.id)
                return (
                  <div
                    key={a.id}
                    className={`group flex items-start gap-3 border px-3 py-2.5 transition-colors ${
                      marcada
                        ? "border-[#6D4A9B] bg-[#1a1228]/60"
                        : "border-[#14141e] bg-[#0d0d16]/40 hover:border-[#2a2a3a]"
                    }`}
                  >
                    {/* La misma casilla, dos significados según el modo.
                        Marcar «hecha» es lo que más se hace en esta pantalla,
                        así que es lo más grande y lo primero que encuentra el
                        dedo; mientras se selecciona para borrar, pasa a ser
                        la de seleccionar y no queda ninguna otra al lado con
                        la que confundirla. */}
                    <button
                      type="button"
                      onClick={() =>
                        seleccionando
                          ? onAlternar(a.id)
                          : onCambiar(a.id, { estado: hecha ? "pendiente" : "hecha" })
                      }
                      aria-label={
                        seleccionando
                          ? (marcada ? "Quitar de la selección" : "Seleccionar")
                          : (hecha ? "Desmarcar" : "Marcar como hecha")
                      }
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border transition-colors ${
                        seleccionando
                          ? marcada
                            ? "border-[#6D4A9B] bg-[#6D4A9B] text-white"
                            : "border-[#3a3a4a] hover:border-[#6D4A9B]"
                          : hecha
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-[#3a3a4a] hover:border-[#6D4A9B]"
                      }`}
                    >
                      {(seleccionando ? marcada : hecha) && <Check size={12} />}
                    </button>

                    {/* Seleccionando, tocar la fila la marca. Abrir el editor
                        a media selección sería perderla. */}
                    <button
                      type="button"
                      onClick={() => (seleccionando ? onAlternar(a.id) : onAbrir(a))}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className={`truncate text-sm ${hecha ? "text-[#6a6a7a] line-through" : "text-[#F3F6FA]"}`}>
                        {a.titulo}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6a6a7a]">
                        <span style={{ color: COLOR[a.categoria] }}>{ETIQUETA[a.categoria]}</span>
                        <span>·</span>
                        <span className={atrasada ? "text-[#e6cf95]" : ""}>{dia(a.fecha)}</span>
                        {a.fecha_entrega && (
                          <>
                            <span>·</span>
                            <span>entrega {dia(a.fecha_entrega)}</span>
                          </>
                        )}
                        {nombre(a.responsable_id) && (
                          <>
                            <span>·</span>
                            <span>{nombre(a.responsable_id)}</span>
                          </>
                        )}
                        {a.campana && (
                          <span className="border border-[#2a2a3a] px-1.5 text-[10px] text-[#8a8fa8]">
                            {a.campana}
                          </span>
                        )}
                      </p>
                    </button>

                    {/* El acceso directo a donde de verdad se hace el envío.
                        Esta pantalla organiza y registra; no manda nada. */}
                    {(a.categoria === "correo" || a.categoria === "notificacion") && (
                      <span
                        title="Se envía desde Comunicaciones"
                        className="mt-0.5 shrink-0 text-[#5a5a6a]"
                      >
                        <Mail size={13} />
                      </span>
                    )}

                    {/* Borrar una suelta, sin abrirla.

                        Se desvanece en el ratón y se queda fija en el móvil:
                        en una pantalla táctil no hay «pasar por encima», y un
                        botón que solo aparece al apuntar ahí no existe. */}
                    {!seleccionando && (
                      <button
                        type="button"
                        onClick={() => onBorrarUna(a)}
                        aria-label={`Borrar ${a.titulo}`}
                        title="Borrar"
                        className="-my-1 -mr-1 mt-0 shrink-0 p-1.5 text-[#4a4a5a] opacity-100 transition-colors hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {actividades.filter((a) => !a.es_referencia).length === 0 && (
        <div className="border border-dashed border-[#1f1f2c] px-6 py-14 text-center">
          <Calendar size={26} className="mx-auto text-[#3a3a50]" />
          <p className="mt-4 text-sm text-[#8a8fa8]">
            Nada planificado en estas fechas.
          </p>
        </div>
      )}
    </div>
  )
}

// ── EL MES ─────────────────────────────────────────────────────────────────

function VistaCalendario({
  desde, hasta, actividades, onAbrir,
  seleccionando, marcadas, onAlternar, onBorrarUna,
}: {
  desde: string
  hasta: string
  actividades: Actividad[]
  onAbrir: (a: Actividad) => void
  seleccionando: boolean
  marcadas: string[]
  onAlternar: (id: string) => void
  onBorrarUna: (a: Actividad) => void
}) {
  const hoy = hoyISO()

  // La rejilla empieza el lunes de la semana del día 1, para que las columnas
  // sean siempre los mismos días de la semana.
  const inicio = lunesDe(desde)
  const dias: string[] = []
  for (let d = inicio; d <= hasta || dias.length % 7 !== 0; d = sumarDias(d, 1)) {
    dias.push(d)
    if (dias.length > 42) break
  }

  // ── UNA SEMANA NO SE DIBUJA COMO UN MES ─────────────────────────────────
  // Son siete casillas en vez de treinta y cinco, así que caben enteras: se
  // les da altura y se enseña todo. En el mes hay que cortar por algún sitio
  // o la rejilla se va de la pantalla.
  const esSemana = dias.length <= 7
  const TOPE = esSemana ? 99 : 4

  const delDia = (iso: string) => actividades.filter((a) => a.fecha === iso)

  return (
    <div>
      <div className="grid grid-cols-7 gap-px border border-[#14141e] bg-[#14141e] text-center">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="bg-[#0d0d16] py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">
            {d}
          </div>
        ))}

        {dias.map((d) => {
          const fuera = d < desde || d > hasta
          const esHoy = d === hoy
          const suyas = delDia(d)
          return (
            <div
              key={d}
              className={`bg-[#0d0d16] p-1.5 text-left ${esSemana ? "min-h-[14rem]" : "min-h-[5.5rem]"} ${fuera ? "opacity-35" : ""}`}
            >
              <p className={`mb-1 text-[10px] ${esHoy ? "font-bold text-[#c3b2e0]" : "text-[#6a6a7a]"}`}>
                {Number(d.slice(8, 10))}
              </p>
              <div className="space-y-0.5">
                {suyas.slice(0, TOPE).map((a) => {
                  const marcada = marcadas.includes(a.id)
                  return (
                    <div key={a.id} className="group/c relative">
                      <button
                        type="button"
                        onClick={() => (seleccionando ? onAlternar(a.id) : onAbrir(a))}
                        title={a.titulo}
                        className={`block w-full truncate border-l-2 px-1 py-0.5 text-left text-[10px] transition-colors ${
                          marcada
                            ? "bg-[#6D4A9B]/35 text-[#e8dcff]"
                            : "bg-[#12121c] text-[#c8c8dc] hover:bg-[#1a1a2a]"
                        }`}
                        style={{
                          borderLeftColor: COLOR[a.categoria],
                          opacity: a.estado === "hecha" ? 0.45 : 1,
                          textDecoration: a.estado === "hecha" ? "line-through" : undefined,
                        }}
                      >
                        {/* Seleccionando, la marca va DENTRO de la pastilla:
                            en una casilla de rejilla no hay sitio para una
                            casilla de verificación al lado. */}
                        {seleccionando && (marcada ? "✓ " : "· ")}
                        {a.titulo}
                      </button>

                      {/* La equis de borrar una suelta. Tapa el final del
                          título, que es texto cortado de todas formas. */}
                      {!seleccionando && (
                        <button
                          type="button"
                          onClick={() => onBorrarUna(a)}
                          aria-label={`Borrar ${a.titulo}`}
                          title="Borrar"
                          className="absolute right-0 top-0 hidden h-full items-center bg-gradient-to-l from-[#1a1a2a] via-[#1a1a2a] to-transparent pl-3 pr-1 text-[#6a6a7a] hover:text-red-400 group-hover/c:flex"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  )
                })}
                {suyas.length > TOPE && (
                  <p className="px-1 text-[10px] text-[#6a6a7a]">+{suyas.length - TOPE}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-[#6a6a7a]">
        {seleccionando
          ? "Toca una actividad para marcarla o desmarcarla."
          : "Toca una actividad para abrirla, o la equis para borrarla. El color es la categoría; lo tachado está hecho."}
      </p>
    </div>
  )
}

// ── CREAR Y EDITAR ─────────────────────────────────────────────────────────

function EditorActividad({ actividad, equipo, fechaPorDefecto, onCerrar, onGuardado }: {
  actividad: Actividad | null
  equipo: Miembro[]
  fechaPorDefecto: string
  onCerrar: () => void
  onGuardado: () => void
}) {
  const [f, setF] = useState<Partial<Actividad>>(
    actividad ?? {
      titulo: "",
      categoria: "reel",
      ambito: "publico",
      campana: "",
      fecha: fechaPorDefecto,
      estado: "pendiente",
      notas: "",
      es_referencia: false,
    },
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const guardar = async () => {
    setGuardando(true); setError(null)
    try {
      const nueva = !actividad
      const r = await fetch(
        nueva
          ? "/api/admin/marketing/actividades"
          : `/api/admin/marketing/actividades/${actividad.id}`,
        {
          method: nueva ? "POST" : "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(f),
        },
      )
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo guardar")
      onGuardado()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar")
      setGuardando(false)
    }
  }

  const borrar = async () => {
    if (!actividad) return
    if (!window.confirm(`¿Borrar «${actividad.titulo}»? No se puede deshacer.`)) return
    setGuardando(true)
    try {
      const r = await fetch(`/api/admin/marketing/actividades/${actividad.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!r.ok) throw new Error("No se pudo borrar")
      onGuardado()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar")
      setGuardando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9600] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto border border-[#2a2a36] bg-[#0b0b13] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a78bca]">
            {actividad ? "Actividad" : "Nueva actividad"}
          </h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="text-[#6a6a7a] hover:text-[#F3F6FA]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nombre</label>
            <input
              type="text"
              value={f.titulo ?? ""}
              onChange={(e) => setF({ ...f, titulo: e.target.value })}
              placeholder="Reel · preparación para el contacto"
              className={inputCls}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Categoría</label>
              <select
                value={f.categoria}
                onChange={(e) => setF({ ...f, categoria: e.target.value as Categoria })}
                className={inputCls}
              >
                {(Object.keys(ETIQUETA) as Categoria[]).map((c) => (
                  <option key={c} value={c}>{ETIQUETA[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Responsable</label>
              <select
                value={f.responsable_id ?? ""}
                onChange={(e) => setF({ ...f, responsable_id: e.target.value || null })}
                className={inputCls}
              >
                <option value="">Sin asignar</option>
                {equipo.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Cuándo ocurre</label>
              <input
                type="date"
                value={f.fecha ?? ""}
                onChange={(e) => setF({ ...f, fecha: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Entrega (opcional)</label>
              <input
                type="date"
                value={f.fecha_entrega ?? ""}
                onChange={(e) => setF({ ...f, fecha_entrega: e.target.value || null })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Dónde se ve</label>
              <select
                value={f.ambito}
                onChange={(e) => setF({ ...f, ambito: e.target.value as Actividad["ambito"] })}
                className={inputCls}
              >
                <option value="publico">Público · redes</option>
                <option value="miembros">Área de miembros</option>
                <option value="interno">Interno · trabajo nuestro</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select
                value={f.estado}
                onChange={(e) => setF({ ...f, estado: e.target.value as Actividad["estado"] })}
                className={inputCls}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_curso">En curso</option>
                <option value="hecha">Hecha</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Tema del mes (opcional)</label>
            <input
              type="text"
              value={f.campana ?? ""}
              onChange={(e) => setF({ ...f, campana: e.target.value })}
              placeholder="El contacto extraterrestre"
              className={inputCls}
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#6a6a7a]">
              Escribe el mismo tema en el reel público y en la meditación privada para verlos
              juntos.
            </p>
          </div>

          <div>
            <label className={labelCls}>Notas</label>
            <textarea
              rows={4}
              value={f.notas ?? ""}
              onChange={(e) => setF({ ...f, notas: e.target.value })}
              className={`${inputCls} resize-y`}
            />
          </div>

          {/* Lo que convierte una fecha en algo que no hay que hacer. */}
          <label className="flex items-start gap-2.5 text-xs text-[#a8a8c0]">
            <input
              type="checkbox"
              checked={f.es_referencia === true}
              onChange={(e) => setF({ ...f, es_referencia: e.target.checked })}
              className="mt-0.5"
              style={{ accentColor: "#6D4A9B" }}
            />
            <span>
              Solo de referencia
              <span className="mt-0.5 block text-[11px] text-[#6a6a7a]">
                Luna llena, solsticio, entrada de signo. Sale en el calendario pero nadie
                tiene que hacerla, y no cuenta para el cumplimiento.
              </span>
            </span>
          </label>

          {error && (
            <p className="border border-red-900 bg-red-950/20 p-2.5 text-xs text-red-300">{error}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-[#1a1a24] pt-4">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/20 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/35 disabled:opacity-50"
            >
              {guardando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Guardar
            </button>
            {actividad && (
              <button
                type="button"
                onClick={borrar}
                disabled={guardando}
                className="inline-flex items-center gap-1.5 text-[11px] text-[#7a7a8a] transition-colors hover:text-red-400 disabled:opacity-50"
              >
                <Trash2 size={12} /> Borrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
