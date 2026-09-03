// Datos de los Portales de Integración entre temporadas del camino iniciático.
// No son videos ni episodios: son bloques de integración (frase, texto,
// bitácora y una acción concreta) que enlazan una temporada con la siguiente.

export type IntegrationPortalDef = {
  id: 1 | 2 | 3
  /** Temporada a la que da acceso el botón final. */
  nextSeason: number
  kicker: string
  name: string
  frase: string[]
  text: string[]
  questions: string[]
  action: string
  buttonLabel: string
  journalKey: string
  /** Título EXACTO del tema del foro (debe coincidir con el SQL sembrado). */
  forumTitle: string
}

// Títulos EXACTOS de los temas del foro (coinciden con docs/sql/foro_temario_144000.sql).
export const FORUM_TITLES = {
  ingreso: "Portal de Ingreso — ¿Por qué llegaste a este camino?",
  objetivos: "Objetivos de Los 144.000 — De la memoria a la misión",
  territorio: "Misión Territorial — La historia sagrada de tu lugar",
  nodos: "Nodos 144.000 — Formar comunidad de base",
} as const

export const INTEGRATION_PORTALS: IntegrationPortalDef[] = [
  {
    id: 1,
    nextSeason: 2,
    kicker: "Entre Temporada 1 y 2",
    name: "PORTAL DEL COMPROMISO",
    frase: ["Recordar no es saber más.", "Recordar es responder."],
    text: [
      "La Temporada 1 abrió el Llamado de Los 144.000: frecuencia, responsabilidad, semilla estelar, olvido, nombre cósmico, misión de la Tierra y propósito.",
      "Antes de entrar a la estructura del cosmos, la memoria recibida debe tocar la voluntad.",
      "Este portal marca el primer compromiso interior: dejar de mirar el despertar como una idea y comenzar a vivirlo como una responsabilidad.",
    ],
    questions: [
      "¿Qué parte de mí se sintió llamada?",
      "¿Qué resistencia apareció durante esta primera etapa?",
      "¿Qué responsabilidad comienza a despertar en mí?",
    ],
    action: "Escribe una declaración personal de intención para este camino.",
    buttonLabel: "Entrar a la Temporada 2",
    journalKey: "portal_compromiso",
    forumTitle: "Portal del Compromiso (T1 → T2) — Tu declaración de intención",
  },
  {
    id: 2,
    nextSeason: 3,
    kicker: "Entre Temporada 2 y 3",
    name: "PORTAL DEL MAPA CÓSMICO",
    frase: ["Quien conoce la estructura,", "puede comprender su lugar dentro del Plan."],
    text: [
      "La Temporada 2 reveló la estructura del cosmos: la Fuente, los universos, las dimensiones, los cuerpos, la jerarquía galáctica, las leyes universales y la Confederación.",
      "Antes de entrar en la historia oculta de la Tierra, el participante debe ubicarse dentro del mapa mayor.",
      "No se trata de mirar el universo desde afuera. Se trata de comprender que el ser humano también participa de esa arquitectura.",
    ],
    questions: [
      "¿Qué cambió en mi visión del universo?",
      "¿Qué dimensión de mi vida necesita más orden?",
      "¿Qué ley universal siento que debo encarnar con más conciencia?",
    ],
    action: "Elige una de las 7 leyes universales y obsérvala durante una semana en tu vida diaria.",
    buttonLabel: "Entrar a la Temporada 3",
    journalKey: "portal_mapa_cosmico",
    forumTitle: "Portal del Mapa Cósmico (T2 → T3) — Elige una de las 7 leyes universales",
  },
  {
    id: 3,
    nextSeason: 4,
    kicker: "Entre Temporada 3 y 4",
    name: "PORTAL DE LA MEMORIA TERRESTRE",
    frase: ["La historia oculta de la Tierra", "también vive en la memoria humana."],
    text: [
      "La Temporada 3 abrió los orígenes ocultos de la Tierra: las primeras humanidades, Lemuria, Orión, Atlántida, los linajes estelares, la caída atlante y la Hermandad Blanca de la Tierra.",
      "Antes de entrar a los Archivos del Sol, esta memoria debe ser integrada.",
      "La historia de la Tierra no es solamente antigua. Sigue actuando en los pueblos, en las heridas colectivas, en los símbolos, en los sueños y en la forma en que la humanidad recuerda o repite.",
    ],
    questions: [
      "¿Qué parte de esta historia me removió más?",
      "¿Qué herida colectiva siento que debe ser sanada?",
      "¿Qué memoria siento más cercana: Lemuria, Orión, Atlántida, Sirio, Pléyades, Arcturus o la Hermandad Blanca?",
    ],
    action: "Durante siete días registra sueños, símbolos, emociones o intuiciones relacionadas con las memorias de la Tierra.",
    buttonLabel: "Entrar a la Temporada 4",
    journalKey: "portal_memoria_terrestre",
    forumTitle: "Portal de la Memoria Terrestre (T3 → T4) — Sueños y señales (7 días)",
  },
]

export function getIntegrationPortal(id: number): IntegrationPortalDef | undefined {
  return INTEGRATION_PORTALS.find((p) => p.id === id)
}
