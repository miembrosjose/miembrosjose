// CARTOGRAFÍA ESTELAR 144 — los cinco aspectos, en texto.
//
// CAPA B para `cualidad`, `comoSeExperimenta` y `queAporta`.
// CAPA A para `angulo`: ese número es geometría, no lectura.
//
// ── NINGUNO ES MEJOR QUE OTRO ──────────────────────────────────────────────
// No hay aspectos favorables ni desfavorables aquí. Un trígono no es una
// recompensa y una cuadratura no es un castigo: describen relaciones
// distintas entre dos funciones, y cada una tiene su manera de expresarse y
// su manera de costar.

import type { ContenidoAspecto } from "./tipos"
import type { AspectoId } from "../domain/types"

export const ASPECTOS_CONTENIDO: Record<AspectoId, ContenidoAspecto> = {
  conjuncion: {
    nombre: "Conjunción",
    angulo: "0°",
    cualidad: "concentración · fusión",
    comoSeExperimenta:
      "Las dos funciones aparecen tan juntas dentro del modelo que cuesta distinguirlas. No se vive como tener una cosa y además otra, sino como una sola. Por eso suele ser lo último que alguien nota de sí mismo: para verlo habría que poder separarlo, y aquí está fundido.",
    queAporta:
      "Intensidad y dificultad de perspectiva a la vez. El tema está disponible de forma constante, y precisamente por eso rara vez se cuestiona.",
  },

  oposicion: {
    nombre: "Oposición",
    angulo: "180°",
    cualidad: "polaridad · contraste · espejo",
    comoSeExperimenta:
      "Las dos funciones se miran desde extremos. Es frecuente que una se viva como propia y la otra aparezca fuera: en personas concretas, en situaciones que se repiten, en lo que irrita de los demás. Reconocer que ambos extremos son propios suele llegar después de haberlos visto varias veces representados por otro.",
    queAporta:
      "Conciencia por contraste. Lo que no se ve mirando hacia dentro se acaba viendo enfrente.",
  },

  trigono: {
    nombre: "Trígono",
    angulo: "120°",
    cualidad: "fluidez · recurso disponible",
    comoSeExperimenta:
      "Las dos funciones colaboran sin que haya que forzarlas. Suele expresarse con tanta naturalidad que la persona no lo considera un recurso: da por hecho que todo el mundo funciona así. Es habitual descubrirlo por sorpresa, cuando alguien señala como notable algo que uno hacía sin pensar.",
    queAporta:
      "Facilidad real, con el riesgo de que no se aproveche por no haberse notado nunca.",
  },

  cuadratura: {
    nombre: "Cuadratura",
    angulo: "90°",
    cualidad: "fricción · integración deliberada",
    comoSeExperimenta:
      "Las dos funciones se piden cosas distintas y no se ajustan solas. Cada una tira en una dirección que la otra no puede seguir del todo, de modo que atender a una deja a la otra sin atender. La salida no aparece por esperar: exige decidir en cada ocasión concreta cuál se atiende y qué se hace con la que queda fuera.",
    queAporta:
      "Es el lugar donde suele desarrollarse verdadera destreza, porque obliga a resolver lo mismo muchas veces y con criterio propio.",
  },

  sextil: {
    nombre: "Sextil",
    angulo: "60°",
    cualidad: "posibilidad · recurso participativo",
    comoSeExperimenta:
      "Las dos funciones se llevan bien, pero no se activan por su cuenta. La relación está disponible y permanece en segundo plano hasta que alguien la usa a propósito. A diferencia del trígono, aquí sí hace falta dar el primer paso.",
    queAporta:
      "Una puerta abierta que no llama. Rinde cuando se busca y pasa desapercibida cuando no.",
  },
}

// ── Exactitud del contacto ──────────────────────────────────────────────────
//
// Clasificación por fracción del orbe permitido. Es una etiqueta de LECTURA,
// no de verdad: un contacto exacto no es "más cierto" ni "más espiritual" que
// uno amplio. Describe nitidez dentro del cálculo, nada más.

export type Exactitud = "exacto" | "cercano" | "amplio"

export const EXACTITUD_TEXTO: Record<Exactitud, { etiqueta: string; texto: string }> = {
  exacto: {
    etiqueta: "Exacto",
    texto: "Se quedó muy cerca de la separación exacta.",
  },
  cercano: {
    etiqueta: "Cercano",
    texto: "Dentro del margen, sin discusión.",
  },
  amplio: {
    etiqueta: "Amplio",
    texto: "Cerca del borde del margen. Cuenta, pero menos.",
  },
}

/** Umbrales como fracción del orbe permitido. Ver Metodología. */
export const LIMITE_EXACTO = 0.25
export const LIMITE_CERCANO = 0.60

export function clasificarExactitud(orbe: number, orbePermitido: number): Exactitud {
  if (orbePermitido <= 0) return "amplio"
  const f = orbe / orbePermitido
  if (f <= LIMITE_EXACTO) return "exacto"
  if (f <= LIMITE_CERCANO) return "cercano"
  return "amplio"
}

// ── Contacto, patrón, eje ───────────────────────────────────────────────────
//
// Términos EDITORIALES de Los 144.000 para describir acumulación. No son
// metafísica objetiva: son una forma de nombrar cuántas veces aparece lo mismo.

export type Densidad = "contacto" | "patron" | "eje"

export const DENSIDAD_TEXTO: Record<Densidad, { etiqueta: string; texto: string }> = {
  contacto: {
    etiqueta: "Una puerta",
    texto: "Un solo contacto. El tema aparece en una parte concreta de ti, no en todas.",
  },
  patron: {
    etiqueta: "Un patrón",
    texto: "Dos contactos. El mismo tema llega por dos caminos distintos, así que es más fácil reconocerlo en situaciones que no se parecen entre sí.",
  },
  eje: {
    etiqueta: "Un eje estructural",
    texto: "Tres o más contactos. El tema aparece en varias partes de ti a la vez, no solo en una.",
  },
}

export function clasificarDensidad(numeroContactos: number): Densidad {
  if (numeroContactos >= 3) return "eje"
  if (numeroContactos === 2) return "patron"
  return "contacto"
}
