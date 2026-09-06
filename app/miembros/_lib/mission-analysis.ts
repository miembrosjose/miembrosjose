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
  /** Gran Síntesis: texto integrador (herida → veneno → medicina), 2 párrafos. */
  sintesis: string
  herida: string
  medicina: string
  territorio: string
  objetivo: string
  primeraMision: string
  frase: string
  pasos: string[]
  /** Lecturas EXTENSAS por plano (se actualizan con cada revelación). */
  planoPersonal: string
  planoLinaje: string
  planoTerritorio: string
  planoRed: string
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

const PROFILES: Record<PatternId, Omit<MissionReport, "territorio" | "patternText" | "sintesis" | "planoPersonal" | "planoLinaje" | "planoTerritorio" | "planoRed">> = {
  abandono: {
    patternLabel: "Abandono y no pertenencia",
    herida: "En tus palabras late una memoria antigua: la de no pertenecer, la de sentirte de paso en un mundo que no terminó de reconocerte. Esa herida no vino a quebrarte, vino a enseñarte de qué está hecho un verdadero hogar. Lo que un día te faltó —ser visto, ser acogido, ser esperado— es exactamente lo que tu alma aprendió a nombrar con precisión. Ya no es un vacío: es una brújula.",
    medicina: "Quien ha caminado el abandono conoce el mapa del que llega solo, y por eso puede recibir a otros como nadie. Tu medicina es la pertenencia: crear círculos, nodos, espacios donde el que se sentía extranjero por fin descansa. No sanas dando lo que te sobra, sino ofreciendo el hogar que aprendiste a construir dentro de ti.",
    objetivo: "Formar Comunidad de Base",
    primeraMision: "Reúne a dos o más personas en un primer nodo —una lectura, una meditación, una conversación consciente— y sostén ahí la frecuencia de acogida que a ti te faltó.",
    frase: "Mi misión comienza cuando transformo la herida de no pertenencia en un hogar donde otros por fin pertenecen.",
    pasos: [
      "Nombra en tu bitácora el primer momento en que te sentiste fuera de lugar, y agradécele lo que te enseñó.",
      "Invita a una sola persona a una conversación consciente esta semana.",
      "Da forma a un pequeño nodo y registra tu primer Reporte de Nodo.",
    ],
  },
  escasez: {
    patternLabel: "Escasez y no merecimiento",
    herida: "Hay en tu historia una voz que aprendió a medir, a temer que no alcance, a creer que recibir es peligroso o que no lo mereces. Esa voz casi nunca nació contigo: la heredaste, la respiraste en tu casa, la sostuviste para no defraudar a nadie. Reconocerla ya es empezar a devolverla. La escasez que atravesaste te vuelve experto en un tesoro invisible: saber cuándo el miedo habla disfrazado de prudencia.",
    medicina: "Tu medicina es la confianza. Quien desmontó su propia escasez puede abrir caminos de merecimiento en otros: mostrar, con su vida, que la abundancia no es acumular sino permitir que la vida circule. Enseñas a recibir sin culpa y a dar sin vaciarse.",
    objetivo: "Irradiar la Clave del Recuerdo",
    primeraMision: "Comparte una enseñanza de Los 144.000 desde lo que ya transformaste —sin imponer, sin vender—, como quien reparte pan y no doctrina.",
    frase: "Mi misión comienza cuando transformo la escasez heredada en un manantial de confianza para la Red.",
    pasos: [
      "Escribe la frase de escasez que más se repitió en tu casa y, debajo, su nueva instrucción consciente.",
      "Realiza un acto pequeño de merecimiento esta semana (recibir, pedir, agradecer).",
      "Comparte una enseñanza en el foro desde tu propia experiencia.",
    ],
  },
  abuso_voz: {
    patternLabel: "Abuso, control y recuperación de la voz",
    herida: "En tu memoria hay lugares donde el poder se usó contra ti, donde tus límites fueron invadidos o tu voz fue silenciada para sobrevivir. Tu cuerpo aprendió a cerrarse, a anticipar, a callar. Nada de eso fue debilidad: fue inteligencia para resistir. Y hoy esa misma sensibilidad —que sabe exactamente dónde se cruza una línea— se está convirtiendo en tu mayor fuerza: la dignidad que vuelve.",
    medicina: "Quien recuperó su voz y sus límites se vuelve guardián de la dignidad de otros. Tu medicina es el límite sano y la palabra verdadera: sostener espacios donde nadie es invadido, donde el poder se pone al servicio y no encima. Enseñas que decir “no” también es un acto de amor.",
    objetivo: "Convertirse en Guardián del Lugar",
    primeraMision: "Recupera por escrito una verdad que no pudiste decir y elige un punto concreto de tu territorio donde empezar a sostener presencia y dignidad.",
    frase: "Mi misión comienza cuando transformo el silencio impuesto en dignidad custodiada.",
    pasos: [
      "Completa la acción “Recuperar mi voz” en tu bitácora.",
      "Define un límite claro que vas a sostener esta semana.",
      "Elige tu punto de custodia y registra tu primer Reporte de Custodia.",
    ],
  },
  silencio: {
    patternLabel: "Silencio y secretos del linaje",
    herida: "Tu árbol guarda silencios: historias que no se contaron, dolores que se taparon con vergüenza, verdades que se heredaron a media voz. Ese silencio pesó en ti aunque no fuera tuyo. Pero algo en tu proceso está listo para hablar con cuidado y sin traición: no para exponer a nadie, sino para que la línea familiar por fin respire.",
    medicina: "Tu medicina es la palabra que sana. Quien atravesó el silencio puede irradiar verdad con delicadeza: poner nombre a lo que otros no pudieron, y así liberar patrones que llevaban generaciones repitiéndose. Hablas para desatar, no para acusar.",
    objetivo: "Irradiar la Clave del Recuerdo",
    primeraMision: "Registra un Reporte de Linaje: nombra el silencio que reconociste y la nueva decisión consciente que empieza contigo.",
    frase: "Mi misión comienza cuando transformo el silencio heredado en palabra consciente al servicio de la Red.",
    pasos: [
      "Nombra un silencio o secreto de tu familia en tu bitácora de linaje.",
      "Escribe: “En mi linaje termina… En mí comienza…”.",
      "Si lo sientes, comparte un Reporte de Linaje cuidado para la Red.",
    ],
  },
  miedo_poder: {
    patternLabel: "Miedo a ocupar tu poder",
    herida: "Aparece en tu historia una relación tensa con el poder: lo temes, lo rechazas o lo entregas para no incomodar. Quizá viste el poder herir y decidiste, sin saberlo, no tenerlo nunca. Esa decisión te protegió, pero también te achicó. Hoy tu proceso madura hacia otra cosa: un poder que no aplasta, sino que sostiene.",
    medicina: "Tu medicina es la voluntad al servicio y el discernimiento en medio del ruido. Quien ordenó su miedo puede mantener centro cuando otros se pierden en falsas señales. Enseñas que ocupar el propio lugar no es dominar: es responsabilizarse.",
    objetivo: "Atravesar la Catastro-fe",
    primeraMision: "Aplica el filtro de discernimiento a una señal, mensaje o información reciente: pregúntate si conduce a servicio o solo a expectativa.",
    frase: "Mi misión comienza cuando transformo el miedo a mi poder en voluntad al servicio.",
    pasos: [
      "Registra una situación donde el miedo tomó una decisión por ti.",
      "Escribe qué habrías hecho desde tu centro, sin culpa.",
      "Toma una decisión pequeña esta semana ocupando tu lugar con responsabilidad.",
    ],
  },
  desconexion_territorio: {
    patternLabel: "Desconexión con el territorio y las raíces",
    herida: "Hay en ti una raíz que quedó suelta: una relación distante, dolida o pendiente con el lugar donde naciste o donde vives. Migraciones, desarraigos, historias que te hicieron sentir de ninguna parte. Esa desconexión no es un defecto: es la señal de un guardián que aún no reconoció su tierra. La nostalgia que sientes es, en realidad, una vocación.",
    medicina: "Tu medicina es ser puente entre la memoria de la Tierra y la comunidad. Quien vuelve a habitar su territorio puede escuchar lo que ese lugar guarda —sus pueblos, sus aguas, sus heridas— y sostenerlo con presencia. No sanas la Tierra desde lejos: la sanas volviendo a pertenecerle.",
    objetivo: "Redescubrir la Historia Sagrada del Territorio",
    primeraMision: "Investiga la historia viva de tu lugar y crea tu ficha de territorio: pueblos antiguos, sitios sagrados, aguas, y una herida colectiva que pida ser recordada.",
    frase: "Mi misión comienza cuando transformo la desconexión en custodia consciente de la memoria de mi tierra.",
    pasos: [
      "Investiga una herida colectiva o una memoria olvidada del lugar donde vives.",
      "Crea tu ficha de territorio en la bitácora de misión.",
      "Elige un punto de custodia concreto (un río, un cerro, una plaza, un templo).",
    ],
  },
  perdon: {
    patternLabel: "Perdón, reparación y alquimia de la herida",
    herida: "Cargas un dolor que aún gobierna desde el resentimiento, la culpa o una historia antigua que se repite. No viniste a negarlo ni a justificarlo. Viniste a hacer con él una alquimia: tomar el veneno que te ató y devolverlo a la vida convertido en conciencia. Ese es el trabajo más difícil y el más sagrado, y tu proceso ya lo empezó.",
    medicina: "Tu medicina es la transformación del veneno en medicina. Quien perdonó sin justificar puede acompañar a otros a soltar lo que los encadena, y mostrar que el perdón no borra la historia: la libera. Tu presencia recuerda que ninguna herida es el final del camino.",
    objetivo: "Prepararse para el Contacto con los Guías",
    primeraMision: "Escribe una carta de perdón consciente (hacia ti, tu linaje o tu historia) y define un acto concreto de reparación que no repita el patrón.",
    frase: "Mi misión comienza cuando transformo el veneno de mi herida en medicina para la Red.",
    pasos: [
      "Completa la carta de perdón consciente en tu bitácora.",
      "Elige un acto de reparación concreto y una fecha para realizarlo.",
      "Registra la medicina que nace de esa herida.",
    ],
  },
  servicio_palabra: {
    patternLabel: "Vocación de irradiar y reunir",
    herida: "Tu proceso muestra algo poco común: una parte tuya ya está lista para servir. No porque lo tengas todo resuelto, sino porque aprendiste a sostener a otros mientras te sostenías. Esa capacidad de reunir, de dar palabra, de hacer red, es la huella de quien vino a custodiar memoria en tiempos de olvido.",
    medicina: "Tu medicina es irradiar la Clave del Recuerdo y tejer comunidad. Puedes poner palabra donde hay confusión y reunir a los dispersos alrededor de un mismo propósito, sin fanatismo ni superioridad. Custodias la memoria compartiéndola.",
    objetivo: "Reencontrarse con la Hermandad Blanca y custodiar los archivos",
    primeraMision: "Registra tu compromiso con los archivos y da el primer paso para formar o activar un nodo donde la memoria deje de estar aislada.",
    frase: "Mi misión comienza cuando pongo la palabra recordada al servicio de la Red.",
    pasos: [
      "Escribe tu compromiso con los archivos y la memoria de la Tierra.",
      "Comparte una enseñanza con una persona o grupo esta semana.",
      "Da forma a un nodo, aunque empiece con dos personas.",
    ],
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
  const base = hit ? hit.label : "el lugar donde vives"
  const cuerpo =
    `El territorio no es un escenario: es un archivo vivo. Te llama ${base} —no para observarlo, sino para reconocer su memoria: los pueblos que caminaron antes, las aguas y los cerros, las heridas de conquista o de olvido que aún laten en su tierra. ` +
    `Tu tarea aquí es investigar y traer claridad: averiguar la historia sagrada de tu lugar, escuchar lo que pide ser recordado y elegir un punto concreto donde empezar a sostener presencia. Ahí tu sanación personal se vuelve custodia.`
  if (territorioEntry.trim()) {
    const snippet = territorioEntry.trim().slice(0, 160)
    return `${cuerpo} En tus propias palabras ya aparece una huella: “${snippet}${territorioEntry.length > 160 ? "…" : ""}”. Ese es el hilo por donde empezar.`
  }
  return `${cuerpo} Abre tu bitácora de territorio e investiga: qué pueblos lo habitaron, qué lugares sagrados existen cerca y qué herida colectiva pide ser honrada.`
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
    `Al leer lo que has registrado en tu bitácora, un hilo aparece con más fuerza que los demás: ${profile.patternLabel.toLowerCase()}` +
    (secondLabel ? `, entrelazado con ${secondLabel}` : "") +
    ". No es una casualidad ni un defecto: es el eje alrededor del cual tu historia, tu linaje y tu territorio se ordenan. " +
    "Reconocerlo es el primer acto de tu misión, porque aquello que aprendiste a atravesar en ti es precisamente lo que puedes ayudar a sanar en la Red. " +
    "Toma esta lectura como un espejo que acompaña, no como una sentencia que define."

  // Gran Síntesis: teje herida (el veneno) → medicina en un solo texto de 2
  // párrafos. Es lo que el Revelador muestra como lectura integrada.
  const sintesis = `${profile.herida}\n\n${profile.medicina}`

  // Lecturas por plano (fallback local; la IA las genera más elevadas).
  const linajeEntry = entries.find((e) => e.category === "linaje")?.answer.trim() ?? ""
  const historiaEntry = entries.find((e) => e.category === "historia")?.answer.trim() ?? ""

  const planoPersonal =
    `Aquí no repetimos la herida: la habitamos. En biodescodificación, lo que un sistema aprende a callar suele guardarse en el cuerpo —en la garganta lo no dicho, en el pecho el afecto negado, en el vientre lo que no se pudo digerir—. ` +
    `Eso que se repite en ti no es un defecto: es una memoria pidiendo ser vista para dejar de gobernarte desde la sombra. ` +
    `Tu trabajo en este plano es darle nombre, edad y lugar a esa parte de ti, y devolverle la pertenencia que le faltó: escríbele, escúchala, acompáñala.` +
    (historiaEntry ? ` En tus palabras ya asoma el hilo por donde entrar: “${historiaEntry.slice(0, 140)}${historiaEntry.length > 140 ? "…" : ""}”.` : " Abre tu bitácora personal y escríbele una carta a esa parte de ti.")

  const planoLinaje =
    `Lo que atraviesas no empezó contigo: viene de tu árbol. En biodescodificación, muchos síntomas y repeticiones son lealtades invisibles a quienes vinieron antes —silencios, duelos no llorados, exclusiones, deudas—. ` +
    `Tu tarea aquí es reconocer qué patrón se repite (abandono, escasez, sometimiento, silencio) y decidir, conscientemente, que termina en ti. ` +
    (linajeEntry ? `Ya nombraste una huella: “${linajeEntry.slice(0, 140)}${linajeEntry.length > 140 ? "…" : ""}”. Ese es el hilo por donde tirar.` : "Abre tu bitácora de linaje e investiga tres generaciones: qué se repite, qué se calló, qué don también se hereda.")

  const planoTerritorio = territorio

  const planoRed =
    `Aquí tu proceso se vuelve servicio concreto. Tu objetivo más activo hoy es “${profile.objetivo}”: por ahí empieza tu forma de ser sol en la Tierra. ` +
    `Ser sol no es brillar por encima de nadie: es irradiar calor donde antes hubo frío —precisamente el frío que tú aprendiste a atravesar—. ` +
    `No sirves a la Red desde la teoría ni desde lo que aún no resolviste, sino ofreciendo lo que ya destilaste en tu propia vida. ` +
    `Empieza pequeño y sostenido: una persona, un círculo, un gesto real esta semana. Eso ya es Red.`

  return {
    sufficient: true,
    entryCount,
    report: { ...profile, patternText, territorio, sintesis, planoPersonal, planoLinaje, planoTerritorio, planoRed },
  }
}

// Última revelación (para el "Mapa Revelado de mi Misión" en Objetivos).
const LAST_KEY = "los144k_last_revelation"
export const REVELATION_CHANGED_EVENT = "app:revelation-changed"

type SavedRevelation = { report: MissionReport; at: string; answered: number | null; source: string | null }

export function saveLastRevelation(r: MissionReport, meta?: { answered?: number; source?: string }): void {
  if (typeof window === "undefined") return
  try {
    const payload: SavedRevelation = {
      report: r,
      at: new Date().toISOString(),
      answered: meta?.answered ?? null,
      source: meta?.source ?? null,
    }
    localStorage.setItem(LAST_KEY, JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent(REVELATION_CHANGED_EVENT))
  } catch { /* ignora */ }
}

export function getLastRevelation(): SavedRevelation | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(LAST_KEY)
    return raw ? (JSON.parse(raw) as SavedRevelation) : null
  } catch { return null }
}

