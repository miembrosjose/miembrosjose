"use client"

// ENCUENTROS PRESENCIALES — la tercera pestaña de La Red.
//
// Quién puede convocar lo decide la BASE DE DATOS, no esta pantalla: la policy
// de INSERT sobre network_meetings exige el rol de Organizador vigente. Aquí el
// formulario se oculta por comodidad, pero si alguien lo forzara, la base lo
// rechazaría igual. Por eso el botón se muestra según `puedo_convocar`, que
// viene del servidor, y no según nada que se guarde en el navegador.
//
// PRIVACIDAD: un encuentro se ancla a una CIUDAD del catálogo. El lugar es
// texto libre pensado para un sitio público. No se geocodifica ni se guardan
// coordenadas propias.

import { useCallback, useEffect, useState } from "react"
import { CalendarPlus, MapPin, Users, Loader2, X, Check, Clock, Pencil, MessageCircle, ChevronDown, Video, Trash2 } from "lucide-react"
import Link from "next/link"
import { useView } from "../_lib/view-context"
import styles from "./encuentros-red.module.css"

type Encuentro = {
  id: number
  titulo: string
  descripcion: string
  lugar: string
  starts_at: string
  ends_at: string | null
  cupo: number | null
  estado: "borrador" | "publicado" | "cancelado"
  modalidad: "online" | "presencial"
  /** Solo llega a quien organiza, modera o confirmó asistencia. */
  enlace: string | null
  soy_organizador: boolean
  /** Un administrador puede moderar cualquier encuentro, no solo los suyos. */
  puedo_moderar?: boolean
  ciudad: { id: number; name: string; admin1: string | null } | null
  country: string
  asistentes: number
  mi_asistencia: "voy" | "quizas" | null
}

type Asistente = {
  id: string
  estado: string
  full_name: string
  username: string | null
  avatar_url: string | null
  is_self: boolean
}

type Pais = { code: string; name: string; flag: string }
type Ciudad = { id: number; name: string; label: string }

/** Cuánto falta, en palabras. La urgencia no depende de cuánta gente vaya. */
function faltan(iso: string): string | null {
  const dias = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (!Number.isFinite(dias) || dias < 0) return null
  if (dias === 0) return "Hoy"
  if (dias === 1) return "Mañana"
  if (dias <= 14) return `En ${dias} días`
  return null
}

function cuando(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("es-419", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
  })
}

/**
 * Cómo funciona un encuentro, en tres pasos.
 *
 * En el boceto eran cuatro e incluían "conoce a otros miembros". Con la Red
 * empezando, ese paso no se puede cumplir: prometerlo sería mentir. Los tres
 * que quedan funcionan desde el primer encuentro con una sola persona.
 */
const PASOS_ENCUENTRO = [
  { n: "1", titulo: "Descubre", texto: "Mira lo que se ha convocado y elige uno." },
  { n: "2", titulo: "Confirma", texto: "Di que vas. Quien organiza sabe con quién cuenta." },
  { n: "3", titulo: "Vive y comparte", texto: "Después del encuentro, cuenta qué te llevaste." },
]

