// CÓDIGO DE ORIGEN — la capa que traduce los índices del motor al vocabulario
// de Los 144.000.
//
// Este archivo es la ÚNICA frontera entre el motor de cálculo y el resto de la
// plataforma. Aguas arriba hay índices numéricos; aguas abajo, solo nombres
// propios. Si mañana se cambia de motor, se reescribe esto y nada más.

import type { ArquetipoId, FrecuenciaId, VectorId } from "./types"

/**
 * Las cinco frecuencias, por el índice de elemento que devuelve el motor.
 * El orden del motor es fijo y está verificado contra la versión instalada.
 */
export const FRECUENCIA_POR_INDICE: readonly FrecuenciaId[] = [
  "expansion",    // 0
  "activacion",   // 1
  "encarnacion",  // 2
  "claridad",     // 3
  "profundidad",  // 4
] as const

/**
 * El vector, por la polaridad del pilar del día.
 * El motor devuelve 1 para la polaridad expansiva y 0 para la receptiva.
 */
export const VECTOR_POR_POLARIDAD: readonly VectorId[] = ["recepcion", "proyeccion"] as const

/**
 * Los diez arquetipos, por el índice de relación que devuelve el motor entre
 * el pilar del día y el del año — entre quien se es y de dónde se viene.
 *
 * El mapeo es SEMÁNTICO, no posicional: cada índice del motor describe un tipo
 * de relación (igualdad, expresión, transformación, sostén…) y se le asigna el
 * arquetipo cuyo significado corresponde. No es el orden en que se listaron los
 * nombres, porque ese orden era una enumeración, no una correspondencia.
 */
export const ARQUETIPO_POR_RELACION: readonly ArquetipoId[] = [
  "resonancia",       // 0 · igual a uno mismo: reconocerse en lo semejante
  "impulso",          // 1 · semejante que empuja: fuerza que mueve
  "creacion",         // 2 · lo que se expresa con fluidez
  "revelacion",       // 3 · lo que se expresa rompiendo la forma
  "materializacion",  // 4 · lo que se toma del mundo de forma amplia
  "apertura",         // 5 · lo que se recibe de forma sostenida
  "iniciacion",       // 6 · lo que confronta y pone a prueba
  "orden",            // 7 · lo que estructura y da marco
  "vision_interior",  // 8 · lo que nutre por vías no evidentes
  "sabiduria",        // 9 · lo que nutre de forma directa
] as const

/**
 * Pesos del reparto de frecuencias.
 *
 * Cada nacimiento aporta cuatro columnas. De cada una se leen dos capas: la
 * visible y la que está contenida dentro. Los pesos son fijos y explícitos
 * para que el resultado sea siempre el mismo con los mismos datos.
 */
export const PESOS = {
  /** Capa visible de cada columna. */
  visible: 2,
  /** Primera capa contenida: la principal. */
  contenidaPrincipal: 2,
  /** Segunda capa contenida. */
  contenidaMedia: 1,
  /** Tercera capa contenida, residual. */
  contenidaResidual: 0.5,
} as const
