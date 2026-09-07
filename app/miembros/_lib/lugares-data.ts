// LUGARES DE CONTACTO — Mapa Cósmico de la Red.
// Modelo de datos + semilla de administración + almacén local (por dispositivo).
//
// NOTA DE ARQUITECTURA: esta primera versión guarda los aportes de la comunidad,
// los testimonios y los "mis registros" en localStorage, PROVISIONALMENTE y de
// forma aislada (claves los144k_lugares_*). Todo está tipado y centralizado aquí
// para migrar a Supabase (tablas contact_places / contact_place_testimonies /
// saved_contact_places) sin tocar la UI. Sin dependencias externas.

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
}

export type ContactPlaceTestimony = {
  id: string
  placeId: string
  userId?: string
  title?: string
  testimony: string
  date?: string
  isPrivate: boolean
  status: PlaceStatus
  createdAt: string
}

export type SavedContactPlace = {
  id: string
  placeId: string
  status: "saved" | "visited" | "worked"
  notes?: string
  createdAt: string
}

// ── Categorías ──────────────────────────────────────────────────────────
export const PLACE_CATEGORIES: { id: string; label: string }[] = [
  { id: "oficial_contacto", label: "Lugar oficial de contacto" },
  { id: "comunitario", label: "Punto comunitario" },
  { id: "avistamiento", label: "Zona de avistamiento" },
  { id: "sagrado", label: "Lugar sagrado" },
  { id: "retiro", label: "Retiro interior" },
  { id: "disco_solar", label: "Disco solar" },
  { id: "nodo", label: "Nodo local" },
  { id: "activacion", label: "Activación territorial" },
  { id: "natural", label: "Cueva / montaña / laguna / desierto / templo" },
  { id: "otro", label: "Otro" },
]
export function categoryLabel(id: string): string {
  return PLACE_CATEGORIES.find((c) => c.id === id)?.label || "Otro"
}

// ── Semilla de administración (editable / ampliable) ────────────────────
// Descripciones prudentes; información ampliada pendiente de edición.
const SEED_DESC = "Punto registrado por la administración como lugar asociado por algunas tradiciones a memoria, contacto o trabajo espiritual. Información ampliada pendiente de edición."

function seed(name: string, country: string, lat: number, lon: number, category: string, extra?: Partial<ContactPlace>): ContactPlace {
  const slug = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  return {
    id: `seed_${slug}`,
    name, slug, country,
    latitude: lat, longitude: lon,
    category, authorityLevel: "official", status: "published",
    shortDescription: SEED_DESC,
    tags: [], images: [], videos: [],
    createdBy: "Administración",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  }
}

export const ADMIN_SEED_POINTS: ContactPlace[] = [
  seed("Chilca", "Perú", -12.52, -76.73, "avistamiento", { region: "Lima" }),
  seed("Capilla del Monte / Uritorco", "Argentina", -30.86, -64.52, "avistamiento", { region: "Córdoba" }),
  seed("Monte Shasta", "Estados Unidos", 41.41, -122.19, "sagrado", { region: "California" }),
  seed("Cueva de los Tayos", "Ecuador", -1.93, -78.20, "natural", { region: "Morona Santiago" }),
  seed("Guatavita", "Colombia", 4.98, -73.77, "sagrado", { region: "Cundinamarca" }),
  seed("Lago Titicaca", "Bolivia / Perú", -15.92, -69.33, "sagrado"),
  seed("Rapa Nui", "Chile", -27.11, -109.35, "sagrado", { region: "Isla de Pascua" }),
  seed("Gizeh", "Egipto", 29.98, 31.13, "sagrado"),
  seed("Teotihuacán", "México", 19.69, -98.84, "sagrado"),
  seed("Zona del Silencio", "México", 26.69, -103.75, "activacion", { region: "Durango" }),
  seed("Monte Roraima", "Venezuela / Brasil / Guyana", 5.14, -60.76, "natural"),
  seed("Desierto del Gobi", "Mongolia / China", 42.5, 105.0, "retiro"),
]

// ── Almacén local (provisional, aislado — futuro: Supabase) ─────────────
const K_COMMUNITY = "los144k_lugares_community"
const K_TESTIMONIES = "los144k_lugares_testimonies"
const K_SAVED = "los144k_lugares_saved"
export const LUGARES_CHANGED_EVENT = "app:lugares-changed"

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(LUGARES_CHANGED_EVENT))
}
function read<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try { const raw = localStorage.getItem(key); const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : [] } catch { return [] }
}
function write<T>(key: string, val: T[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* quota / privado */ }
}
function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// Puntos de la comunidad (incluye pendientes y publicados).
export function loadCommunityPlaces(): ContactPlace[] { return read<ContactPlace>(K_COMMUNITY) }