export function EncuentrosRed() {
  const [encuentros, setEncuentros] = useState<Encuentro[]>([])
  const [puedoConvocar, setPuedoConvocar] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const [guardando, setGuardando] = useState<string | null>(null)

  // Encuentro que se está editando, y encuentro cuya lista de asistentes está
  // desplegada. Solo uno de cada a la vez: son paneles, no ventanas.
  const [editando, setEditando] = useState<Encuentro | null>(null)
  const [verAsistentes, setVerAsistentes] = useState<number | null>(null)
  const [cuando_, setCuando] = useState<"proximos" | "pasados">("proximos")

  const { setView } = useView()

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const r = await fetch(
        cuando_ === "pasados" ? "/api/red/encuentros?pasados=1" : "/api/red/encuentros",
        { credentials: "include" },
      )
      if (!r.ok) throw new Error("No se pudieron cargar los encuentros")
      const d = await r.json()
      setEncuentros(d.encuentros || [])
      setPuedoConvocar(d.puedo_convocar === true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setCargando(false)
    }
  }, [cuando_])

  useEffect(() => { cargar() }, [cargar])

  const responder = useCallback(
    async (id: number, asistencia: "voy" | "quizas" | null) => {
      setGuardando(`a${id}`)
      try {
        const r = await fetch(`/api/red/encuentros/${id}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ asistencia }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d?.error || "No se pudo actualizar")
        setEncuentros((prev) =>
          prev.map((e) => {
            if (e.id !== id) return e
            const antes = e.mi_asistencia
            const delta = antes && !asistencia ? -1 : !antes && asistencia ? 1 : 0
            return { ...e, mi_asistencia: asistencia, asistentes: e.asistentes + delta }
          }),
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error")
      } finally {
        setGuardando(null)
      }
    },
    [],
  )

  // Eliminar de verdad. Solo para administradores: un encuentro con gente
  // apuntada se cancela, no se borra. Pero la basura —pruebas, duplicados,
  // cancelados viejos— alguien tiene que poder quitarla.
  const eliminar = useCallback(async (id: number, titulo: string) => {
    if (!window.confirm(`¿Eliminar definitivamente "${titulo}"? No se puede deshacer.`)) return
    setGuardando(`d${id}`)
    try {
      const r = await fetch(`/api/red/encuentros/${id}`, { method: "DELETE", credentials: "include" })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d?.error || "No se pudo eliminar")
      setEncuentros((prev) => prev.filter((e) => e.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo eliminar")
    } finally {
      setGuardando(null)
    }
  }, [])

  const cancelar = useCallback(async (id: number) => {
    setGuardando(`c${id}`)
    try {
      const r = await fetch(`/api/red/encuentros/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "cancelado" }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || "No se pudo cancelar")
      setEncuentros((prev) => prev.map((e) => (e.id === id ? { ...e, estado: "cancelado" } : e)))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setGuardando(null)
    }
  }, [])

  return (
    <div className={styles.wrap}>
      {puedoConvocar && (
        <button type="button" onClick={() => setFormAbierto((v) => !v)} className={styles.convocar}>
          <CalendarPlus size={14} aria-hidden />
          {formAbierto ? "Cerrar" : "Convocar un encuentro"}
        </button>
      )}

      {formAbierto && (
        <Formulario
          onListo={() => { setFormAbierto(false); cargar() }}
          onError={setError}
        />
      )}

      {/* Cómo funciona. Va antes de la lista porque cuando todavía no hay
          encuentros es lo único que explica para qué sirve esta pestaña. */}
      <div className={styles.pasosRitual}>
        {PASOS_ENCUENTRO.map((x) => (
          <div key={x.n} className={styles.pasoRitual}>
            <span className={styles.pasoRitualNum}>{x.n}</span>
            <span className={styles.pasoRitualTextos}>
              <span className={styles.pasoRitualTitulo}>{x.titulo}</span>
              <span className={styles.pasoRitualTexto}>{x.texto}</span>
            </span>
          </div>
        ))}
      </div>

      <div className={styles.cuando} role="tablist" aria-label="Cuándo">
        <button
          type="button" role="tab" aria-selected={cuando_ === "proximos"}
          onClick={() => setCuando("proximos")}
          className={`${styles.cuandoBtn} ${cuando_ === "proximos" ? styles.cuandoOn : ""}`}
        >
          Próximos
        </button>
        <button
          type="button" role="tab" aria-selected={cuando_ === "pasados"}
          onClick={() => setCuando("pasados")}
          className={`${styles.cuandoBtn} ${cuando_ === "pasados" ? styles.cuandoOn : ""}`}
        >
          Ya ocurridos
        </button>
      </div>

      {error && (
        <p className={styles.error} role="status">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Cerrar aviso">
            <X size={13} />
          </button>
        </p>
      )}

      {cargando ? (
        <p className={styles.cargando}><Loader2 size={14} className={styles.spin} /> Cargando encuentros…</p>
      ) : encuentros.length === 0 ? (
        <div className={styles.vacio}>
          <Users size={26} aria-hidden />
          <p>{cuando_ === "pasados" ? "Todavía no ha ocurrido ninguno." : "Todavía no hay encuentros convocados."}</p>
          {!puedoConvocar && (
            <span>
              Los convoca quien sostiene la función de Organizador. Si quieres reunir
              a la Red en tu ciudad, escríbenos.
            </span>
          )}
        </div>
      ) : (
        <ul className={styles.lista}>
          {encuentros
            .filter((e) => e.estado !== "cancelado" || e.soy_organizador || e.puedo_moderar)
            .map((e) => (
            <li key={e.id} className={`${styles.card} ${e.estado === "cancelado" ? styles.cancelado : ""}`}>
              <div className={styles.modalidad}>
                {e.modalidad === "online" ? (
                  <span className={styles.enLinea}><Video size={11} aria-hidden /> En línea</span>
                ) : (
                  <span className={styles.presencial}><MapPin size={11} aria-hidden /> Presencial</span>
                )}
                {faltan(e.starts_at) && <span className={styles.cuantoFalta}>{faltan(e.starts_at)}</span>}
              </div>

              <div className={styles.cabecera}>
                <h3 className={styles.titulo}>{e.titulo}</h3>
                {e.estado === "cancelado" && <span className={styles.sello}>Cancelado</span>}
                {e.estado === "borrador" && <span className={styles.selloBorrador}>Borrador</span>}
                {/* Editar y Eliminar van en su propio grupo. Sueltos en la
                    cabecera, cada uno se colocaba por su cuenta y en móvil
                    acababan montados encima del título. */}
                {(e.soy_organizador || e.puedo_moderar) && (
                  <div className={styles.accionesCabecera}>
                    <button
                      type="button"
                      onClick={() => setEditando(editando?.id === e.id ? null : e)}
                      className={styles.editar}
                      aria-label={`Editar ${e.titulo}`}
                      title="Editar este encuentro"
                    >
                      <Pencil size={12} aria-hidden /> Editar
                    </button>
                    {/* Solo administración. Va aquí y no entre las acciones de
                        asistencia porque también hace falta sobre borradores y
                        cancelados, que no muestran ese bloque. */}
                    {e.puedo_moderar && (
                      <button
                        type="button"
                        disabled={guardando === `d${e.id}`}
                        onClick={() => eliminar(e.id, e.titulo)}
                        className={styles.eliminar}
                        aria-label={`Eliminar ${e.titulo}`}
                        title="Eliminar definitivamente (solo administración)"
                      >
                        {guardando === `d${e.id}`
                          ? <Loader2 size={12} className={styles.spin} aria-hidden />
                          : <Trash2 size={12} aria-hidden />}
                        Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>

              {editando?.id === e.id && (
                <Formulario
                  encuentro={e}
                  onListo={() => { setEditando(null); cargar() }}
                  onError={setError}
                />
              )}

              <p className={styles.meta}>
                <Clock size={12} aria-hidden /> {cuando(e.starts_at)}
                {e.ends_at ? ` — ${hasta(e.ends_at)}` : ""}
              </p>
              {/* Un encuentro en línea no ocurre en ninguna ciudad: ocurre
                  en una plataforma. Enseñar un alfiler de mapa vacío hacía
                  que pareciera un presencial al que le faltaba el sitio. */}
              {e.modalidad === "online" ? (
                <p className={styles.meta}>
                  <Video size={12} aria-hidden />
                  {e.lugar || "En línea"}
                </p>
              ) : (
                <p className={styles.meta}>
                  <MapPin size={12} aria-hidden />
                  {e.ciudad ? `${e.ciudad.name}, ${e.country}` : e.country}
                  {e.lugar ? ` · ${e.lugar}` : ""}
                </p>
              )}

              {/* El enlace solo llega desde el servidor a quien organiza,
                  modera o ya confirmó. Aquí basta con pintarlo si vino. */}
              {e.modalidad === "online" && e.enlace && e.estado !== "cancelado" && (
                <a
                  href={e.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.entrar}
                >
                  <Video size={13} aria-hidden /> Entrar a la transmisión
                </a>
              )}

              {e.descripcion && <p className={styles.desc}>{e.descripcion}</p>}

              <button
                type="button"
                onClick={() => setVerAsistentes(verAsistentes === e.id ? null : e.id)}
                className={styles.asistentes}
                aria-expanded={verAsistentes === e.id}
                disabled={e.asistentes === 0}
              >
                <Users size={12} aria-hidden />
                {e.asistentes === 1 ? "1 persona" : `${e.asistentes} personas`}
                {e.cupo ? ` de ${e.cupo}` : ""}
                {e.asistentes > 0 && (
                  <ChevronDown
                    size={12}
                    aria-hidden
                    style={{ transform: verAsistentes === e.id ? "rotate(180deg)" : undefined }}
                  />
                )}
              </button>

              {verAsistentes === e.id && (
                <Asistentes
                  meetingId={e.id}
                  puedeEscribir={e.soy_organizador}
                  onAbrirMensaje={(uid) => setView("messages", null, { withUserId: uid })}
                />
              )}

              {e.estado === "publicado" && cuando_ === "proximos" && (
                <div className={styles.acciones}>
                  <button
                    type="button"
                    disabled={guardando === `a${e.id}`}
                    onClick={() => responder(e.id, e.mi_asistencia === "voy" ? null : "voy")}
                    className={`${styles.btn} ${e.mi_asistencia === "voy" ? styles.btnOn : ""}`}
                  >
                    {guardando === `a${e.id}`
                      ? <Loader2 size={12} className={styles.spin} />
                      : e.mi_asistencia === "voy" ? <Check size={12} /> : null}
                    Voy
                  </button>
                  <button
                    type="button"
                    disabled={guardando === `a${e.id}`}
                    onClick={() => responder(e.id, e.mi_asistencia === "quizas" ? null : "quizas")}
                    className={`${styles.btn} ${e.mi_asistencia === "quizas" ? styles.btnOn : ""}`}
                  >
                    Quizás
                  </button>
                  {(e.soy_organizador || e.puedo_moderar) && (
                    <button
                      type="button"
                      disabled={guardando === `c${e.id}`}
                      onClick={() => cancelar(e.id)}
                      className={styles.btnCancelar}
                      title="Un encuentro publicado se cancela; no se borra, porque hay gente apuntada"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Formulario de convocatoria ──────────────────────────────────────────────
/**
 * Convoca un encuentro nuevo o edita uno existente. Es el mismo formulario: la
 * única diferencia es a dónde se envía y con qué valores arranca.
 */
function Formulario({
  encuentro, onListo, onError,
}: {
  encuentro?: Encuentro
  onListo: () => void
  onError: (s: string) => void
}) {
  const editar = encuentro !== undefined

  const [paises, setPaises] = useState<Pais[]>([])
  // En línea o presencial. Un encuentro en línea no tiene ciudad: tiene un
  // enlace. Sin esto no se podían convocar las meditaciones globales.
  //
  // Al EDITAR arrancan con lo que ya tiene el encuentro. Antes arrancaban
  // siempre en presencial y con el enlace en blanco: abrir una transmisión
  // para corregirle la hora la mostraba como presencial, y guardar borraba su
  // enlace. De ahí que "Publicar" no se activara nunca y que "Entrar a la
  // transmisión" no llevara a ninguna parte.
  const [esOnline, setEsOnline] = useState(encuentro?.modalidad === "online")
  const [enlace, setEnlace] = useState(encuentro?.enlace ?? "")
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [pais, setPais] = useState("")
  const [cityId, setCityId] = useState<number | "">(encuentro?.ciudad?.id ?? "")
  const [titulo, setTitulo] = useState(encuentro?.titulo ?? "")
  const [descripcion, setDescripcion] = useState(encuentro?.descripcion ?? "")
  const [lugar, setLugar] = useState(encuentro?.lugar ?? "")
  // El input datetime-local quiere hora LOCAL sin zona; lo que llega es UTC.
  const [inicio, setInicio] = useState(
    encuentro ? paraInput(encuentro.starts_at) : "",
  )
  const [fin, setFin] = useState(encuentro?.ends_at ? paraInput(encuentro.ends_at) : "")
  const [cupo, setCupo] = useState(encuentro?.cupo != null ? String(encuentro.cupo) : "")

  // El campo no deja elegir nada anterior a ahora. Es una comodidad: la regla
  // de verdad la aplica el servidor, que no se fía del navegador.
  const ahora = paraInput(new Date().toISOString())
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    fetch("/api/red/ciudades", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.paises) setPaises(d.paises) })
      .catch(() => { /* sin países no se puede elegir ciudad */ })
  }, [])

  useEffect(() => {
    if (!pais) { setCiudades([]); setCityId(""); return }
    fetch(`/api/red/ciudades?pais=${encodeURIComponent(pais)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCiudades(d?.ciudades || []))
      .catch(() => setCiudades([]))
  }, [pais])

  // La gente escribe "meet.google.com/abc" o "zoom.us/j/123", sin https://.
  // Exigir el esquema dejaba el botón apagado para siempre sin explicar nada.
  const enlaceNormalizado = (() => {
    const t = enlace.trim()
    if (!t) return ""
    if (/^https?:\/\//i.test(t)) return t
    // Solo si parece un dominio: no convertimos cualquier texto en URL.
    if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(t)) return `https://${t}`
    return t
  })()

  const enviar = async (publicar: boolean) => {
    setEnviando(true)
    try {
      const cuerpo: Record<string, unknown> = {
        titulo, descripcion, lugar,
        starts_at: inicio ? new Date(inicio).toISOString() : "",
        ends_at: fin ? new Date(fin).toISOString() : null,
        cupo: cupo === "" ? null : Number(cupo),
      }
      cuerpo.modalidad = esOnline ? "online" : "presencial"
      if (esOnline) {
        cuerpo.enlace = enlaceNormalizado
      } else if (cityId !== "") {
        // Al editar, la ciudad solo se manda si se cambió: el servidor la
        // revalida contra el catálogo y de ella deriva el país.
        cuerpo.city_id = cityId
      }
      if (editar) cuerpo.estado = publicar ? "publicado" : "borrador"
      else cuerpo.publicar = publicar

      const r = await fetch(
        editar ? `/api/red/encuentros/${encuentro!.id}` : "/api/red/encuentros",
        {
          method: editar ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cuerpo),
        },
      )
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || (editar ? "No se pudo guardar" : "No se pudo crear"))
      onListo()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Error")
    } finally {
      setEnviando(false)
    }
  }

  const enElPasado = inicio !== "" && new Date(inicio).getTime() < Date.now()
  const finAntes = fin !== "" && inicio !== "" && new Date(fin) < new Date(inicio)
  // Un presencial necesita ciudad; un online, enlace. Antes se pedía ciudad
  // siempre, y por eso no había forma de convocar una transmisión.
  const listo = Boolean(titulo.trim()) && Boolean(inicio) &&
    (esOnline ? /^https?:\/\//i.test(enlaceNormalizado) : cityId !== "")
  const yaPublicado = encuentro?.estado === "publicado"

  // Un botón apagado que no dice por qué es un callejón sin salida. Esto
  // enumera lo que falta, y desaparece en cuanto está todo.
  const falta: string[] = []
  if (!titulo.trim()) falta.push("un título")
  if (!inicio) falta.push("la fecha y hora de inicio")
  if (esOnline && !/^https?:\/\//i.test(enlaceNormalizado)) falta.push("el enlace de la transmisión")
  if (!esOnline && cityId === "") falta.push("la ciudad")

  return (
    <form className={styles.form} onSubmit={(e) => { e.preventDefault(); if (listo) enviar(true) }}>
      {/* La modalidad va primero porque decide qué campos hacen falta
          después: una ciudad, o un enlace. */}
      <div className={styles.modalidadElegir} role="group" aria-label="Modalidad">
        <button
          type="button"
          onClick={() => setEsOnline(false)}
          className={!esOnline ? styles.modalidadOn : styles.modalidadOff}
          aria-pressed={!esOnline}
        >
          <MapPin size={13} aria-hidden /> Presencial
        </button>
        <button
          type="button"
          onClick={() => setEsOnline(true)}
          className={esOnline ? styles.modalidadOn : styles.modalidadOff}
          aria-pressed={esOnline}
        >
          <Video size={13} aria-hidden /> En línea
        </button>
      </div>

      <label className={styles.label}>
        Título
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={160} className={styles.input} />
      </label>

      {esOnline ? (
        <label className={styles.label}>
          Enlace de la transmisión
          <input
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            maxLength={600}
            placeholder="https://zoom.us/j/…"
            className={styles.input}
          />
          <span className={styles.ayuda}>
            Zoom, YouTube en vivo o donde vayas a transmitir. Quien confirme verá
            este enlace en la tarjeta del encuentro.
          </span>
        </label>
      ) : (
      <div className={styles.fila}>
        <label className={styles.label}>
          País
          <select value={pais} onChange={(e) => setPais(e.target.value)} className={styles.input}>
            <option value="">Elige un país</option>
            {paises.map((p) => <option key={p.code} value={p.code}>{p.flag} {p.name}</option>)}
          </select>
        </label>
        <label className={styles.label}>
          Ciudad
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : "")}
            className={styles.input}
            disabled={!pais}
          >
            <option value="">{pais ? "Elige una ciudad" : "Elige antes un país"}</option>
            {ciudades.map((c) => <option key={c.id} value={c.id}>{c.label || c.name}</option>)}
          </select>
        </label>
      </div>
      )}

      <label className={styles.label}>
        Lugar
        <input
          value={lugar}
          onChange={(e) => setLugar(e.target.value)}
          maxLength={300}
          placeholder={esOnline ? "Zoom, YouTube en vivo…" : "Un sitio público: una plaza, un parque, un local"}
          className={styles.input}
        />
        <span className={styles.ayuda}>
          Nunca un domicilio. Este texto lo ve toda la Red.
        </span>
      </label>

      <div className={styles.fila}>
        <label className={styles.label}>
          Empieza
          <input
            type="datetime-local"
            value={inicio}
            min={ahora}
            onChange={(e) => setInicio(e.target.value)}
            className={styles.input}
          />
        </label>
        <label className={styles.label}>
          {/* El "opcional" va en la MISMA línea que el rótulo. Suelto dentro
              de un label en columna se colocaba debajo, y entonces el campo
              de la derecha quedaba un renglón más abajo que el de al lado. */}
          <span className={styles.rotulo}>Termina <span className={styles.ayuda}>opcional</span></span>
          <input
            type="datetime-local"
            value={fin}
            min={inicio || ahora}
            onChange={(e) => setFin(e.target.value)}
            className={styles.input}
          />
        </label>
      </div>

      <div className={styles.fila}>
        <label className={styles.label}>
          <span className={styles.rotulo}>Cupo <span className={styles.ayuda}>opcional</span></span>
          <input type="number" min={1} value={cupo} onChange={(e) => setCupo(e.target.value)} className={styles.input} />
        </label>
        <span />
      </div>

      <label className={styles.label}>
        Descripción
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={4000}
          rows={4}
          className={styles.input}
        />
      </label>

      {enElPasado && <p className={styles.aviso}>Esa fecha ya pasó.</p>}
      {finAntes && <p className={styles.aviso}>El final no puede ser anterior al comienzo.</p>}

      {falta.length > 0 && (
        <p className={styles.falta}>
          Para publicar falta {falta.length === 1 ? falta[0] : `${falta.slice(0, -1).join(", ")} y ${falta[falta.length - 1]}`}.
        </p>
      )}

      <div className={styles.acciones}>
        <button type="submit" disabled={!listo || enviando} className={styles.btnPrimario}>
          {enviando ? <Loader2 size={12} className={styles.spin} /> : null}
          {editar ? (yaPublicado ? "Guardar cambios" : "Guardar y publicar") : "Publicar"}
        </button>
        {!yaPublicado && (
          <button
            type="button"
            disabled={!listo || enviando}
            onClick={() => enviar(false)}
            className={styles.btn}
          >
            Guardar como borrador
          </button>
        )}
      </div>
    </form>
  )
}

/** ISO en UTC → el valor que quiere un <input type="datetime-local"> (hora local). */
function paraInput(iso: string): string {
  const d = new Date(iso)
  const p = (x: number) => String(x).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Quién va a un encuentro. Se pide solo al desplegarlo. */
function Asistentes({
  meetingId, puedeEscribir, onAbrirMensaje,
}: {
  meetingId: number
  puedeEscribir: boolean
  onAbrirMensaje: (userId: string) => void
}) {
  const [gente, setGente] = useState<Asistente[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    fetch(`/api/red/encuentros/${meetingId}/asistentes`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vivo) setGente(d?.asistentes || []) })
      .catch(() => { if (vivo) setGente([]) })
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [meetingId])

  if (cargando) {
    return <p className={styles.cargando}><Loader2 size={13} className={styles.spin} /> Cargando…</p>
  }
  if (gente.length === 0) {
    return <p className={styles.cargando}>Todavía no se ha apuntado nadie.</p>
  }

  return (
    <ul className={styles.gente}>
      {gente.map((g) => (
        <li key={g.id} className={styles.persona}>
          {g.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={g.avatar_url} alt="" className={styles.retrato} />
            : <span className={styles.retrato}>{g.full_name.slice(0, 1).toUpperCase()}</span>}
          <span className={styles.personaNombre}>
            {g.full_name}
            {g.estado === "quizas" && <em className={styles.quizas}> · quizás</em>}
          </span>
          {puedeEscribir && !g.is_self && (
            <Link
              href={`/miembros/mensajes/${g.id}`}
              onClick={(ev) => {
                if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return
                ev.preventDefault()
                onAbrirMensaje(g.id)
              }}
              className={styles.escribir}
              aria-label={`Escribir a ${g.full_name}`}
            >
              <MessageCircle size={12} aria-hidden />
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Solo la hora del final: la fecha ya la dice el comienzo. */
function hasta(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit" })
}
