// CARTOGRAFÍA ESTELAR 144 — signos, constelaciones y por qué no coinciden.
//
// CAPA A. Aquí no hay interpretación: son hechos astronómicos y aritmética.
//
// ── POR QUÉ EXISTE ESTE ARCHIVO ────────────────────────────────────────────
// La pregunta que más se repite al usar la herramienta es: "¿por qué no sale
// mi signo?". Y es una pregunta excelente, porque la respuesta explica de una
// vez lo que más cuesta entender de todo esto.
//
// Resumen: el SIGNO y la CONSTELACIÓN del mismo nombre son dos cosas
// distintas y hoy no están en el mismo sitio del cielo. Hace unos dos mil
// años sí coincidían; desde entonces el eje de la Tierra se ha ido
// desplazando y se han separado más de veinte grados.
//
// Esta herramienta trabaja con las estrellas REALES. Por eso alguien con el
// Sol en el signo de Capricornio puede encontrarse con que su Sol apuntaba a
// las estrellas de Sagitario, y con que el portal llamado Capricornio no le
// toca en absoluto. No es un fallo: es lo que hay en el cielo.

import { anclaEnFecha } from "../../astronomy/efemerides"
import { separacionLongitud } from "../../astronomy/angulos"
import { PORTALES } from "../../catalog/portales"
import { PUNTOS } from "../../content/puntos.content"
import type { Cartografia, PuntoNatalId } from "../types"

/** Los doce signos, en orden. Cada uno ocupa 30° exactos de la rueda. */
export const SIGNOS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
] as const

export type SignoCalculado = {
  nombre: string
  /** Grado dentro del signo, 0–30. */
  grado: number
}

/**
 * En qué signo cae una longitud.
 *
 * Es una división aritmética de la rueda en doce partes iguales, no una
 * observación: los signos no son regiones del cielo con estrellas dentro.
 */
export function signoDe(longitud: number): SignoCalculado {
  const l = ((longitud % 360) + 360) % 360
  return {
    nombre: SIGNOS[Math.floor(l / 30)],
    grado: l % 30,
  }
}

export function signoTexto(longitud: number): string {
  const s = signoDe(longitud)
  return `${s.nombre} ${s.grado.toFixed(0)}°`
}

export type EstrellaCercana = {
  anclaNombre: string
  portalId: string
  portalNombre: string
  /** Separación en longitud, en grados. */
  separacion: number
  /** Longitud de la estrella, para poder decir en qué signo cae. */
  longitud: number
  /** true si además llegó a formar contacto en la cartografía. */
  esContacto: boolean
}

/**
 * La estrella del catálogo hacia la que apuntaba un punto natal.
 *
 * No la que forma el mejor aspecto: la que está literalmente más cerca en la
 * rueda. Es lo que permite decir "tu Sol, en el signo de Capricornio, estaba
 * apuntando a las estrellas de Sagitario".
 */
export function estrellaMasCercanaA(
  carto: Cartografia,
  punto: PuntoNatalId,
): EstrellaCercana | null {
  const p = carto.puntos.find((x) => x.id === punto)
  if (!p) return null

  const contactos = new Set(
    carto.resonancias.flatMap((r) =>
      r.contactos.filter((c) => c.punto === punto).map((c) => c.ancla.id),
    ),
  )

  let mejor: (EstrellaCercana & { anclaId: string }) | null = null

  for (const portal of PORTALES) {
    for (const a of portal.anclas) {
      const pos = anclaEnFecha(a.raJ2000, a.decJ2000, carto.instante.utcMs)
      const sep = separacionLongitud(p.longitud, pos.longitud)
      if (!mejor || sep < mejor.separacion) {
        mejor = {
          anclaId: a.id,
          anclaNombre: a.nombre,
          portalId: portal.id,
          portalNombre: portal.nombre,
          separacion: sep,
          longitud: pos.longitud,
          esContacto: contactos.has(a.id),
        }
      }
    }
  }

  if (!mejor) return null
  const { anclaId: _omitido, ...resto } = mejor
  return resto
}

export type ExplicacionSigno = {
  punto: PuntoNatalId
  puntoNombre: string
  /** El signo donde cae, que es lo que diría cualquier carta astral. */
  signo: string
  grado: number
  longitud: number
  /** Hacia qué estrella real apuntaba. */
  estrella: EstrellaCercana | null
  /**
   * true cuando el signo y la constelación a la que apunta NO coinciden,
   * que es el caso habitual. Es lo que sorprende.
   */
  desajuste: boolean
}

/**
 * Por qué el signo de alguien no aparece entre sus portales.
 *
 * Se calcula sobre el Sol por defecto, que es el signo que todo el mundo
 * conoce de sí mismo y por el que pregunta.
 */
export function explicarSigno(
  carto: Cartografia,
  punto: PuntoNatalId = "sol",
): ExplicacionSigno | null {
  const p = carto.puntos.find((x) => x.id === punto)
  if (!p) return null

  const s = signoDe(p.longitud)
  const estrella = estrellaMasCercanaA(carto, punto)

  // El nombre del portal al que apunta, comparado con el nombre del signo.
  // "Sagitario" contra "Capricornio" es desajuste; "Libra" contra "Libra" no.
  const desajuste =
    estrella !== null &&
    !estrella.portalNombre.toLowerCase().includes(s.nombre.toLowerCase())

  return {
    punto,
    puntoNombre: PUNTOS[punto].nombre,
    signo: s.nombre,
    grado: s.grado,
    longitud: p.longitud,
    estrella,
    desajuste,
  }
}

/**
 * ¿Existe un portal con el nombre del signo de alguien, y le toca?
 *
 * Los nombres de portal como "Capricornio" o "Libra" se refieren a la
 * CONSTELACIÓN, no al signo. Esta función permite decir con datos si ese
 * portal concreto forma contacto o no.
 */
export function portalDelMismoNombre(
  carto: Cartografia,
  signo: string,
): { portalId: string; nombre: string; resonancia: number | null } | null {
  const portal = PORTALES.find((p) =>
    p.nombre.toLowerCase().includes(signo.toLowerCase()),
  )
  if (!portal) return null
  const r = carto.resonancias.find((x) => x.portalId === portal.id)
  return {
    portalId: portal.id,
    nombre: portal.nombre,
    resonancia: r ? r.resonancia : null,
  }
}
