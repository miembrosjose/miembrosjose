"use client"

// PRÓXIMO ENCUENTRO — el anuncio de la portada.
//
// Lo que viene en vivo: meditaciones globales, transmisiones, encuentros de
// ciudad. Va en la portada porque es lo que tiene fecha: si está enterrado en
// una pestaña, la gente se entera cuando ya pasó.
//
// ── DISEÑADO PARA EMPEZAR CON UNO SOLO ─────────────────────────────────────
// Hoy no hay encuentros y no hay miembros. Así que:
//   · Sin encuentros, la sección NO aparece. Una rejilla vacía dice que aquí
//     no pasa nada, y eso es peor que no decir nada.
//   · Con uno, ocupa el ancho entero y se ve como un cartel. No se queda
//     encogido a un tercio esperando compañía que no existe.
//   · El número de confirmados solo sale a partir de uno. "0 asistirán" espanta.

import { useEffect, useState } from "react"
import { CalendarDays, Clock, MapPin, Radio, Video } from "lucide-react"
import s from "./proximo-encuentro.module.css"

type Encuentro = {
  id: number
  titulo: string
  descripcion: string
  empiezaEn: string
  terminaEn: string | null
  online: boolean
  enlace: string | null
  donde: string
  cupo: number | null
  confirmados: number
}

/** Fecha en palabras, con el día de la semana: ancla mejor que una cifra. */
function fecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-419", {
      weekday: "long", day: "numeric", month: "long",
    })
  } catch { return "" }
}

function hora(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit" })
  } catch { return "" }
}

/** Cuánto falta, en palabras. Da urgencia sin necesitar a nadie más. */
function cuantoFalta(iso: string): string | null {
  const dias = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (!Number.isFinite(dias)) return null
  if (dias <= 0) return "Hoy"
  if (dias === 1) return "Mañana"
  if (dias <= 14) return `En ${dias} días`
  return null
}

export function ProximoEncuentro({ onVerTodos }: { onVerTodos?: () => void }) {
  const [lista, setLista] = useState<Encuentro[] | null>(null)

  useEffect(() => {
    let vivo = true
    void fetch("/api/red/proximo", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { encuentros: [] }))
      .then((j: { encuentros?: Encuentro[] }) => {
        if (vivo) setLista(j.encuentros ?? [])
      })
      .catch(() => { if (vivo) setLista([]) })
    return () => { vivo = false }
  }, [])

  // Sin nada que anunciar, la sección no existe.
  if (!lista || lista.length === 0) return null

  const [principal, ...resto] = lista

  return (
    <section className={s.bloque}>
      <header className={s.cabecera}>
        <p className={s.kicker}>
          <Radio size={13} /> En vivo, próximamente
        </p>
        {onVerTodos && (
          <button type="button" className={s.verTodos} onClick={onVerTodos}>
            Ver todos →
          </button>
        )}
      </header>

      <div className={s.rejilla}>
        {/* El principal ocupa el ancho: es un cartel, no una miniatura. */}
        <article className={s.principal}>
          <div className={s.fondo} aria-hidden />

          <div className={s.contenido}>
            <div className={s.etiquetas}>
              <span className={principal.online ? s.etiquetaOnline : s.etiquetaPresencial}>
                {principal.online ? <><Video size={11} /> En línea</> : <><MapPin size={11} /> Presencial</>}
              </span>
              {cuantoFalta(principal.empiezaEn) && (
                <span className={s.cuenta}>{cuantoFalta(principal.empiezaEn)}</span>
              )}
            </div>

            <h3 className={s.titulo}>{principal.titulo}</h3>
            {principal.descripcion && (
              <p className={s.descripcion}>{principal.descripcion}</p>
            )}

            <dl className={s.datos}>
              <div>
                <dt aria-hidden><CalendarDays size={13} /></dt>
                <dd>{fecha(principal.empiezaEn)}</dd>
              </div>
              <div>
                <dt aria-hidden><Clock size={13} /></dt>
                <dd>{hora(principal.empiezaEn)}</dd>
              </div>
              {principal.donde && (
                <div>
                  <dt aria-hidden>{principal.online ? <Video size={13} /> : <MapPin size={13} />}</dt>
                  <dd>{principal.donde}</dd>
                </div>
              )}
            </dl>

            <div className={s.acciones}>
              {principal.online && principal.enlace ? (
                <a
                  href={principal.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.principalBoton}
                >
                  Entrar a la transmisión
                </a>
              ) : onVerTodos ? (
                <button type="button" className={s.principalBoton} onClick={onVerTodos}>
                  Ver el encuentro
                </button>
              ) : null}

              {/* El contador solo cuando hay alguien. Un "0 asistirán" espanta
                  más de lo que convoca. */}
              {principal.confirmados > 0 && (
                <span className={s.confirmados}>
                  {principal.confirmados === 1
                    ? "1 persona confirmada"
                    : `${principal.confirmados} personas confirmadas`}
                </span>
              )}
            </div>
          </div>
        </article>

        {/* El siguiente, si lo hay, en formato reducido. */}
        {resto.map((e) => (
          <article key={e.id} className={s.secundario}>
            <span className={s.secundarioFecha}>
              <span className={s.secundarioDia}>
                {new Date(e.empiezaEn).toLocaleDateString("es-419", { day: "numeric" })}
              </span>
              <span className={s.secundarioMes}>
                {new Date(e.empiezaEn).toLocaleDateString("es-419", { month: "short" })}
              </span>
            </span>
            <span className={s.secundarioTextos}>
              <span className={s.secundarioTitulo}>{e.titulo}</span>
              <span className={s.secundarioMeta}>
                {hora(e.empiezaEn)} · {e.online ? "En línea" : e.donde}
              </span>
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
