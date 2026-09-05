// Registro central de "Mi Gran Bitácora".
//
// Cada entrada de bitácora del camino (portales, integraciones, misiones) se
// guarda en localStorage bajo `los144k_bitacora_<key>` (ver PortalJournal).
// Este registro describe qué keys existen, a qué etapa pertenecen y en qué
// pestaña de la Gran Bitácora se muestran.
//
// PREPARADO PARA BACKEND: si más adelante se migra a una tabla
// user_journal_entries, este registro sigue sirviendo como catálogo de etapas;
// solo cambiaría la capa de lectura/escritura (localStorage → API).

export type JournalTab = "proceso" | "linaje" | "territorio" | "senales" | "misiones"

export type JournalEntryDef = {
  key: string        // sufijo de la key en localStorage
  title: string      // título de la entrada
  stage: string      // etapa del camino (para mostrar y ordenar)
  tab: JournalTab    // pestaña donde aparece
  order: number      // orden dentro del camino
}

export const JOURNAL_STORAGE_PREFIX = "los144k_bitacora_"

// Evento global para abrir "Mi Gran Bitácora" desde cualquier parte
// (navbar, portales, objetivos). El shell lo escucha y abre el modal.
export const OPEN_JOURNAL_EVENT = "app:open-bitacora"

// Pestaña pendiente al abrir la bitácora (para "Completar mi historia", etc.).
let pendingTab: string | null = null

export function openGrandJournal(tab?: string): void {
  pendingTab = tab ?? null
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(OPEN_JOURNAL_EVENT))
}

export function consumeJournalTab(): string | null {
  const t = pendingTab
  pendingTab = null
  return t
}

export function journalStorageKey(key: string): string {
  return `${JOURNAL_STORAGE_PREFIX}${key}`
}

export const JOURNAL_TABS: { id: JournalTab; label: string }[] = [
  { id: "proceso", label: "Mi proceso personal" },
  { id: "linaje", label: "Mi linaje" },
  { id: "territorio", label: "Mi territorio" },
  { id: "senales", label: "Mis señales" },
  { id: "misiones", label: "Mis misiones" },
]

// Catálogo de entradas conocidas. Se irá ampliando en fases siguientes
// (Integración Solar, Mi Historia Personal, Misiones de Custodia, etc.).
export const JOURNAL_ENTRIES: JournalEntryDef[] = [
  { key: "ingreso", title: "Bitácora de Ingreso", stage: "Portal de Ingreso", tab: "proceso", order: 10 },
  { key: "portal_compromiso", title: "Portal del Compromiso", stage: "Integración · Temporada 1 → 2", tab: "proceso", order: 20 },
  { key: "portal_mapa_cosmico", title: "Portal del Mapa Cósmico", stage: "Integración · Temporada 2 → 3", tab: "proceso", order: 30 },
  { key: "portal_memoria_terrestre", title: "Portal de la Memoria Terrestre", stage: "Integración · Temporada 3 → 4", tab: "linaje", order: 40 },
  { key: "personal", title: "Bitácora Personal", stage: "Objetivos de Los 144.000", tab: "proceso", order: 50 },
  { key: "historia_personal", title: "Mi Historia Personal", stage: "Objetivos de Los 144.000", tab: "linaje", order: 45 },
  { key: "integracion_solar", title: "Integración Solar", stage: "Objetivos de Los 144.000", tab: "senales", order: 55 },
  { key: "territorio", title: "Bitácora del Territorio", stage: "Misión Territorial", tab: "territorio", order: 60 },
  { key: "custodia", title: "Misiones de Custodia", stage: "Objetivos de Los 144.000", tab: "misiones", order: 70 },
]

/** Lee el contenido guardado de una entrada (localStorage, cliente). */
export function readJournalEntry(key: string): string {
  if (typeof window === "undefined") return ""
  try { return localStorage.getItem(journalStorageKey(key)) ?? "" } catch { return "" }
}

/** Guarda el contenido de una entrada (localStorage, cliente). */
export function writeJournalEntry(key: string, value: string): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(journalStorageKey(key), value) } catch { /* modo privado / quota */ }
}
