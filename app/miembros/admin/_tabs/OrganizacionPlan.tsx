"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  RESULTADOS Y PLAN · la reunión
// ═══════════════════════════════════════════════════════════════════════════
//
// Dos pantallas que se usan una vez por semana y una vez por mes. Por eso no
// están optimizadas para la rapidez sino para la claridad: aquí no se trabaja
// deprisa, se decide.
//
// ── TODO SE ESCRIBE A MANO, Y ES DELIBERADO ────────────────────────────────
// Ninguna conexión con Instagram ni con Meta. Una integración con una API
// ajena se rompe sola —cambian permisos, caduca un token, cambia el nombre de
// una métrica— y el día que se rompe nadie se entera hasta que alguien mira
// un gráfico vacío. Copiar siete números una vez por semana cuesta dos
// minutos y no se rompe nunca.

import { useCallback, useEffect, useState } from "react"
import { Check, Loader2, Sparkles, TrendingDown, TrendingUp } from "lucide-react"
import { inputCls, labelCls } from "./_shared"
import { CATALOGO } from "@/lib/marketing/reglas"
import type { Categoria } from "@/lib/marketing/reglas"

type Metrica = {
  id: string
  periodo: string
  actividad_id: string | null
  alcance: number | null
  visualizaciones: number | null
  me_gusta: number | null
  comentarios: number | null
  compartidos: number | null
  guardados: number | null
  nuevos_seguidores: number | null
  contenidos_publicados: number | null
  interacciones: number | null
  correos_enviados: number | null
  tasa_apertura: number | null
  clics: number | null
  notificaciones_enviadas: number | null
  que_funciono: string
  que_interes: string
  que_repetir: string
  que_mejorar: string
  observaciones: string
}

/** Los números que se anotan, en el orden en que se leen en un panel. */
const CIFRAS: Array<{ k: keyof Metrica; nombre: string; grupo: string }> = [
  { k: "alcance", nombre: "Alcance", grupo: "Instagram y Facebook" },
  { k: "visualizaciones", nombre: "Visualizaciones", grupo: "Instagram y Facebook" },
  { k: "me_gusta", nombre: "Me gusta", grupo: "Instagram y Facebook" },
  { k: "comentarios", nombre: "Comentarios", grupo: "Instagram y Facebook" },
  { k: "compartidos", nombre: "Compartidos", grupo: "Instagram y Facebook" },
  { k: "guardados", nombre: "Guardados", grupo: "Instagram y Facebook" },
  { k: "nuevos_seguidores", nombre: "Nuevos seguidores", grupo: "Instagram y Facebook" },
  { k: "contenidos_publicados", nombre: "Contenidos publicados", grupo: "Comunidad" },
  { k: "interacciones", nombre: "Interacciones", grupo: "Comunidad" },
  { k: "correos_enviados", nombre: "Correos enviados", grupo: "Correo y avisos" },
  { k: "tasa_apertura", nombre: "Apertura (%)", grupo: "Correo y avisos" },
  { k: "clics", nombre: "Clics", grupo: "Correo y avisos" },
  { k: "notificaciones_enviadas", nombre: "Notificaciones", grupo: "Correo y avisos" },
]

const PREGUNTAS: Array<{ k: keyof Metrica; nombre: string; pista: string }> = [
  { k: "que_funciono", nombre: "¿Qué funcionó mejor?", pista: "El contenido, no el número" },
  { k: "que_interes", nombre: "¿Qué tema despertó más interés?", pista: "" },
  { k: "que_repetir", nombre: "¿Qué repetiríamos?", pista: "" },
  { k: "que_mejorar", nombre: "¿Qué mejoraríamos?", pista: "" },
]

function semanaCorta(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-419", {
    day: "numeric", month: "short", timeZone: "UTC",
  })
}

