// CARTOGRAFÍA ESTELAR 144 — los tres universos, los siete cuerpos, las doce
// dimensiones.
//
// CAPA B, y además VOLUNTARIA.
//
// ── LO QUE NO SE HACE AQUÍ ─────────────────────────────────────────────────
// Nada de esto se deriva del cálculo astronómico. Ninguna estrella "es" un
// cuerpo ni "corresponde" a una dimensión. Son LENTES que la persona elige
// aplicar sobre su propia lectura, y que no cambian ni un número.
//
// La diferencia importa: si el sistema asignara automáticamente un cuerpo a
// cada portal, estaría afirmando una correspondencia que no tiene con qué
// sostener. Aquí la asignación la hace quien lee, sobre su propia experiencia.

import type { ContenidoCuerpo, CuerpoId } from "./tipos"

// ── Los tres universos ──────────────────────────────────────────────────────

export type UniversoId = "fisico" | "mental" | "espiritual"

export const UNIVERSOS: Record<UniversoId, {
  nombre: string
  pregunta: string
  ambitos: string[]
}> = {
  fisico: {
    nombre: "Físico",
    pregunta: "¿Cómo aparece esta dinámica en tu cuerpo, tus hábitos y lo que haces?",
    ambitos: ["cuerpo", "hábitos", "conducta", "decisiones", "acción"],
  },
  mental: {
    nombre: "Mental",
    pregunta: "¿Cómo aparece en lo que percibes, piensas y dices?",
    ambitos: ["percepción", "pensamiento", "interpretación", "lenguaje", "sentido"],
  },
  espiritual: {
    nombre: "Espiritual",
    pregunta: "¿Cómo aparece en tu propósito y tu relación con algo mayor que tú?",
    ambitos: ["propósito", "servicio", "integración", "relación con algo mayor"],
  },
}

export const AVISO_UNIVERSOS =
  "Esto no sale del cálculo ni lo cambia. Son simplemente tres maneras distintas de mirar lo mismo, por si alguna te sirve más que las otras."

// ── Los siete cuerpos ───────────────────────────────────────────────────────

export const CUERPOS: Record<CuerpoId, ContenidoCuerpo> = {
  fisico: {
    id: "fisico",
    nombre: "Físico",
    descripcion:
      "Donde el patrón se nota en el cuerpo: cansancio, tensión, sueño, apetito, la postura al entrar en un sitio.",
    preguntas: [
      "¿Dónde se instala esto físicamente, y cuándo lo notas?",
      "¿Qué hace tu cuerpo antes de que tu mente registre la situación?",
      "¿Qué cambia en tu descanso cuando esto está activo?",
    ],
  },
  astral: {
    id: "astral",
    nombre: "Astral",
    descripcion:
      "Donde el patrón se nota en el estado de ánimo y en las reacciones que llegan antes de pensar.",
    preguntas: [
      "¿Qué emoción aparece primero, antes de cualquier explicación?",
      "¿Qué situaciones lo disparan sin que medie una decisión?",
      "¿Cuánto tarda en pasarse, y qué lo acorta?",
    ],
  },
  mental_inferior: {
    id: "mental_inferior",
    nombre: "Mental inferior",
    descripcion:
      "Donde el patrón se nota en el pensamiento concreto: lo que te repites, cómo interpretas lo que pasa, qué te dices.",
    preguntas: [
      "¿Qué frase exacta te dices cuando esto ocurre?",
      "¿Qué interpretación das por hecha sin comprobarla?",
      "¿Cuántas veces al día vuelve este pensamiento?",
    ],
  },
  mental_superior: {
    id: "mental_superior",
    nombre: "Mental superior",
    descripcion:
      "Donde el patrón se nota en los principios: qué consideras correcto, qué criterio usas para decidir.",
    preguntas: [
      "¿Qué principio tuyo está detrás de esto?",
      "¿De dónde salió ese principio, y lo elegirías hoy?",
      "¿Qué decisión tuya se apoya en él sin que lo hayas notado?",
    ],
  },
  alma: {
    id: "alma",
    nombre: "Alma",
    descripcion:
      "Donde el patrón se nota en lo que te importa de fondo, más allá de la conveniencia.",
    preguntas: [
      "¿Qué se pone en juego aquí que sí te importa de verdad?",
      "¿Qué estarías traicionando si lo resolvieras de la manera cómoda?",
      "¿Qué reconoces en esto que llevas contigo desde hace mucho?",
    ],
  },
  espiritu: {
    id: "espiritu",
    nombre: "Espíritu",
    descripcion:
      "Donde el patrón se nota en la dirección: hacia dónde empuja, qué orienta tus decisiones largas.",
    preguntas: [
      "¿Hacia dónde te empuja esto cuando dejas de resistirlo?",
      "¿Qué dirección se sostiene en tu vida más allá de las circunstancias?",
      "¿Qué seguirías haciendo aunque nada de esto se reconociera?",
    ],
  },
  esencia: {
    id: "esencia",
    nombre: "Esencia",
    descripcion:
      "Donde el patrón deja de ser algo que te pasa y pasa a ser simplemente cómo eres. Aquí no hay nada que resolver.",
    preguntas: [
      "¿Qué parte de esto no necesita cambiar?",
      "¿Qué queda de ti cuando sueltas la lucha con ello?",
      "¿Qué es lo que no cambia, dicho sin adornos?",
    ],
  },
}

export const ORDEN_CUERPOS: CuerpoId[] = [
  "fisico", "astral", "mental_inferior", "mental_superior",
  "alma", "espiritu", "esencia",
]

export const AVISO_CUERPOS =
  "Aquí no elegimos nosotros: eliges tú. La herramienta no te asigna ninguno, porque no tendría con qué hacerlo. Según lo que elijas cambian las preguntas que te hacemos, y nada más."

// ── Las doce dimensiones ────────────────────────────────────────────────────
//
// Arquitectura preparada, integración pendiente.
//
// DELIBERADAMENTE SIN DERIVAR DEL CÁLCULO. No se va a afirmar que una estrella
// corresponde a una dimensión: no hay nada que lo sostenga, ni astronómica ni
// editorialmente, y decirlo sería exactamente el tipo de afirmación que esta
// herramienta evita. Queda declarado como trabajo futuro.

export const DIMENSIONES_ESTADO = {
  integrado: false,
  nota:
    "Las doce dimensiones no se calculan a partir de las estrellas ni se asignan a ningún portal. La arquitectura está preparada para una integración futura que, cuando llegue, será también una lente voluntaria.",
} as const
