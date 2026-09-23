// CARTOGRAFÍA ESTELAR 144 — contrato de la capa editorial.
//
// CAPA B. Aquí no hay astronomía y nada de aquí pretende serlo.
//
// ── ORIGEN ─────────────────────────────────────────────────────────────────
// Escrito para Los 144.000. No procede de Galactic Astro Chart, Galactic
// Astrology, Starseed Astrology, Starseed Strategies, Gene Keys, Human Design,
// Law of One, Urantia, Oahspe, ni de ningún curso, PDF, ebook, tabla comercial
// o blog de razas estelares. No se consultaron ni se parafrasearon.
//
// ── LA REGLA QUE GOBIERNA TODO ESTE DIRECTORIO ─────────────────────────────
// Ningún texto afirma lo que alguien ES. Describe con qué se RELACIONA una
// configuración y cómo PUEDE expresarse. Nunca predice. La tensión no es un
// defecto ni un diagnóstico: es la forma que toma una capacidad cuando se
// sostiene sola.
//
// ── EL ESTADO NO SE MUESTRA ────────────────────────────────────────────────
// `estado` es un control interno de redacción. La interfaz NUNCA lo enseña.
// Un portal activo entrega siempre lectura completa; si no la tuviera, el
// fallo es de contenido y las pruebas lo detienen antes de llegar a nadie.
//
// ── QUÉ SIGNIFICA CADA ESTADO ──────────────────────────────────────────────
//   seed     · esqueleto con los campos puestos, todavía sin redactar.
//   draft    · redactado entero, sin pasar por la revisión editorial.
//   reviewed · redactado y comprobado contra las reglas del módulo.
//
// «reviewed» no es una opinión: es lo que certifica
// `tests/cartografia-revision.test.ts`, que comprueba los cincuenta portales
// campo por campo —que ninguno afirme procedencia, prediga o diagnostique,
// que no cite fuentes vetadas, que cada campo tenga sustancia, que las
// preguntas sean preguntas y que nada esté copiado de otro portal—.
//
// Durante meses los cincuenta estuvieron en «draft» y ninguno llegó a
// «reviewed», porque no había escrito en ninguna parte qué había que cumplir
// para merecerlo. Una marca que no se puede ganar no informa de nada. Ahora
// se puede ganar, y se pierde sola: si alguien reescribe un portal y rompe
// una regla, la prueba lo para.

export type EstadoContenido = "seed" | "draft" | "reviewed"

/** Una práctica observable. Sin afirmaciones, sin fe requerida. */
export type Practica = {
  titulo: string
  /** Qué se hace, en pasos que se pueden seguir sin interpretarlos. */
  pasos: string[]
  /** Qué mirar al terminar. Nunca "qué vas a descubrir". */
  cierre: string
}

/** Las tres lentes voluntarias. No se derivan del cálculo: las elige la persona. */
export type Framework144 = {
  fisico: string
  mental: string
  espiritual: string
}

export type Relaciones = {
  consigo: string
  vinculos: string
  grupo: string
  servicio: string
}

export type ContenidoPortal = {
  id: string
  estado: EstadoContenido

  /**
   * CAPA A dentro del archivo editorial, y la única excepción a la regla:
   * descripción astronómica factual del objeto. Sin metáfora, sin lectura.
   * Se muestra en su propia sección, separada del resto.
   */
  astronomia: string

  /** Tres expresiones que fijan el tono. */
  esencia: string
  /** Una frase de entrada. Lo primero que se lee al abrir el portal. */
  fraseUmbral: string

  arquetipo: string
  /** El tema en una sola idea, más corto y más central que el arquetipo. */
  nucleo: string

  potenciales: string[]
  tensiones: string[]
  /** Cómo se ve cuando la capacidad y su límite conviven. */
  cuandoIntegrado: string[]
  /** Cómo se ve cuando la capacidad corre sin freno. No es un diagnóstico. */
  cuandoSobrecargado: string[]
  /** Escenas cotidianas reconocibles. Concretas, no abstractas. */
  patronesCotidianos: string[]

  relaciones: Relaciones

  aprendizajeCentral: string
  /** La contradicción interna del tema. Sin resolverla. */
  paradoja: string

  preguntaUmbral: string
  preguntas: string[]
  journalPrompts: string[]

  practicaBase: Practica
  framework144: Framework144
}

// ── Puntos natales ──────────────────────────────────────────────────────────

export type ContenidoPunto = {
  nombre: string
  /** Tres palabras, para las listas compactas. */
  lente: string
  /** Qué función de la experiencia representa. 1–2 frases. */
  funcion: string
  /** Qué significa que un portal toque justamente aquí. */
  cuandoEsTocado: string
  /** Cómo se reconoce en la vida diaria. */
  seReconoceEn: string
  /** Pregunta propia del punto, independiente del portal. */
  pregunta: string
}

// ── Aspectos ────────────────────────────────────────────────────────────────

export type ContenidoAspecto = {
  nombre: string
  /** El ángulo, en texto, para la capa educativa. */
  angulo: string
  /** Qué relación describe. Nunca "bueno" ni "malo". */
  cualidad: string
  /** Desarrollo editorial: cómo tiende a experimentarse. */
  comoSeExperimenta: string
  /** Qué cambia respecto a los otros aspectos. */
  queAporta: string
}

// ── Combinación portal × punto ──────────────────────────────────────────────

/** Texto específico para un cruce concreto. 350–650 caracteres. */
export type ContenidoCruce = string

// ── Ejes de integración ─────────────────────────────────────────────────────

export type EjeId =
  | "pertenencia_soberania" | "servicio_limite" | "libertad_estructura"
  | "sensibilidad_discernimiento" | "vision_encarnacion"
  | "poder_responsabilidad" | "conocimiento_experiencia"
  | "movimiento_raiz" | "expansion_foco"

export type ContenidoEje = {
  id: EjeId
  nombre: string
  polos: [string, string]
  descripcion: string
  /** Qué observar para reconocer en qué polo se está cayendo. */
  comoReconocerlo: string
  pregunta: string
}

// ── Capacidades ─────────────────────────────────────────────────────────────

export type CapacidadId =
  | "observacion" | "transmision" | "organizacion" | "vinculo"
  | "discernimiento" | "creacion" | "movimiento" | "servicio"
  | "liderazgo" | "transformacion" | "perspectiva" | "encarnacion"

export type ContenidoCapacidad = {
  id: CapacidadId
  nombre: string
  descripcion: string
  /** Cómo puede aparecer sin que quien la tiene la note. */
  puntoCiego: string
}

// ── Siete cuerpos ───────────────────────────────────────────────────────────

export type CuerpoId =
  | "fisico" | "astral" | "mental_inferior" | "mental_superior"
  | "alma" | "espiritu" | "esencia"

export type ContenidoCuerpo = {
  id: CuerpoId
  nombre: string
  descripcion: string
  /** Preguntas distintas según dónde la persona reconozca el patrón. */
  preguntas: string[]
}
