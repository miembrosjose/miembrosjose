// NUMEROLOGÍA CÓSMICA — motor de cálculo + lectura, propio de Los 144.000.
// Usa correspondencias numerológicas generales (tabla pitagórica). Lenguaje y
// estructura originales de la plataforma. Sin dependencias externas.

export type PlanoNombre = "mental" | "físico" | "emocional" | "intuitivo"

export type NumerologiaResultado = {
  nombre: string
  fecha: string
  ciudad: string
  nombreCosmico: string
  caminoVida: number
  alma: number
  personalidad: number
  expresion: number
  primeraVocal: { letra: string; numero: number }
  grupoDominante: { numero: number; veces: number }
  plano: PlanoNombre
  signoSolar: string
  creadoEn: string
}

// Tabla pitagórica (Ñ se trata como N para estabilidad del sistema).
const LETTER_VALUE: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
}
const VOWELS = new Set(["A", "E", "I", "O", "U"])
const MASTERS = new Set([11, 22, 33, 44])

/** Limpia: quita tildes, pasa a mayúsculas, Ñ→N, deja solo A-Z. */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase().replace(/Ñ/g, "N").replace(/[^A-Z]/g, "")
}

/** Reduce a 1-9 conservando números maestros 11/22/33/44. */
function reduce(n: number): number {
  let x = n
  while (x > 9 && !MASTERS.has(x)) {
    x = String(x).split("").reduce((a, d) => a + Number(d), 0)
  }
  return x
}

function sumLetters(letters: string[]): number {
  return letters.reduce((a, c) => a + (LETTER_VALUE[c] || 0), 0)
}

function firstWord(raw: string): string {
  const w = raw.trim().split(/\s+/)[0] || ""
  return normalizeName(w)
}

export function calcular(input: {
  nombre: string; fecha: string; ciudad?: string; nombreCosmico?: string
}): NumerologiaResultado {
  const clean = normalizeName(input.nombre)
  const letters = clean.split("")
  const vowels = letters.filter((c) => VOWELS.has(c))
  const consonants = letters.filter((c) => !VOWELS.has(c))

  // Camino de vida — suma de TODOS los dígitos de la fecha, reducida
  // conservando maestros. Este método detecta 11/22/33 que se perderían al
  // reducir día/mes/año por separado (ej. 27/12/1988 → 3+8=11, no 2).
  const [, m, d] = (input.fecha || "").split("-").map((v) => parseInt(v, 10))
  const digitSum = (input.fecha || "").replace(/\D/g, "").split("").reduce((a, ch) => a + Number(ch), 0)
  const caminoVida = reduce(digitSum)

  const alma = reduce(sumLetters(vowels))
  const personalidad = reduce(sumLetters(consonants))
  const expresion = reduce(sumLetters(letters))

  // Primera vocal (del primer nombre).
  const fw = firstWord(input.nombre)
  const pv = fw.split("").find((c) => VOWELS.has(c)) || vowels[0] || ""
  const primeraVocal = { letra: pv, numero: LETTER_VALUE[pv] || 0 }

  // Grupo dominante: número más frecuente entre las letras del nombre.
  const counts: Record<number, number> = {}
  for (const c of letters) { const v = LETTER_VALUE[c]; if (v) counts[v] = (counts[v] || 0) + 1 }
  let grupoDominante = { numero: expresion, veces: 0 }
  for (const [num, veces] of Object.entries(counts)) {
    if (veces > grupoDominante.veces) grupoDominante = { numero: Number(num), veces }
  }

  // Plano dominante: agrupa los números por plano y toma el de mayor peso.
  const planoDe: Record<number, PlanoNombre> = {
    1: "mental", 8: "mental",
    4: "físico", 5: "físico",
    2: "emocional", 3: "emocional", 6: "emocional",
    7: "intuitivo", 9: "intuitivo",
  }
  const planoPeso: Record<PlanoNombre, number> = { mental: 0, físico: 0, emocional: 0, intuitivo: 0 }
  for (const c of letters) { const v = LETTER_VALUE[c]; const p = v && planoDe[v]; if (p) planoPeso[p]++ }
  const plano = (Object.entries(planoPeso).sort((a, b) => b[1] - a[1])[0]?.[0] as PlanoNombre) || "mental"

  return {
    nombre: input.nombre.trim(),
    fecha: input.fecha,
    ciudad: (input.ciudad || "").trim(),
    nombreCosmico: (input.nombreCosmico || "").trim(),
    caminoVida, alma, personalidad, expresion,
    primeraVocal, grupoDominante, plano,
    signoSolar: signoSolar(m, d),
    creadoEn: new Date().toISOString(),
  }
}

