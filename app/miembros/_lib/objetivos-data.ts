// Datos compartidos de la página "Objetivos de Los 144.000":
// los 7 Objetivos y las Misiones de Custodia. Se usan en Season5Portal, en el
// banco de preguntas (Mi Gran Bitácora) y en el Revelador de Misión.

import type { SealId } from "./seals"
import { FORUM_TITLES } from "./portals-data"

export type ObjAction = "foro_nodos" | "foro_objetivos" | "misiones" | "umbral"

export type Objetivo = {
  n: number
  id: string
  title: string
  phrase: string
  text: string
  actionLabel: string
  act: ObjAction
}

export const OBJETIVOS: Objetivo[] = [
  {
    n: 1, id: "comunidad", title: "FORMAR COMUNIDAD DE BASE",
    phrase: "El llamado se fortalece cuando varias conciencias sostienen una misma frecuencia.",
    text: "Crear grupos de sintonía, afinidad y propósito —físicos, virtuales o mentales— donde varias personas estudian, meditan, registran y sirven a un mismo objetivo. Aquí nacen los nodos de Los 144.000.",
    actionLabel: "Crear o buscar un nodo", act: "foro_nodos",
  },
  {
    n: 2, id: "irradiar", title: "IRRADIAR LA CLAVE DEL RECUERDO",
    phrase: "Quien recuerda se convierte en punto de irradiación.",
    text: "La Clave del Recuerdo se activó en las temporadas anteriores. Ahora debe irradiarse: transmitir, compartir los archivos, recordar la verdadera historia de la Tierra desde coherencia y servicio. El miembro no impone. Irradia.",
    actionLabel: "Compartir una enseñanza sin imponer", act: "foro_objetivos",
  },
  {
    n: 3, id: "historia_territorio", title: "REDESCUBRIR LA HISTORIA SAGRADA DEL TERRITORIO",
    phrase: "Cada lugar guarda una parte de la memoria planetaria.",
    text: "Mirar el propio territorio con nuevos ojos: montañas, ríos, ciudades, templos, cuevas, linajes y misiones olvidadas. La verdadera historia también está escrita en la tierra que pisamos.",
    actionLabel: "Crear mi ficha de territorio", act: "misiones",
  },
  {
    n: 4, id: "guardian", title: "CONVERTIRSE EN GUARDIÁN DEL LUGAR",
    phrase: "La misión planetaria comienza donde cada alma fue sembrada.",
    text: "Ser guardián no es poseer un lugar: es escucharlo, respetarlo, limpiarlo, recordarlo y servirlo. Cada miembro puede ser un punto de custodia que sostiene luz en su entorno.",
    actionLabel: "Elegir mi punto de custodia", act: "misiones",
  },
  {
    n: 5, id: "catastrofe", title: "ATRAVESAR LA CATASTRO-FE",
    phrase: "La gran prueba será sostener fe y discernimiento en medio del caos.",
    text: "En un tiempo de sobreinformación, falsas señales y distorsiones, el miembro aprende a sostener centro, voluntad, fe y discernimiento cuando el mundo se llena de ruido.",
    actionLabel: "Aplicar filtro de discernimiento", act: "misiones",
  },
  {
    n: 6, id: "contacto", title: "PREPARARSE PARA EL CONTACTO CON LOS GUÍAS",
    phrase: "El contacto maduro comienza cuando la intención se ordena hacia el servicio.",
    text: "Limpiar intención, ordenar la mente, abrir el corazón, fortalecer discernimiento y sanar el miedo. El contacto no alimenta la identidad espiritual: es una responsabilidad dentro del Plan.",
    actionLabel: "Entrar al Umbral del Contacto", act: "umbral",
  },
  {
    n: 7, id: "hermandad", title: "REENCONTRARSE CON LA HERMANDAD BLANCA Y CUSTODIAR LOS ARCHIVOS",
    phrase: "La memoria vuelve cuando existe una red capaz de custodiarla.",
    text: "Preparar a la humanidad para reencontrarse conscientemente con la Gran Hermandad Blanca de los Retiros Interiores y custodiar la memoria sin convertirla en poder, dogma o separación.",
    actionLabel: "Registrar mi compromiso con los archivos", act: "misiones",
  },
]

export type CustodiaMision = {
  id: string
  n: number
  title: string
  text: string
  action: string
  fields: string[]
  result: string
  sealId?: SealId
  foro?: string
}

