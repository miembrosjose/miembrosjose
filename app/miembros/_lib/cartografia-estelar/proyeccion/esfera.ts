// CARTOGRAFÍA ESTELAR 144 — proyección sobre la esfera celeste.
//
// CAPA A. Geometría, no interpretación.
//
// ── QUÉ REPRESENTA EL MAPA Y QUÉ NO ────────────────────────────────────────
// La posición de un portal en el mapa es su DIRECCIÓN en el cielo, calculada
// desde su ascensión recta y su declinación. No es su distancia: Sirio está a
// 8.6 años luz y M87 a 53 millones, y en el mapa ambos caen sobre la misma
// esfera. Representar distancias reales dejaría 47 portales fuera de cualquier
// pantalla y el mapa no serviría para nada.
//
// Los portales NO se colocan al azar ni por estética. Cada uno cae donde
// realmente está visto desde la Tierra.
//
// La resonancia se codifica en tamaño y brillo, nunca en posición: mover un
// portal según su puntuación falsearía el cielo.

import { GRADOS_A_RADIANES } from "../astronomy/angulos"
import { anclaEnFecha } from "../astronomy/efemerides"
import { PORTALES } from "../catalog/portales"
import type { Cartografia, PuntoNatalId } from "../domain/types"

export type Vec3 = { x: number; y: number; z: number }

/** Radio de la esfera celeste en el mapa. Todos los portales caen sobre ella. */
export const RADIO_ESFERA = 10

/**
 * De ascensión recta y declinación a un vector unitario.
 *
 * Convención: x hacia el punto Aries (RA 0h), z hacia el polo norte celeste.
 * En la escena de Three.js el eje vertical es y, así que la conversión final
 * intercambia y y z para que el polo quede arriba.
 */
export function direccion(raGrados: number, decGrados: number): Vec3 {
  const ra = raGrados * GRADOS_A_RADIANES
  const dec = decGrados * GRADOS_A_RADIANES
  const cd = Math.cos(dec)
  // y y z intercambiados respecto a la convención astronómica: en la escena
  // el eje vertical es y.
  return { x: cd * Math.cos(ra), y: Math.sin(dec), z: -cd * Math.sin(ra) }
}

export function escalar(v: Vec3, k: number): Vec3 {
  return { x: v.x * k, y: v.y * k, z: v.z * k }
}

/** Media de varias direcciones, normalizada. Para portales con varias anclas. */
export function direccionMedia(vs: Vec3[]): Vec3 {
  if (vs.length === 0) return { x: 1, y: 0, z: 0 }
  let x = 0, y = 0, z = 0
  for (const v of vs) { x += v.x; y += v.y; z += v.z }
  const n = Math.hypot(x, y, z)
  // Anclas diametralmente opuestas se cancelarían. No ocurre en este catálogo
  // —un portal agrupa estrellas vecinas— pero se cubre por si se amplía.
  if (n < 1e-9) return vs[0]
  return { x: x / n, y: y / n, z: z / n }
}

export type AnclaProyectada = {
  id: string
  nombre: string
  designacion: string
  magnitud?: number
  pos: Vec3
}

export type PortalProyectado = {
  id: string
  nombre: string
  tipo: string
  pos: Vec3
  anclas: AnclaProyectada[]
  resonancia: number
  contactos: number
  /** Un portal es activo cuando tiene al menos un contacto. Solo estos se abren. */
  activo: boolean
}

/**
 * Los cincuenta portales situados sobre la esfera celeste.
 *
 * Las coordenadas se precesan a la fecha del nacimiento, igual que en el
 * cálculo de contactos: así el mapa y los números describen el mismo cielo.
 */
export function proyectarPortales(carto: Cartografia): PortalProyectado[] {
  const porId = new Map(carto.resonancias.map((r) => [r.portalId, r]))
  const utcMs = carto.instante.utcMs

  return PORTALES.map((p) => {
    const anclas: AnclaProyectada[] = p.anclas.map((a) => {
      const pos = anclaEnFecha(a.raJ2000, a.decJ2000, utcMs)
      return {
        id: a.id,
        nombre: a.nombre,
        designacion: a.designacion,
        magnitud: a.magnitud,
        pos: escalar(direccion(pos.ra, pos.dec), RADIO_ESFERA),
      }
    })

    const r = porId.get(p.id)
    return {
      id: p.id,
      nombre: p.nombre,
      tipo: p.tipo,
      pos: escalar(
        direccionMedia(anclas.map((a) => ({
          x: a.pos.x / RADIO_ESFERA,
          y: a.pos.y / RADIO_ESFERA,
          z: a.pos.z / RADIO_ESFERA,
        }))),
        RADIO_ESFERA,
      ),
      anclas,
      resonancia: r?.resonancia ?? 0,
      contactos: r?.contactos.length ?? 0,
      activo: (r?.contactos.length ?? 0) > 0,
    }
  })
}

/**
 * Los puntos natales sobre la misma esfera.
 *
 * Se usa su ascensión recta y declinación reales, no su longitud eclíptica:
 * en un mapa del cielo lo que corresponde es dónde estaba cada cuerpo visto
 * desde la Tierra.
 */
export type PuntoProyectado = {
  id: PuntoNatalId
  pos: Vec3
  longitud: number
}

export function proyectarPuntos(carto: Cartografia): PuntoProyectado[] {
  return carto.puntos.map((p) => ({
    id: p.id,
    pos: escalar(direccion(p.ascensionRecta, p.declinacion), RADIO_ESFERA * 0.96),
    longitud: p.longitud,
  }))
}

/**
 * Un campo de estrellas de fondo, determinista.
 *
 * NO son estrellas reales: son puntos de referencia visual para que la esfera
 * se perciba como un volumen y no como un plano. Se generan con una secuencia
 * fija —sin Math.random— para que el fondo sea idéntico en cada visita y en
 * cada dispositivo.
 *
 * Se devuelven como un único array plano de coordenadas, listo para un
 * BufferGeometry: miles de objetos de React serían inmanejables.
 */
export function fondoEstrellas(cantidad = 1400): Float32Array {
  const out = new Float32Array(cantidad * 3)
  // Secuencia de Weyl con el ángulo áureo: reparte los puntos de forma pareja
  // sobre la esfera y es completamente determinista.
  const DORADO = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < cantidad; i++) {
    const y = 1 - (i / (cantidad - 1)) * 2
    const radio = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = DORADO * i
    const R = RADIO_ESFERA * 2.6
    out[i * 3] = Math.cos(theta) * radio * R
    out[i * 3 + 1] = y * R
    out[i * 3 + 2] = Math.sin(theta) * radio * R
  }
  return out
}
