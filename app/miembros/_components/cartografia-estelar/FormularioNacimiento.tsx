"use client"

// CARTOGRAFÍA ESTELAR 144 — datos de nacimiento.
//
// ── POR QUÉ LA CIUDAD ES OBLIGATORIA ───────────────────────────────────────
// Las otras herramientas de la casa solo piden fecha y hora. Aquí hace falta
// el lugar por dos razones distintas:
//
//   1. El Ascendente depende de la latitud. Sin ella no se puede calcular.
//   2. La hora que alguien recuerda es la de SU reloj, y para convertirla a
//      tiempo universal hay que saber qué marcaba ese reloj ese día. Madrid en
//      junio de 1975 iba UTC+2; en enero, UTC+1.
//
// La ciudad se resuelve a zona horaria con `city-timezones`, que ya estaba en
// el proyecto. El desfase histórico lo aporta la base IANA del navegador.
//
// Nada de esto sale del dispositivo.
//
// ── CÓMO SE BUSCA LA CIUDAD, Y POR QUÉ NO SE BUSCA AQUÍ ───────────────────
// La búsqueda vive en `_lib/cartografia-estelar/geo/ciudades.ts` y se prueba
// con `npm run probar:ciudades`. Está fuera porque el fallo del 24-11-2026
// fue de búsqueda, no de pantalla: `lookupViaCity` exigía el nombre exacto, y
// la base guarda «Bogota» sin tilde, «Tucumán» con tilde y «Mexico City» en
// inglés. La gente escribía su ciudad bien, no salía nada, y el formulario
// seguía pidiendo el lugar. Ahora eso se puede comprobar sin abrir el
// navegador, que es lo que faltaba para que no vuelva a pasar.

import { useMemo, useState } from "react"
import { MapPin, Loader2, Compass } from "lucide-react"
import { AVISO_DOS_CAPAS } from "../../_lib/cartografia-estelar/content/avisos"
import type { Nacimiento } from "../../_lib/cartografia-estelar/domain/types"
import { buscarCiudades, type CiudadEncontrada } from "../../_lib/cartografia-estelar/geo/ciudades"
import { useCiudadesMundo, juntarSinRepetir } from "../../_lib/cartografia-estelar/geo/use-ciudades-mundo"
import { CabeceraRecurso } from "../CabeceraRecurso"
import s from "./cartografia.module.css"

/**
 * La zona horaria de unas coordenadas escritas a mano.
 *
 * No se puede saber: hace falta un mapa de husos, y eso son megas. Así que se
 * usa la del propio dispositivo y se DICE en pantalla, para que quien nació
 * en otro huso la corrija eligiendo una ciudad cercana.
 *
 * Es el último recurso de todos, para la aldea que no está en ninguna base.
 */
