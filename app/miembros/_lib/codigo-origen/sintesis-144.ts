// SÍNTESIS 144 — el puente entre Numerología Cósmica y Código de Origen.
//
// NO recalcula la numerología. Consume el resultado que YA produjo su motor
// (app/miembros/_lib/numerologia.ts) y lo combina con el Código de Origen
// mediante plantillas propias.
//
// Si no hay lectura de numerología guardada, la síntesis simplemente no
// aparece: la herramienta funciona igual por su cuenta.

import { loadLastReading, type NumerologiaResultado } from "../numerologia"
import type { CodigoOrigenResultado } from "./types"

export type Sintesis144 = {
  /** Camino de vida que ya calculó Numerología Cósmica. No se recalcula. */
  caminoVida: number
  plano: string
  /** Resumen del Código de Origen, para mostrarlos lado a lado. */
  frecuencias: string
  vector: string
  arquetipo: string
  /** El texto combinado, armado con reglas. */
  texto: string[]
}

/**
 * El puente. Devuelve null cuando no hay nada que combinar, que es el caso
 * de quien aún no ha hecho su lectura de Numerología Cósmica.
 */
export function construirSintesis144(
  origen: CodigoOrigenResultado,
  numerologia?: NumerologiaResultado | null,
): Sintesis144 | null {
  const num = numerologia ?? loadLastReading()
  if (!num) return null

  const frecuencias = `${origen.raiz.nombre} · ${origen.apoyo.nombre}`
  const texto: string[] = []

  // Regla 1 — cómo dialogan el número y la frecuencia raíz.
  texto.push(
    `Tu Camino de Vida ${num.caminoVida} y una raíz de ${origen.raiz.nombre} apuntan a lo mismo desde dos lenguajes distintos: ` +
      `uno cuenta el trayecto, el otro el material con el que se recorre.`,
  )

  // Regla 2 — el vector matiza el plano dominante de la numerología.
  texto.push(
    `Numerología Cósmica sitúa tu plano dominante en lo ${num.plano}. ` +
      `El vector de ${origen.vector.nombre} sugiere cómo tiende a moverse: ` +
      (origen.vector.id === "proyeccion"
        ? "hacia fuera, ofreciendo antes de que se lo pidan."
        : "hacia dentro, dejando que las cosas lleguen antes de responder."),
  )

  // Regla 3 — el arquetipo como forma de habitar ese camino.
  texto.push(
    `${origen.arquetipo.nombre} describe desde dónde se sostiene todo eso. ${origen.arquetipo.frase} ` +
      `Leído junto al ${num.caminoVida}, se relaciona con una manera concreta de recorrer el camino, no con otro camino distinto.`,
  )

  texto.push(
    "Las dos lecturas no se comprueban entre sí. Se miran: donde coinciden hay confirmación, y donde no, hay algo que observar.",
  )

  return {
    caminoVida: num.caminoVida,
    plano: num.plano,
    frecuencias,
    vector: origen.vector.nombre,
    arquetipo: origen.arquetipo.nombre,
    texto,
  }
}

/**
 * La fecha de nacimiento que Numerología Cósmica ya guardó, en componentes.
 *
 * Su motor guarda la fecha como "AAAA-MM-DD" en localStorage. Se parte por
 * separadores en vez de pasarla por `new Date`, que la interpretaría en UTC y
 * podría devolver el día anterior según la zona horaria de quien mire.
 */
export function fechaDesdeNumerologia(): { anio: number; mes: number; dia: number } | null {
  const num = loadLastReading()
  if (!num?.fecha) return null
  const partes = num.fecha.split("-").map((v) => parseInt(v, 10))
  if (partes.length !== 3 || partes.some((v) => !Number.isFinite(v))) return null
  const [anio, mes, dia] = partes
  return { anio, mes, dia }
}
