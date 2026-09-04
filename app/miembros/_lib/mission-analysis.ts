// REVELADOR DE MISIÓN — análisis LOCAL (en el dispositivo) de Mi Gran Bitácora.
//
// No usa API externa ni claves: lee las entradas privadas del usuario
// (journal-store) y detecta el patrón dominante por coincidencia de temas,
// devolviendo una lectura de misión en el lenguaje de Los 144.000.
// Es un espejo, no una imposición ni un diagnóstico.

import { loadEntries } from "./journal-store"

export type MissionReport = {
  patternLabel: string
  patternText: string
  herida: string
  medicina: string
  territorio: string
  objetivo: string
  primeraMision: string
  frase: string
  pasos: string[]
}

export type MissionAnalysis =
  | { sufficient: false; entryCount: number }
  | { sufficient: true; entryCount: number; report: MissionReport }

type PatternId =
  | "abandono" | "escasez" | "abuso_voz" | "silencio" | "miedo_poder"
  | "desconexion_territorio" | "perdon" | "servicio_palabra"

const KEYWORDS: Record<PatternId, string[]> = {
  abandono: ["abandon", "no perten", "fuera de lugar", "soledad", "solo", "sola", "rechaz", "desarraig", "no encaj", "diferente", "migrac"],
  escasez: ["escasez", "merec", "dinero", "pobre", "falta", "no puedo", "no soy suficiente", "carenc", "deuda", "sacrific"],
  abuso_voz: ["abuso", "control", "manipul", "silenci", "callar", "callé", "calle", "mi voz", "la voz", "límite", "limite", "sometim", "violen", "invasi"],
  silencio: ["secreto", "no se hablaba", "vergüenza", "verguenza", "callad", "ocult"],
  miedo_poder: ["miedo", "temor", "ansiedad", "vigilan", "culpa", "poder", "autorit", "sumis"],
  desconexion_territorio: ["territorio", "tierra", "lugar", "ciudad", "pueblo", "barrio", "río", "rio", "montaña", "montana", "cerro", "agua", "raíz", "raiz", "desconex"],
  perdon: ["perdón", "perdon", "resentimiento", "rencor", "repara", "veneno", "daño", "dano", "herida"],
  servicio_palabra: ["enseñar", "ensenar", "escribir", "hablar", "compartir", "palabra", "comunidad", "servir", "servicio", "nodo", "irradiar"],
}