function signoSolar(mes: number, dia: number): string {
  if (!mes || !dia) return ""
  const s: [number, number, string][] = [
    [1, 20, "Capricornio"], [2, 19, "Acuario"], [3, 20, "Piscis"], [4, 20, "Aries"],
    [5, 21, "Tauro"], [6, 21, "Géminis"], [7, 22, "Cáncer"], [8, 22, "Leo"],
    [9, 22, "Virgo"], [10, 22, "Libra"], [11, 21, "Escorpio"], [12, 21, "Sagitario"],
  ]
  const [, limite, signo] = s[mes - 1]
  if (dia <= limite) return signo
  return s[mes % 12][2]
}

// ── Significados (lenguaje propio, sobrio y elevado) ────────────────────
type Num = { titulo: string; esencia: string; lectura: string }
export const NUMERO: Record<number, Num> = {
  1: { titulo: "El Iniciador", esencia: "voluntad, inicio y dirección", lectura: "Hay una fuerza de comienzo que busca abrir camino desde la experiencia directa. Cuando esta energía madura, ordena el impulso, decide con claridad y activa movimiento en otros." },
  2: { titulo: "El Tejedor", esencia: "sensibilidad, unión y equilibrio", lectura: "Tu frecuencia percibe lo sutil y busca armonía entre las partes. Al madurar, se vuelve capacidad de unir, mediar y sostener vínculos sin perder el propio centro." },
  3: { titulo: "La Palabra", esencia: "expresión, creación y alegría", lectura: "Una energía creadora pide salir en palabra, arte y comunicación. Madura cuando la expresión deja de buscar atención y se convierte en un canal que despierta y alivia." },
  4: { titulo: "El Constructor", esencia: "orden, trabajo y raíz", lectura: "Hay una necesidad de estructura, de dar forma y sostener en el tiempo. Al madurar, edifica bases firmes que otros pueden habitar." },
  5: { titulo: "El Viajero", esencia: "libertad, cambio y experiencia", lectura: "Tu frecuencia busca movimiento, sentidos y expansión. Madura cuando la libertad deja de dispersarse y se convierte en experiencia que enseña y libera." },
  6: { titulo: "El Guardián", esencia: "amor, servicio y responsabilidad", lectura: "Hay una vocación de cuidar, armonizar y responsabilizarse por lo que se ama. Al madurar, el servicio se ofrece sin cargarse el peso de todos." },
  7: { titulo: "El Buscador", esencia: "introspección, análisis y sabiduría", lectura: "Una energía que observa el fondo de las cosas y busca la verdad detrás de la forma. Madura cuando el silencio se vuelve comprensión que ilumina a otros." },
  8: { titulo: "El Realizador", esencia: "poder, materia y logro", lectura: "Hay capacidad de dirigir, gestionar y manifestar en el mundo. Al madurar, el poder se pone al servicio y la abundancia circula." },
  9: { titulo: "El Servidor", esencia: "compasión, cierre y entrega", lectura: "Tu frecuencia abarca lo humano y sabe soltar lo que cumplió su ciclo. Madura cuando la entrega deja de esperar reconocimiento y se vuelve amor universal." },
  11: { titulo: "El Iluminador", esencia: "intuición elevada e inspiración", lectura: "Una vibración de alta sensibilidad y visión, un puente entre lo humano y lo espiritual. Madura cuando la inspiración se ancla en actos concretos de servicio." },
  22: { titulo: "El Arquitecto Maestro", esencia: "materializar al servicio colectivo", lectura: "La capacidad de llevar una visión espiritual a obra concreta y duradera. Madura cuando la gran construcción sirve a muchos y no al propio nombre." },
  33: { titulo: "El Maestro del Amor", esencia: "servicio compasivo y enseñanza", lectura: "Una frecuencia de entrega y sanación que enseña con la propia vida. Madura cuando el amor se ofrece con límites sanos y humildad." },
  44: { titulo: "El Orden Sagrado", esencia: "estructura material y espiritual", lectura: "La fuerza de sostener sistemas que unen lo terreno y lo sagrado. Madura cuando el orden se pone al servicio del despertar colectivo." },
}

