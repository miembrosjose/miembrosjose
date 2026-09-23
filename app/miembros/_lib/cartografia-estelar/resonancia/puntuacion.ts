// CARTOGRAFÍA ESTELAR 144 — contactos y resonancia.
//
// ── LO QUE MIDE Y LO QUE NO ────────────────────────────────────────────────
// La resonancia es una medida de NUESTRA metodología: cuánto se acumulan los
// contactos entre los puntos de un nacimiento y las anclas de un portal, con
// los orbes y pesos que hemos elegido y declarado en config.ts.
//
// No mide procedencia, ni origen, ni pertenencia a nada. Un 87 no dice que
// alguien "sea" de ningún sitio: dice que en este método, con estos números,
// ese portal aparece marcado en su mapa. La interfaz lo repite.
//
// Todo aquí es determinista. Sin Math.random, sin Date.now.

import { anclaEnFecha } from "../astronomy/efemerides"
import { separacionLongitud, separacionReal } from "../astronomy/angulos"
import {
  ASPECTOS, ECO_MISMA_ANCLA, ESCALA_SATURACION, EXPONENTE_CERCANIA, PESO_PUNTO,
  SUELO_RESONANCIA, TOPE_RESONANCIA,
} from "./config"
import type {
  Ancla, Contacto, Portal, PuntoNatal, ResonanciaPortal,
} from "../domain/types"

/**
 * Cercanía al aspecto exacto, de 0 a 1.
 *
 *   max(0, 1 − orbe/orbePermitido) ^ 1.5
 *
 * El exponente hace que un contacto casi exacto destaque claramente sobre uno
 * que apenas entra: a mitad de orbe no vale 0.5 sino 0.35.
 */
export function cercania(orbe: number, orbePermitido: number): number {
  if (orbePermitido <= 0) return 0
  const lineal = 1 - orbe / orbePermitido
  if (lineal <= 0) return 0
  return Math.pow(lineal, EXPONENTE_CERCANIA)
}

/**
 * Busca todos los contactos entre un punto natal y un ancla.
 *
 * Devuelve como mucho uno: si dos aspectos cayeran dentro de orbe a la vez
 * —imposible con estos orbes, pero posible si alguien los amplía— se queda el
 * más fuerte, para no contar dos veces la misma proximidad.
 */
function contactoEntre(
  punto: PuntoNatal,
  ancla: Ancla,
  portalId: string,
  portalPeso: number,
  utcMs: number,
): Contacto | null {
  const pos = anclaEnFecha(ancla.raJ2000, ancla.decJ2000, utcMs)
  const sepLongitud = separacionLongitud(punto.longitud, pos.longitud)

  let mejor: Contacto | null = null

  for (const asp of ASPECTOS) {
    // Distancia al ángulo exacto del aspecto.
    const orbe = Math.abs(sepLongitud - asp.angulo)
    if (orbe > asp.orbe) continue

    const c = cercania(orbe, asp.orbe)
    if (c <= 0) continue

    const fuerza = c * asp.peso * PESO_PUNTO[punto.id] * portalPeso

    if (!mejor || fuerza > mejor.fuerza) {
      mejor = {
        punto: punto.id,
        portalId,
        ancla,
        aspecto: asp.id,
        orbe,
        // La separación REAL en el cielo, que puede ser enorme aunque el
        // orbe sea mínimo. Nunca se presentan como lo mismo.
        separacionReal: separacionReal(
          punto.ascensionRecta, punto.declinacion, pos.ra, pos.dec,
        ),
        fuerza,
      }
    }
  }

  return mejor
}

/**
 * Curva saturante.
 *
 *   100 × (1 − e^(−total/escala))
 *
 * Sumar linealmente haría que diez contactos flojos superaran a una conjunción
 * exacta al Sol, que es lo contrario de lo que queremos. Con la curva, los
 * primeros contactos cuentan mucho y los siguientes cada vez menos.
 *
 * El 100 no se alcanza. En matemática pura la exponencial nunca llega a cero,
 * pero en coma flotante sí: para totales grandes, e^(−83) desborda a 0 y el
 * resultado sale exactamente 100. Por eso el tope es explícito y no confiado
 * a la fórmula.
 */
export function saturar(total: number): number {
  if (total <= 0) return 0
  const bruto = 100 * (1 - Math.exp(-total / ESCALA_SATURACION))
  return Math.min(bruto, TOPE_RESONANCIA)
}

/** La resonancia de un portal con un nacimiento concreto. */
export function resonanciaDe(
  portal: Portal,
  puntos: PuntoNatal[],
  utcMs: number,
): ResonanciaPortal | null {
  if (portal.pendingData) return null

  const contactos: Contacto[] = []
  for (const punto of puntos) {
    for (const ancla of portal.anclas) {
      const c = contactoEntre(punto, ancla, portal.id, portal.peso, utcMs)
      if (c) contactos.push(c)
    }
  }

  if (contactos.length === 0) return null

  // Del más fuerte al más débil: la interfaz muestra siempre cuál produjo el
  // contacto, nunca esconde los datos dentro de una cifra.
  contactos.sort((a, b) => b.fuerza - a.fuerza)

  // Un punto natal que alcanza varias anclas del mismo portal aporta entero
  // su contacto más fuerte; los demás, atenuados. Ver ECO_MISMA_ANCLA: sin
  // esto, un cúmulo compacto ganaba por tener más estrellas en la lista, no
  // por resonar más.
  const yaContado = new Set<string>()
  let total = 0
  for (const c of contactos) {
    if (yaContado.has(c.punto)) {
      total += c.fuerza * ECO_MISMA_ANCLA
    } else {
      total += c.fuerza
      yaContado.add(c.punto)
    }
  }

  // Si hay contacto, se ve. Un contacto en el borde del orbe puede dar un
  // total tan pequeño que redondee a cero, y mostrar "Resonancia 0" junto a
  // un contacto listado debajo es contradictorio.
  const bruta = Math.round(saturar(total) * 10) / 10
  return {
    portalId: portal.id,
    resonancia: Math.max(bruta, SUELO_RESONANCIA),
    contactos,
  }
}
