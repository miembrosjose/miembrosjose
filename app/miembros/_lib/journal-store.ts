// MI GRAN BITÁCORA — almacén estructurado de entradas del camino.
//
// A diferencia de la versión anterior (un solo bloque de texto por clave),
// aquí cada entrada guarda: categoría, origen (portal/temporada), pregunta,
// respuesta, fecha, y si es privada. Todo vive en localStorage (por
// dispositivo) y PRIVADO POR DEFECTO. Preparado para migrar a Supabase:
// la capa de lectura/escritura está aislada en este archivo.

export type JournalCategory =
  | "camino"        // MI CAMINO — ingreso e integraciones generales
  | "historia"      // MI HISTORIA PERSONAL — heridas, infancia, propósito
  | "linaje"        // MI LINAJE — patrones familiares, creencias heredadas
  | "territorio"    // MI TERRITORIO — historia del lugar, heridas colectivas
  | "acciones"      // MIS ACCIONES ALQUÍMICAS — cartas, actos simbólicos
  | "misiones"      // MIS MISIONES — custodia, nodos, reportes
  | "revelaciones"  // MIS REVELACIONES — comprensiones-hito

export const JOURNAL_CATEGORIES: { id: JournalCategory; label: string; hint: string }[] = [
  { id: "camino", label: "Mi Camino", hint: "Portal de Ingreso e integraciones generales" },
  { id: "historia", label: "Mi Historia Personal", hint: "Heridas, infancia, no pertenencia, cuerpo, voz, propósito" },
  { id: "linaje", label: "Mi Linaje", hint: "Creencias heredadas, patrones familiares, silencios" },
  { id: "territorio", label: "Mi Territorio", hint: "Historia del lugar, heridas colectivas, memoria ancestral" },
  { id: "acciones", label: "Mis Acciones Alquímicas", hint: "Cartas, actos simbólicos, reparación" },
  { id: "misiones", label: "Mis Misiones", hint: "Custodia, territorio, nodos, irradiación" },
  { id: "revelaciones", label: "Mis Revelaciones", hint: "Comprensiones que quieras guardar como hitos" },
]

export type JournalEntry = {
  id: string
  category: JournalCategory
  source: string        // id del portal/temporada/misión (p.ej. "t1_compromiso")
  sourceLabel: string   // etiqueta legible (p.ej. "Portal del Compromiso · T1 → T2")
  prompt: string        // la pregunta / campo
  answer: string        // la respuesta
  private: boolean       // privado por defecto
  createdAt: string
  updatedAt: string
}

const KEY = "los144k_journal_v2"
const MIGRATED_FLAG = "los144k_journal_migrated_v2"
export const JOURNAL_CHANGED_EVENT = "app:journal-changed"

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(JOURNAL_CHANGED_EVENT))
}

function slugify(s: string): string {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    .slice(0, 60)
}

/** id determinístico por (origen + pregunta) → re-responder actualiza la misma entrada. */
export function entryId(source: string, prompt: string): string {
  return `${source}__${slugify(prompt)}`
}

export function loadEntries(): JournalEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? (JSON.parse(raw) as JournalEntry[]) : []
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function saveEntries(entries: JournalEntry[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(KEY, JSON.stringify(entries)) } catch { /* quota / privado */ }
}

/** Crea o actualiza una entrada por (source, prompt). Answer vacía → la elimina. */
export function upsertAnswer(input: {
  category: JournalCategory
  source: string
  sourceLabel: string
  prompt: string
  answer: string
  isPrivate?: boolean
}): void {
  const id = entryId(input.source, input.prompt)
  const entries = loadEntries()
  const now = new Date().toISOString()
  const idx = entries.findIndex((e) => e.id === id)
  const answer = input.answer

  if (!answer.trim()) {
    if (idx >= 0) { entries.splice(idx, 1); saveEntries(entries); emit() }
    return
  }
  if (idx >= 0) {
    entries[idx] = {
      ...entries[idx],
      category: input.category,
      sourceLabel: input.sourceLabel,
      prompt: input.prompt,
      answer,
      updatedAt: now,
      // conserva la elección de privacidad si ya existía
      private: entries[idx].private,
    }
  } else {
    entries.push({
      id,
      category: input.category,
      source: input.source,
      sourceLabel: input.sourceLabel,
      prompt: input.prompt,
      answer,
      private: input.isPrivate ?? true,
      createdAt: now,
      updatedAt: now,
    })
  }
  saveEntries(entries)
  emit()
}

export function readAnswer(source: string, prompt: string): string {
  const id = entryId(source, prompt)
  return loadEntries().find((e) => e.id === id)?.answer ?? ""
}

export function deleteEntry(id: string): void {
  const entries = loadEntries().filter((e) => e.id !== id)
  saveEntries(entries)
  emit()
}

export function setEntryPrivate(id: string, isPrivate: boolean): void {
  const entries = loadEntries()
  const idx = entries.findIndex((e) => e.id === id)
  if (idx < 0) return
  entries[idx] = { ...entries[idx], private: isPrivate, updatedAt: new Date().toISOString() }
  saveEntries(entries)
  emit()
}

export function entriesByCategory(cat: JournalCategory): JournalEntry[] {
  return loadEntries()
    .filter((e) => e.category === cat)
    .sort((a, b) => (a.sourceLabel === b.sourceLabel
      ? a.createdAt.localeCompare(b.createdAt)
      : a.sourceLabel.localeCompare(b.sourceLabel)))
}

export function countByCategory(): Record<JournalCategory, number> {
  const out = { camino: 0, historia: 0, linaje: 0, territorio: 0, acciones: 0, misiones: 0, revelaciones: 0 } as Record<JournalCategory, number>
  for (const e of loadEntries()) out[e.category] = (out[e.category] || 0) + 1
  return out
}

// ── Migración de la bitácora antigua (un blob por clave) ────────────────
// Importa una sola vez los textos guardados en la versión anterior
// (los144k_bitacora_<key>) para que nadie pierda lo escrito.
const LEGACY_MAP: { key: string; category: JournalCategory; label: string }[] = [
  { key: "ingreso", category: "camino", label: "Bitácora de Ingreso" },
  { key: "portal_compromiso", category: "camino", label: "Portal del Compromiso (T1 → T2)" },
  { key: "portal_mapa_cosmico", category: "camino", label: "Portal del Mapa Cósmico (T2 → T3)" },
  { key: "portal_memoria_terrestre", category: "linaje", label: "Portal de la Memoria Terrestre (T3 → T4)" },
  { key: "personal", category: "historia", label: "Bitácora Personal" },
  { key: "historia_personal", category: "historia", label: "Mi Historia Personal" },
  { key: "integracion_solar", category: "revelaciones", label: "Integración Solar" },
  { key: "territorio", category: "territorio", label: "Bitácora del Territorio" },
  { key: "custodia", category: "misiones", label: "Misiones de Custodia" },
]

export function migrateLegacyJournal(): void {
  if (typeof window === "undefined") return
  try {
    if (localStorage.getItem(MIGRATED_FLAG)) return
    for (const m of LEGACY_MAP) {
      const val = localStorage.getItem(`los144k_bitacora_${m.key}`)
      if (val && val.trim()) {
        upsertAnswer({
          category: m.category,
          source: `legacy_${m.key}`,
          sourceLabel: m.label,
          prompt: "Registro anterior",
          answer: val.trim(),
          isPrivate: true,
        })
      }
    }
    localStorage.setItem(MIGRATED_FLAG, "1")
  } catch { /* ignora */ }
}
