"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  EL PULSO DE LA SEMANA · escribir las preguntas
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ ESTA PANTALLA NO EXISTÍA ──────────────────────────────────────
// El Pulso se sembró con tres preguntas desde una migración y nunca tuvo
// dónde gestionarse. Escribir la cuarta exigía abrir el editor SQL de
// Supabase y teclear un INSERT — o sea, la pregunta semanal dependía de que
// alguien que supiera SQL estuviera disponible el lunes.
//
// ── LA REGLA, DICHA EN PANTALLA ───────────────────────────────────────────
// No hay interruptor de «activa»: la vigente es LA MÁS RECIENTE CUYA FECHA
// YA PASÓ, y rotan solas. Eso permite dejar un mes preparado, pero también
// significa que poner una fecha de ayer activa esa pregunta ahora mismo.
//
// Esa consecuencia tiene que estar escrita donde se escribe la fecha, no en
// un manual. Quien programa cuatro semanas de golpe no se acuerda de la
// regla; la lee en el formulario o no la lee nunca.

import { useCallback, useEffect, useState, useTransition } from "react"
import { Activity, Plus, Trash2, Pencil, X, Check } from "lucide-react"
import { btnCls, inputCls, labelCls } from "./_shared"

type Semana = {
  id: string
  numero: number
  pregunta: string
  invitacion: string
  inicia_en: string
  dias: number
  practica_titulo: string | null
  practica_url: string | null
  practica_duracion: string | null
  respuestas: number
}

type Datos = { hoy: string; vigente: string | null; semanas: Semana[] }

/** Lo que se está escribiendo. Vacío = formulario cerrado. */
type Borrador = {
  id?: string
  pregunta: string
  invitacion: string
  inicia_en: string
  practica_titulo: string
  practica_url: string
  practica_duracion: string
}

const VACIO: Borrador = {
  pregunta: "", invitacion: "", inicia_en: "",
  practica_titulo: "", practica_url: "", practica_duracion: "",
}

/** El lunes que viene: la fecha que casi siempre se quiere al crear. */
function proximoLunes(): string {
  const d = new Date()
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7))
  return d.toISOString().slice(0, 10)
}

function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date(`${iso}T12:00:00`))
}

