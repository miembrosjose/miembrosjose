"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  NOVEDADES · el tablón de José, en Inicio
// ═══════════════════════════════════════════════════════════════════════════
//
// Reuniones, directos y avisos. Lo escribe una sola persona y la gente
// comenta — un foro que no es un foro.
//
// ── POR QUÉ ESTÁ EN INICIO Y NO EN LA BARRA ───────────────────────────────
// La barra de escritorio tiene seis secciones y está llena; una séptima la
// rompe, y en el móvil se iría al menú, donde no la vería nadie. Inicio es
// donde aterriza todo el mundo cada vez que entra: es el único sitio al que
// no hay que ir.
//
// ── POR QUÉ SE LEE ENTERA AQUÍ ────────────────────────────────────────────
// Un anuncio cortado con «leer más» obliga a decidir si merece la pena antes
// de saber qué dice. Son tres párrafos y pasan una vez por semana: caben.
// Lo que sí lleva a otro sitio es comentar, porque eso ya es una conversación
// y vive en la comunidad, con su moderación y sus respuestas.

import { useEffect, useState } from "react"
import { Megaphone, Calendar, MessageCircle, ArrowUpRight, EyeOff } from "lucide-react"
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

/**
 * La fecha del acto, dicha dos veces.
 *
 * ── POR QUÉ DOS ───────────────────────────────────────────────────────────
 * «11:00 hora de México» es exacto y es inútil para quien lee desde Santiago
 * o desde Madrid: le obliga a abrir un buscador para saber si le pilla
 * desayunando o durmiendo.
 *
 * Pero decir solo la hora local tampoco vale: la gente habla entre sí, y en
 * el Telegram alguien va a escribir «es a las once». Si cada pantalla enseña
 * una hora distinta sin decir de dónde es, nadie sabe cuál es la buena.
 *
 * Así que se dicen las dos: la original, que es la que circula, y la suya,
 * que es la que necesita.
 */
function Cuando({ iso, zona }: { iso: string; zona: string | null }) {
  const cuando = new Date(iso)
  const aqui = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null

  const fmt = (tz?: string) =>
    new Intl.DateTimeFormat("es-ES", {
      weekday: "long", day: "numeric", month: "long",
      hour: "2-digit", minute: "2-digit",
      ...(tz ? { timeZone: tz } : {}),
    }).format(cuando)

  // Si quien lee está en la misma zona en que se anunció, repetirlo sería
  // decir lo mismo dos veces con distinta etiqueta.
  const mismaZona = !zona || !aqui || zona === aqui

  const faltan = cuando.getTime() - Date.now()
  const dias = Math.round(faltan / 86_400_000)
  const aviso =
    faltan < 0 ? "Ya ocurrió"
      : dias === 0 ? "Es hoy"
      : dias === 1 ? "Es mañana"
      : `Faltan ${dias} días`

  return (
    <div className={s.cuando}>
      <Calendar size={14} className={s.cuandoIcono} aria-hidden />
      <div>
        <p className={s.cuandoLinea}>
          {fmt(zona || undefined)}
          {!mismaZona && <span className={s.cuandoZona}> · hora de México</span>}
        </p>
        {!mismaZona && (
          <p className={s.cuandoLocal}>
            {fmt()} <span className={s.cuandoZona}>· tu hora</span>
          </p>
        )}
        <p className={`${s.cuandoFaltan} ${faltan < 0 ? s.pasado : ""}`}>{aviso}</p>
      </div>
    </div>
  )
}

export function Novedades() {
  const { setView } = useView()
  const [novedades, setNovedades] = useState<Novedad[] | null>(null)
  const [oculta, setOculta] = useState(false)

  useEffect(() => {
    let vivo = true
    fetch("/api/novedades", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { novedades?: Novedad[]; oculta?: boolean } | null) => {
        if (!vivo || !d) return
        setNovedades(d.novedades ?? [])
        setOculta(Boolean(d.oculta))
      })
      .catch(() => { if (vivo) setNovedades([]) })
    return () => { vivo = false }
  }, [])

  // Mientras carga no se reserva sitio ni se pinta un esqueleto: esta sección
  // puede estar legítimamente vacía, y un hueco gris que luego desaparece es
  // peor que aparecer un segundo más tarde.
  if (!novedades || novedades.length === 0) return null

  return (
    <section className={s.zona} aria-labelledby="novedades-titulo">
      <header className={s.cabecera}>
        <h2 id="novedades-titulo" className={s.titulo}>
          <Megaphone size={14} className={s.tituloIcono} aria-hidden />
          Novedades
        </h2>

        {/* ── EL AVISO DE QUE TODAVÍA NO LA VE NADIE ──────────────────────
            Sin esto es facilísimo revisar la sección, verla bien, y darla por
            publicada. Solo lo ve quien puede verla estando oculta, que es la
            administración. */}
        {oculta && (
          <span className={s.oculta}>
            <EyeOff size={12} aria-hidden /> Solo la ves tú
          </span>
        )}
      </header>

      <div className={s.lista}>
        {novedades.map((n) => (
          <article key={n.id} className={s.novedad}>
            <h3 className={s.novedadTitulo}>{n.titulo}</h3>

            {n.eventoAt && <Cuando iso={n.eventoAt} zona={n.eventoZona} />}

            {/* El cuerpo se guarda como texto con saltos de línea, no como
                HTML: lo escribe una persona, no una plantilla. Cada párrafo
                es una línea en blanco. */}
            <div className={s.cuerpo}>
              {n.cuerpo.split(/\n{2,}/).map((parrafo, i) => (
                <p key={i}>{parrafo}</p>
              ))}
            </div>

            <div className={s.acciones}>
              {n.ctaUrl && (
                <a
                  href={n.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.cta}
                >
                  {n.ctaTexto || "Abrir"} <ArrowUpRight size={14} aria-hidden />
                </a>
              )}

              {/* Comentar lleva a la conversación de la comunidad. Se busca
                  por el título, que es el camino que ya existe para llegar a
                  un hilo desde fuera del foro. */}
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
          </article>
        ))}
      </div>
    </section>
  )
}