export const CUSTODIA: CustodiaMision[] = [
  {
    id: "m1_historia", n: 1, title: "MI HISTORIA ANTES DEL TERRITORIO",
    text: "Antes de investigar la historia del lugar, reconozco la historia que vive en mí.",
    action: "Revisa tu bitácora (historia y linaje) y sintetiza aquí lo esencial.",
    fields: ["Mi síntesis personal:"], result: "Primera síntesis personal.",
  },
  {
    id: "m2_territorio", n: 2, title: "ESCUCHAR EL TERRITORIO",
    text: "El territorio no es un escenario. Es un archivo vivo.",
    action: "Investiga historia ancestral, pueblos antiguos, lugares sagrados y heridas colectivas del lugar donde vives.",
    fields: ["Lugar / territorio:", "Pueblos antiguos y sitios sagrados:", "Herida colectiva que reconozco:"],
    result: "Ficha de territorio.", sealId: "territorio", foro: FORUM_TITLES.territorio,
  },
  {
    id: "m3_linaje", n: 3, title: "RECONOCER EL LINAJE",
    text: "El árbol familiar muestra patrones que la Red pide transformar.",
    action: "Registra una creencia heredada, una herida repetida y una nueva decisión consciente.",
    fields: ["Creencia heredada:", "Herida repetida:", "Nueva decisión consciente:"],
    result: "Reporte privado de linaje.",
  },
  {
    id: "m4_punto", n: 4, title: "IDENTIFICAR UN PUNTO DE CUSTODIA",
    text: "Cada guardián necesita reconocer un lugar concreto donde sostener presencia.",
    action: "Elige un río, montaña, árbol, iglesia antigua, cueva, parque, cerro, lago, volcán, plaza o punto natural cercano.",
    fields: ["Mi punto de custodia:", "Por qué lo elijo:"], result: "Punto de custodia elegido.",
  },
  {
    id: "m5_sanar", n: 5, title: "SANAR UNA HERIDA DEL LUGAR",
    text: "La custodia comienza cuando el recuerdo se convierte en acto.",
    action: "Realiza una oración, meditación, limpieza, ofrenda sencilla, investigación, acto de perdón, servicio o cuidado del espacio.",
    fields: ["Acción de custodia realizada:", "Comprensión recibida:"],
    result: "Reporte de custodia.", sealId: "guardian", foro: FORUM_TITLES.territorio,
  },
  {
    id: "m6_irradiar", n: 6, title: "IRRADIAR LA CLAVE DEL RECUERDO",
    text: "Quien recuerda se convierte en punto de irradiación.",
    action: "Comparte una enseñanza de Los 144.000 a una persona, grupo o red social desde humildad y claridad.",
    fields: ["A quién / dónde compartí:", "Qué enseñanza irradié:"], result: "Registro de irradiación.",
    foro: FORUM_TITLES.objetivos,
  },
  {
    id: "m7_nodo", n: 7, title: "FORMAR O ACTIVAR UN NODO",
    text: "La Red se fortalece cuando la memoria deja de estar aislada.",
    action: "Invita a dos o más personas a una lectura, meditación, conversación consciente o práctica en común.",
    fields: ["Ciudad o territorio:", "Práctica realizada y participantes:", "Próximo paso:"],
    result: "Reporte de nodo.", sealId: "nodo", foro: FORUM_TITLES.nodos,
  },
]

export function getCustodia(id: string): CustodiaMision | undefined {
  return CUSTODIA.find((m) => m.id === id)
}

// Recomendación de misiones según el objetivo más activo del análisis.
export const OBJETIVO_TO_MISIONES: Record<string, string[]> = {
  "Formar Comunidad de Base": ["m7_nodo", "m6_irradiar"],
  "Irradiar la Clave del Recuerdo": ["m6_irradiar", "m3_linaje"],
  "Redescubrir la Historia Sagrada del Territorio": ["m2_territorio", "m4_punto"],
  "Convertirse en Guardián del Lugar": ["m4_punto", "m5_sanar"],
  "Atravesar la Catastro-fe": ["m1_historia", "m3_linaje"],
  "Prepararse para el Contacto con los Guías": ["m1_historia", "m5_sanar"],
  "Reencontrarse con la Hermandad Blanca y custodiar los archivos": ["m6_irradiar", "m7_nodo"],
}

export function recommendedMissions(objetivo: string): CustodiaMision[] {
  const ids = OBJETIVO_TO_MISIONES[objetivo] || ["m1_historia", "m2_territorio"]
  return ids.map(getCustodia).filter(Boolean) as CustodiaMision[]
}
