"use client"

// PULSO 144 — el ritual semanal.
//
// Una pregunta por semana. Se responde, se leen las de los demás, y la semana
// siguiente hay otra. Es lo que hace que alguien vuelva: algo cambió desde la
// última vez, y no lo cambió él.
//
// ── DISEÑADO PARA EMPEZAR VACÍO ────────────────────────────────────────────
// Hoy la plataforma no tiene usuarios. Un contador que diga "0 personas han
// participado" comunica que esto está muerto, y quien lo vea se va.
//
// Por eso aquí el vacío NO es un caso excepcional, es el caso principal:
//   · Sin respuestas no se muestra ningún número, sino una invitación.
//   · El contador y los avatares aparecen solo a partir de la segunda persona,
//     que es cuando decir cuántos son aporta algo.
//   · La pregunta es siempre lo primero y lo más grande. Funciona igual para
//     una persona sola que para cincuenta, porque responderla ya vale por sí.

import { useCallback, useEffect, useState } from "react"
import { Activity, ArrowRight, Send, Pencil, Trash2, Heart } from "lucide-react"
import s from "./pulso.module.css"

type Respuesta = {
  id: string
  cuerpo: string
  creadoEn: string
  esMia: boolean
  autor: { nombre: string; avatar: string | null }
  corazones: number
  miCorazon: boolean
}

type Pulso = {
  id: string
  numero: number
  pregunta: string
  invitacion: string
  practica: { titulo: string | null; url: string; duracion: string | null } | null
  diasRestantes: number
}

type Datos = {
  pulso: Pulso | null
  respuestas: Respuesta[]
  miRespuesta: string | null
  miRespuestaCorazones: number
  total: number
}

/**
 * Los pasos del ritual.
 *
 * Están escritos para que los tres se puedan hacer sin nadie más. En los
 * mockups eran cuatro e incluían "lee a otros" y "responde a alguien", que hoy
 * no se pueden cumplir: prometerlos sería mentir.
 */
const PASOS = [
  { n: "1", titulo: "Detente", texto: "Lee la pregunta y quédate con ella un momento antes de contestar." },
  { n: "2", titulo: "Observa", texto: "Durante la semana, fíjate en lo que va apareciendo. No hay respuestas correctas." },
  { n: "3", titulo: "Escribe", texto: "Comparte lo que viste. Queda aquí para quien llegue después." },
]

/** Variante compacta para la home; completa para La Red. */
type Props = {
  compacto?: boolean
  /** En la portada, el compacto no responde: lleva a La Red a hacerlo. */
  onIrALaRed?: () => void
}

