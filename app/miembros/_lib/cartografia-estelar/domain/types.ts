// CARTOGRAFÍA ESTELAR 144 — tipos del dominio.
//
// ── LAS DOS CAPAS ──────────────────────────────────────────────────────────
// Este archivo distingue, a propósito y en los nombres, dos cosas que nunca
// deben mezclarse:
//
//   CAPA A — astronomía. Determinista, reproducible, auditable. Todo lo que
//   aquí se llama `grados`, `separacion`, `longitud` es un número calculado.
//
//   CAPA B — interpretación 144. Contemplativa, editorial, nuestra. Vive en
//   `content/` y jamás entra en estos tipos salvo como identificador.
//
// Un contacto astronómico no afirma nada espiritual. La resonancia tampoco:
// es una medida de nuestra metodología, no un hecho del cielo.

// ── Nacimiento ──────────────────────────────────────────────────────────────

/**
 * El nacimiento, en componentes explícitos y con su lugar.
 *
 * NUNCA una cadena pasada por `new Date`: eso la interpreta según la zona del
 * navegador y puede mover la hora natal una hora entera, que en el Ascendente
 * son quince grados.
 */
export type Nacimiento = {
  anio: number
  mes: number
  dia: number
  /** Hora LOCAL del lugar de nacimiento, no UTC. */
  hora: number
  minuto: number
  lugar: Lugar
}

export type Lugar = {
  /** Como lo escribió la persona. Solo para mostrar. */
  nombre: string
  latitud: number
  longitud: number
  /** Identificador IANA, p. ej. "America/Guayaquil". */
  zonaHoraria: string
}

/** El instante del nacimiento, ya resuelto a tiempo universal. */
export type InstanteNatal = {
  /** Milisegundos desde época, en UTC. */
  utcMs: number
  /** Desfase aplicado, en minutos. Se muestra para que sea auditable. */
  desfaseMinutos: number
  /** Texto del desfase, p. ej. "UTC−5". */
  desfaseTexto: string
}

// ── Puntos natales ──────────────────────────────────────────────────────────

export type PuntoNatalId =
  | "sol" | "luna" | "mercurio" | "venus" | "marte"
  | "jupiter" | "saturno" | "urano" | "neptuno" | "pluton"
  | "nodo_norte" | "nodo_sur" | "ascendente" | "medio_cielo"

export type PuntoNatal = {
  id: PuntoNatalId
  /** Longitud eclíptica de la fecha, 0–360. */
  longitud: number
  /** Latitud eclíptica. Los ángulos y nodos van a 0 por definición. */
  latitud: number
  /** Ascensión recta y declinación, para la separación real en el cielo. */
  ascensionRecta: number
  declinacion: number
}

// ── Catálogo ────────────────────────────────────────────────────────────────

export type TipoPortal =
  | "STAR_SYSTEM" | "STAR_FAMILY" | "CONSTELLATION"
  | "CLUSTER" | "GALAXY" | "NEBULA" | "COSMIC_REFERENCE"

/**
 * Un ancla: un objeto celeste concreto con coordenadas verificables.
 *
 * Las coordenadas se guardan en J2000 —que es como las publican los catálogos
 * astronómicos— y la precesión a la fecha del nacimiento la hace el motor.
 * Así el dato guardado es el del catálogo, sin transformar, y se puede
 * contrastar contra la fuente.
 */
export type Ancla = {
  id: string
  nombre: string
  /** Identificador del catálogo, p. ej. "HIP 32349". La procedencia. */
  designacion: string
  /** Ascensión recta J2000, en grados. */
  raJ2000: number
  /** Declinación J2000, en grados. */
  decJ2000: number
  /** Magnitud aparente, cuando se conoce. Solo informativa. */
  magnitud?: number
}

export type Portal = {
  id: string
  nombre: string
  tipo: TipoPortal
  anclas: Ancla[]
  /**
   * Peso del portal dentro del cálculo. Un ancla brillante y bien
   * documentada pesa lo mismo que otra: esto pondera el PORTAL, no el brillo.
   */
  peso: number
  /**
   * true cuando no tenemos coordenadas fiables para alguna de sus anclas.
   * Un portal pendiente NO entra en el cálculo: preferimos que falte a que
   * salga con datos inventados.
   */
  pendingData?: boolean
}

// ── Contactos y resonancia ──────────────────────────────────────────────────

export type AspectoId = "conjuncion" | "oposicion" | "trigono" | "cuadratura" | "sextil"

/**
 * Un contacto entre un punto natal y un ancla.
 *
 * Guarda DOS distancias distintas a propósito, y la interfaz las muestra por
 * separado: confundirlas es el error más común de este tipo de herramientas.
 */
export type Contacto = {
  punto: PuntoNatalId
  portalId: string
  ancla: Ancla
  aspecto: AspectoId
  /**
   * Separación por LONGITUD ECLÍPTICA respecto al ángulo exacto del aspecto,
   * en grados. Es lo que construye el aspecto simbólico.
   */
  orbe: number
  /**
   * Separación angular REAL sobre la esfera celeste, en grados. Para una
   * estrella lejos de la eclíptica puede ser enorme aunque el orbe sea mínimo.
   */
  separacionReal: number
  /** Aporte de este contacto, 0–1 antes de agregar. */
  fuerza: number
}

export type ResonanciaPortal = {
  portalId: string
  /** 0–100. NO es una probabilidad de nada: es una medida de esta metodología. */
  resonancia: number
  contactos: Contacto[]
}

export type Cartografia = {
  nacimiento: Nacimiento
  instante: InstanteNatal
  puntos: PuntoNatal[]
  /** Ordenadas de mayor a menor resonancia. Solo las que tienen contacto. */
  resonancias: ResonanciaPortal[]
  /** Portales sin ningún contacto. Se listan para poder decir "X de 50". */
  sinContacto: string[]
  resumen: {
    contactosExactos: number
    portalesActivos: number
    portalesTotales: number
    portalMayor: string | null
    puntoMasImplicado: PuntoNatalId | null
    aspectoMasRepetido: AspectoId | null
  }
}
