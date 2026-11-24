// ═══════════════════════════════════════════════════════════════════════════
//  LA CARTA, CALCULADA AQUÍ MISMO
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ NO SE USA NINGUNA LIBRERÍA DE ASTROLOGÍA ──────────────────────
// Las que hay —Kerykeion, pyswisseph, AstrologerStudio— van todas contra la
// Swiss Ephemeris, y la Swiss Ephemeris es AGPL o de pago. Astrodienst lo dice
// con estas palabras: la opción libre obliga a «place his or her whole
// software project under the AGPL or a compatible license». O sea, publicar el
// código de TODA la plataforma de Los 144.000. La alternativa son 700,00 CHF.
//
// Aquí se usa `astronomy-engine` (MIT, Don Cross), que ya estaba en el
// proyecto para la Cartografía Estelar: sin copyleft, sin atribución visible
// obligatoria y sin coste. Da los diez cuerpos, el tiempo sideral y las
// rotaciones entre sistemas de coordenadas con precisión de ±1 minuto de
// arco. Lo que no da —Ascendente, Medio Cielo, nodos— son fórmulas
// astronómicas estándar, y una fórmula no se licencia.
//
// ── LA ECLÍPTICA DE LA FECHA, NO LA DE J2000 ──────────────────────────────
// La astrología tropical mide desde el punto vernal DEL DÍA DEL NACIMIENTO,
// que se desplaza unos 1,4° por siglo por la precesión. Para un nacimiento de
// 1950 la diferencia contra J2000 ronda los 0,7°: un planeta a 29°50' de un
// signo se iría al siguiente. En la frontera, medio grado cambia la lectura.
//
// Aquí se rota explícitamente con `Rotation_EQJ_ECT`. Conviene saber que
// `A.Ecliptic()` hace exactamente lo mismo —su documentación dice «converts a
// J2000 mean equator (EQJ) vector to a true ecliptic of date (ETC) vector»—,
// así que las dos vías coinciden al milésimo de grado y la Cartografía
// Estelar, que usa `A.Ecliptic()`, también está en el sistema correcto.
//
// Se deja la rotación a la vista de todas formas: el nombre `Ecliptic` no dice
// en qué marco deja el resultado, y eso es justo la clase de detalle que se
// lee mal una vez y desplaza una carta entera. Hay una prueba que ancla la
// equivalencia, para que se note si la librería cambiara de criterio.
//
// Nada de esto sale del dispositivo: se calcula en el navegador, igual que la
// Cartografía.

import * as A from "astronomy-engine"
import { type SignoId, signoDeGrado, gradoEnSigno } from "../contenido/signos"
import {
  type Casa, type SistemaCasas,
  casasPlacidus, casasSignosEnteros, casaDe,
} from "./casas"
import { type Aspecto, calcularAspectos } from "./aspectos"

const GRADOS = 180 / Math.PI
const RADIANES = Math.PI / 180

/** 0 ≤ ángulo < 360. */
function normalizar(g: number): number {
  return ((g % 360) + 360) % 360
}

export type PuntoId =
  | "sol" | "luna" | "mercurio" | "venus" | "marte"
  | "jupiter" | "saturno" | "urano" | "neptuno" | "pluton"
  | "nodo_norte" | "ascendente" | "medio_cielo"

export type Punto = {
  id: PuntoId
  nombre: string
  longitud: number
  signo: SignoId
  grado: number
  /** Retrógrado. Los ángulos y el Sol nunca lo son. */
  retrogrado: boolean
  /** En qué casa cae, de 1 a 12. */
  casa: number
}

const CUERPOS: Array<{ id: PuntoId; nombre: string; body: A.Body }> = [
  { id: "sol", nombre: "Sol", body: A.Body.Sun },
  { id: "luna", nombre: "Luna", body: A.Body.Moon },
  { id: "mercurio", nombre: "Mercurio", body: A.Body.Mercury },
  { id: "venus", nombre: "Venus", body: A.Body.Venus },
  { id: "marte", nombre: "Marte", body: A.Body.Mars },
  { id: "jupiter", nombre: "Júpiter", body: A.Body.Jupiter },
  { id: "saturno", nombre: "Saturno", body: A.Body.Saturn },
  { id: "urano", nombre: "Urano", body: A.Body.Uranus },
  { id: "neptuno", nombre: "Neptuno", body: A.Body.Neptune },
  { id: "pluton", nombre: "Plutón", body: A.Body.Pluto },
]

