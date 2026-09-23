// CÓDIGO DE ORIGEN — tipos de la lectura.
//
// Tres capas separadas a propósito:
//   1. engine.ts        habla con el motor de cálculo y devuelve índices
//   2. mappings.ts      traduce esos índices al vocabulario de Los 144.000
//   3. interpretations.ts  contiene los textos
//
// Nada de lo que sale de aquí lleva terminología del motor. Los datos crudos
// viajan en `_debug`, que la interfaz no muestra nunca.

/** Las cinco frecuencias, en el orden interno del motor. */
export type FrecuenciaId =
  | "expansion"
  | "activacion"
  | "encarnacion"
  | "claridad"
  | "profundidad"

/** Hacia dónde se mueve la energía de origen. */
export type VectorId = "proyeccion" | "recepcion"

/** Los diez arquetipos de origen. */
export type ArquetipoId =
  | "resonancia"
  | "impulso"
  | "creacion"
  | "revelacion"
  | "materializacion"
  | "apertura"
  | "orden"
  | "iniciacion"
  | "sabiduria"
  | "vision_interior"

export type Frecuencia = {
  id: FrecuenciaId
  nombre: string
  frase: string
  descripcion: string
  don: string
  desequilibrio: string
  integracion: string
  /** Cómo suele reconocerse en el día a día, en gestos concretos. */
  enLaPractica: string
  /** Un ejercicio observable. Nada que exija creer nada. */
  practica: string
  /** Color con el que se dibuja en el mandala. */
  color: string
}

export type Arquetipo = {
  id: ArquetipoId
  nombre: string
  frase: string
  don: string
  tension: string
  integracion: string
  /** Dónde suele encajar esta forma de sostener dentro de Los 144.000. */
  enLaRed: string
}

/**
 * Clave de una lectura de combinación: `${raiz}-${apoyo}`.
 * Son 20 (cinco frecuencias por las otras cuatro).
 */
export type CombinacionId = `${FrecuenciaId}-${FrecuenciaId}`

export type Vector = {
  id: VectorId
  nombre: string
  descripcion: string
}

/** Peso de una frecuencia dentro de la configuración. */
export type PesoFrecuencia = {
  id: FrecuenciaId
  /** Puntos brutos del cálculo. Sirven para ordenar. */
  peso: number
  /** Porcentaje sobre el total, redondeado. Suma 100 salvo redondeos. */
  porcentaje: number
}

/** El nacimiento, en componentes explícitos. Nunca un Date ni una cadena. */
export type Nacimiento = {
  anio: number
  mes: number
  dia: number
  hora: number
  minuto: number
}

export type CodigoOrigenResultado = {
  nacimiento: Nacimiento
  /** Las cinco frecuencias ordenadas de mayor a menor presencia. */
  reparto: PesoFrecuencia[]
  raiz: Frecuencia
  apoyo: Frecuencia
  integracion: Frecuencia
  vector: Vector
  arquetipo: Arquetipo
  /** Lectura del par raíz + apoyo. Es lo que diferencia una lectura de otra. */
  combinacion: string
  /** Cómo matiza el vector a la frecuencia raíz. */
  matizDelVector: string
  /** Síntesis armada con reglas y plantillas propias. Sin IA, sin red. */
  configuracion: string[]
  /**
   * Datos crudos del motor. Solo para depuración: NO se muestran nunca en la
   * interfaz, y por eso van en un campo con nombre explícito.
   */
  _debug: {
    pilares: string[]
    elementoDia: number
    polaridadDia: number
    relacionOrigen: number
  }
}
