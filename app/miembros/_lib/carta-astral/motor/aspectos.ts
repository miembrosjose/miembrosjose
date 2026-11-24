// ═══════════════════════════════════════════════════════════════════════════
//  LOS ASPECTOS · qué distancia hay entre dos puntos, y si significa algo
// ═══════════════════════════════════════════════════════════════════════════
//
// Un aspecto es una distancia concreta entre dos puntos de la carta. No todas
// las distancias cuentan: solo cinco, y cada una admite un margen —el orbe—
// porque exigir el grado exacto dejaría casi todas las cartas sin aspectos.
//
// ── LOS ORBES NO SON UNA LEY ──────────────────────────────────────────────
// No hay un orbe «correcto»: cada escuela usa los suyos, y cambiarlos cambia
// qué aspectos aparecen. Los de aquí son los de uso más común, y están en una
// constante a la vista para poder discutirlos. Lo que no vale es esconderlos
// dentro del cálculo como si vinieran dados.
//
// Dos reglas que sí son casi unánimes:
//   · El Sol y la Luna admiten más margen que el resto. Se nota más un
//     trígono flojo del Sol que uno exacto de Neptuno.
//   · El Ascendente y el Medio Cielo lo admiten MENOS. Dependen de la hora de
//     nacimiento, y esa hora suele venir redondeada: con orbe ancho se
//     estarían afirmando aspectos que quizá no existen.

import type { Punto, PuntoId } from "./carta"

export type AspectoId = "conjuncion" | "oposicion" | "trigono" | "cuadratura" | "sextil"

export type TipoAspecto = {
  id: AspectoId
  nombre: string
  angulo: number
  orbe: number
  /** Para pintarlo y para ordenar la lectura. */
  naturaleza: "union" | "tension" | "fluidez"
}

export const TIPOS: TipoAspecto[] = [
  { id: "conjuncion", nombre: "Conjunción", angulo: 0, orbe: 8, naturaleza: "union" },
  { id: "oposicion", nombre: "Oposición", angulo: 180, orbe: 8, naturaleza: "tension" },
  { id: "trigono", nombre: "Trígono", angulo: 120, orbe: 7, naturaleza: "fluidez" },
  { id: "cuadratura", nombre: "Cuadratura", angulo: 90, orbe: 7, naturaleza: "tension" },
  { id: "sextil", nombre: "Sextil", angulo: 60, orbe: 5, naturaleza: "fluidez" },
]

const LUMINARIAS: PuntoId[] = ["sol", "luna"]
const ANGULOS: PuntoId[] = ["ascendente", "medio_cielo"]

/** Lo que se le suma o resta al orbe según quién participe. */
function ajusteDeOrbe(a: PuntoId, b: PuntoId): number {
  if (ANGULOS.includes(a) || ANGULOS.includes(b)) return -2
  if (LUMINARIAS.includes(a) || LUMINARIAS.includes(b)) return +2
  return 0
}

export type Aspecto = {
  tipo: AspectoId
  nombre: string
  naturaleza: TipoAspecto["naturaleza"]
  a: PuntoId
  b: PuntoId
  nombreA: string
  nombreB: string
  /** Separación real entre los dos puntos, 0–180. */
  separacion: number
  /** Cuánto se aparta del ángulo exacto. 0 = exacto. */
  desviacion: number
  /** 0 a 1. Uno es exacto; cero, al borde del orbe. Sirve para ordenar. */
  fuerza: number
}

/** Separación más corta entre dos longitudes: de 0 a 180. */
export function separacion(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360)
  return d > 180 ? 360 - d : d
}

/**
 * Los aspectos de la carta, de más exacto a menos.
 *
 * ── EL NODO NO ASPECTA ────────────────────────────────────────────────────
 * El Nodo Norte se deja fuera a propósito. No es un cuerpo: es una dirección
 * geométrica, y meterlo llena la lista de aspectos que la mayoría de las
 * escuelas no lee. Está en la carta y se ve; simplemente no genera aspectos.
 *
 * El Ascendente y el Medio Cielo SÍ aspectan, pero tampoco entre ellos: su
 * distancia depende de la latitud y no dice nada de la persona.
 */
export function calcularAspectos(puntos: Punto[]): Aspecto[] {
  const participan = puntos.filter((p) => p.id !== "nodo_norte")
  const salida: Aspecto[] = []

  for (let i = 0; i < participan.length; i++) {
    for (let j = i + 1; j < participan.length; j++) {
      const a = participan[i]
      const b = participan[j]

      // Ascendente y Medio Cielo entre sí: no.
      if (ANGULOS.includes(a.id) && ANGULOS.includes(b.id)) continue

      const sep = separacion(a.longitud, b.longitud)
      const ajuste = ajusteDeOrbe(a.id, b.id)

      for (const tipo of TIPOS) {
        const orbe = Math.max(1, tipo.orbe + ajuste)
        const desviacion = Math.abs(sep - tipo.angulo)
        if (desviacion > orbe) continue

        salida.push({
          tipo: tipo.id,
          nombre: tipo.nombre,
          naturaleza: tipo.naturaleza,
          a: a.id,
          b: b.id,
          nombreA: a.nombre,
          nombreB: b.nombre,
          separacion: sep,
          desviacion,
          fuerza: 1 - desviacion / orbe,
        })
        // Dos puntos no pueden estar en dos aspectos a la vez: los ángulos
        // están lo bastante separados como para que un orbe no alcance al
        // siguiente.
        break
      }
    }
  }

  salida.sort((x, y) => y.fuerza - x.fuerza)
  return salida
}