/** Texto plano del informe (para guardar en bitácora o descargar). */
export function reportToText(r: MissionReport): string {
  const sintesis = r.sintesis || [r.herida, r.medicina].filter(Boolean).join("\n\n")
  const parts = [
    "REVELADOR DE MISIÓN — Lectura personal",
    "",
    `LA REVELACIÓN\n${sintesis}`,
    `FRASE DE MISIÓN PERSONAL\n“${r.frase}”`,
    `OBJETIVO DE LOS 144.000 MÁS ACTIVO EN TI\n${r.objetivo}`,
  ]
  if (r.planoPersonal) parts.push(`PLANO PERSONAL\n${r.planoPersonal}`)
  if (r.planoLinaje) parts.push(`PLANO DEL LINAJE\n${r.planoLinaje}`)
  if (r.planoTerritorio) parts.push(`PLANO DEL TERRITORIO\n${r.planoTerritorio}`)
  if (r.planoRed) parts.push(`PLANO DE LA RED\n${r.planoRed}`)
  parts.push(`PRIMERA MISIÓN RECOMENDADA\n${r.primeraMision}`)
  parts.push(`SIGUIENTES PASOS\n${r.pasos.map((p, i) => `${i + 1}. ${p}`).join("\n")}`)
  return parts.join("\n\n")
}
