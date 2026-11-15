"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  NOVEDADES · el registro de convocatorias
// ═══════════════════════════════════════════════════════════════════════════
//
// ── QUÉ SE APRENDIÓ EN EL PRIMER INTENTO ──────────────────────────────────
// La primera versión dibujaba cada novedad como un artículo: titular grande,
// tres párrafos, caja de fecha. Ocupaba media pantalla y competía con todo lo
// demás de Inicio.
//
// El error no era de tamaño, era de categoría. Una convocatoria no es
// contenido que se lee: es una SEÑAL que se comprueba. Nadie vuelve aquí a
// releer el texto del anuncio — vuelve a mirar la hora.
//
// ── EL CONCEPTO ───────────────────────────────────────────────────────────
// Un registro. Una línea por convocatoria, y un punto de estado en el raíl
// izquierdo que dice sin leer nada si eso es ahora, mañana o ya pasó. El
// punto no decora: es el dato.
//
// ── LO QUE MANDA ES EL CUÁNDO ─────────────────────────────────────────────
// Al revés que en la primera versión. Lo primero que se lee en la línea es
// «mañana · 11:00», no el título: la pregunta que trae a alguien aquí es
// cuándo, y el qué ya lo sabe.
//
// ── SE ABRE SOLA CUANDO IMPORTA ───────────────────────────────────────────
// Si falta menos de dos días, nace desplegada. Si no, en una línea. La
// sección no decide por estética: decide por urgencia, que es lo único que
// justifica ocupar sitio en la pantalla de alguien.

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, MessageCircle, EyeOff } from "lucide-react"
import s from "./novedades.module.css"
import { useView } from "../_lib/view-context"

type Novedad = {
  id: string
  titulo: string
  cuerpo: string
  autor: string
  creada: string
  eventoAt: string | null
  eventoZona: string | null
  ctaTexto: string | null
  ctaUrl: string | null
  respuestas: number
}

/** Cómo está una convocatoria respecto a ahora. El punto del raíl lo dibuja. */
type Estado = "vivo" | "pronto" | "futuro" | "pasado" | "sin_fecha"

const HORA = 3_600_000
const DIA = 24 * HORA

function estadoDe(iso: string | null): Estado {
  if (!iso) return "sin_fecha"
  const falta = new Date(iso).getTime() - Date.now()
  // Noventa minutos de margen: una reunión no se evapora al dar la hora.
  if (falta < -90 * 60_000) return "pasado"
  if (falta <= 90 * 60_000) return "vivo"
  if (falta < 2 * DIA) return "pronto"
  return "futuro"
}

/**
 * El cuándo, en la línea: corto y suficiente para decidir.
 *
 * Nada de «domingo 15 de noviembre de 2026 a las 11:00». Quien mira esta
 * línea quiere saber si le pilla hoy, y para eso sobra el año.
 */
function resumenDeFecha(iso: string | null, estado: Estado): string | null {
  if (!iso) return null
  const cuando = new Date(iso)
  if (estado === "vivo") return "ahora"

  const hora = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(cuando)
  const hoy = new Date()
  const mismoDia = cuando.toDateString() === hoy.toDateString()
  const manana = new Date(hoy.getTime() + DIA).toDateString() === cuando.toDateString()

  if (mismoDia) return `hoy · ${hora}`
  if (manana) return `mañana · ${hora}`

  const dia = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(cuando)
  return estado === "pasado" ? dia : `${dia} · ${hora}`
}

/**
 * La hora completa, dentro del desplegable.
 *
 * ── POR QUÉ SE DICE DOS VECES ─────────────────────────────────────────────
 * «11:00 hora de México» es exacto e inútil para quien lee desde Santiago.
 * Pero poner solo la hora local tampoco vale: en el Telegram alguien va a
 * escribir «es a las once», y si cada pantalla enseña una distinta sin decir
 * de dónde es, nadie sabe cuál es la buena.
 *
 * La original circula; la local decide. Hacen falta las dos.
 */