/** Longitud eclíptica DE LA FECHA de un cuerpo, en grados. */
function longitudEclipticaDeLaFecha(body: A.Body, t: A.AstroTime): number {
  // `true` = posición aparente, con aberración. Es la que se usa en una carta.
  const vec = A.GeoVector(body, t, true)
  const ecl = A.RotateVector(A.Rotation_EQJ_ECT(t), vec)
  return normalizar(Math.atan2(ecl.y, ecl.x) * GRADOS)
}

/**
 * Oblicuidad media de la eclíptica, en grados. Serie de la IAU 1980.
 *
 * Cambia unos 47 segundos de arco por siglo: un valor fijo acumularía error
 * según se aleja la fecha del año 2000.
 */
function oblicuidadMedia(t: A.AstroTime): number {
  const T = t.tt / 36525
  return 23.439291111
    - 0.0130041667 * T
    - 1.6666667e-7 * T * T
    + 5.027778e-7 * T * T * T
}

/**
 * Medio Cielo: la longitud que cruza el meridiano del lugar.
 *
 *   tan(MC) = sin(TSL) / (cos(TSL)·cos(ε))
 *
 * El cuadrante lo resuelve atan2, así que no hay que corregirlo a mano.
 */
function medioCielo(tslGrados: number, oblicuidad: number): number {
  const tsl = tslGrados * RADIANES
  const e = oblicuidad * RADIANES
  return normalizar(Math.atan2(Math.sin(tsl), Math.cos(tsl) * Math.cos(e)) * GRADOS)
}

/**
 * Ascendente: la longitud que asoma por el horizonte este.
 *
 *   tan(ASC) = cos(TSL) / −(sin(TSL)·cos(ε) + tan(φ)·sin(ε))
 *
 * La fórmula degenera en los polos, donde la eclíptica puede no cortar el
 * horizonte. Se acota la latitud a ±89° en lugar de devolver un número sin
 * sentido físico.
 */
function ascendente(tslGrados: number, latitud: number, oblicuidad: number): number {
  const tsl = tslGrados * RADIANES
  const e = oblicuidad * RADIANES
  const phi = Math.max(-89, Math.min(89, latitud)) * RADIANES
  const y = Math.cos(tsl)
  const x = -(Math.sin(tsl) * Math.cos(e) + Math.tan(phi) * Math.sin(e))
  return normalizar(Math.atan2(y, x) * GRADOS)
}

/**
 * Nodo lunar norte verdadero, del plano orbital instantáneo.
 *
 *   h = r × v      (normal al plano de la órbita)
 *   λ = atan2(h_x, −h_y)
 *
 * Se evalúa EN EL INSTANTE del nacimiento. Buscar el cruce más próximo por la
 * eclíptica daría el mismo nodo a todos los nacidos en una ventana de ~27
 * días, con saltos de más de 2°.
 */
function nodoNorte(t: A.AstroTime): number {
  const st = A.RotateState(A.Rotation_EQJ_ECT(t), A.GeoMoonState(t))
  const hx = st.y * st.vz - st.z * st.vy
  const hy = st.z * st.vx - st.x * st.vz
  return normalizar(Math.atan2(hx, -hy) * GRADOS)
}

/**
 * ¿Va retrógrado?
 *
 * No hay magia: se mira la longitud seis horas antes y seis después. Si
 * decrece, es retrógrado. Se usa una ventana amplia a propósito, porque con
 * minutos el movimiento es tan pequeño que el ruido numérico decide el signo
 * justo en las estaciones.
 */
function esRetrogrado(body: A.Body, t: A.AstroTime): boolean {
  // OJO con `MakeTime`: si se le pasa un NÚMERO lo lee como días desde J2000,
  // no como milisegundos. Pasarle `Date.now()` lo manda cuatro mil millones de
  // años al futuro y el motor revienta con «object is too distant». Siempre
  // con un `Date`.
  const antes = longitudEclipticaDeLaFecha(body, A.MakeTime(new Date(t.date.getTime() - 6 * 3600e3)))
  const despues = longitudEclipticaDeLaFecha(body, A.MakeTime(new Date(t.date.getTime() + 6 * 3600e3)))
  let d = despues - antes
  // Cruce por 0°: 359° → 1° es avance, no un retroceso de 358°.
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d < 0
}

