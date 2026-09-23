// CARTOGRAFÍA ESTELAR 144 — por qué un portal puntúa lo que puntúa.
//
// CAPA A. Aquí no hay interpretación: se reconstruye paso a paso la misma
// aritmética que produjo la cifra, con los mismos números de config.ts.
//
// ── POR QUÉ EXISTE ESTE ARCHIVO ────────────────────────────────────────────
// Un número sin explicación es una caja negra, y una caja negra pide fe. La
// resonancia es una medida de nuestra metodología, no un hecho del cielo: si
// no se puede abrir y comprobar, no hay motivo para creerla.
//
// Cada contacto muestra: orbe, orbe permitido, cercanía, pesos, aporte. Y la
// suma muestra cómo se llega del total a la cifra final.

import {
  ASPECTOS, ECO_MISMA_ANCLA, ESCALA_SATURACION, EXPONENTE_CERCANIA,
  PESO_PUNTO, SUELO_RESONANCIA, TOPE_RESONANCIA, aspectoPorId,
} from "../../resonancia/config"
import { cercania } from "../../resonancia/puntuacion"
import { portalPorId } from "../../catalog/portales"
import type { Contacto, ResonanciaPortal } from "../types"

export type LineaExplicacion = {
  contacto: Contacto
  /** Orbe permitido para este aspecto, en grados. */
  orbePermitido: number
  /** (1 − orbe/orbePermitido) ^ 1.5 */
  cercania: number
  pesoAspecto: number
  pesoPunto: number
  pesoPortal: number
  /** cercanía × pesoAspecto × pesoPunto × pesoPortal */
  fuerza: number
  /**
   * true cuando este punto natal ya aportó por otra ancla del mismo portal,
   * de modo que este contacto cuenta atenuado. Ver ECO_MISMA_ANCLA.
   */
  esEco: boolean
  /** Lo que realmente suma: fuerza, o fuerza × 0.15 si es eco. */
  aporte: number
}

export type ExplicacionScore = {
  portalId: string
  lineas: LineaExplicacion[]
  /** Suma de todos los aportes. */
  total: number
  /** 100 × (1 − e^(−total/1.2)) */
  bruta: number
  /** Tras aplicar tope, suelo y redondeo. Es la cifra que se muestra. */
  final: number
  /** Cuántos contactos se atenuaron por compartir portal con otro del mismo punto. */
  ecos: number
  constantes: {
    exponenteCercania: number
    escalaSaturacion: number
    ecoMismaAncla: number
    topeResonancia: number
    sueloResonancia: number
  }
}

/**
 * Reconstruye el cálculo de una resonancia, paso a paso.
 *
 * Recalcula desde los mismos datos y las mismas constantes en vez de recibir
 * los valores ya hechos: si esta reconstrucción y el motor se separaran, la
 * prueba correspondiente lo detecta.
 */
export function explicarScore(r: ResonanciaPortal): ExplicacionScore {
  const portal = portalPorId(r.portalId)
  const pesoPortal = portal?.peso ?? 1

  // Los contactos llegan ya ordenados de mayor a menor fuerza. El primero de
  // cada punto natal cuenta entero; los siguientes, atenuados.
  const yaContado = new Set<string>()
  const lineas: LineaExplicacion[] = []
  let total = 0
  let ecos = 0

  for (const c of r.contactos) {
    const def = aspectoPorId(c.aspecto)
    const cerc = cercania(c.orbe, def.orbe)
    const pesoPunto = PESO_PUNTO[c.punto]
    const fuerza = cerc * def.peso * pesoPunto * pesoPortal

    const esEco = yaContado.has(c.punto)
    if (esEco) ecos++
    else yaContado.add(c.punto)

    const aporte = esEco ? fuerza * ECO_MISMA_ANCLA : fuerza
    total += aporte

    lineas.push({
      contacto: c,
      orbePermitido: def.orbe,
      cercania: cerc,
      pesoAspecto: def.peso,
      pesoPunto,
      pesoPortal,
      fuerza,
      esEco,
      aporte,
    })
  }

  const bruta = total <= 0 ? 0 : 100 * (1 - Math.exp(-total / ESCALA_SATURACION))
  const acotada = Math.min(bruta, TOPE_RESONANCIA)
  const redondeada = Math.round(acotada * 10) / 10
  const final = Math.max(redondeada, SUELO_RESONANCIA)

  return {
    portalId: r.portalId,
    lineas,
    total,
    bruta,
    final,
    ecos,
    constantes: {
      exponenteCercania: EXPONENTE_CERCANIA,
      escalaSaturacion: ESCALA_SATURACION,
      ecoMismaAncla: ECO_MISMA_ANCLA,
      topeResonancia: TOPE_RESONANCIA,
      sueloResonancia: SUELO_RESONANCIA,
    },
  }
}

/** Los cinco aspectos con su ángulo y su orbe, para la pantalla educativa. */
export function tablaAspectos() {
  return ASPECTOS.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    angulo: a.angulo,
    orbe: a.orbe,
    peso: a.peso,
  }))
}
