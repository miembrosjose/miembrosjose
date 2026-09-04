// Categorías del foro + tipos de "Reporte para la Red".
//
// Un REPORTE es distinto de la bitácora privada: es una versión consciente,
// madura y VOLUNTARIA de lo que la persona decide aportar a la comunidad.
// Nada de la bitácora íntima se comparte sin decisión explícita.
//
// Las categorías se guardan como `tags` (columna ya existente en forum_posts),
// así que esto NO cambia el esquema de la base.

export type ForumCategory = { label: string; tag: string }

export const FORUM_CATEGORIES: ForumCategory[] = [
  { label: "Custodia del Territorio", tag: "CUSTODIA" },
  { label: "Linaje y Desprogramación", tag: "LINAJE" },
  { label: "Señales y Sueños", tag: "SEÑALES" },
  { label: "Nodos 144.000", tag: "NODOS" },
  { label: "Discernimiento", tag: "DISCERNIMIENTO" },
  { label: "Umbral del Contacto", tag: "UMBRAL" },
  { label: "Archivos y Memoria de la Tierra", tag: "ARCHIVOS" },
]

export function categoryLabel(tag: string): string {
  return FORUM_CATEGORIES.find((c) => c.tag === tag)?.label ?? tag
}

export type ReportType = {
  id: string
  label: string
  categoryTag: string
  intro: string
  fields: string[]
}

export const REPORT_TYPES: ReportType[] = [
  {
    id: "custodia",
    label: "Reporte de Custodia",
    categoryTag: "CUSTODIA",
    intro: "Comparte, con cuidado, un acto de custodia en tu territorio.",
    fields: [
      "Territorio:",
      "Lugar investigado o visitado:",
      "Memoria encontrada:",
      "Herida reconocida:",
      "Acción realizada:",
      "Comprensión recibida:",
    ],
  },
  {
    id: "linaje",
    label: "Reporte de Linaje",
    categoryTag: "LINAJE",
    intro: "Una versión madura y cuidada de un patrón de linaje que decidiste transformar.",
    fields: [
      "Patrón familiar reconocido:",
      "Herida repetida:",
      "Creencia heredada:",
      "Nueva decisión consciente:",
      "Acción de reparación:",
      "Qué medicina puede nacer de esta historia:",
    ],
  },
  {
    id: "territorio",
    label: "Reporte de Territorio",
    categoryTag: "ARCHIVOS",
    intro: "La memoria viva del lugar donde habitas.",
    fields: [
      "Lugar:",
      "Pueblos antiguos:",
      "Sitios sagrados o naturales:",
      "Herida colectiva:",
      "Símbolos o relatos:",
      "Acción de custodia propuesta:",
    ],
  },
  {
    id: "senales",
    label: "Reporte de Señales",
    categoryTag: "SEÑALES",
    intro: "Una señal, sueño o sincronía, mirada con discernimiento.",
    fields: [
      "Fecha:",
      "Lugar:",
      "Sueño, señal o sincronía:",
      "Emoción que dejó:",
      "Discernimiento aplicado:",
      "¿Conduce a servicio o solo a expectativa?:",
    ],
  },
  {
    id: "nodo",
    label: "Reporte de Nodo",
    categoryTag: "NODOS",
    intro: "Un encuentro o práctica en comunidad de base.",
    fields: [
      "Ciudad o territorio:",
      "Número de participantes:",
      "Práctica realizada:",
      "Comprensión grupal:",
      "Próximo paso:",
    ],
  },
]

/** Construye el cuerpo del post a partir de los campos completados del reporte. */
export function buildReportBody(typeLabel: string, entries: { label: string; value: string }[]): string {
  const lines = entries
    .filter((e) => e.value.trim())
    .map((e) => `${e.label} ${e.value.trim()}`)
  return `『 ${typeLabel} 』\n\n${lines.join("\n\n")}`
}
