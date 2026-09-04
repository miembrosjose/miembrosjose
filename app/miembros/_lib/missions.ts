// Estado de las Misiones de Custodia. Sin puntos ni ranking: solo estados de
// integración. Se guarda en localStorage (por dispositivo).

export type MissionState = "no_iniciada" | "en_proceso" | "integrada"

export const MISSION_STATE_LABELS: Record<MissionState, string> = {
  no_iniciada: "No iniciada",
  en_proceso: "En proceso",
  integrada: "Integrada",
}

const KEY = "los144k_missions_v1"
export const MISSIONS_CHANGED_EVENT = "app:missions-changed"

function load(): Record<string, MissionState> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(KEY)
    const obj = raw ? (JSON.parse(raw) as Record<string, MissionState>) : {}
    return obj && typeof obj === "object" ? obj : {}
  } catch { return {} }
}

function save(obj: Record<string, MissionState>): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(KEY, JSON.stringify(obj)) } catch { /* ignora */ }
}

export function getMissionState(id: string): MissionState {
  return load()[id] ?? "no_iniciada"
}

export function getMissionStates(): Record<string, MissionState> {
  return load()
}

export function setMissionState(id: string, state: MissionState): void {
  const obj = load()
  obj[id] = state
  save(obj)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MISSIONS_CHANGED_EVENT, { detail: { id, state } }))
  }
}