export function Pulso() {
  const [datos, setDatos] = useState<Datos | null>(null)
  const [borrador, setBorrador] = useState<Borrador | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, empezar] = useTransition()

  const cargar = useCallback(async () => {
    const r = await fetch("/api/admin/pulso", { credentials: "include" })
    if (!r.ok) { setError("No se pudo cargar el Pulso."); return }
    setDatos(await r.json())
  }, [])

  useEffect(() => { void cargar() }, [cargar])

  function guardar() {
    if (!borrador) return
    setError(null)
    empezar(async () => {
      const esNueva = !borrador.id
      const r = await fetch("/api/admin/pulso", {
        method: esNueva ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(borrador),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) { setError(j.error || "No se pudo guardar."); return }
      setBorrador(null)
      await cargar()
    })
  }

  function retirar(s: Semana) {
    if (!confirm(`¿Retirar la semana ${s.numero}? Todavía no ha empezado.`)) return
    setError(null)
    empezar(async () => {
      const r = await fetch(`/api/admin/pulso?id=${s.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) { setError(j.error || "No se pudo retirar."); return }
      await cargar()
    })
  }

  if (!datos) {
    return <p className="text-sm text-[#8a8fa8]">Cargando el Pulso…</p>
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F3F6FA]">
            <Activity size={16} className="text-[#a78bca]" /> Pulso de la semana
          </h2>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[#8a8fa8]">
            Una pregunta por semana. La que se ve es <strong className="text-[#c3b2e0]">la
            más reciente cuya fecha ya pasó</strong>, así que puedes dejar varias
            preparadas y rotan solas — nadie tiene que entrar un lunes a publicarlas.
          </p>
        </div>

        {!borrador && (
          <button
            type="button"
            className={btnCls}
            onClick={() => setBorrador({ ...VACIO, inicia_en: proximoLunes() })}
          >
            <Plus size={14} /> Escribir una semana
          </button>
        )}
      </header>

      {error && (
        <div role="alert" className="border border-red-900/40 bg-red-900/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {borrador && (
        <section className="space-y-4 border border-[#6D4A9B]/40 bg-[#12121a]/60 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F3F6FA]">
              {borrador.id ? "Corregir la semana" : "Semana nueva"}
            </h3>
            <button
              type="button"
              onClick={() => { setBorrador(null); setError(null) }}
              className="text-[#8a8fa8] hover:text-[#F3F6FA]"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <label className={labelCls}>La pregunta</label>
            <p className="-mt-1 mb-2 text-[11px] text-[#6a6a7a]">
              Es el titular grande, y lo único que mucha gente va a leer.
            </p>
            <input
              type="text"
              className={inputCls}
              placeholder="¿A quién le debes una conversación?"
              value={borrador.pregunta}
              onChange={(e) => setBorrador({ ...borrador, pregunta: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>La invitación</label>
            <p className="-mt-1 mb-2 text-[11px] text-[#6a6a7a]">
              Dos o tres frases que den contexto sin responder la pregunta por nadie.
            </p>
            <textarea
              rows={4}
              className={inputCls}
              value={borrador.invitacion}
              onChange={(e) => setBorrador({ ...borrador, invitacion: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>Empieza el</label>
            {/* La advertencia va aquí y no en un manual: quien programa cuatro
                semanas de golpe no se acuerda de la regla, la lee o no la lee. */}
            <p className="-mt-1 mb-2 text-[11px] leading-relaxed text-[#6a6a7a]">
              Desde esa fecha es la que se ve. Si pones una fecha pasada,
              <strong className="text-[#e0864a]"> se activa ahora mismo</strong> y
              desplaza a la que estuviera.
            </p>
            <input
              type="date"
              className={inputCls}
              value={borrador.inicia_en}
              onChange={(e) => setBorrador({ ...borrador, inicia_en: e.target.value })}
            />
          </div>

          <details className="border-l-2 border-[#2f2f42] pl-3">
            <summary className="cursor-pointer text-[12px] text-[#8a8fa8]">
              Añadir una práctica (opcional)
            </summary>
            <div className="mt-3 space-y-3">
              <input
                type="text" className={inputCls} placeholder="Título de la práctica"
                value={borrador.practica_titulo}
                onChange={(e) => setBorrador({ ...borrador, practica_titulo: e.target.value })}
              />
              <input
                type="text" className={inputCls} placeholder="https://…"
                value={borrador.practica_url}
                onChange={(e) => setBorrador({ ...borrador, practica_url: e.target.value })}
              />
              <input
                type="text" className={inputCls} placeholder="12 min"
                value={borrador.practica_duracion}
                onChange={(e) => setBorrador({ ...borrador, practica_duracion: e.target.value })}
              />
            </div>
          </details>

          <button type="button" className={btnCls} onClick={guardar} disabled={guardando}>
            <Check size={14} /> {guardando ? "Guardando…" : "Guardar"}
          </button>
        </section>
      )}

      {/* ── EL CALENDARIO ────────────────────────────────────────────────
          De lo más nuevo a lo más viejo, con la vigente marcada. Es la misma
          lista que ve la plataforma, no un resumen aparte: si aquí pone que
          manda una, es la que está en pantalla. */}
      <ul className="space-y-2">
        {datos.semanas.map((s) => {
          const vigente = s.id === datos.vigente
          const futura = s.inicia_en > datos.hoy

          return (
            <li
              key={s.id}
              className={`border px-4 py-3 ${
                vigente ? "border-[#6D4A9B] bg-[#6D4A9B]/10" : "border-[#1f1f2c]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#6a6a7a]">
                    Semana {s.numero}
                    {vigente && <span className="text-[#c3b2e0]">· en pantalla ahora</span>}
                    {futura && <span className="text-[#8a8fa8]">· programada</span>}
                    {!vigente && !futura && <span>· pasada</span>}
                  </p>
                  <p className="mt-1 text-[15px] leading-snug text-[#F3F6FA]">{s.pregunta}</p>
                  <p className="mt-1 text-[12px] text-[#8a8fa8]">
                    {fechaLarga(s.inicia_en)} · {s.respuestas}{" "}
                    {s.respuestas === 1 ? "respuesta" : "respuestas"}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    aria-label="Corregir"
                    className="border border-[#2f2f42] p-2 text-[#8a8fa8] hover:text-[#F3F6FA]"
                    onClick={() => setBorrador({
                      id: s.id,
                      pregunta: s.pregunta,
                      invitacion: s.invitacion,
                      inicia_en: s.inicia_en,
                      practica_titulo: s.practica_titulo ?? "",
                      practica_url: s.practica_url ?? "",
                      practica_duracion: s.practica_duracion ?? "",
                    })}
                  >
                    <Pencil size={13} />
                  </button>

                  {/* Solo lo que no ha empezado. Lo que ya se vio puede tener
                      respuestas debajo, y nadie que pulse la papelera está
                      pensando en ellas. */}
                  {futura && (
                    <button
                      type="button"
                      aria-label="Retirar"
                      className="border border-[#2f2f42] p-2 text-[#8a5a5a] hover:text-[#d08080]"
                      onClick={() => retirar(s)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
