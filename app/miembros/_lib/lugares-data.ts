// LUGARES DE CONTACTO — Mapa Cósmico de la Red.
// Modelo de datos + categorías (con color) + acceso a la API (/api/lugares) para
// los puntos, y almacén local para testimonios/guardados personales.
//
// Los PUNTOS ahora se guardan en Supabase (tabla contact_places) vía /api/lugares
// para que las solicitudes de la comunidad lleguen a la administración y puedan
// aprobarse/denegarse. Los testimonios y "guardados/visitados" personales siguen
// en localStorage (aislado: los144k_lugares_*) por ahora.

export type AuthorityLevel = "official" | "community" | "pending" | "featured"
export type PlaceStatus = "published" | "pending_review" | "rejected" | "hidden"

export type ContactPlace = {
  id: string
  name: string
  slug: string
  country: string
  region?: string
  city?: string
  latitude: number | null
  longitude: number | null
  category: string
  authorityLevel: AuthorityLevel
  status: PlaceStatus
  shortDescription: string
  longDescription?: string
  memoryType?: string
  contactRelation?: string
  visitRecommendations?: string
  suggestedPractice?: string
  tags: string[]
  images: string[]
  videos: string[]
  createdBy?: string
  createdAt: string
  updatedAt: string
  approvedBy?: string
  approvedAt?: string
  mine?: boolean
}

export type ContactPlaceTestimony = {
  id: string; placeId: string; userId?: string; title?: string
  testimony: string; date?: string; isPrivate: boolean; status: PlaceStatus; createdAt: string
}
export type SavedContactPlace = {
  id: string; placeId: string; status: "saved" | "visited" | "worked"; notes?: string; createdAt: string
}

// ── Categorías (con color propio para el mapa y las fichas) ─────────────
export const PLACE_CATEGORIES: { id: string; label: string; color: string }[] = [
  { id: "oficial_contacto", label: "Lugar oficial de contacto", color: "#e6cf95" },
  { id: "comunitario", label: "Punto comunitario", color: "#a78bca" },
  { id: "avistamiento", label: "Zona de avistamiento", color: "#67e8f9" },
  { id: "sagrado", label: "Lugar sagrado", color: "#f0abfc" },
  { id: "retiro", label: "Retiro interior", color: "#86efac" },
  { id: "disco_solar", label: "Disco solar", color: "#fbbf24" },
  { id: "nodo", label: "Nodo local", color: "#93c5fd" },
  { id: "activacion", label: "Activación territorial", color: "#fca5a5" },
  { id: "natural", label: "Cueva / montaña / laguna / desierto / templo", color: "#a3e635" },
  { id: "otro", label: "Otro", color: "#cbd5e1" },
]
export function categoryLabel(id: string): string { return PLACE_CATEGORIES.find((c) => c.id === id)?.label || "Otro" }
export function categoryColor(id: string): string { return PLACE_CATEGORIES.find((c) => c.id === id)?.color || "#cbd5e1" }

// ── Semilla (fallback si la API no responde) ────────────────────────────
function seed(name: string, country: string, lat: number, lon: number, category: string, region?: string): ContactPlace {
  const slug = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  return {
    id: `seed_${slug}`, name, slug, country, region,
    latitude: lat, longitude: lon, category, authorityLevel: "official", status: "published",
    shortDescription: "Punto registrado por la administración como lugar asociado por algunas tradiciones a memoria, contacto o trabajo espiritual. Información ampliada pendiente de edición.",
    tags: [], images: [], videos: [], createdBy: "Administración",
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  }
}
export const ADMIN_SEED_POINTS: ContactPlace[] = [
  seed("Chilca", "Perú", -12.52, -76.73, "avistamiento", "Lima"),
  seed("Capilla del Monte / Uritorco", "Argentina", -30.86, -64.52, "avistamiento", "Córdoba"),
  seed("Monte Shasta", "Estados Unidos", 41.41, -122.19, "sagrado", "California"),
  seed("Cueva de los Tayos", "Ecuador", -1.93, -78.20, "natural", "Morona Santiago"),
  seed("Guatavita", "Colombia", 4.98, -73.77, "sagrado", "Cundinamarca"),
  seed("Lago Titicaca", "Bolivia / Perú", -15.92, -69.33, "sagrado"),
  seed("Rapa Nui", "Chile", -27.11, -109.35, "sagrado", "Isla de Pascua"),
  seed("Gizeh", "Egipto", 29.98, 31.13, "sagrado"),
  seed("Teotihuacán", "México", 19.69, -98.84, "sagrado"),
  seed("Zona del Silencio", "México", 26.69, -103.75, "activacion", "Durango"),
  seed("Monte Roraima", "Venezuela / Brasil / Guyana", 5.14, -60.76, "natural"),
  seed("Desierto del Gobi", "Mongolia / China", 42.5, 105.0, "retiro"),
]

