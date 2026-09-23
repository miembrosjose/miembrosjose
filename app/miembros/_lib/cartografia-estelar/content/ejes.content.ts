// CARTOGRAFÍA ESTELAR 144 — ejes de integración.
//
// CAPA B. Un eje es una polaridad real entre dos capacidades que se piden
// cosas distintas. No es un diagnóstico ni una etiqueta: es una tensión que
// aparece cuando dos portales de una misma cartografía tiran en direcciones
// que no se ajustan solas.
//
// Ninguno de los dos polos es el bueno. El trabajo no es elegir: es saber
// en qué momento se está cayendo hacia uno de ellos.

import type { ContenidoEje, EjeId } from "./tipos"

export const EJES: Record<EjeId, ContenidoEje> = {
  pertenencia_soberania: {
    id: "pertenencia_soberania",
    nombre: "Pertenencia ↔ Soberanía",
    polos: ["Pertenencia", "Soberanía"],
    descripcion:
      "Dos necesidades reales que no se satisfacen a la vez. Formar parte pide ajustarse; sostener lo propio pide no ajustarse. Cada vez que una situación las pone en contacto hay que decidir cuál se atiende, y la que queda fuera no desaparece.",
    comoReconocerlo:
      "Caes hacia pertenencia cuando descubres que has cambiado de opinión sin darte cuenta y no sabes cuál era la tuya. Caes hacia soberanía cuando te has ido de un sitio y no sabrías explicar qué habría hecho falta para quedarte.",
    pregunta: "¿Puedo sostener lo mío dentro de un vínculo, sin retirarme y sin disolverme?",
  },

  servicio_limite: {
    id: "servicio_limite",
    nombre: "Servicio ↔ Límite",
    polos: ["Servicio", "Límite"],
    descripcion:
      "Estar disponible para otros y conservar lo propio son cosas que compiten por las mismas horas y la misma energía. No hay un punto de equilibrio fijo: hay una decisión por situación, y un límite que hay que volver a poner cada vez.",
    comoReconocerlo:
      "Caes hacia servicio cuando el cansancio no se corresponde con lo que has hecho, sino con lo que has sostenido. Caes hacia límite cuando te has protegido de algo que en realidad querías hacer.",
    pregunta: "¿Cómo estar disponible sin hacerme responsable de procesos que solo otro puede atravesar?",
  },

  libertad_estructura: {
    id: "libertad_estructura",
    nombre: "Libertad ↔ Estructura",
    polos: ["Libertad", "Estructura"],
    descripcion:
      "El margen abierto permite moverse; la estructura permite que algo llegue a existir. Lo que se gana en una dirección se pierde en la otra, y ninguna cantidad de una compensa la ausencia de la otra.",
    comoReconocerlo:
      "Caes hacia libertad cuando tienes muchas cosas abiertas y ninguna avanza. Caes hacia estructura cuando sigues un plan que dejó de tener sentido hace meses.",
    pregunta: "¿Qué tendría que fijar para poder moverme de verdad dentro de ello?",
  },

  sensibilidad_discernimiento: {
    id: "sensibilidad_discernimiento",
    nombre: "Sensibilidad ↔ Discernimiento",
    polos: ["Sensibilidad", "Discernimiento"],
    descripcion:
      "Percibir mucho y decidir con criterio no se ayudan tanto como parece. La sensibilidad trae información que el criterio no pidió, y el criterio corta información que la sensibilidad consideraba relevante.",
    comoReconocerlo:
      "Caes hacia sensibilidad cuando tienes tanta información sobre una situación que no puedes decidir nada. Caes hacia discernimiento cuando has decidido bien y has dejado a alguien fuera sin enterarte.",
    pregunta: "¿Qué de lo que percibo necesita acción, y qué solo necesita ser registrado?",
  },

  vision_encarnacion: {
    id: "vision_encarnacion",
    nombre: "Visión ↔ Encarnación",
    polos: ["Visión", "Encarnación"],
    descripcion:
      "Ver lejos y hacer aquí piden estados distintos. La visión se degrada al bajar al detalle; el detalle no se resuelve mirando lejos. La mayoría de lo que no avanza está atascado en el tránsito entre ambas.",
    comoReconocerlo:
      "Caes hacia visión cuando llevas meses con una idea clara y ningún primer paso hecho. Caes hacia encarnación cuando llevas meses muy ocupado y no sabrías decir hacia dónde.",
    pregunta: "¿Cuál es el primer paso concreto, con fecha, de lo que veo claro?",
  },

  poder_responsabilidad: {
    id: "poder_responsabilidad",
    nombre: "Poder ↔ Responsabilidad",
    polos: ["Poder", "Responsabilidad"],
    descripcion:
      "Tener efecto sobre otros y responder por ese efecto no llegan juntos. El efecto aparece solo; la responsabilidad hay que asumirla, y solo se puede asumir lo que se ha notado.",
    comoReconocerlo:
      "Caes hacia poder cuando te sorprende el efecto que tuvo algo que dijiste de pasada. Caes hacia responsabilidad cuando cargas con consecuencias de decisiones que no tomaste tú.",
    pregunta: "¿Qué efecto estoy teniendo que todavía no he reconocido en voz alta?",
  },

  conocimiento_experiencia: {
    id: "conocimiento_experiencia",
    nombre: "Conocimiento ↔ Experiencia",
    polos: ["Conocimiento", "Experiencia"],
    descripcion:
      "Entender algo y haberlo vivido producen saberes distintos que no se sustituyen. El conocimiento llega antes y protege del error; la experiencia llega después y es la única que cambia cómo se actúa.",
    comoReconocerlo:
      "Caes hacia conocimiento cuando ves con total claridad un patrón tuyo y sigues repitiéndolo. Caes hacia experiencia cuando repites un error que podrías haber previsto leyendo media hora.",
    pregunta: "¿Qué entiendo perfectamente y todavía no he hecho ni una vez?",
  },

  movimiento_raiz: {
    id: "movimiento_raiz",
    nombre: "Movimiento ↔ Raíz",
    polos: ["Movimiento", "Raíz"],
    descripcion:
      "Cambiar de sitio y echar raíz dan cosas distintas y se excluyen en el tiempo. El movimiento da perspectiva y evita desgastes; la raíz da profundidad y es la única que permite que algo madure.",
    comoReconocerlo:
      "Caes hacia movimiento cuando llevas varios sitios y en ninguno llegaste a la parte difícil. Caes hacia raíz cuando sigues donde estás y no sabrías decir por qué, más allá de que ya estabas.",
    pregunta: "¿Me voy porque terminó, o porque se puso difícil?",
  },

  expansion_foco: {
    id: "expansion_foco",
    nombre: "Expansión ↔ Foco",
    polos: ["Expansión", "Foco"],
    descripcion:
      "Abrir posibilidades y desarrollar una son operaciones opuestas. Mientras todo sigue abierto nada puede fallar del todo, y tampoco puede llegar a ninguna parte.",
    comoReconocerlo:
      "Caes hacia expansión cuando abres algo nuevo justo cuando lo actual entra en su fase aburrida. Caes hacia foco cuando llevas años en lo mismo sin haber mirado si había otra cosa.",
    pregunta: "¿A qué tendría que renunciar para hacer bien una sola cosa?",
  },
}