const PLANO_TEXTO: Record<PlanoNombre, string> = {
  mental: "Tu energía se organiza sobre todo desde el plano mental: la idea, la voluntad y la dirección guían tu forma de estar en el mundo.",
  físico: "Tu energía se ancla en el plano físico: la acción concreta, el cuerpo, el trabajo y el territorio son tu manera de manifestar.",
  emocional: "Tu energía fluye desde el plano emocional: el vínculo, el sentir y la expresión son el centro de tu experiencia.",
  intuitivo: "Tu energía se abre desde el plano intuitivo: la percepción sutil, el silencio y la comprensión profunda orientan tu camino.",
}

export function num(n: number): Num {
  return NUMERO[n] || NUMERO[reduce9(n)] || NUMERO[9]
}
function reduce9(n: number): number { let x = n; while (x > 9) x = String(x).split("").reduce((a, d) => a + Number(d), 0); return x }

export function planoTexto(p: PlanoNombre): string { return PLANO_TEXTO[p] }

// ── Helpers reutilizables por la lectura profunda ───────────────────────
export function letterValue(ch: string): number { return LETTER_VALUE[ch] || 0 }
export function isVowel(ch: string): boolean { return VOWELS.has(ch) }
export function reduceKeepMasters(n: number): number { return reduce(n) }
export function sumDigits(s: string): number {
  return s.replace(/\D/g, "").split("").reduce((a, c) => a + Number(c), 0)
}
export const MASTER_NUMBERS = [11, 22, 33, 44]
export const planoDeNumero: Record<number, PlanoNombre> = {
  1: "mental", 8: "mental",
  4: "físico", 5: "físico",
  2: "emocional", 3: "emocional", 6: "emocional",
  7: "intuitivo", 9: "intuitivo",
}

/** Mensaje inicial de misión — une camino, alma y expresión en un párrafo. */
export function mensajeMision(r: NumerologiaResultado): string {
  const c = num(r.caminoVida), a = num(r.alma), e = num(r.expresion)
  return (
    `Tu arquitectura vibratoria dibuja un mismo hilo: entras en la materia con la frecuencia del ${r.caminoVida} · ${c.titulo}, ` +
    `mientras tu alma late en el ${r.alma} · ${a.titulo} y tu expresión se dirige hacia el ${r.expresion} · ${e.titulo}. ` +
    `Esta combinación revela una conciencia que aprende a ${c.esencia}, se nutre de ${a.esencia} y ofrece al mundo ${e.esencia}. ` +
    `Aquí comienza tu servicio dentro de la Red: cuando esta energía se ordena, tu vida personal se vuelve una medicina que otros pueden recibir.`
  )
}

// ── Persistencia de la última lectura (por dispositivo) ─────────────────
const LAST_KEY = "los144k_numerologia_last"

export function saveLastReading(r: NumerologiaResultado): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(LAST_KEY, JSON.stringify(r)) } catch { /* quota */ }
}

export function loadLastReading(): NumerologiaResultado | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(LAST_KEY)
    return raw ? (JSON.parse(raw) as NumerologiaResultado) : null
  } catch { return null }
}

/** prompt estable para la bitácora: una lectura por (nombre + fecha). */
export function bitacoraPrompt(r: NumerologiaResultado): string {
  const f = r.fecha ? r.fecha.split("-").reverse().join("/") : "—"
  return `Lectura · ${r.nombre || "Sin nombre"} · ${f}`
}

/** Texto plano para guardar en Mi Gran Bitácora. */
export function resultadoATexto(r: NumerologiaResultado): string {
  const linea = (t: string, n: number) => `${t}: ${n} · ${num(n).titulo}`
  return [
    `NUMEROLOGÍA CÓSMICA — Escáner de código personal`,
    `Nombre: ${r.nombre}`,
    `Fecha: ${r.fecha}${r.ciudad ? ` · ${r.ciudad}` : ""}${r.nombreCosmico ? ` · Nombre cósmico: ${r.nombreCosmico}` : ""}`,
    "",
    linea("Camino de vida", r.caminoVida),
    linea("Número del alma", r.alma),
    linea("Personalidad externa", r.personalidad),
    linea("Expresión / destino", r.expresion),
    `Primera vocal: ${r.primeraVocal.letra || "—"}${r.primeraVocal.numero ? ` (${r.primeraVocal.numero})` : ""}`,
    `Grupo dominante: ${r.grupoDominante.numero} · ${num(r.grupoDominante.numero).titulo}`,
    `Plano dominante: ${r.plano}`,
    r.signoSolar ? `Signo solar: ${r.signoSolar}` : "",
    "",
    `Mensaje inicial de misión:`,
    mensajeMision(r),
  ].filter(Boolean).join("\n")
}
