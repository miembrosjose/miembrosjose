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
import { MapPin } from "lucide-react"
import { AVISO_DOS_CAPAS } from "../../_lib/cartografia-estelar/content/avisos"
import type { Nacimiento } from "../../_lib/cartografia-estelar/domain/types"
import { buscarCiudades, type CiudadEncontrada } from "../../_lib/cartografia-estelar/geo/ciudades"
import { CabeceraRecurso } from "../CabeceraRecurso"
import s from "./cartografia.module.css"

export function FormularioNacimiento({ onTrazar, error }: {
  onTrazar: (n: Nacimiento) => void
  error: string | null
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

  const hallazgo = useMemo(
    () => (lugar ? { estado: "corto" as const } : buscarCiudades(busqueda)),
    [busqueda, lugar],
  )
  const sugerencias = hallazgo.estado === "ok" ? hallazgo.ciudades : []
  const listo = Boolean(fecha && hora && lugar)

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
      {/* «Compara tu nacimiento con 50 puntos del cielo» decía lo que hace el
          cálculo, no lo que vas a ver. Ahora lo dice. */}
      <CabeceraRecurso
        kicker="Cartografía Estelar 144"
        titulo="Traza tu cartografía"
        entrada="Calculamos el cielo del instante exacto en que naciste y lo comparamos con 50 puntos elegidos: estrellas, cúmulos, nebulosas, galaxias y centros del universo."
        matiz="Los que quedaron más cerca forman tu mapa. Cada uno se abre en dos capas separadas: lo que la astronomía sabe de él, y su lectura dentro de los 144."
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
          ) : (
            <>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escribe una ciudad…"
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

              {/* ── CUANDO NO HAY NADA, HAY QUE DECIRLO ────────────────────
                  Antes esto no existía: la lista salía vacía y la única pista
                  era el texto de abajo repitiendo que el lugar hace falta.
                  Así que la gente escribía su ciudad una y otra vez, sin
                  saber que el problema era que no estaba en la lista. Es el
                  fallo que trajo a José, y el silencio era la mitad de él. */}
              {hallazgo.estado === "vacio" && (
                <p className={s.sinCiudad}>
                  No encontramos «{busqueda.trim()}».
                  {" "}Prueba solo con el nombre de la ciudad, sin el país. Y si es un
                  pueblo pequeño, usa <strong>la ciudad grande más cercana</strong>: unos
                  kilómetros no cambian tu Ascendente.
                </p>
              )}

              <small className={s.ayuda}>
                {/* Que hay que ELEGIRLA de la lista no se decía en ninguna
                    parte, y es el paso donde se atascaba todo el mundo. */}
                Escribe y <strong>elige una de la lista</strong>. Hace falta: sin el lugar
                no se puede calcular tu Ascendente.
              </small>
            </>
          )}
        </div>

        {error && <p className={s.error}>{error}</p>}

        <button type="submit" className={s.primario} disabled={!listo}>
          Trazar mi cartografía
        </button>

        <p className={s.privacidad}>
          Todo el cálculo ocurre en tu dispositivo. Nada se guarda en ningún servidor.
        </p>
        <details className={s.avisoPlegado}>
          <summary>Aviso sobre cálculo e interpretación</summary>
          <p>{AVISO_DOS_CAPAS}</p>
        </details>
      </form>
    </>
  )
}