const PROFILES: Record<PatternId, Omit<MissionReport, "territorio" | "patternText">> = {
  abandono: {
    patternLabel: "Abandono y no pertenencia",
    herida: "La herida de no pertenecer —de sentirse fuera de lugar— parece estar convirtiéndose en la capacidad de crear el hogar que no tuviste.",
    medicina: "Quien ha atravesado el abandono puede sostener comunidad: hacer sentir a otros que pertenecen.",
    objetivo: "Formar Comunidad de Base",
    primeraMision: "Formar o activar un nodo: invita a dos o más personas a una práctica en común.",
    frase: "Mi misión comienza cuando transformo la herida de no pertenencia en una comunidad que acoge.",
    pasos: ["Completar el Mapa de mi Misión.", "Invitar a una primera persona a una conversación consciente.", "Registrar un Reporte de Nodo."],
  },
  escasez: {
    patternLabel: "Escasez y no merecimiento",
    herida: "El programa de escasez y no merecimiento parece estar transformándose en confianza y dignidad.",
    medicina: "Quien sanó la escasez puede abrir caminos de confianza y merecimiento para otros.",
    objetivo: "Irradiar la Clave del Recuerdo",
    primeraMision: "Compartir una enseñanza desde la abundancia de lo que recordaste, sin imponer.",
    frase: "Mi misión comienza cuando transformo la escasez heredada en confianza al servicio de la Red.",
    pasos: ["Nombrar una creencia heredada de escasez en tu bitácora.", "Escribir la nueva instrucción consciente.", "Compartir una enseñanza en el foro."],
  },
  abuso_voz: {
    patternLabel: "Abuso, control y pérdida de la voz",
    herida: "La memoria de invasión de límites y voz silenciada parece estar convirtiéndose en dignidad recuperada.",
    medicina: "Quien recuperó su voz y sus límites puede custodiar la dignidad y los límites de otros.",
    objetivo: "Convertirse en Guardián del Lugar",
    primeraMision: "Escribir una carta para recuperar tu voz y elegir un punto de custodia donde sostener dignidad.",
    frase: "Mi misión comienza cuando transformo el silencio impuesto en dignidad custodiada.",
    pasos: ["Completar la acción “Recuperar mi voz”.", "Elegir un punto de custodia.", "Registrar un Reporte de Custodia."],
  },
  silencio: {
    patternLabel: "Silencio familiar",
    herida: "El silencio y los secretos del linaje parecen estar transformándose en palabra consciente.",
    medicina: "Quien sanó el silencio puede irradiar palabra y verdad con cuidado.",
    objetivo: "Irradiar la Clave del Recuerdo",
    primeraMision: "Registrar un Reporte de Linaje: nombrar el silencio y la nueva decisión consciente.",
    frase: "Mi misión comienza cuando transformo el silencio heredado en palabra consciente al servicio de la Red.",
    pasos: ["Nombrar un silencio familiar en tu bitácora.", "Escribir la nueva decisión consciente.", "Compartir, si lo deseas, un Reporte de Linaje."],
  },
  miedo_poder: {
    patternLabel: "Miedo a ocupar el poder",
    herida: "La relación con el miedo, la culpa y el poder parece estar madurando hacia el servicio.",
    medicina: "Quien ordenó su relación con el poder puede ponerlo al servicio y sostener discernimiento en el caos.",
    objetivo: "Atravesar la Catastro-fe",
    primeraMision: "Aplicar el filtro de discernimiento ante una señal o información reciente.",
    frase: "Mi misión comienza cuando transformo el miedo al poder en voluntad al servicio.",
    pasos: ["Registrar una situación donde el miedo dirigió una decisión.", "Aplicar discernimiento por escrito.", "Elegir una acción con responsabilidad, no culpa."],
  },
  desconexion_territorio: {
    patternLabel: "Desconexión del territorio",
    herida: "La desconexión con el lugar y las raíces parece estar convirtiéndose en custodia consciente.",
    medicina: "Quien reconectó con su territorio puede servir como puente entre la memoria de la Tierra y la comunidad.",
    objetivo: "Redescubrir la Historia Sagrada del Territorio",
    primeraMision: "Crear tu ficha de territorio: pueblos antiguos, sitios sagrados y heridas colectivas.",
    frase: "Mi misión comienza cuando transformo la desconexión en custodia de la memoria de mi tierra.",
    pasos: ["Investigar una herida colectiva de tu lugar.", "Crear tu ficha de territorio.", "Elegir un punto de custodia."],
  },
  perdon: {
    patternLabel: "Necesidad de perdón y reparación",
    herida: "El dolor que gobernaba desde el resentimiento parece estar transformándose en medicina.",
    medicina: "Quien atravesó el perdón puede acompañar a otros a transformar el veneno en medicina.",
    objetivo: "Prepararse para el Contacto con los Guías",
    primeraMision: "Escribir una carta de perdón consciente y un acto de reparación.",
    frase: "Mi misión comienza cuando transformo el veneno de la herida en medicina para la Red.",
    pasos: ["Completar la carta de perdón consciente.", "Elegir un acto de reparación concreto.", "Registrar la medicina que nace de la herida."],
  },
  servicio_palabra: {
    patternLabel: "Servicio a través de la palabra y la comunidad",
    herida: "Tu proceso parece mostrar una vocación de irradiar y reunir que ya está lista para el servicio.",
    medicina: "Puedes irradiar la Clave del Recuerdo y custodiar los archivos junto a otros.",
    objetivo: "Reencontrarse con la Hermandad Blanca y custodiar los archivos",
    primeraMision: "Registrar tu compromiso con los archivos y formar un pequeño nodo.",
    frase: "Mi misión comienza cuando pongo la palabra recordada al servicio de la Red.",
    pasos: ["Registrar tu compromiso con los archivos.", "Compartir una enseñanza.", "Formar o activar un nodo."],
  },
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function territorioFromText(rawText: string, territorioEntry: string): string {
  const t = normalize(rawText)
  const hints: { k: string[]; label: string }[] = [
    { k: ["agua", "rio", "río", "mar", "lago", "laguna"], label: "el agua (ríos, lagos, mar) de tu territorio" },
    { k: ["montan", "montaña", "cerro", "volcan", "volcán", "cordiller"], label: "la montaña o el cerro cercano" },
    { k: ["pueblo", "originari", "ancestr", "indigena", "indígena"], label: "los pueblos originarios de tu tierra" },
    { k: ["mujer", "femenin", "madre", "abuela"], label: "la memoria femenina de tu linaje" },
    { k: ["conquist", "guerra", "invasi", "colon"], label: "las heridas de conquista de tu región" },
    { k: ["ciudad", "barrio", "calle", "plaza"], label: "tu ciudad y su comunidad local" },
    { k: ["familia", "linaje", "arbol", "árbol"], label: "tu linaje familiar" },
  ]
  const hit = hints.find((h) => h.k.some((w) => t.includes(normalize(w))))
  const base = hit ? hit.label : "el lugar donde vives y su memoria"
  if (territorioEntry.trim()) {
    const snippet = territorioEntry.trim().slice(0, 140)
    return `Por lo que escribiste, te llama ${base}. En tus palabras: “${snippet}${territorioEntry.length > 140 ? "…" : ""}”.`
  }
  return `Por los temas que aparecen, te llama ${base}.`
}

export function analyzeMission(): MissionAnalysis {
  const entries = loadEntries().filter((e) => e.answer.trim())
  const entryCount = entries.length

  // Necesita huellas suficientes para ser leída.
  if (entryCount < 4) return { sufficient: false, entryCount }

  const allText = entries.map((e) => e.answer).join("  \n  ")
  const norm = normalize(allText)

  const scores = (Object.keys(KEYWORDS) as PatternId[]).map((id) => {
    let score = 0
    for (const kw of KEYWORDS[id]) {
      const n = normalize(kw)
      let idx = norm.indexOf(n)
      while (idx !== -1) { score++; idx = norm.indexOf(n, idx + n.length) }
    }
    return { id, score }
  }).sort((a, b) => b.score - a.score)

  const top = scores[0]
  const second = scores[1]
  // Si nada resuena, usa "servicio" como lectura general (no deja al usuario sin espejo).
  const dominant: PatternId = top.score > 0 ? top.id : "servicio_palabra"
  const profile = PROFILES[dominant]

  const territorioEntry = entries.find((e) => e.category === "territorio")?.answer ?? ""
  const territorio = territorioFromText(allText, territorioEntry)

  const secondLabel = second && second.score > 0 && second.id !== dominant
    ? PROFILES[second.id].patternLabel.toLowerCase()
    : ""
  const patternText =
    `Según lo registrado en tu bitácora, aparece con fuerza el patrón de ${profile.patternLabel.toLowerCase()}` +
    (secondLabel ? `, entrelazado con ${secondLabel}` : "") +
    ". Esta lectura puede servirte como espejo, no como imposición."

  return {
    sufficient: true,
    entryCount,
    report: { ...profile, patternText, territorio },
  }
}

/** Texto plano del informe (para guardar en bitácora o descargar). */
export function reportToText(r: MissionReport): string {
  return [
    "REVELADOR DE MISIÓN — Lectura personal",
    "",
    `1. PATRÓN CENTRAL DETECTADO\n${r.patternText}`,
    `2. HERIDA QUE SE ESTÁ TRANSFORMANDO\n${r.herida}`,
    `3. MEDICINA QUE PUEDES OFRECER\n${r.medicina}`,
    `4. TERRITORIO QUE TE LLAMA\n${r.territorio}`,
    `5. OBJETIVO DE LOS 144.000 MÁS ACTIVO EN TI\n${r.objetivo}`,
    `6. PRIMERA MISIÓN RECOMENDADA\n${r.primeraMision}`,
    `7. FRASE DE MISIÓN PERSONAL\n“${r.frase}”`,
    `8. SIGUIENTES 3 PASOS\n${r.pasos.map((p, i) => `${i + 1}. ${p}`).join("\n")}`,
  ].join("\n\n")
}