export function addCommunityPlace(input: {
  name: string; country: string; region?: string; city?: string
  latitude?: number | null; longitude?: number | null
  category: string; shortDescription: string; longDescription?: string
  memoryType?: string; visitRecommendations?: string; tags?: string[]
  createdBy?: string
}): ContactPlace {
  const now = new Date().toISOString()
  const slug = input.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const place: ContactPlace = {
    id: uid("cp"),
    name: input.name.trim(), slug, country: input.country.trim(),
    region: input.region?.trim() || undefined, city: input.city?.trim() || undefined,
    latitude: input.latitude ?? null, longitude: input.longitude ?? null,
    category: input.category,
    authorityLevel: "pending", status: "pending_review",
    shortDescription: input.shortDescription.trim(),
    longDescription: input.longDescription?.trim() || undefined,
    memoryType: input.memoryType?.trim() || undefined,
    visitRecommendations: input.visitRecommendations?.trim() || undefined,
    tags: input.tags ?? [], images: [], videos: [],
    createdBy: input.createdBy || "Comunidad",
    createdAt: now, updatedAt: now,
  }
  const all = loadCommunityPlaces(); all.push(place); write(K_COMMUNITY, all); emit()
  return place
}

export function updateCommunityPlace(id: string, patch: Partial<ContactPlace>): void {
  const all = loadCommunityPlaces()
  const i = all.findIndex((p) => p.id === id)
  if (i < 0) return
  all[i] = { ...all[i], ...patch, updatedAt: new Date().toISOString() }
  write(K_COMMUNITY, all); emit()
}
export function deleteCommunityPlace(id: string): void {
  write(K_COMMUNITY, loadCommunityPlaces().filter((p) => p.id !== id)); emit()
}

/** Lugares visibles: semilla oficial + comunidad publicada. Admin ve también pendientes. */
export function visiblePlaces(isAdmin: boolean): ContactPlace[] {
  const community = loadCommunityPlaces().filter((p) =>
    p.status === "published" || (isAdmin && p.status === "pending_review"))
  return [...ADMIN_SEED_POINTS, ...community]
}

// Testimonios
export function loadTestimonies(placeId?: string): ContactPlaceTestimony[] {
  const all = read<ContactPlaceTestimony>(K_TESTIMONIES)
  return placeId ? all.filter((t) => t.placeId === placeId) : all
}
export function addTestimony(input: { placeId: string; testimony: string; title?: string; date?: string; isPrivate: boolean }): ContactPlaceTestimony {
  const t: ContactPlaceTestimony = {
    id: uid("ct"), placeId: input.placeId, title: input.title?.trim() || undefined,
    testimony: input.testimony.trim(), date: input.date || undefined,
    isPrivate: input.isPrivate, status: input.isPrivate ? "hidden" : "pending_review",
    createdAt: new Date().toISOString(),
  }
  const all = read<ContactPlaceTestimony>(K_TESTIMONIES); all.push(t); write(K_TESTIMONIES, all); emit()
  return t
}

// Guardados / visitados
export function loadSaved(): SavedContactPlace[] { return read<SavedContactPlace>(K_SAVED) }
export function savedStatus(placeId: string): SavedContactPlace | undefined {
  return loadSaved().find((s) => s.placeId === placeId)
}
export function setSaved(placeId: string, status: SavedContactPlace["status"]): void {
  const all = loadSaved()
  const i = all.findIndex((s) => s.placeId === placeId)
  if (i >= 0) {
    // Alterna: si ya tenía el mismo estado, lo quita.
    if (all[i].status === status) { all.splice(i, 1) }
    else all[i] = { ...all[i], status }
  } else {
    all.push({ id: uid("sv"), placeId, status, createdAt: new Date().toISOString() })
  }
  write(K_SAVED, all); emit()
}

// ── Proyección equirectangular (lat/lon → % dentro del mapa) ────────────
export function project(lat: number, lon: number): { x: number; y: number } {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 }
}

/** Nº de países/territorios representados (cuenta segmentos separados por "/"). */
export function countTerritories(places: ContactPlace[]): number {
  const set = new Set<string>()
  for (const p of places) for (const c of p.country.split("/")) set.add(c.trim().toLowerCase())
  return set.size
}