function zonaDelDispositivo(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

/**
 * Lo que este formulario dice de sí mismo.
 *
 * ── POR QUÉ ES UN PARÁMETRO Y NO TEXTO FIJO ───────────────────────────────
 * Lo usan DOS herramientas: la Cartografía Estelar y la Carta Astral. Piden
 * exactamente lo mismo —fecha, hora y lugar— y por eso comparten formulario:
 * la búsqueda de ciudad es complicada y arreglarla dos veces sería arreglarla
 * mal una de las dos.
 *
 * Pero compartir el formulario NO es compartir la portada. Con el texto fijo,
 * quien abría la Carta Astral leía «Traza tu cartografía» y «50 puntos del
 * cielo», que es otra herramienta. Daba la impresión de haber abierto la que
 * no era.
 */
export type Portada = {
  kicker: string
  titulo: string
  entrada: string
  matiz: string
  /** Lo que pone el botón. Un botón dice lo que va a pasar al pulsarlo. */
  accion: string
}

const PORTADA_CARTOGRAFIA: Portada = {
  kicker: "Cartografía Estelar 144",
  titulo: "Traza tu cartografía",
  entrada: "Calculamos el cielo del instante exacto en que naciste y lo comparamos con 50 puntos elegidos: estrellas, cúmulos, nebulosas, galaxias y centros del universo.",
  matiz: "Los que quedaron más cerca forman tu mapa. Cada uno se abre en dos capas separadas: lo que la astronomía sabe de él, y su lectura dentro de los 144.",
  accion: "Trazar mi cartografía",
}

export function FormularioNacimiento({ onTrazar, error, portada = PORTADA_CARTOGRAFIA }: {
  onTrazar: (n: Nacimiento) => void
  error: string | null
  portada?: Portada
}) {
  // Se reutiliza lo que ya escribió en Código de Origen, si está.
  const previo = useMemo(() => {
    try {
      const raw = localStorage.getItem("los144k_codigo_origen_last")
      return raw ? (JSON.parse(raw) as { anio: number; mes: number; dia: number; hora: number; minuto: number }) : null
    } catch { return null }
  }, [])

  const [fecha, setFecha] = useState(
    previo ? `${previo.anio}-${String(previo.mes).padStart(2, "0")}-${String(previo.dia).padStart(2, "0")}` : "",
  )
  const [hora, setHora] = useState(
    previo ? `${String(previo.hora).padStart(2, "0")}:${String(previo.minuto).padStart(2, "0")}` : "12:00",
  )
  const [busqueda, setBusqueda] = useState("")
  const [lugar, setLugar] = useState<CiudadEncontrada | null>(null)

  const [aMano, setAMano] = useState(false)
  const [latTexto, setLatTexto] = useState("")
  const [lonTexto, setLonTexto] = useState("")

  const hallazgo = useMemo(
    () => (lugar ? { estado: "corto" as const } : buscarCiudades(busqueda)),
    [busqueda, lugar],
  )
  const locales = hallazgo.estado === "ok" ? hallazgo.ciudades : []

  // Las 237.393 del servidor, por detrás. Ver use-ciudades-mundo.ts.
  const mundo = useCiudadesMundo(busqueda, !lugar && !aMano)
  const sugerencias = useMemo(
    () => juntarSinRepetir(locales, mundo.ciudades),
    [locales, mundo.ciudades],
  )

  // Nada encontrado en NINGUNA de las dos, y ya terminó de buscar.
  const sinNada =
    !lugar && !aMano && !mundo.buscando &&
    hallazgo.estado !== "corto" && sugerencias.length === 0

  const listo = Boolean(fecha && hora && lugar)

  /** Acepta «4.6097» y «4,6097»: en español la coma es lo natural. */
  const aNumero = (v: string) => Number(v.trim().replace(",", "."))
  const latNum = aNumero(latTexto)
  const lonNum = aNumero(lonTexto)
  const coordenadasValen =
    latTexto.trim() !== "" && lonTexto.trim() !== "" &&
    Number.isFinite(latNum) && Number.isFinite(lonNum) &&
    Math.abs(latNum) <= 90 && Math.abs(lonNum) <= 180

  const usarCoordenadas = () => {
    if (!coordenadasValen) return
    const zona = zonaDelDispositivo()
    setLugar({
      nombre: `${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`,
      provincia: "coordenadas escritas a mano",
      lat: latNum,
      lon: lonNum,
      zona,
    })
    setAMano(false)
  }

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lugar) return
    // Se parte por separadores, nunca con `new Date`: esa función
    // interpretaría la cadena en la zona de quien mira, no en la del
    // nacimiento, y una hora de desfase son quince grados de Ascendente.
    const [anio, mes, dia] = fecha.split("-").map((v) => parseInt(v, 10))
    const [h, min] = hora.split(":").map((v) => parseInt(v, 10))
    if ([anio, mes, dia, h, min].some((v) => !Number.isFinite(v))) return

    onTrazar({
      anio, mes, dia, hora: h, minuto: min,
      lugar: { nombre: lugar.nombre, latitud: lugar.lat, longitud: lugar.lon, zonaHoraria: lugar.zona },
    })
  }

  return (
    <>
      {/* El texto lo pone quien usa el formulario: lo comparten la
          Cartografía Estelar y la Carta Astral, y no son lo mismo. */}
      <CabeceraRecurso
        kicker={portada.kicker}
        titulo={portada.titulo}
        entrada={portada.entrada}
        matiz={portada.matiz}
      />

      <form onSubmit={enviar} className={s.form}>
        {previo && (
          <p className={s.heredada}>
            Tomamos tu fecha y hora de Código de Origen. Falta el lugar.
          </p>
        )}

        <label className={s.campo}>
          <span>Fecha de nacimiento</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className={s.input} />
        </label>

        <label className={s.campo}>
          <span>Hora de nacimiento</span>
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required className={s.input} />
          <small className={s.ayuda}>
            La de tu reloj local, tal como te la contaron.
          </small>
          {/* ── POR QUÉ ESTE AVISO ESTÁ AQUÍ Y NO EN UNA NOTA AL PIE ───────
              El campo viene con 12:00 puesto. Quien no sepa su hora deja ese
              12:00 y recibe un Ascendente que no es el suyo, sin enterarse de
              nada: la carta sale completa y con aspecto de ser correcta.

              Medido sobre una carta real: dos horas de desviación mueven el
              Ascendente de Acuario a Piscis. Otro signo, otra lectura entera.

              No se ofrece calcular «a medias» escondiendo el Ascendente,
              porque eso normaliza entrar con datos inventados. Lo que toca es
              decir dónde se busca el dato y quién lo deduce cuando no hay
              dónde buscarlo. */}
          <p className={s.avisoHora}>
            <strong>Si no la sabes, averíguala antes de seguir.</strong> Suele estar en tu
            partida o certificado de nacimiento. Si ahí no aparece, un astrólogo puede
            deducirla a partir de hechos de tu vida — se llama rectificación.
            <br />
            Sin la hora exacta, el <strong>Ascendente y las casas</strong> no son fiables.
            El resto de la carta sí.
          </p>
        </label>

        <div className={s.campo}>
          <span>Lugar de nacimiento</span>
          {lugar ? (
            <div className={s.lugarElegido}>
              <MapPin size={14} aria-hidden />
              <span>{lugar.nombre}</span>
              <span className={s.lugarZona}>{lugar.zona}</span>
              <button type="button" onClick={() => { setLugar(null); setBusqueda("") }} className={s.lugarCambiar}>
                Cambiar
              </button>
            </div>
          ) : aMano ? (
            /* ── EL ÚLTIMO RECURSO ──────────────────────────────────────
               Para la aldea que no está en ninguna base. Lo ofrecen todos
               los programas serios de astrología, y es la única forma de
               cubrir el cien por cien sin depender de nadie. */
            <div className={s.aMano}>
              <p className={s.ayuda}>
                Las coordenadas de tu lugar exacto. Las encuentras en cualquier mapa:
                busca el sitio, mantén pulsado y te las enseña.
              </p>
              <div className={s.aManoCampos}>
                <label>
                  <span>Latitud</span>
                  <input
                    type="text" inputMode="decimal" value={latTexto}
                    onChange={(e) => setLatTexto(e.target.value)}
                    placeholder="4,6097" className={s.input}
                  />
                </label>
                <label>
                  <span>Longitud</span>
                  <input
                    type="text" inputMode="decimal" value={lonTexto}
                    onChange={(e) => setLonTexto(e.target.value)}
                    placeholder="-74,0817" className={s.input}
                  />
                </label>
              </div>
              <p className={s.sinCiudad}>
                Con coordenadas a mano usamos la zona horaria de <strong>este
                dispositivo</strong> ({zonaDelDispositivo()}). Si naciste en otro huso,
                elige mejor una ciudad cercana de la lista: la zona importa tanto como
                el sitio.
              </p>
              <div className={s.aManoBotones}>
                <button
                  type="button" className={s.primario}
                  disabled={!coordenadasValen} onClick={usarCoordenadas}
                >
                  Usar estas coordenadas
                </button>
                <button type="button" className={s.lugarCambiar} onClick={() => setAMano(false)}>
                  Volver a buscar por nombre
                </button>
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escribe una ciudad o un pueblo…"
                className={s.input}
                autoComplete="off"
              />
              {sugerencias.length > 0 && (
                <ul className={s.sugerencias}>
                  {sugerencias.map((c, i) => (
                    <li key={i}>
                      <button type="button" onClick={() => setLugar(c)}>
                        <span>{c.nombre}</span>
                        <span className={s.sugerenciaZona}>{c.provincia || c.zona}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Mientras llegan las del servidor. Solo se enseña si lo local
                  no dio nada: con resultados en pantalla, un cargando debajo
                  solo inquieta. */}
              {mundo.buscando && sugerencias.length === 0 && (
                <p className={s.buscandoMundo}>
                  <Loader2 size={13} className={s.gira} aria-hidden />
                  Buscando entre todas las ciudades del mundo…
                </p>
              )}

              {/* ── CUANDO NO HAY NADA, HAY QUE DECIRLO ────────────────────
                  Antes esto no existía: la lista salía vacía y la única pista
                  era el texto de abajo repitiendo que el lugar hace falta.
                  Así que la gente escribía su ciudad una y otra vez, sin
                  saber que el problema era que no estaba en la lista. Es el
                  fallo que trajo a José, y el silencio era la mitad de él.
                  Ahora, además, ya no se le pide que aproxime: se le da una
                  salida exacta. */}
              {sinNada && !mundo.fallo && (
                <p className={s.sinCiudad}>
                  No encontramos «{busqueda.trim()}» entre las 1.300.000 localidades que
                  tenemos. Prueba solo con el nombre, sin el país — o escribe{" "}
                  <strong>las coordenadas exactas</strong>, que es lo más preciso.
                </p>
              )}

              {/* ── «NO HAY» Y «NO PUDE MIRAR» NO SON LO MISMO ─────────────
                  Cuando la búsqueda ampliada falla, antes salía el mismo
                  mensaje de «no encontramos»: o sea que la herramienta
                  afirmaba que un pueblo no existe cuando en realidad no
                  había podido comprobarlo. Eso no se dice si no se sabe. */}
              {mundo.fallo && (
                <p className={s.sinCiudad}>
                  Ahora mismo solo estamos buscando entre las ciudades principales:
                  la búsqueda ampliada no responde. Si tu pueblo no aparece, no es que
                  no esté — vuelve a intentarlo en un momento, o escribe{" "}
                  <strong>las coordenadas exactas</strong>.
                </p>
              )}

              <small className={s.ayuda}>
                {/* Que hay que ELEGIRLA de la lista no se decía en ninguna
                    parte, y es el paso donde se atascaba todo el mundo. */}
                Escribe y <strong>elige una de la lista</strong>. Hace falta: sin el lugar
                no se puede calcular tu Ascendente.{" "}
                <button type="button" className={s.enlaceSuelto} onClick={() => setAMano(true)}>
                  <Compass size={11} aria-hidden /> Escribir coordenadas
                </button>
              </small>
            </>
          )}
        </div>

        {error && <p className={s.error}>{error}</p>}

        <button type="submit" className={s.primario} disabled={!listo}>
          {portada.accion}
        </button>

        {/* ── LA PRIVACIDAD, DICHA COMO ES AHORA ──────────────────────────
            Antes ponía «nada se guarda en ningún servidor», y era verdad
            mientras las ciudades viajaban dentro de la aplicación. Con el
            buscador mundial, el NOMBRE que se escribe sí va al servidor. La
            fecha y la hora no, y el cálculo sigue ocurriendo aquí.

            Se reescribe en vez de dejarlo: una promesa de privacidad que ha
            dejado de ser exacta es peor que no haberla hecho. */}
        <p className={s.privacidad}>
          Tu fecha y tu hora de nacimiento <strong>no salen de este dispositivo</strong>, y
          el cálculo entero ocurre aquí. Lo único que viaja es el nombre de la ciudad
          mientras la buscas, para poder mirarla entre las 1.300.000 que tenemos.
        </p>

        {/* GeoNames es CC BY 4.0: el crédito es obligatorio. Si se quita de
            aquí, se incumple la licencia. */}
        <p className={s.credito}>
          Datos de ciudades de{" "}
          <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a>
          {" "}(CC BY 4.0).
        </p>
        <details className={s.avisoPlegado}>
          <summary>Aviso sobre cálculo e interpretación</summary>
          <p>{AVISO_DOS_CAPAS}</p>
        </details>
      </form>
    </>
  )
}
