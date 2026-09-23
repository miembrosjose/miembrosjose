// CARTOGRAFÍA ESTELAR 144 — mapa de capacidades.
//
// CAPA B. Una capacidad NO se afirma: se propone a partir de qué contactos
// concretos la sustentan, y la interfaz los muestra siempre debajo. Nunca
// aparece un "tienes este don" sin el porqué.
//
// Cada capacidad lleva su punto ciego, porque una capacidad sin contrapeso
// es exactamente lo que produce la mayoría de las dificultades.

import type { CapacidadId, ContenidoCapacidad } from "./tipos"

export const CAPACIDADES: Record<CapacidadId, ContenidoCapacidad> = {
  observacion: {
    id: "observacion",
    nombre: "Observación",
    descripcion:
      "Registrar lo que ocurre antes de interpretarlo: el estado de una sala, lo que alguien no dijo, el detalle que no encaja. Es una capacidad de entrada, no de conclusión.",
    puntoCiego:
      "Observar tanto que no queda energía para actuar, y confundir haber notado algo con haber hecho algo al respecto.",
  },
  transmision: {
    id: "transmision",
    nombre: "Transmisión",
    descripcion:
      "Convertir lo aprendido en algo que otro pueda usar sin haberlo vivido. Incluye enseñar, explicar y dejar dispuesto lo que servirá después.",
    puntoCiego:
      "Explicar cuando lo que hacía falta era escuchar, y necesitar seguir siendo indispensable para quien ya aprendió.",
  },
  organizacion: {
    id: "organizacion",
    nombre: "Organización",
    descripcion:
      "Ver la estructura que hay debajo de los hechos y darle una forma que se sostenga sin supervisión continua.",
    puntoCiego:
      "Reorganizar lo que ya funcionaba, y tratar a las personas como piezas de un sistema que se está mejorando.",
  },
  vinculo: {
    id: "vinculo",
    nombre: "Vínculo",
    descripcion:
      "Crear y sostener relación: hacer que un espacio sea habitable, que alguien baje la guardia, que un grupo tenga tejido.",
    puntoCiego:
      "Sostener el vínculo a costa de la propia posición, y confundir cuidar con hacerse cargo.",
  },
  discernimiento: {
    id: "discernimiento",
    nombre: "Discernimiento",
    descripcion:
      "Distinguir lo importante de lo urgente, lo propio de lo ajeno, lo que pide decisión de lo que solo pide tiempo.",
    puntoCiego:
      "Cortar demasiado pronto, y aplicar criterio a situaciones que pedían presencia.",
  },
  creacion: {
    id: "creacion",
    nombre: "Creación",
    descripcion:
      "Dar forma a algo que no existía y sostenerlo hasta que otros puedan verlo. Incluye empezar sin permiso y sin garantía.",
    puntoCiego:
      "Crear siempre en solitario, y abandonar en el momento en que empieza el mantenimiento.",
  },
  movimiento: {
    id: "movimiento",
    nombre: "Movimiento",
    descripcion:
      "Cambiar de posición cuando hace falta: dejar a tiempo, empezar en terreno nuevo, desbloquear lo parado.",
    puntoCiego:
      "Moverse ante cualquier fricción, y no llegar nunca a la parte que solo aparece si te quedas.",
  },
  servicio: {
    id: "servicio",
    nombre: "Servicio",
    descripcion:
      "Sostener lo que otros necesitan para poder funcionar, con continuidad y sin que dependa del entusiasmo.",
    puntoCiego:
      "Atar el valor propio a la utilidad prestada, y no saber pedir por llevar años dando.",
  },
  liderazgo: {
    id: "liderazgo",
    nombre: "Liderazgo",
    descripcion:
      "Ocupar un lugar de referencia y responder por sus efectos: decidir cuando hay que decidir y dar cobertura a otros.",
    puntoCiego:
      "Dejar de notar el propio peso, y ocupar el centro cuando otro lo necesitaba más.",
  },
  transformacion: {
    id: "transformacion",
    nombre: "Transformación",
    descripcion:
      "Atravesar procesos que cambian a fondo, propios o acompañando a otros, sin necesidad de suavizarlos.",
    puntoCiego:
      "Convertir en profundo lo que era sencillo, y controlar para que el proceso no se salga de lo previsto.",
  },
  perspectiva: {
    id: "perspectiva",
    nombre: "Perspectiva",
    descripcion:
      "Situar un asunto dentro de un marco más amplio y devolverle su tamaño real, sin quitarle importancia.",
    puntoCiego:
      "Relativizar lo que sí importaba, y dar perspectiva a quien pedía compañía.",
  },
  encarnacion: {
    id: "encarnacion",
    nombre: "Encarnación",
    descripcion:
      "Llevar a la práctica lo que otros dejaron en intención: hacerlo concreto, cotidiano y sostenible.",
    puntoCiego:
      "Ocuparse de lo inmediato para no mirar lo que pide una decisión mayor.",
  },
}

/**
 * Qué capacidades sustenta cada portal.
 *
 * Una capacidad se propone en la cartografía cuando los portales que la
 * sustentan tienen contacto real. Nunca se propone sin contactos debajo.
 */
