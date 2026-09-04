// SELLOS INICIÁTICOS — marcan que la persona atravesó una etapa del camino.
// Sin puntos, sin ranking, sin competencia: solo hitos de integración.
// Se guardan en localStorage (por dispositivo).

export type SealId =
  | "ingreso"
  | "corazon"
  | "desprogramacion"
  | "dignidad"
  | "perdon_solar"
  | "territorio"
  | "guardian"
  | "nodo"
  | "contacto_interior"

export type SealDef = {
  id: SealId
  name: string
  glyph: string        // símbolo/emoji del sello
  condition: string    // cómo se obtiene (para UI)
  phrase: string       // texto del sello (cierre iniciático)
}

export const SEALS: SealDef[] = [
  { id: "ingreso", name: "Sello del Ingreso", glyph: "🜂", condition: "Completó el Portal de Ingreso.",
    phrase: "He abierto el espacio y acepto recorrer este camino con discernimiento y humildad." },
  { id: "corazon", name: "Sello del Corazón", glyph: "❤︎", condition: "Integró la Temporada 1.",
    phrase: "He reconocido que el llamado no vino desde afuera. Algo antiguo volvió a pasar por mi corazón." },
  { id: "desprogramacion", name: "Sello de la Desprogramación", glyph: "✦", condition: "Integró la Temporada 2.",
    phrase: "He visto que no todo lo que pienso nació en mí. Ahora puedo elegir una nueva instrucción." },
  { id: "dignidad", name: "Sello de la Dignidad", glyph: "⚜", condition: "Integró la Temporada 3.",
    phrase: "He reconocido que la memoria antigua también vive en mi historia. Recupero mi cuerpo, mi voz, mis límites y mi voluntad." },
  { id: "perdon_solar", name: "Sello del Perdón Solar", glyph: "☀", condition: "Integró la Temporada 4.",
    phrase: "He comprendido que el perdón no borra la historia. La transforma en fuerza, servicio y misión." },
  { id: "territorio", name: "Sello del Territorio", glyph: "⛰", condition: "Creó su ficha de territorio.",
    phrase: "He comenzado a escuchar la memoria del lugar donde fui sembrado." },
  { id: "guardian", name: "Sello del Guardián", glyph: "🛡", condition: "Realizó una misión de custodia.",
    phrase: "He convertido el recuerdo en acto: sostengo presencia en mi territorio." },
  { id: "nodo", name: "Sello del Nodo", glyph: "✵", condition: "Formó o participó en una comunidad de base.",
    phrase: "La memoria dejó de estar aislada: sostengo la Red junto a otros." },
  { id: "contacto_interior", name: "Sello del Contacto Interior", glyph: "◉", condition: "Completó el Umbral del Contacto.",
    phrase: "He ordenado la intención: el servicio pesa más que la experiencia." },
]

export function getSeal(id: SealId): SealDef | undefined {
  return SEALS.find((s) => s.id === id)
}

type SealRecord = { id: SealId; unlockedAt: string }

const KEY = "los144k_seals_v1"
export const SEALS_CHANGED_EVENT = "app:seals-changed"

function load(): SealRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? (JSON.parse(raw) as SealRecord[]) : []
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function save(list: SealRecord[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignora */ }
}

export function getUnlockedSeals(): SealRecord[] {
  return load()
}

export function hasSeal(id: SealId): boolean {
  return load().some((s) => s.id === id)
}

/** Desbloquea un sello (idempotente). Devuelve true si se desbloqueó ahora. */
export function unlockSeal(id: SealId): boolean {
  if (typeof window === "undefined") return false
  const list = load()
  if (list.some((s) => s.id === id)) return false
  list.push({ id, unlockedAt: new Date().toISOString() })
  save(list)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SEALS_CHANGED_EVENT, { detail: { id } }))
  }
  return true
}