// ── API de puntos ────────────────────────────────────────────────────────
export async function fetchPlaces(): Promise<{ places: ContactPlace[]; isAdmin: boolean }> {
  try {
    const r = await fetch("/api/lugares", { credentials: "include" })
    if (!r.ok) throw new Error("bad")
    const d = await r.json()
    const places = Array.isArray(d.places) ? (d.places as ContactPlace[]) : []
    return { places: places.length ? places : ADMIN_SEED_POINTS, isAdmin: !!d.isAdmin }
  } catch {
    return { places: ADMIN_SEED_POINTS, isAdmin: false }
  }
}

export async function submitPlace(payload: {
  name: string; country: string; region?: string; city?: string
  latitude?: number | null; longitude?: number | null
  category: string; shortDescription: string; longDescription?: string
  memoryType?: string; visitRecommendations?: string; tags?: string[]
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch("/api/lugares", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify(payload),
    })
    const d = await r.json().catch(() => ({}))
    return r.ok ? { ok: true } : { ok: false, error: d.error || "No se pudo enviar" }
  } catch { return { ok: false, error: "Error de conexión" } }
}

export async function moderatePlace(id: string, patch: Partial<Pick<ContactPlace, "status" | "authorityLevel" | "category" | "shortDescription" | "longDescription" | "visitRecommendations">>): Promise<boolean> {
  try {
    const r = await fetch(`/api/lugares/${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify(patch),
    })
    return r.ok
  } catch { return false }
}
export async function deletePlace(id: string): Promise<boolean> {
  try {
    const r = await fetch(`/api/lugares/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" })
    return r.ok
  } catch { return false }
}

// ── Geocodificación (proxy propio) ───────────────────────────────────────
export type GeoResult = { label: string; lat: number; lon: number; country: string; region: string; city: string }
export async function geocode(q: string): Promise<GeoResult[]> {
  if (q.trim().length < 3) return []
  try {
    const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { credentials: "include" })
    if (!r.ok) return []
    const d = await r.json()
    return Array.isArray(d.results) ? d.results : []
  } catch { return [] }
}

// ── Testimonios / guardados (local, personal) ───────────────────────────
const K_TESTIMONIES = "los144k_lugares_testimonies"
const K_SAVED = "los144k_lugares_saved"
export const LUGARES_CHANGED_EVENT = "app:lugares-changed"

function emit() { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(LUGARES_CHANGED_EVENT)) }
function read<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try { const raw = localStorage.getItem(key); const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : [] } catch { return [] }
}
function writeLS<T>(key: string, val: T[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* quota */ }
}
function uid(p: string): string { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}` }

export function loadTestimonies(placeId?: string): ContactPlaceTestimony[] {
  const all = read<ContactPlaceTestimony>(K_TESTIMONIES)
  return placeId ? all.filter((t) => t.placeId === placeId) : all
}
export function addTestimony(input: { placeId: string; testimony: string; title?: string; date?: string; isPrivate: boolean }): void {
  const t: ContactPlaceTestimony = {
    id: uid("ct"), placeId: input.placeId, title: input.title?.trim() || undefined,
    testimony: input.testimony.trim(), date: input.date || undefined,
    isPrivate: input.isPrivate, status: input.isPrivate ? "hidden" : "pending_review", createdAt: new Date().toISOString(),
  }
  const all = read<ContactPlaceTestimony>(K_TESTIMONIES); all.push(t); writeLS(K_TESTIMONIES, all); emit()
}
export function loadSaved(): SavedContactPlace[] { return read<SavedContactPlace>(K_SAVED) }
export function savedStatus(placeId: string): SavedContactPlace | undefined { return loadSaved().find((s) => s.placeId === placeId) }
export function setSaved(placeId: string, status: SavedContactPlace["status"]): void {
  const all = loadSaved()
  const i = all.findIndex((s) => s.placeId === placeId)
  if (i >= 0) { if (all[i].status === status) all.splice(i, 1); else all[i] = { ...all[i], status } }
  else all.push({ id: uid("sv"), placeId, status, createdAt: new Date().toISOString() })
  writeLS(K_SAVED, all); emit()
}

// ── Utilidades ────────────────────────────────────────────────────────────
export function project(lat: number, lon: number): { x: number; y: number } {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 }
}
export function countTerritories(places: ContactPlace[]): number {
  const set = new Set<string>()
  for (const p of places) for (const c of p.country.split("/")) set.add(c.trim().toLowerCase())
  return set.size
}

// Lista de países (desplegable del formulario). Foco en América + principales.
export const COUNTRIES: string[] = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador",
  "El Salvador", "España", "Estados Unidos", "Guatemala", "Honduras", "México", "Nicaragua",
  "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela",
  "Canadá", "Portugal", "Francia", "Italia", "Reino Unido", "Alemania", "Egipto", "India",
  "China", "Japón", "Australia", "Nueva Zelanda", "Sudáfrica", "Otro",
]