export const CAPACIDADES_DE_PORTAL: Record<string, CapacidadId[]> = {
  pleyades: ["observacion", "vinculo"],
  sirio: ["servicio", "transmision"],
  arcturus: ["organizacion", "observacion"],
  lyra: ["creacion", "discernimiento"],
  orion: ["discernimiento", "transformacion"],
  andromeda: ["perspectiva", "movimiento"],
  alfa_centauri: ["encarnacion", "vinculo"],
  antares: ["transformacion", "servicio"],
  regulus: ["liderazgo", "vinculo"],
  centro_galactico: ["perspectiva", "discernimiento"],

  aldebaran: ["discernimiento", "servicio"],
  fomalhaut: ["observacion", "discernimiento"],
  spica: ["organizacion", "transmision"],
  altair: ["movimiento", "encarnacion"],
  deneb: ["transmision", "perspectiva"],
  polaris: ["liderazgo", "organizacion"],
  capella: ["servicio", "encarnacion"],
  canopus: ["transmision", "liderazgo"],
  achernar: ["discernimiento", "transformacion"],
  geminis: ["movimiento", "transmision"],

  perseo: ["movimiento", "observacion"],
  casiopea: ["servicio", "vinculo"],
  cefeo: ["perspectiva", "creacion"],
  draco: ["transmision", "organizacion"],
  ofiuco: ["creacion", "perspectiva"],
  hercules: ["servicio", "encarnacion"],
  pegaso: ["observacion", "creacion"],
  crux: ["discernimiento", "organizacion"],
  centaurus: ["observacion", "transformacion"],
  libra: ["vinculo", "discernimiento"],

  hydra: ["servicio", "perspectiva"],
  corvus: ["transmision", "discernimiento"],
  phoenix: ["transformacion", "creacion"],
  grus: ["movimiento", "discernimiento"],
  aquarius: ["creacion", "observacion"],
  capricornus: ["organizacion", "servicio"],
  sagittarius: ["creacion", "movimiento"],
  sculptor: ["organizacion", "discernimiento"],
  m31: ["perspectiva", "observacion"],
  m42: ["creacion", "observacion"],

  m1: ["transformacion", "perspectiva"],
  m57: ["transformacion", "discernimiento"],
  omega_centauri: ["vinculo", "transmision"],
  m13: ["servicio", "transmision"],
  virgo_m87: ["liderazgo", "organizacion"],
  gran_atractor: ["observacion", "perspectiva"],
  shapley: ["perspectiva", "transformacion"],
  procyon: ["organizacion", "encarnacion"],
  tau_ceti: ["vinculo", "observacion"],
  epsilon_eridani: ["creacion", "movimiento"],
}

// ── Zonas de integración ────────────────────────────────────────────────────
//
// Se derivan de aspectos tensos (cuadratura, oposición) y de contradicciones
// entre portales. Máximo tres por cartografía: más de tres dejan de orientar.

export type ZonaIntegracion = {
  nombre: string
  descripcion: string
}

export const ZONAS: Record<string, ZonaIntegracion> = {
  vinculo_sin_sobrecarga: {
    nombre: "Vínculo sin sobrecarga",
    descripcion:
      "Estar cerca de alguien sin quedarte con lo que le corresponde. La señal de que se ha cruzado la línea es el cansancio que no se explica por lo que has hecho.",
  },
  autonomia_sin_aislamiento: {
    nombre: "Autonomía sin aislamiento",
    descripcion:
      "Sostener lo propio sin que eso implique hacerlo todo solo. La señal es cuánto tardas en pedir ayuda cuando ya te vendría bien.",
  },
  servicio_sin_sacrificio: {
    nombre: "Servicio sin sacrificio",
    descripcion:
      "Aportar sin que el valor propio dependa de ser necesario. La señal es qué te queda cuando nadie te necesita durante una semana.",
  },
  vision_con_encarnacion: {
    nombre: "Visión con encarnación",
    descripcion:
      "Que lo que ves claro llegue a tener un primer paso con fecha. La señal es cuántas ideas tuyas llevan meses sin empezar.",
  },
  claridad_con_cuidado: {
    nombre: "Claridad con cuidado",
    descripcion:
      "Decir lo cierto midiendo el momento y a quien escucha. La señal es cuántas veces tuviste razón y la conversación salió mal.",
  },
  intensidad_con_tregua: {
    nombre: "Intensidad con tregua",
    descripcion:
      "Vivir a fondo sin que todo tenga que serlo. La señal es si puedes estar tranquilo sin sentir que es superficial.",
  },
  pertenencia_con_criterio: {
    nombre: "Pertenencia con criterio",
    descripcion:
      "Formar parte sin que tu posición se ajuste sola al tono del grupo. La señal es cuántas opiniones cambiaste esta semana sin darte cuenta.",
  },
  movimiento_con_cierre: {
    nombre: "Movimiento con cierre",
    descripcion:
      "Irte cuando toca, dejando cerrado lo que dependía de ti. La señal es cuántas cosas quedaron a medias detrás.",
  },
  estructura_con_holgura: {
    nombre: "Estructura con holgura",
    descripcion:
      "Sostener un plan dejando margen para lo imprevisto. La señal es qué ocurre en tu semana cuando algo se sale del guion.",
  },
}