export function PulsoSemana({ compacto = false, onIrALaRed }: Props) {
  const [datos, setDatos] = useState<Datos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [texto, setTexto] = useState("")
  const [editando, setEditando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/pulso", { credentials: "include" })
      if (!res.ok) { setDatos(null); return }
      const json = (await res.json()) as Datos
      setDatos(json)
      setTexto(json.miRespuesta ?? "")
    } catch {
      setDatos(null)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { void cargar() }, [cargar])

  const publicar = async () => {
    if (!datos?.pulso || texto.trim().length === 0) return
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch("/api/pulso", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pulsoId: datos.pulso.id, cuerpo: texto }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError((j as { error?: string }).error ?? "No se pudo publicar")
        return
      }
      setEditando(false)
      await cargar()
    } catch {
      setError("Sin conexión")
    } finally {
      setEnviando(false)
    }
  }

  /**
   * Pone o quita el corazón de una respuesta.
   *
   * Cambia el número ANTES de hablar con el servidor y lo deshace si falla.
   * Esperar a la respuesta de red para pintar un corazón hace que el botón
   * parezca roto en un móvil con mala cobertura, que es donde más se usa.
   */
  const alternarCorazon = async (r: Respuesta) => {
    const quitando = r.miCorazon

    setDatos((d) =>
      d
        ? {
            ...d,
            respuestas: d.respuestas.map((x) =>
              x.id === r.id
                ? { ...x, miCorazon: !quitando, corazones: x.corazones + (quitando ? -1 : 1) }
                : x,
            ),
          }
        : d,
    )

    try {
      const res = quitando
        ? await fetch(`/api/pulso/corazon?respuestaId=${encodeURIComponent(r.id)}`, {
            method: "DELETE",
            credentials: "include",
          })
        : await fetch("/api/pulso/corazon", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ respuestaId: r.id }),
          })
      if (!res.ok) throw new Error("falló")
    } catch {
      // Se vuelve al estado real. Sin este paso el contador se quedaría
      // mintiendo hasta que alguien recargara la página.
      setDatos((d) =>
        d
          ? {
              ...d,
              respuestas: d.respuestas.map((x) =>
                x.id === r.id
                  ? { ...x, miCorazon: quitando, corazones: x.corazones + (quitando ? 1 : -1) }
                  : x,
              ),
            }
          : d,
      )
    }
  }

  const borrar = async () => {
    if (!datos?.pulso) return
    setEnviando(true)
    try {
      await fetch(`/api/pulso?pulsoId=${datos.pulso.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      setTexto("")
      setEditando(false)
      await cargar()
    } finally {
      setEnviando(false)
    }
  }

  // Mientras carga no se pinta un esqueleto parpadeante: se reserva el hueco.
  if (cargando) return <div className={s.cargando} aria-hidden />

  // Sin pulso publicado la sección no existe. Mejor ausente que vacía.
  if (!datos?.pulso) return null

  const p = datos.pulso
  const yaRespondi = datos.miRespuesta !== null
  const otras = datos.respuestas.filter((r) => !r.esMia)

  // ── La portada: un aviso, no la sección entera ──────────────────────────
  // Antes el compacto ocupaba media pantalla en el móvil y empujaba las
  // temporadas muy abajo. Aquí solo va lo que hace falta para decidir entrar.
  if (compacto) {
    return (
      <button type="button" className={s.aviso} onClick={onIrALaRed}>
        <span className={s.avisoFondo} aria-hidden />
        <span className={s.avisoContenido}>
          <span className={s.avisoCabecera}>
            <span className={s.marca}><Activity size={13} /> Pulso de la semana</span>
            <span className={s.dias}>
              {p.diasRestantes === 0 ? "Último día"
                : p.diasRestantes === 1 ? "Queda 1 día"
                : `Quedan ${p.diasRestantes} días`}
            </span>
          </span>
          <span className={s.avisoPregunta}>{p.pregunta}</span>
          <span className={s.avisoPie}>
            {yaRespondi ? "Ya respondiste · ver las demás" : "Responder"}
            <ArrowRight size={14} aria-hidden />
          </span>
        </span>
      </button>
    )
  }

  return (
    <section className={compacto ? s.pulsoCompacto : s.pulso}>
      <span className={s.estrellas} aria-hidden />
      <header className={s.cabecera}>
        <div className={s.marca}>
          <Activity size={14} />
          <span>Pulso de la semana</span>
        </div>
        {/* Los días que quedan dan urgencia sin necesitar a nadie más. */}
        <span className={s.dias}>
          {p.diasRestantes === 0
            ? "Último día"
            : p.diasRestantes === 1
              ? "Queda 1 día"
              : `Quedan ${p.diasRestantes} días`}
        </span>
      </header>

      {/* Dos columnas en escritorio: sin esto la pregunta queda flotando sola
          en una caja muy ancha, que es como se veía antes. */}
      <div className={compacto ? s.cuerpoCompacto : s.cuerpo}>
        <div className={s.principal}>
          <h2 className={compacto ? s.preguntaCompacta : s.pregunta}>{p.pregunta}</h2>
          {!compacto && p.invitacion && <p className={s.invitacion}>{p.invitacion}</p>}

        </div>

        {/* Lateral: la práctica si la hay, y si no los pasos del ritual. En
            móvil va debajo; en escritorio, al lado. */}
        {!compacto && (
          <aside className={s.lateral}>
            {p.practica ? (
              <a href={p.practica.url} target="_blank" rel="noopener noreferrer" className={s.practica}>
                <span className={s.practicaKicker}>Práctica de esta semana</span>
                <span className={s.practicaTitulo}>{p.practica.titulo ?? "Meditación guiada"}</span>
                {p.practica.duracion && <span className={s.practicaDuracion}>{p.practica.duracion}</span>}
              </a>
            ) : (
              <div className={s.pasos}>
                <p className={s.pasosKicker}>Cómo se hace</p>
                {PASOS.map((x) => (
                  <div key={x.n} className={s.paso}>
                    <span className={s.pasoNum}>{x.n}</span>
                    <span className={s.pasoTextos}>
                      <span className={s.pasoTitulo}>{x.titulo}</span>
                      <span className={s.pasoTexto}>{x.texto}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── Tu respuesta ─────────────────────────────────────────────────── */}
      {yaRespondi && !editando ? (
        <div className={s.miRespuesta}>
          <p className={s.miRespuestaKicker}>Tu respuesta de esta semana</p>
          <p className={s.miRespuestaTexto}>{datos.miRespuesta}</p>
          {/* Solo cuando hay alguno. Un "0 corazones" bajo lo que acabas de
              escribir dice que a nadie le importó, y no es verdad: es que
              todavía no ha entrado nadie. */}
          {datos.miRespuestaCorazones > 0 && (
            <p className={s.miRespuestaCorazones}>
              <Heart size={12} aria-hidden />
              {datos.miRespuestaCorazones === 1
                ? "Una persona resonó con esto"
                : `${datos.miRespuestaCorazones} personas resonaron con esto`}
            </p>
          )}
          <div className={s.miRespuestaAcciones}>
            <button type="button" className={s.accionMenor} onClick={() => setEditando(true)}>
              <Pencil size={12} /> Editar
            </button>
            <button type="button" className={s.accionMenor} onClick={borrar} disabled={enviando}>
              <Trash2 size={12} /> Borrar
            </button>
          </div>
        </div>
      ) : (
        <div className={s.responder}>
          <textarea
            className={s.campo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Lo que estás observando esta semana…"
            rows={compacto ? 2 : 3}
            maxLength={2000}
          />
          {error && <p className={s.error}>{error}</p>}
          <button
            type="button"
            className={s.publicar}
            onClick={publicar}
            disabled={enviando || texto.trim().length === 0}
          >
            <Send size={14} /> {yaRespondi ? "Guardar cambios" : "Compartir mi observación"}
          </button>
        </div>
      )}

      {/* ── Las demás ────────────────────────────────────────────────────── */}
      {/* Con nadie más, una invitación. NUNCA un "0 participando": eso dice
          que el sitio está vacío y hace que quien entra se vaya. */}
      {otras.length === 0 ? (
        <p className={s.invitacionVacia}>
          {yaRespondi
            ? "Eres la primera persona en responder esta semana. Lo que escribas queda aquí para quien llegue después."
            : "Nadie ha respondido todavía. Puedes ser la primera voz de esta semana."}
        </p>
      ) : (
        <div className={s.otras}>
          <p className={s.otrasKicker}>
            {/* El número aparece solo cuando decirlo aporta algo. */}
            {otras.length === 1
              ? "Otra persona respondió esta semana"
              : `${otras.length} personas respondieron esta semana`}
          </p>
          <div className={compacto ? undefined : s.rejilla}>
          {(compacto ? otras.slice(0, 2) : otras).map((r) => (
            <article key={r.id} className={s.otra}>
              <div className={s.otraAutor}>
                {r.autor.avatar
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={r.autor.avatar} alt="" className={s.otraAvatar} />
                  : <span className={s.otraAvatarVacio} aria-hidden>{r.autor.nombre.charAt(0)}</span>}
                <span className={s.otraNombre}>{r.autor.nombre}</span>
              </div>
              <p className={s.otraTexto}>{r.cuerpo}</p>
              {/* En la portada no: allí toda la tarjeta es un enlace a La Red
                  y un botón dentro de otro botón no se puede pulsar. */}
              {!compacto && (
                <button
                  type="button"
                  className={r.miCorazon ? s.corazonPuesto : s.corazon}
                  onClick={() => void alternarCorazon(r)}
                  aria-pressed={r.miCorazon}
                  aria-label={r.miCorazon ? "Quitar mi corazón" : "Resonar con esto"}
                >
                  <Heart size={14} aria-hidden fill={r.miCorazon ? "currentColor" : "none"} />
                  {r.corazones > 0 && <span>{r.corazones}</span>}
                  <span className={s.corazonTexto}>
                    {r.miCorazon ? "Resonaste" : "Resonar"}
                  </span>
                </button>
              )}
            </article>
          ))}
          </div>
        </div>
      )}
    </section>
  )
}
