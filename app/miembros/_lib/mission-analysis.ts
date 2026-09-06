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
  /** Los 4 pilares del servicio (personal, linaje, territorio, red). */
  planoPersonal: string
  planoLinaje: string
  planoTerritorio: string
  planoRed: string
  /** Códigos detectados en la bitácora: veneno → medicina → servicio. */
  codigos: { nombre: string; veneno: string; medicina: string; servicio: string }[]
  /** Cómo se activan los 5 objetivos colectivos en esta persona. */
  objetivos5: { id: string; label: string; texto: string }[]
  /** Puerta inicial del servicio (NO un objetivo único). */
  puntoEntrada: string
  /** Acciones recomendadas, una por cada uno de los 5 objetivos. */
  acciones5: { objetivo: string; accion: string }[]
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

type ProfileFields = Omit<MissionReport,
  "territorio" | "patternText" | "sintesis" | "planoPersonal" | "planoLinaje" |
  "planoTerritorio" | "planoRed" | "codigos" | "objetivos5" | "puntoEntrada" | "acciones5">

const PROFILES: Record<PatternId, ProfileFields> = {
  abandono: {
    patternLabel: "Abandono y no pertenencia",
    herida: "En tu historia aparece una memoria de no pertenencia, la sensación de estar de paso en un mundo que tardó en reconocerte. Esa experiencia afinó en ti una percepción sutil: reconoces con claridad qué le falta a quien llega solo, porque tú lo viviste. En la intemperie, tu alma aprendió de qué está hecho un verdadero hogar, y esa comprensión se ha vuelto una brújula.",
    medicina: "De esa raíz nace tu medicina: la pertenencia. Puedes crear círculos y nodos donde quien se sentía extranjero encuentra descanso, y sostener con presencia la acogida que en su momento buscaste. Tu servicio comienza cuando ofreces a otros el hogar que aprendiste a construir dentro de ti.",
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
    medicina: "De ahí surge tu medicina: la confianza. Al desarmar tu propia escasez, puedes abrir en otros el sentido del merecimiento y mostrar, con tu vida, que la abundancia es dejar que la vida circule. Tu servicio abre caminos de confianza, y enseña a recibir con gratitud y a dar desde la plenitud.",
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
    herida: "En tu memoria hay lugares donde el poder pesó sobre ti, donde tus límites fueron cruzados o tu voz quedó en silencio. Tu cuerpo aprendió a anticipar y a protegerse, y esa misma sensibilidad —que percibe con exactitud cuándo algo invade— se ha convertido en una forma de sabiduría. Reconoces con precisión dónde se pierde la dignidad, y por eso puedes ayudar a recuperarla.",
    medicina: "Tu medicina es la dignidad y el límite justo. Puedes custodiar espacios donde el poder se pone al servicio y donde la voz de cada quien vuelve a ser escuchada. Tu servicio devuelve dignidad, y recuerda que poner un límite claro es también una forma de amor.",
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
    herida: "Tu árbol guarda silencios: historias que quedaron sin contar, dolores cubiertos por la vergüenza, verdades transmitidas a media voz. Ese silencio pesó en ti aunque llegara de generaciones anteriores. Tu proceso muestra que ha llegado el tiempo de hablar con cuidado, para que la línea familiar por fin respire.",
    medicina: "Tu medicina es la palabra que sana. Puedes poner nombre a lo que otros callaron y, al hacerlo, liberar patrones que se repetían desde hace generaciones. Tu servicio es irradiar verdad con delicadeza, hablando para desatar y reconciliar.",
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
    herida: "Aparece en tu historia una relación cuidadosa con el poder: aprendiste a retenerte para no incomodar o para no repetir lo que viste herir. Esa prudencia te protegió durante un tiempo, y ahora tu proceso madura hacia un poder que sostiene y ordena. Estás recuperando la voluntad para ocupar tu lugar con serenidad.",
    medicina: "Tu medicina es la voluntad al servicio y el discernimiento en medio del ruido. Puedes mantener el centro cuando otros se pierden entre falsas señales, y ocupar tu lugar desde la responsabilidad. Tu servicio es sostener claridad y firmeza amable en tiempos de confusión.",
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
    herida: "Hay en ti una raíz pendiente: una relación distante o dolida con el lugar donde naciste o donde vives. Migraciones, desarraigos y memorias que te dejaron entre dos tierras. Esa nostalgia guarda una vocación: la de un guardián que aún está por reconocer su territorio y volver a habitarlo con conciencia.",
    medicina: "Tu medicina es ser puente entre la memoria de la Tierra y la comunidad. Al volver a habitar tu territorio, puedes escuchar lo que ese lugar guarda —sus pueblos, sus aguas, sus heridas— y sostenerlo con presencia. Tu servicio es custodiar la raíz y devolver pertenencia al lugar.",
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
    herida: "En tu historia hay un dolor que aún organiza parte de tu vida: un resentimiento, una culpa o una escena que se repite. Tu proceso muestra que ese dolor está madurando hacia una alquimia: convertirse en conciencia y liberación. Es el trabajo más exigente y a la vez el más sagrado, y ya lo has comenzado.",
    medicina: "Tu medicina es la transformación del veneno en medicina a través del perdón, un perdón que libera aunque reconozca la verdad de lo ocurrido. Puedes acompañar a otros a soltar lo que los encadena. Tu presencia recuerda que toda herida puede volverse camino.",
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
    herida: "Tu proceso muestra una vocación temprana de reunir y de dar palabra: aprendiste a sostener a otros mientras te sostenías a ti. Esa capacidad de tejer y de nombrar es la huella de quien vino a custodiar memoria en tiempos de olvido. Tu historia te preparó para hacer red.",
    medicina: "Tu medicina es irradiar la Clave del Recuerdo y tejer comunidad. Puedes poner palabra donde hay confusión y reunir a los dispersos alrededor de un mismo propósito, con humildad y respeto. Tu servicio es custodiar la memoria compartiéndola.",
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

// Código (veneno → medicina → servicio) por patrón, para la sección "Códigos".
const CODIGO_BY_PATTERN: Record<PatternId, { nombre: string; veneno: string; medicina: string; servicio: string }> = {
  abandono: { nombre: "No pertenencia", veneno: "sentirte de paso, fuera de lugar, excluido", medicina: "crear hogar y pertenencia", servicio: "sostener comunidad y acoger a otros" },
  escasez: { nombre: "Escasez", veneno: "no merecer, temer que no alcance", medicina: "confianza y abundancia consciente", servicio: "abrir caminos de merecimiento" },
  abuso_voz: { nombre: "Voz silenciada", veneno: "invasión de límites, sometimiento", medicina: "dignidad y límite sano", servicio: "custodiar la dignidad de otros" },
  silencio: { nombre: "Silencio del linaje", veneno: "secretos y vergüenza heredada", medicina: "palabra que sana", servicio: "irradiar verdad con cuidado" },
  miedo_poder: { nombre: "Miedo al poder", veneno: "culpa, achicarse, entregar la voluntad", medicina: "voluntad al servicio", servicio: "sostener discernimiento en el caos" },
  desconexion_territorio: { nombre: "Desarraigo", veneno: "desconexión con el lugar y las raíces", medicina: "reconexión y custodia", servicio: "ser puente con la memoria de la Tierra" },
  perdon: { nombre: "Herida no perdonada", veneno: "resentimiento y culpa que encadenan", medicina: "perdón que libera", servicio: "acompañar la transformación del dolor" },
  servicio_palabra: { nombre: "Vocación de reunir", veneno: "dispersión y aislamiento", medicina: "palabra y comunidad", servicio: "tejer y custodiar la memoria" },
}

const PUERTA_BY_PATTERN: Record<PatternId, string> = {
  abandono: "presencia y comunidad",
  escasez: "confianza y merecimiento",
  abuso_voz: "dignidad y límites",
  silencio: "palabra y transmisión",
  miedo_poder: "discernimiento y protección",
  desconexion_territorio: "territorio y raíz",
  perdon: "perdón y linaje",
  servicio_palabra: "servicio y archivo",
}

// Acciones recomendadas (una por cada objetivo colectivo) — base fallback.
const ACCIONES_5_BASE: { objetivo: string; accion: string }[] = [
  { objetivo: "Comunidad de Base", accion: "Invita a una persona a compartir una lectura, meditación o conversación consciente." },
  { objetivo: "Irradiar la Clave", accion: "Comparte una enseñanza de Los 144.000 sin imponer, desde una experiencia real." },
  { objetivo: "Sanar y custodiar el territorio", accion: "Investiga una herida o memoria del lugar donde vives y relaciónala con tu propia historia." },
  { objetivo: "Discernimiento y Contacto", accion: "Completa una práctica de silencio, observación o discernimiento antes de buscar señales externas." },
  { objetivo: "Custodia de los Archivos", accion: "Guarda una revelación o escribe una síntesis que aporte a la memoria colectiva de la Red." },
]

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
    `El territorio donde vives guarda una memoria que dialoga con tu propio proceso. Te llama ${base}: sus pueblos, sus aguas, sus cerros y sus silencios pueden mostrarte qué parte de la Red pide presencia a través de ti. ` +
    `Tu tarea es investigar y traer claridad: conocer la historia sagrada de tu lugar, escuchar lo que pide ser recordado y elegir un punto concreto donde sostener presencia. Ahí tu sanación personal se vuelve custodia.`
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
    ". Es el eje alrededor del cual tu historia, tu linaje y tu territorio se ordenan. " +
    "Reconocerlo es el primer acto de tu misión, porque aquello que aprendiste a atravesar en ti es lo mismo que puedes ayudar a sanar en la Red. " +
    "Recibe esta lectura como un espejo que acompaña tu discernimiento."

  // Gran Síntesis: teje herida (el veneno) → medicina en un solo texto de 2
  // párrafos. Es lo que el Revelador muestra como lectura integrada.
  const sintesis = `${profile.herida}\n\n${profile.medicina}`

  // Lecturas por plano (fallback local; la IA las genera más elevadas).
  const linajeEntry = entries.find((e) => e.category === "linaje")?.answer.trim() ?? ""
  const historiaEntry = entries.find((e) => e.category === "historia")?.answer.trim() ?? ""

  const planoPersonal =
    `La repetición que aparece en tu vida señala un punto de transformación. En biodescodificación, lo que un sistema aprende a callar suele guardarse en el cuerpo —en la garganta lo que no se dijo, en el pecho el afecto contenido, en el vientre lo que costó digerir—. ` +
    `Tu trabajo en este plano es dar nombre, edad y lugar a esa parte de ti y devolverle la presencia que buscaba. Escríbele, escúchala, acompáñala con conciencia.` +
    (historiaEntry ? ` En tus palabras ya asoma el hilo por donde entrar: “${historiaEntry.slice(0, 140)}${historiaEntry.length > 140 ? "…" : ""}”.` : " Abre tu bitácora personal y escríbele una carta a esa parte de ti.")

  const planoLinaje =
    `Algunas respuestas que aparecen en tu vida vienen de un campo más antiguo: frases familiares, silencios del linaje, formas de amar y de sobrevivir transmitidas antes de que pudieras elegirlas. En biodescodificación, muchas repeticiones son lealtades invisibles hacia quienes vinieron antes. ` +
    `Tu tarea es reconocer el patrón que se repite y decidir, con conciencia, que en ti comienza una nueva generación. ` +
    (linajeEntry ? `Ya nombraste una huella: “${linajeEntry.slice(0, 140)}${linajeEntry.length > 140 ? "…" : ""}”. Ese es el hilo por donde comenzar.` : "Abre tu bitácora de linaje e investiga tres generaciones: qué se repite, qué se calló y qué don también se hereda.")

  const planoTerritorio = territorio

  const planoRed =
    `Aquí tu proceso se vuelve servicio. Ser sol en la Tierra es irradiar calor donde antes hubo frío, ofreciendo la medicina que destilaste en tu propia vida. ` +
    `Tu servicio a la Red comienza en gestos concretos y sostenidos: una persona, un círculo, una presencia real esta semana. Cada acto verdadero ya teje Red.`

  // Códigos detectados (patrones con resonancia; incluye el dominante).
  const codigoIds = scores.filter((s) => s.score > 0).map((s) => s.id)
  const idsForCodigos = (codigoIds.length ? codigoIds : [dominant]).slice(0, 4)
  const codigos = idsForCodigos.map((id) => CODIGO_BY_PATTERN[id])

  // Punto de entrada (puerta), NO objetivo único.
  const puerta = PUERTA_BY_PATTERN[dominant]
  const puntoEntrada =
    `Según lo registrado en tu bitácora, tu servicio parece comenzar por la puerta de ${puerta}. ` +
    `Es un umbral, un lugar por donde tu medicina empieza a circular. Todos los objetivos de Los 144.000 siguen siendo tuyos; esta puerta solo indica por dónde se abre tu camino en este momento.`

  // Cómo se activan los 5 objetivos colectivos en esta persona.
  const med = CODIGO_BY_PATTERN[dominant].medicina
  const objetivos5 = [
    { id: "comunidad", label: "Formar Comunidad de Base", texto: `Desde ${med}, puedes sostener un espacio donde otros encuentren compañía y propósito. Aunque empiece con una sola persona, ahí ya vive una comunidad de base.` },
    { id: "irradiar", label: "Irradiar la Clave del Recuerdo", texto: `Tu forma de irradiar surge de lo vivido: la comprensión que ganaste al transformar tu propia herida es la enseñanza más honesta que puedes ofrecer, con humildad y claridad.` },
    { id: "territorio", label: "Sanar y custodiar el territorio", texto: `Lo que reconociste en tu historia personal y en tu linaje es la llave para leer el lugar donde vives. Comienza por conocer su memoria: pueblos, aguas, heridas colectivas y lugares sagrados.` },
    { id: "catastrofe", label: "Prepararse para la Catastro-fe y el Contacto", texto: `Tu proceso te invita a fortalecer el centro y el discernimiento: sostener claridad cuando el mundo se llene de ruido, y acercarte al contacto desde la responsabilidad y el servicio.` },
    { id: "hermandad", label: "Reencontrarse con la Hermandad Blanca y custodiar los archivos", texto: `Custodiar es servir con humildad. Guardar tus revelaciones y aportarlas a la Red es ya una forma de custodiar los archivos del Plan y sostener la memoria viva.` },
  ]

  return {
    sufficient: true,
    entryCount,
    report: {
      ...profile, patternText, territorio, sintesis,
      planoPersonal, planoLinaje, planoTerritorio, planoRed,
      codigos, objetivos5, puntoEntrada, acciones5: ACCIONES_5_BASE,
    },
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
    "REVELACIÓN DE MISIÓN — Lectura personal",
    "",
    `LA REVELACIÓN\n${sintesis}`,
    `FRASE DE MISIÓN PERSONAL\n“${r.frase}”`,
  ]
  if (r.codigos?.length) {
    parts.push(`CÓDIGOS DETECTADOS\n${r.codigos.map((c) => `• ${c.nombre} — veneno: ${c.veneno}; medicina: ${c.medicina}; servicio: ${c.servicio}`).join("\n")}`)
  }
  if (r.planoPersonal) parts.push(`PILAR PERSONAL\n${r.planoPersonal}`)
  if (r.planoLinaje) parts.push(`PILAR DEL LINAJE\n${r.planoLinaje}`)
  if (r.planoTerritorio) parts.push(`PILAR DEL TERRITORIO\n${r.planoTerritorio}`)
  if (r.planoRed) parts.push(`PILAR DE LA RED\n${r.planoRed}`)
  if (r.objetivos5?.length) {
    parts.push(`CÓMO SE ACTIVAN LOS 5 OBJETIVOS\n${r.objetivos5.map((o) => `• ${o.label}: ${o.texto}`).join("\n\n")}`)
  }
  if (r.puntoEntrada) parts.push(`PUNTO DE ENTRADA A TU SERVICIO\n${r.puntoEntrada}`)
  if (r.acciones5?.length) {
    parts.push(`ACCIONES DE MISIÓN\n${r.acciones5.map((a) => `• ${a.objetivo}: ${a.accion}`).join("\n")}`)
  }
  parts.push(`SIGUIENTES PASOS\n${r.pasos.map((p, i) => `${i + 1}. ${p}`).join("\n")}`)
  return parts.join("\n\n")
}
