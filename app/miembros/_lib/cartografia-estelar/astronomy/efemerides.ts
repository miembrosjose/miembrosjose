// CARTOGRAFÍA ESTELAR 144 — posiciones natales.
//
// Única frontera con astronomy-engine (MIT, Don Cross). Si algún día se
// cambiara de motor, se reescribe este archivo y nada más.
//
// ── QUÉ CALCULA EL MOTOR Y QUÉ NO ──────────────────────────────────────────
// astronomy-engine da los diez cuerpos, el tiempo sideral y las matrices de
// rotación entre sistemas de coordenadas. NO da Ascendente ni Medio Cielo, y
// no expone la posición del nodo lunar como longitud.
//
// Esos tres se calculan aquí con fórmulas astronómicas estándar, a partir de
// lo que el motor sí garantiza. Están comentadas y cubiertas por pruebas
// contra valores conocidos: no se ha inventado nada.

import * as A from "astronomy-engine"
import { GRADOS_A_RADIANES, RADIANES_A_GRADOS, normalizar } from "./angulos"
import type { PuntoNatal, PuntoNatalId } from "../domain/types"

/** Los diez cuerpos, con el nombre del motor. */
const CUERPOS: Array<{ id: PuntoNatalId; body: A.Body }> = [
  { id: "sol", body: A.Body.Sun },
  { id: "luna", body: A.Body.Moon },
  { id: "mercurio", body: A.Body.Mercury },
  { id: "venus", body: A.Body.Venus },
  { id: "marte", body: A.Body.Mars },
  { id: "jupiter", body: A.Body.Jupiter },
  { id: "saturno", body: A.Body.Saturn },
  { id: "urano", body: A.Body.Uranus },
  { id: "neptuno", body: A.Body.Neptune },
  { id: "pluton", body: A.Body.Pluto },
]

/** De longitud/latitud eclípticas a ascensión recta y declinación. */
function eclipticaAEcuatorial(
  lon: number, lat: number, t: A.AstroTime,
): { ra: number; dec: number } {
  const l = lon * GRADOS_A_RADIANES
  const b = lat * GRADOS_A_RADIANES
  const vec = new A.Vector(
    Math.cos(b) * Math.cos(l),
    Math.cos(b) * Math.sin(l),
    Math.sin(b),
    t,
  )
  const eq = A.RotateVector(A.Rotation_ECT_EQD(t), vec)
  const r = Math.hypot(eq.x, eq.y, eq.z)
  return {
    ra: normalizar(Math.atan2(eq.y, eq.x) * RADIANES_A_GRADOS),
    dec: Math.asin(eq.z / r) * RADIANES_A_GRADOS,
  }
}

/**
 * Medio Cielo: la longitud eclíptica que cruza el meridiano del lugar.
 *
 *   tan(MC) = tan(TSL) / cos(ε)
 *
 * donde TSL es el tiempo sideral local y ε la oblicuidad de la eclíptica.
 * El cuadrante se resuelve con atan2, que es por lo que no hace falta corregir
 * a mano según el sector.
 */
function medioCielo(tslGrados: number, oblicuidad: number): number {
  const tsl = tslGrados * GRADOS_A_RADIANES
  const e = oblicuidad * GRADOS_A_RADIANES
  return normalizar(Math.atan2(Math.sin(tsl), Math.cos(tsl) * Math.cos(e)) * RADIANES_A_GRADOS)
}

/**
 * Ascendente: la longitud eclíptica que asoma por el horizonte este.
 *
 *   tan(ASC) = cos(TSL) / −(sin(TSL)·cos(ε) + tan(φ)·sin(ε))
 *
 * con φ la latitud geográfica. La fórmula degenera en los polos, donde la
 * eclíptica puede no cortar el horizonte: por eso la latitud se limita.
 */
function ascendente(tslGrados: number, latitud: number, oblicuidad: number): number {
  const tsl = tslGrados * GRADOS_A_RADIANES
  const e = oblicuidad * GRADOS_A_RADIANES
  // Más allá de ±89° la tangente se dispara y el resultado deja de tener
  // sentido físico. Se acota en vez de devolver un número sin significado.
  const phi = Math.max(-89, Math.min(89, latitud)) * GRADOS_A_RADIANES

  const y = Math.cos(tsl)
  const x = -(Math.sin(tsl) * Math.cos(e) + Math.tan(phi) * Math.sin(e))
  return normalizar(Math.atan2(y, x) * RADIANES_A_GRADOS)
}

/**
 * Nodo lunar norte verdadero, a partir del plano orbital instantáneo.
 *
 * El nodo ascendente es la dirección en que el plano de la órbita de la Luna
 * corta la eclíptica subiendo. Ese plano lo define el momento angular:
 *
 *   h = r × v          (normal al plano orbital)
 *   nodo = ẑ × h       = (−h_y, h_x, 0)
 *   λ = atan2(h_x, −h_y)
 *
 * Se evalúa EN EL INSTANTE DEL NACIMIENTO. La versión anterior buscaba el
 * cruce por la eclíptica más cercano y devolvía la longitud de la Luna en ese
 * cruce: como los cruces ascendentes ocurren cada ~27 días, todos los nacidos
 * en una misma ventana recibían el mismo nodo, con escalones de hasta 2.28°
 * —más que el orbe entero de la conjunción—. Ver docs/CARTOGRAFIA_BUG_NODOS.md.
 *
 * Verificado contra el nodo medio de Meeus (cap. 47): oscila alrededor de él
 * dentro de ±1.66° y deriva 0.0529°/día en retrógrado, que es el período
 * nodal de 18.6 años.
 */
