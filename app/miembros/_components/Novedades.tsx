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
import { ChevronDown, MessageCircle, EyeOff, Send } from "lucide-react"
import s from "./novedades.module.css"

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

/**
 * Los comentarios, aquí mismo.
 *
 * ── POR QUÉ NO SE VA AL FORO ──────────────────────────────────────────────
 * «Comentar» llevaba a la comunidad buscando el hilo por su título. Dos
 * problemas: saca a alguien de Inicio para escribir dos frases, y cuando la
 * búsqueda no encontraba el hilo aterrizaba en La Red, que no tiene nada que
 * ver con lo que se acababa de leer.
 *
 * El hilo existe igual —es una fila del foro, con su moderación y sus
 * denuncias— y se puede seguir abriendo desde la comunidad. Lo que cambia es
 * que para decir «ahí estaré» no hace falta ir a ninguna parte.
 *
 * Se piden al abrir, no al cargar la página: la mayoría de las veces nadie
 * los abre, y traerlos siempre sería una consulta por novedad en cada visita
 * a Inicio.
 */
function Comentarios({ novedadId, alPublicar }: { novedadId: string; alPublicar: () => void }) {
  type Respuesta = { id: string; author_name: string; body: string; created_at: string }

  const [lista, setLista] = useState<Respuesta[] | null>(null)
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    fetch(`/api/forum/posts/${novedadId}/replies`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { replies?: Respuesta[] } | null) => { if (vivo) setLista(d?.replies ?? []) })
      .catch(() => { if (vivo) setLista([]) })
    return () => { vivo = false }
  }, [novedadId])

  async function enviar() {
    const limpio = texto.trim()
    if (!limpio || enviando) return
    setEnviando(true)
    setError(null)
    try {
      const r = await fetch(`/api/forum/posts/${novedadId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: limpio }),
      })
      const j = (await r.json().catch(() => ({}))) as { reply?: Respuesta; error?: string }
      if (!r.ok || !j.reply) { setError(j.error || "No se pudo publicar."); return }
      // Se añade al final, que es donde lo va a buscar quien acaba de
      // escribirlo. Recargar la lista entera haría parpadear lo que ya hay.
      setLista((prev) => [...(prev ?? []), j.reply as Respuesta])
      setTexto("")
      alPublicar()
    } catch {
      setError("No se pudo publicar.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={s.comentarios}>
      {lista && lista.length > 0 && (
        <ul className={s.hilos}>
          {lista.map((c) => (
            <li key={c.id} className={s.comentario}>
              <p className={s.comentarioAutor}>{c.author_name}</p>
              <p className={s.comentarioTexto}>{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className={s.escribir}>
        <textarea
          className={s.campo}
          rows={2}
          placeholder="Escribe un comentario…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          // Enviar con Enter y saltar de línea con Mayúsculas+Enter: esto son
          // dos frases, no un ensayo.
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar() }
          }}
        />
        <button
          type="button"
          className={s.enviar}
          onClick={() => void enviar()}
          disabled={enviando || texto.trim().length === 0}
          aria-label="Publicar comentario"
        >
          <Send size={15} />
        </button>
      </div>

      {error && <p className={s.errorComentario}>{error}</p>}
    </div>
  )
}

export function Novedades() {
  const [novedades, setNovedades] = useState<Novedad[] | null>(null)
  const [oculta, setOculta] = useState(false)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [conComentarios, setConComentarios] = useState<string | null>(null)
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
        // ── TODAS CERRADAS, SIEMPRE ───────────────────────────────────
        // Antes la inminente nacía desplegada. Leído en pantalla, eso no es
        // «te aviso de lo urgente»: es media pantalla de texto que nadie ha
        // pedido, y el resto de Inicio empujado hacia abajo.
        //
        // El punto ámbar y «mañana · 11:00» ya dicen que hay algo y cuándo.
        // Quien quiera el detalle, abre. Una línea que se puede ignorar
        // informa más que un bloque que hay que saltarse.
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
    <section className={s.panel} aria-labelledby="novedades-titulo">
      {/* ── EL TÍTULO, DENTRO DE LA CAJA ─────────────────────────────────
          Fuera quedaba suelto y la sección parecía una nota al pie del
          Pulso. Dentro, y con el mismo ancho y el mismo aire que él, las
          dos se leen como hermanas en vez de como una grande y un apéndice. */}
      <header className={s.cabeceraPanel}>
        <h2 id="novedades-titulo" className={s.tituloPanel}>
          Novedades de Los 144.000
        </h2>
        {oculta && (
          <span className={s.oculta}>
            <EyeOff size={11} aria-hidden /> Solo la ves tú
          </span>
        )}
      </header>

      <div className={s.registro}>

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
                  aria-expanded={conComentarios === n.id}
                  onClick={() => setConComentarios(conComentarios === n.id ? null : n.id)}
                >
                  <MessageCircle size={14} aria-hidden />
                  {n.respuestas === 0
                    ? "Comentar"
                    : `${n.respuestas} ${n.respuestas === 1 ? "comentario" : "comentarios"}`}
                </button>
              </div>

              {conComentarios === n.id && (
                <Comentarios
                  novedadId={n.id}
                  alPublicar={() =>
                    setNovedades((prev) =>
                      (prev ?? []).map((x) =>
                        x.id === n.id ? { ...x, respuestas: x.respuestas + 1 } : x,
                      ),
                    )
                  }
                />
              )}
            </div>
          </article>
        )
      })}
      </div>
    </section>
  )
}