export function OrganizacionResultados({ semana }: { semana: string }) {
  const [metricas, setMetricas] = useState<Metrica[]>([])
  const [f, setF] = useState<Partial<Metrica>>({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await fetch("/api/admin/marketing/metricas", { credentials: "include" })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudieron cargar")
      const lista = (j.metricas || []) as Metrica[]
      setMetricas(lista)
      // La semana que se está mirando, si ya tiene algo anotado.
      setF(lista.find((m) => m.periodo === semana && !m.actividad_id) ?? { periodo: semana })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar")
    } finally {
      setCargando(false)
    }
  }, [semana])

  useEffect(() => { void cargar() }, [cargar])

  const guardar = async () => {
    setGuardando(true); setError(null); setGuardado(false)
    try {
      const r = await fetch("/api/admin/marketing/metricas", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, periodo: semana }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo guardar")
      setGuardado(true)
      void cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar")
    } finally {
      setGuardando(false)
    }
  }

  // ── LA COMPARACIÓN ──────────────────────────────────────────────────────
  // Un número suelto no dice nada: 4.200 de alcance solo significa algo al
  // lado de los 3.100 de la semana pasada. Por eso lo primero no son las
  // casillas, es la tabla de las últimas semanas.
  const historial = metricas.filter((m) => !m.actividad_id).slice(0, 8)

  const valor = (k: keyof Metrica) => {
    const v = f[k]
    return v === null || v === undefined ? "" : String(v)
  }

  const grupos = [...new Set(CIFRAS.map((c) => c.grupo))]

  return (
    <div className="space-y-6">
      {cargando ? (
        <div className="flex items-center gap-2 py-12 text-sm text-[#7a7a8a]">
          <Loader2 size={15} className="animate-spin" /> Cargando…
        </div>
      ) : (
        <>
          {historial.length > 1 && (
            <section className="border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
                Las últimas semanas
              </h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-xs">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#6a6a7a]">
                      <th className="pb-2 pr-3">Semana</th>
                      <th className="pb-2 pr-3 text-right">Alcance</th>
                      <th className="pb-2 pr-3 text-right">Visualiz.</th>
                      <th className="pb-2 pr-3 text-right">Me gusta</th>
                      <th className="pb-2 text-right">Seguidores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((m, i) => {
                      const previa = historial[i + 1]
                      return (
                        <tr key={m.id} className="border-t border-[#14141e] text-[#c8c8dc]">
                          <td className="py-2 pr-3 text-[#8a8fa8]">{semanaCorta(m.periodo)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">
                            <Celda ahora={m.alcance} antes={previa?.alcance ?? null} />
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums">
                            <Celda ahora={m.visualizaciones} antes={previa?.visualizaciones ?? null} />
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums">
                            <Celda ahora={m.me_gusta} antes={previa?.me_gusta ?? null} />
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            <Celda ahora={m.nuevos_seguidores} antes={previa?.nuevos_seguidores ?? null} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-[#6a6a7a]">
                Una raya es que esa semana no se anotó ese dato. No es un cero: un cero
                significa que se miró y no pasó nada.
              </p>
            </section>
          )}

          {/* ── ANOTAR LA SEMANA ──────────────────────────────────────── */}
          <section className="border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
              Semana del {semanaCorta(semana)}
            </h3>

            {grupos.map((grupo) => (
              <div key={grupo} className="mt-5">
                <p className="mb-2 text-[11px] uppercase tracking-[0.15em] text-[#6a6a7a]">{grupo}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {CIFRAS.filter((c) => c.grupo === grupo).map((c) => (
                    <div key={String(c.k)}>
                      <label className="mb-1 block text-[11px] text-[#8a8fa8]">{c.nombre}</label>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={valor(c.k)}
                        onChange={(e) =>
                          setF({ ...f, [c.k]: e.target.value === "" ? null : Number(e.target.value) })
                        }
                        placeholder="—"
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* ── LO QUE VALE MÁS QUE LOS NÚMEROS ───────────────────────
                Lo que se aprende de una semana no es el alcance: es por qué
                fue ese alcance. */}
            <div className="mt-6 space-y-4 border-t border-[#14141e] pt-5">
              {PREGUNTAS.map((p) => (
                <div key={String(p.k)}>
                  <label className={labelCls}>{p.nombre}</label>
                  <textarea
                    rows={2}
                    value={(f[p.k] as string) ?? ""}
                    onChange={(e) => setF({ ...f, [p.k]: e.target.value })}
                    placeholder={p.pista}
                    className={`${inputCls} resize-y`}
                  />
                </div>
              ))}
            </div>

            {error && (
              <p className="mt-4 border border-red-900 bg-red-950/20 p-2.5 text-xs text-red-300">{error}</p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/20 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/35 disabled:opacity-50"
              >
                {guardando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Guardar la semana
              </button>
              {guardado && !guardando && (
                <span className="text-xs text-emerald-400">Guardado.</span>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

/** Un número con su comparación contra la semana anterior. */
function Celda({ ahora, antes }: { ahora: number | null; antes: number | null }) {
  if (ahora === null) return <span className="text-[#4a4a5a]">—</span>

  const hay = antes !== null && antes > 0
  const sube = hay && ahora > antes
  const baja = hay && ahora < antes
  const pct = hay ? Math.round(((ahora - antes) / antes) * 100) : null

  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      {ahora.toLocaleString("es-419")}
      {pct !== null && pct !== 0 && (
        <span className={`inline-flex items-center text-[10px] ${sube ? "text-emerald-400" : "text-[#c9a86b]"}`}>
          {sube ? <TrendingUp size={10} /> : baja ? <TrendingDown size={10} /> : null}
          {Math.abs(pct)}%
        </span>
      )}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  EL PLAN DEL MES
// ═══════════════════════════════════════════════════════════════════════════

type Frecuencia = { categoria: string; cantidad: number; cada: "semana" | "mes"; responsable_id: string | null }

type Plan = {
  mes: string
  objetivos: string
  prioridades: string
  acuerdos: string
  observaciones: string
  frecuencias: Frecuencia[]
}

// Los nombres y las explicaciones salen del catálogo, que es el mismo que
// usa el calendario. Tenerlos aquí aparte fue lo que dejó «Protocolos» vivo
// en esta pantalla después de quitarlo de las otras.
const NOMBRE_CAT = (c: string) => CATALOGO[c as Categoria]?.plural ?? c

/** El mismo color que en el calendario, para que el acuerdo y el mes se lean
    como la misma cosa. Si se escribiera aparte, se desincronizaría. */
const COLOR_CAT = (c: string) => COLOR_POR_CATEGORIA[c] ?? "#8a8fa8"

const COLOR_POR_CATEGORIA: Record<string, string> = {
  reel: "#a888e8", carrusel: "#5fb0e8", historias: "#f08ac0",
  administracion: "#59d1a8",
  correo: "#f0b45c", notificacion: "#e8d45c", telegram: "#4ec8e0",
  transmision: "#f07070",
  reunion: "#9aa0b8", resultados: "#9aa0b8", otra: "#7a7a8a",
  luna: "#d8dff0", zodiaco: "#d4a84a", estacion: "#f0c040",
  portal: "#c77ad0", efemeride: "#8a8a9a",
}
const QUE_ES = (c: string) => CATALOGO[c as Categoria]?.que ?? ""

export function OrganizacionPlan({ mes, esPropietario }: { mes: string; esPropietario: boolean }) {
  const [p, setP] = useState<Partial<Plan>>({ mes })
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await fetch(`/api/admin/marketing/plan?mes=${mes}`, { credentials: "include" })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo cargar")

      // ── LAS CATEGORÍAS QUE YA NO EXISTEN ──────────────────────────────
      // El acuerdo está guardado como JSON en la fila del mes, así que
      // quitar una categoría del código no la quita de ahí: «protocolo»
      // seguía saliendo en pantalla, sin nombre ni explicación porque el
      // catálogo ya no la tenía.
      //
      // Y era peor que un renglón feo: al guardar se mandaba entera, el
      // servidor la rechazaba por no existir, y el plan ENTERO dejaba de
      // poder guardarse. Se cae aquí, al leer, y el primer guardado deja
      // la fila limpia.
      const plan = j.plan ?? { mes, frecuencias: j.frecuenciasHeredadas ?? [] }
      setP({
        ...plan,
        frecuencias: (plan.frecuencias ?? []).filter(
          (f: { categoria: string }) => CATALOGO[f.categoria as Categoria],
        ),
      })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar")
    } finally {
      setCargando(false)
    }
  }, [mes])

  useEffect(() => { void cargar() }, [cargar])

  const guardar = async () => {
    setOcupado(true); setError(null); setAviso(null)
    try {
      const r = await fetch("/api/admin/marketing/plan", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        // Las frecuencias solo se mandan si puede cambiarlas: si no, el
        // servidor rechazaría la petición entera y tampoco se guardarían los
        // acuerdos, que sí son de los dos.
        body: JSON.stringify(esPropietario ? { ...p, mes } : { ...p, mes, frecuencias: undefined }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo guardar")
      setAviso("Plan guardado.")
      void cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar")
    } finally {
      setOcupado(false)
    }
  }

  const generar = async (simular: boolean) => {
    setOcupado(true); setError(null); setAviso(null)
    try {
      const r = await fetch("/api/admin/marketing/plan/generar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, simular }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "No se pudo generar")

      if (simular) {
        setAviso(
          j.crearia === 0
            ? "El mes ya está completo: no haría falta crear nada."
            : `Crearía ${j.crearia} actividades: `
              + j.resumen.map((x: { categoria: string; crea: number }) =>
                  `${x.crea} ${NOMBRE_CAT(x.categoria)}`).join(", ") + ".",
        )
      } else {
        setAviso(
          j.creadas === 0
            ? "No hacía falta crear nada: el mes ya estaba completo."
            : `Creadas ${j.creadas} actividades. Están en el calendario con el `
              + "nombre de su categoría, listas para que les pongas el suyo.",
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar")
    } finally {
      setOcupado(false)
    }
  }

  const campo = (k: keyof Plan, filas: number) => (
    <textarea
      rows={filas}
      value={(p[k] as string) ?? ""}
      onChange={(e) => setP({ ...p, [k]: e.target.value })}
      className={`${inputCls} resize-y`}
    />
  )

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-[#7a7a8a]">
        <Loader2 size={15} className="animate-spin" /> Cargando…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="space-y-4 border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
          La reunión del mes
        </h3>
        <div>
          <label className={labelCls}>Objetivos</label>
          {campo("objetivos", 3)}
        </div>
        <div>
          <label className={labelCls}>Prioridades</label>
          {campo("prioridades", 2)}
        </div>
        <div>
          <label className={labelCls}>Acuerdos</label>
          {campo("acuerdos", 4)}
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#6a6a7a]">
            Lo que se decidió hoy. Es lo que se consulta dentro de tres semanas, cuando ya
            nadie recuerda por qué se acordó algo.
          </p>
        </div>
        <div>
          <label className={labelCls}>Observaciones</label>
          {campo("observaciones", 2)}
        </div>
      </section>

      {/* ── LAS FRECUENCIAS ───────────────────────────────────────────── */}
      <section className="border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
          Frecuencias acordadas
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[#8a8fa8]">
          Son metas, no publicaciones automáticas: guardar esto no crea nada. Lo que crea
          actividades es el botón de abajo.
        </p>

        <div className="mt-4 space-y-1.5">
          {(p.frecuencias ?? []).map((fr, i) => (
            <div key={fr.categoria} className="flex items-center gap-3 border border-[#14141e] px-3 py-2">
              {/* ── POR QUÉ CADA UNO LLEVA UNA FRASE ────────────────────
                  «Área de miembros» no dice qué hay que hacer. El nombre
                  vale para quien escribió el acuerdo; la frase vale para
                  quien lo abre tres semanas después, o para quien entra por
                  primera vez y tiene que cumplirlo. */}
              <span className="flex-1">
                <span className="flex items-center gap-2 text-xs text-[#F3F6FA]">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: COLOR_CAT(fr.categoria) }}
                  />
                  {NOMBRE_CAT(fr.categoria)}
                </span>
                {QUE_ES(fr.categoria) && (
                  <span className="mt-0.5 block pl-[1.125rem] text-[11px] leading-snug text-[#6a6a7a]">
                    {QUE_ES(fr.categoria)}
                  </span>
                )}
              </span>
              <input
                type="number"
                min={1}
                max={30}
                value={fr.cantidad}
                disabled={!esPropietario}
                onChange={(e) => {
                  const copia = [...(p.frecuencias ?? [])]
                  copia[i] = { ...fr, cantidad: Number(e.target.value) }
                  setP({ ...p, frecuencias: copia })
                }}
                className="w-16 border border-[#1f1f2c] bg-[#12121a] px-2 py-1 text-center text-xs text-[#F3F6FA] disabled:opacity-50"
              />
              <span className="w-20 text-[11px] text-[#6a6a7a]">
                por {fr.cada}
              </span>
            </div>
          ))}
          {(p.frecuencias ?? []).length === 0 && (
            <p className="text-[11px] text-[#6a6a7a]">
              Sin frecuencias. Corre el SQL de la fase 3 para cargar las de partida.
            </p>
          )}
        </div>

        {!esPropietario && (
          <p className="mt-3 text-[11px] leading-relaxed text-[#c9a86b]">
            Solo el propietario cambia las cantidades: es cambiar lo que se le pide a
            alguien. Lo demás de esta pantalla sí lo editáis los dos.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#14141e] pt-4">
          <button
            type="button"
            onClick={() => generar(true)}
            disabled={ocupado}
            className="inline-flex items-center gap-2 border border-[#2f2f42] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#a0a0b0] transition-colors hover:border-[#6D4A9B] hover:text-[#c3b2e0] disabled:opacity-50"
          >
            <Sparkles size={13} /> Ver qué crearía
          </button>
          <button
            type="button"
            onClick={() => generar(false)}
            disabled={ocupado}
            className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/20 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/35 disabled:opacity-50"
          >
            {ocupado ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            Generar el mes
          </button>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-[#6a6a7a]">
          Cuenta lo que ya hay en cada semana y crea solo lo que falta. Pasarlo dos veces no
          duplica nada.
        </p>
      </section>

      {error && <p className="border border-red-900 bg-red-950/20 p-3 text-xs text-red-300">{error}</p>}
      {aviso && <p className="border border-[#2a3a2a] bg-[#0d1a0d]/40 p-3 text-xs text-emerald-300">{aviso}</p>}

      <button
        type="button"
        onClick={guardar}
        disabled={ocupado}
        className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30 disabled:opacity-50"
      >
        {ocupado ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        Guardar el plan
      </button>
    </div>
  )
}