/**
 * Qué eje tiende a producir cada portal.
 *
 * Es una asignación EDITORIAL: dice desde qué polo empuja el tema de ese
 * portal. Un eje se forma cuando dos portales activos de una cartografía
 * empujan desde polos opuestos del mismo par.
 */
export const POLO_DE_PORTAL: Record<string, { eje: EjeId; polo: 0 | 1 }> = {
  // Pertenencia ↔ Soberanía
  pleyades: { eje: "pertenencia_soberania", polo: 0 },
  omega_centauri: { eje: "pertenencia_soberania", polo: 0 },
  casiopea: { eje: "pertenencia_soberania", polo: 0 },
  lyra: { eje: "pertenencia_soberania", polo: 1 },
  ofiuco: { eje: "pertenencia_soberania", polo: 1 },
  fomalhaut: { eje: "pertenencia_soberania", polo: 1 },

  // Servicio ↔ Límite
  sirio: { eje: "servicio_limite", polo: 0 },
  capella: { eje: "servicio_limite", polo: 0 },
  hercules: { eje: "servicio_limite", polo: 0 },
  m13: { eje: "servicio_limite", polo: 0 },
  libra: { eje: "servicio_limite", polo: 1 },
  achernar: { eje: "servicio_limite", polo: 1 },
  grus: { eje: "servicio_limite", polo: 1 },

  // Libertad ↔ Estructura
  andromeda: { eje: "libertad_estructura", polo: 0 },
  pegaso: { eje: "libertad_estructura", polo: 0 },
  altair: { eje: "libertad_estructura", polo: 0 },
  capricornus: { eje: "libertad_estructura", polo: 1 },
  aldebaran: { eje: "libertad_estructura", polo: 1 },
  polaris: { eje: "libertad_estructura", polo: 1 },
  draco: { eje: "libertad_estructura", polo: 1 },

  // Sensibilidad ↔ Discernimiento
  m42: { eje: "sensibilidad_discernimiento", polo: 0 },
  epsilon_eridani: { eje: "sensibilidad_discernimiento", polo: 0 },
  orion: { eje: "sensibilidad_discernimiento", polo: 1 },
  arcturus: { eje: "sensibilidad_discernimiento", polo: 1 },
  spica: { eje: "sensibilidad_discernimiento", polo: 1 },
  corvus: { eje: "sensibilidad_discernimiento", polo: 1 },

  // Visión ↔ Encarnación
  centro_galactico: { eje: "vision_encarnacion", polo: 0 },
  cefeo: { eje: "vision_encarnacion", polo: 0 },
  deneb: { eje: "vision_encarnacion", polo: 0 },
  shapley: { eje: "vision_encarnacion", polo: 0 },
  alfa_centauri: { eje: "vision_encarnacion", polo: 1 },
  procyon: { eje: "vision_encarnacion", polo: 1 },

  // Poder ↔ Responsabilidad
  regulus: { eje: "poder_responsabilidad", polo: 0 },
  virgo_m87: { eje: "poder_responsabilidad", polo: 0 },
  antares: { eje: "poder_responsabilidad", polo: 0 },
  canopus: { eje: "poder_responsabilidad", polo: 1 },
  m1: { eje: "poder_responsabilidad", polo: 1 },
  gran_atractor: { eje: "poder_responsabilidad", polo: 1 },

  // Conocimiento ↔ Experiencia
  m31: { eje: "conocimiento_experiencia", polo: 0 },
  tau_ceti: { eje: "conocimiento_experiencia", polo: 0 },
  hydra: { eje: "conocimiento_experiencia", polo: 1 },
  phoenix: { eje: "conocimiento_experiencia", polo: 1 },
  m57: { eje: "conocimiento_experiencia", polo: 1 },

  // Movimiento ↔ Raíz
  perseo: { eje: "movimiento_raiz", polo: 0 },
  geminis: { eje: "movimiento_raiz", polo: 0 },
  crux: { eje: "movimiento_raiz", polo: 1 },
  centaurus: { eje: "movimiento_raiz", polo: 1 },

  // Expansión ↔ Foco
  sagittarius: { eje: "expansion_foco", polo: 0 },
  aquarius: { eje: "expansion_foco", polo: 0 },
  sculptor: { eje: "expansion_foco", polo: 1 },
}