function nodoNorte(t: A.AstroTime): number {
  // Posición y velocidad de la Luna, llevadas a la eclíptica de la fecha.
  const st = A.RotateState(A.Rotation_EQJ_ECT(t), A.GeoMoonState(t))

  // Momento angular orbital: normal al plano de la órbita.
  const hx = st.y * st.vz - st.z * st.vy
  const hy = st.z * st.vx - st.x * st.vz

  return normalizar(Math.atan2(hx, -hy) * RADIANES_A_GRADOS)
}

/**
 * Todas las posiciones natales.
 *
 * Determinista: el mismo instante y lugar dan siempre exactamente lo mismo.
 * No hay azar ni lectura del reloj en ninguna rama.
 */
export function calcularPuntos(utcMs: number, latitud: number, longitud: number): PuntoNatal[] {
  const t = A.MakeTime(new Date(utcMs))
  const puntos: PuntoNatal[] = []

  for (const { id, body } of CUERPOS) {
    // `true` aplica aberración: la posición aparente, que es la que se usa.
    const ecl = A.Ecliptic(A.GeoVector(body, t, true))
    const eq = eclipticaAEcuatorial(ecl.elon, ecl.elat, t)
    puntos.push({
      id,
      longitud: normalizar(ecl.elon),
      latitud: ecl.elat,
      ascensionRecta: eq.ra,
      declinacion: eq.dec,
    })
  }

  // ── Nodos ──
  const nn = nodoNorte(t)
  const ns = normalizar(nn + 180)
  for (const [id, lon] of [["nodo_norte", nn], ["nodo_sur", ns]] as const) {
    const eq = eclipticaAEcuatorial(lon, 0, t)
    puntos.push({ id, longitud: lon, latitud: 0, ascensionRecta: eq.ra, declinacion: eq.dec })
  }

  // ── Ángulos ──
  // Tiempo sideral de Greenwich en horas → local en grados. La longitud
  // geográfica va con signo: este positivo, oeste negativo.
  const tsl = normalizar(A.SiderealTime(t) * 15 + longitud)
  const oblicuidad = oblicuidadMedia(t)

  const mc = medioCielo(tsl, oblicuidad)
  const asc = ascendente(tsl, latitud, oblicuidad)

  for (const [id, lon] of [["ascendente", asc], ["medio_cielo", mc]] as const) {
    const eq = eclipticaAEcuatorial(lon, 0, t)
    puntos.push({ id, longitud: lon, latitud: 0, ascensionRecta: eq.ra, declinacion: eq.dec })
  }

  return puntos
}

/**
 * Oblicuidad media de la eclíptica, en grados.
 *
 * Serie de la IAU 1980. Cambia unos 47 segundos de arco por siglo, así que
 * usar un valor fijo introduciría un error creciente con la distancia a 2000.
 */
function oblicuidadMedia(t: A.AstroTime): number {
  const T = t.tt / 36525
  return 23.439291111
    - 0.0130041667 * T
    - 1.6666667e-7 * T * T
    + 5.027778e-7 * T * T * T
}

/**
 * Longitud y latitud eclípticas de la fecha para una estrella del catálogo.
 *
 * El catálogo guarda J2000 —que es como publican los catálogos astronómicos—
 * y la precesión hasta la fecha del nacimiento la hace el motor. Así el dato
 * almacenado es el de la fuente, sin transformar, y se puede contrastar.
 */
export function anclaEnFecha(
  raJ2000: number, decJ2000: number, utcMs: number,
): { longitud: number; latitud: number; ra: number; dec: number } {
  const t = A.MakeTime(new Date(utcMs))
  const ra = raJ2000 * GRADOS_A_RADIANES
  const dec = decJ2000 * GRADOS_A_RADIANES

  const vec = new A.Vector(
    Math.cos(dec) * Math.cos(ra),
    Math.cos(dec) * Math.sin(ra),
    Math.sin(dec),
    t,
  )

  // EQJ = ecuatorial J2000; ECT = eclíptica verdadera de la fecha.
  const ecl = A.RotateVector(A.Rotation_EQJ_ECT(t), vec)
  const rEcl = Math.hypot(ecl.x, ecl.y, ecl.z)

  // Y la ecuatorial de la fecha, para la separación real en el cielo.
  const eqd = A.RotateVector(A.Rotation_EQJ_EQD(t), vec)
  const rEq = Math.hypot(eqd.x, eqd.y, eqd.z)

  return {
    longitud: normalizar(Math.atan2(ecl.y, ecl.x) * RADIANES_A_GRADOS),
    latitud: Math.asin(ecl.z / rEcl) * RADIANES_A_GRADOS,
    ra: normalizar(Math.atan2(eqd.y, eqd.x) * RADIANES_A_GRADOS),
    dec: Math.asin(eqd.z / rEq) * RADIANES_A_GRADOS,
  }
}