export type Carta = {
  utcMs: number
  latitud: number
  longitud: number
  puntos: Punto[]
  casas: Casa[]
  /** Con cuál se calcularon. La pantalla lo dice: no es un detalle interno. */
  sistemaCasas: SistemaCasas
  /**
   * Por qué no se usó Placidus, cuando no se usó. `null` si sí se usó.
   * Se guarda el motivo para poder enseñarlo, no para deducirlo después.
   */
  motivoCasas: string | null
  aspectos: Aspecto[]
}

/**
 * La carta entera.
 *
 * Determinista: el mismo instante y el mismo lugar dan siempre lo mismo. No
 * se lee el reloj ni hay azar en ninguna rama.
 *
 * ── LAS CASAS ─────────────────────────────────────────────────────────────
 * Placidus, que es el que usan casi todas las webs de astrología. Si aquí
 * Venus saliera en la casa 2 y en otra página en la 3, nadie concluiría que
 * son sistemas distintos: concluiría que esto está roto.
 *
 * Por encima del círculo polar Placidus no está definido —hay puntos de la
 * eclíptica que allí ni salen ni se ponen— y se cae a signos enteros. Cuando
 * eso pasa, la carta lo dice en `sistemaCasas` y `motivoCasas`, para que la
 * pantalla pueda avisarlo en vez de disimularlo.
 */
export function calcularCarta(utcMs: number, latitud: number, longitud: number): Carta {
  const t = A.MakeTime(new Date(utcMs))
  const puntos: Punto[] = []

  // La casa se rellena al final: hasta no tener las cúspides no se sabe.
  const meter = (id: PuntoId, nombre: string, lon: number, retrogrado: boolean) => {
    const l = normalizar(lon)
    puntos.push({
      id, nombre, longitud: l,
      signo: signoDeGrado(l), grado: gradoEnSigno(l),
      retrogrado, casa: 0,
    })
  }

  for (const { id, nombre, body } of CUERPOS) {
    const lon = longitudEclipticaDeLaFecha(body, t)
    // El Sol y la Luna no retrogradan nunca: son el marco, no planetas.
    const retro = id === "sol" || id === "luna" ? false : esRetrogrado(body, t)
    meter(id, nombre, lon, retro)
  }

  // El nodo norte siempre va en retrógrado, que es un hecho del cielo y no un
  // cálculo: el plano orbital de la Luna gira al revés, 18,6 años por vuelta.
  meter("nodo_norte", "Nodo Norte", nodoNorte(t), true)

  // Tiempo sideral de Greenwich en horas → local en grados. La longitud
  // geográfica va con signo: este positivo, oeste negativo.
  const tsl = normalizar(A.SiderealTime(t) * 15 + longitud)
  const obl = oblicuidadMedia(t)

  const asc = ascendente(tsl, latitud, obl)
  const mc = medioCielo(tsl, obl)
  meter("ascendente", "Ascendente", asc, false)
  meter("medio_cielo", "Medio Cielo", mc, false)

  // ── Las casas ──
  // `tsl` ya ES la ascensión recta del Medio Cielo: el tiempo sideral local
  // en grados es exactamente eso.
  const placidus = casasPlacidus(tsl, latitud, obl, asc, mc)

  const casas = placidus ?? casasSignosEnteros(asc)
  const sistemaCasas: SistemaCasas = placidus ? "placidus" : "signos_enteros"
  const motivoCasas = placidus
    ? null
    : `Por encima del círculo polar (latitud ${latitud.toFixed(1)}°) Placidus no está ` +
      `definido: hay grados de la eclíptica que ahí ni salen ni se ponen. Estas casas ` +
      `son de signos enteros.`

  for (const p of puntos) p.casa = casaDe(p.longitud, casas)

  return {
    utcMs, latitud, longitud,
    puntos, casas, sistemaCasas, motivoCasas,
    aspectos: calcularAspectos(puntos),
  }
}