function HoraLarga({ iso, zona }: { iso: string; zona: string | null }) {
  const cuando = new Date(iso)
  const aqui = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null
  const mismaZona = !zona || !aqui || zona === aqui

  const fmt = (tz?: string) =>
    new Intl.DateTimeFormat("es-ES", {
      weekday: "long", day: "numeric", month: "long",
      hour: "2-digit", minute: "2-digit",
      ...(tz ? { timeZone: tz } : {}),
    }).format(cuando)

  const donde = zona ? zona.split("/").pop()?.replace(/_/g, " ") : null

  return (
    <p className={s.horaLarga}>
      <span className={s.horaPrincipal}>{fmt()}</span>
      {!mismaZona && (
        <span className={s.horaOtra}>
          {fmt(zona || undefined)} en {donde}
        </span>
      )}
    </p>
  )
}

export function Novedades() {
  const { setView } = useView()
  const [novedades, setNovedades] = useState<Novedad[] | null>(null)
  const [oculta, setOculta] = useState(false)
  const [abierta, setAbierta] = useState<string | null>(null)
  // Para que `estadoDe` se recalcule cuando la reunión pasa de «mañana» a
  // «ahora» sin que nadie recargue. Una vez por minuto basta.
  const [, tic] = useState(0)

  useEffect(() => {
    const t = setInterval(() => tic((n) => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let vivo = true
    fetch("/api/novedades", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { novedades?: Novedad[]; oculta?: boolean } | null) => {
        if (!vivo || !d) return
        const lista = d.novedades ?? []
        setNovedades(lista)
        setOculta(Boolean(d.oculta))
        // La que importa se abre sola. Si no hay ninguna inminente, todas
        // en una línea: la sección no pide sitio cuando no lo necesita.
        const urgente = lista.find((n) => {
          const e = estadoDe(n.eventoAt)
          return e === "vivo" || e === "pronto"
        })
        if (urgente) setAbierta(urgente.id)
      })
      .catch(() => { if (vivo) setNovedades([]) })
    return () => { vivo = false }
  }, [])

  const filas = useMemo(
    () => (novedades ?? []).map((n) => ({ n, estado: estadoDe(n.eventoAt) })),
    [novedades],
  )

  // Puede estar legítimamente vacía. Un esqueleto que luego desaparece es
  // peor que aparecer un segundo más tarde.
  if (!novedades || novedades.length === 0) return null

  return (
    <section className={s.registro} aria-label="Novedades">
      {oculta && (
        <p className={s.oculta}>
          <EyeOff size={11} aria-hidden /> Esta sección todavía no la ve nadie más
        </p>
      )}

      {filas.map(({ n, estado }) => {
        const abierto = abierta === n.id
        const resumen = resumenDeFecha(n.eventoAt, estado)

        return (
          <article key={n.id} className={`${s.fila} ${s[estado]} ${abierto ? s.filaAbierta : ""}`}>
            <button
              type="button"
              className={s.cabecera}
              aria-expanded={abierto}
              aria-controls={`novedad-${n.id}`}
              onClick={() => setAbierta(abierto ? null : n.id)}
            >
              {/* El punto es el dato, no un adorno: dice en qué estado está
                  esto sin que haya que leer una palabra. */}
              <span className={s.punto} aria-hidden />

              <span className={s.linea}>
                {resumen && <span className={s.cuando}>{resumen}</span>}
                <span className={s.titulo}>{n.titulo}</span>
              </span>

              <ChevronDown size={16} className={s.flecha} aria-hidden />
            </button>

            <div
              id={`novedad-${n.id}`}
              className={s.cuerpoCaja}
              hidden={!abierto}
            >
              {n.eventoAt && <HoraLarga iso={n.eventoAt} zona={n.eventoZona} />}

              <div className={s.texto}>
                {n.cuerpo.split(/\n{2,}/).map((parrafo, i) => (
                  <p key={i}>{parrafo}</p>
                ))}
              </div>

              <div className={s.acciones}>
                {n.ctaUrl && estado !== "pasado" && (
                  <a href={n.ctaUrl} target="_blank" rel="noopener noreferrer" className={s.cta}>
                    {n.ctaTexto || "Abrir"}
                  </a>
                )}

                <button
                  type="button"
                  className={s.comentar}
                  onClick={() => setView("comunidad", null, { comunidadTema: n.titulo })}
                >
                  <MessageCircle size={14} aria-hidden />
                  {n.respuestas === 0
                    ? "Comentar"
                    : `${n.respuestas} ${n.respuestas === 1 ? "comentario" : "comentarios"}`}
                </button>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
