"use client"

// LUGARES DE CONTACTO — Mapa Cósmico de la Red.
// Módulo dentro de Biblioteca (se abre desde la tarjeta). Puntos en Supabase vía
// /api/lugares (con moderación admin); testimonios/guardados personales en local.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"
import {
  X, MapPin, Search, Plus, Bookmark, BookmarkCheck, Footprints,
  MessageSquarePlus, Shield, Check, BookmarkPlus, Globe2, Loader2,
} from "lucide-react"
import {
  fetchPlaces, submitPlace, moderatePlace, deletePlace,
  loadTestimonies, addTestimony, loadSaved, savedStatus, setSaved,
  countTerritories, categoryLabel, categoryColor, PLACE_CATEGORIES, COUNTRIES,
  LUGARES_CHANGED_EVENT, type ContactPlace,
} from "../_lib/lugares-data"
import { upsertAnswer } from "../_lib/journal-store"
import { useProducts, type DbProduct } from "../_lib/use-products"
import prod from "./products.module.css"

// Mapa y selector: SOLO cliente (ssr:false). Así Leaflet/globe.gl/three NO entran
// al bundle del Worker (evita "Error 1102 · Worker exceeded resource limits").
const ContactPlacesMap = dynamic(() => import("./ContactPlacesMap").then((m) => m.ContactPlacesMap), {
  ssr: false,
  loading: () => <div style={{ height: "min(62vh,460px)", minHeight: 300, borderRadius: 14, border: "1px solid rgba(167,139,202,0.25)", background: "#06060f", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b90b4", fontSize: "0.8rem" }}>Cargando mapa…</div>,
})
const LocationPicker = dynamic(() => import("./ContactPlacesMap").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => <div style={{ height: 260, borderRadius: 14, border: "1px solid rgba(167,139,202,0.25)", background: "#06060f", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b90b4", fontSize: "0.8rem" }}>Cargando selector…</div>,
})

const GOLD = "#e6cf95"
const GOLD_DEEP = "#c9a86b"
const VIOLET = "#a78bca"

export function isLugaresToolProduct(p: { name: string }): boolean {
  const n = p.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  return n.includes("lugares") && n.includes("contacto")
}

type View = "mapa" | "oficiales" | "anadir" | "mis"

export function LugaresContacto() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>("mapa")
  const [mapView, setMapView] = useState<"map" | "globe">("map")
  const [selected, setSelected] = useState<ContactPlace | null>(null)

  const [places, setPlaces] = useState<ContactPlace[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)

  const [q, setQ] = useState("")
  const [level, setLevel] = useState<"todos" | "official" | "community" | "pending">("todos")
  const [cat, setCat] = useState("")

  const { products } = useProducts()
  const product = useMemo(() => products.find(isLugaresToolProduct) ?? null, [products])
  const bodyRef = useRef<HTMLDivElement>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    const { places, isAdmin } = await fetchPlaces()
    setPlaces(places); setIsAdmin(isAdmin); setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    if (!open) return
    reload()
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { if (selected) setSelected(null); else setOpen(false) } }
    const onLocal = () => { /* testimonios/guardados cambian → forzar re-render */ setPlaces((p) => [...p]) }
    window.addEventListener("keydown", onKey)
    window.addEventListener(LUGARES_CHANGED_EVENT, onLocal)
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); window.removeEventListener(LUGARES_CHANGED_EVENT, onLocal) }
  }, [open, selected, reload])

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }) }, [view])

  const oficiales = useMemo(() => places.filter((p) => p.authorityLevel === "official" || p.authorityLevel === "featured"), [places])
  const pendientesCount = useMemo(() => places.filter((p) => p.status === "pending_review").length, [places])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return places.filter((p) => {
      if (level === "official" && !(p.authorityLevel === "official" || p.authorityLevel === "featured")) return false
      if (level === "community" && p.authorityLevel !== "community") return false
      if (level === "pending" && p.status !== "pending_review") return false
      if (cat && p.category !== cat) return false
      if (needle) { const hay = `${p.name} ${p.country} ${p.region ?? ""} ${p.city ?? ""} ${p.tags.join(" ")}`.toLowerCase(); if (!hay.includes(needle)) return false }
      return true
    })
  }, [places, q, level, cat])

  const counters = useMemo(() => ({
    registrados: places.filter((p) => p.status === "published").length,
    oficiales: oficiales.length,
    comunidad: places.filter((p) => p.authorityLevel === "community" && p.status === "published").length,
    territorios: countTerritories(places.filter((p) => p.status === "published")),
  }), [places, oficiales])

  const closeDetailAndReload = useCallback(() => { setSelected(null); reload() }, [reload])

  return (
    <>
      <LugaresCard onClick={() => setOpen(true)} product={product} count={counters.registrados} />
      {open && createPortal(
        <Overlay onClose={() => setOpen(false)}>
          <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>
            <div style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(1.3rem,4vw,2.4rem) clamp(1rem,4vw,1.8rem) 4rem" }}>
              <p style={kicker}>Mapa Cósmico de la Red</p>
              <h2 style={title}>Lugares de Contacto</h2>
              <p style={{ margin: "1rem 0 0", fontSize: "0.95rem", lineHeight: 1.78, color: "#c6cbe6" }}>
                Hay territorios donde la memoria parece respirar más cerca de la superficie. Montañas, desiertos,
                lagunas, cuevas, templos antiguos y zonas de silencio han sido reconocidos por distintas tradiciones
                como puntos de contacto, custodia y activación.
              </p>
              <p style={{ margin: "0.7rem 0 0", fontSize: "0.9rem", lineHeight: 1.7, color: "#9297bb" }}>
                Este mapa reúne lugares registrados por la administración y puntos compartidos por la comunidad. Cada
                registro es una semilla de memoria territorial, una invitación al discernimiento y una forma de
                reconocer cómo la Red se expresa en la Tierra.
              </p>

              <div style={{ marginTop: "1.4rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: "0.6rem" }}>
                {[
                  { l: "Lugares registrados", v: counters.registrados },
                  { l: "Puntos oficiales", v: counters.oficiales },
                  { l: "Aportes de comunidad", v: counters.comunidad },
                  { l: "Territorios", v: counters.territorios },
                ].map((c) => (
                  <div key={c.l} style={{ textAlign: "center", padding: "0.8rem 0.5rem", borderRadius: 12, border: "1px solid rgba(167,139,202,0.22)", background: "rgba(10,11,26,0.5)" }}>
                    <div style={{ fontFamily: "var(--font-cinzel,serif)", fontWeight: 800, fontSize: "1.5rem", color: GOLD }}>{c.v}</div>
                    <div style={{ marginTop: 2, fontSize: "0.54rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8b90b4", fontFamily: "var(--font-mono,monospace)" }}>{c.l}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "1.4rem", display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                <button type="button" onClick={() => setView("mapa")} style={tabBtn(view === "mapa")}><Globe2 size={14} /> Explorar mapa</button>
                <button type="button" onClick={() => setView("oficiales")} style={tabBtn(view === "oficiales")}><Shield size={14} /> Lugares oficiales</button>
                <button type="button" onClick={() => setView("anadir")} style={tabBtn(view === "anadir")}><Plus size={14} /> Añadir punto local</button>
                <button type="button" onClick={() => setView("mis")} style={tabBtn(view === "mis")}><Bookmark size={14} /> Mis registros</button>
              </div>

              {isAdmin && pendientesCount > 0 && (
                <button type="button" onClick={() => { setView("mapa"); setLevel("pending") }}
                  style={{ marginTop: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.9rem", borderRadius: 999, border: "1px solid rgba(217,184,102,0.5)", background: "rgba(217,184,102,0.1)", color: GOLD, fontFamily: "var(--font-mono,monospace)", fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                  <Shield size={13} /> {pendientesCount} pendiente{pendientesCount === 1 ? "" : "s"} de revisión · moderar
                </button>
              )}

              <div style={{ marginTop: "1.4rem" }}>
                {(view === "mapa" || view === "oficiales") && (
                  <Filters q={q} setQ={setQ} level={level} setLevel={setLevel} cat={cat} setCat={setCat} isAdmin={isAdmin} />
                )}
                {loading && places.length === 0 && (
                  <p style={{ marginTop: "1.2rem", textAlign: "center", color: "#8b90b4", fontSize: "0.86rem" }}><Loader2 size={14} className="animate-spin" style={{ display: "inline", verticalAlign: "middle" }} /> Cargando lugares…</p>
                )}
                {view === "mapa" && (
                  <div style={{ marginTop: "1rem" }}>
                    <ContactPlacesMap places={filtered} selectedId={selected?.id ?? null} onSelect={setSelected} view={mapView} onToggleView={setMapView} />
                  </div>
                )}
                {view === "oficiales" && <PlaceList places={filtered.filter((p) => p.authorityLevel === "official" || p.authorityLevel === "featured")} onSelect={setSelected} />}
                {view === "anadir" && <SubmitForm onDone={() => { setView("mapa"); reload() }} />}
                {view === "mis" && <MisRegistros places={places} onSelect={setSelected} />}
              </div>

              <p style={{ marginTop: "2.2rem", padding: "0.9rem 1rem", borderRadius: 12, border: "1px solid rgba(167,139,202,0.18)", background: "rgba(10,11,26,0.4)", fontSize: "0.78rem", lineHeight: 1.6, color: "#8b90b4" }}>
                Este mapa reúne registros administrativos y aportes comunitarios. Cada punto debe ser explorado con
                respeto, discernimiento y cuidado del territorio. La presencia de un lugar en el mapa no obliga a creer
                ni a visitar; invita a investigar, sentir, contrastar y actuar con responsabilidad.
              </p>
            </div>
          </div>
        </Overlay>,
        document.body,
      )}

      {selected && createPortal(
        <DetailPanel place={selected} isAdmin={isAdmin} onClose={() => setSelected(null)} onModerated={closeDetailAndReload} />,
        document.body,
      )}
    </>
  )
}

// ── Tarjeta ─────────────────────────────────────────────────────────────
function LugaresCard({ onClick, product, count }: { onClick: () => void; product: DbProduct | null; count: number }) {
  const cover = product?.media_url || null
  const isVid = !!cover && /\.(mp4|webm|mov)(\?|$)/i.test(cover)
  const titulo = product?.name?.trim() || "Lugares de Contacto"
  return (
    <button type="button" onClick={onClick} className={prod.card} style={{ cursor: "pointer" }}>
      <div className={prod.thumb}>
        {cover ? (
          isVid ? <video src={cover} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline loop autoPlay />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={cover} alt={titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(120% 90% at 50% 18%, rgba(167,139,202,0.5) 0%, rgba(60,44,110,0.4) 42%, rgba(12,10,28,0.9) 100%)" }}>
            <div aria-hidden style={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(230,207,149,0.32), transparent 68%)" }} />
            <Globe2 size={52} strokeWidth={1.3} style={{ color: GOLD, filter: "drop-shadow(0 0 14px rgba(217,184,102,0.55))", position: "relative" }} />
          </div>
        )}
      </div>
      <div className={prod.body}>
        <h3 className={prod.name} style={{ color: "#F3F6FA" }}>{titulo}</h3>
        <p style={{ margin: 0, fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: VIOLET, fontFamily: "var(--font-mono,monospace)" }}>Mapa Cósmico de la Red</p>
        <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#a8a8c0", lineHeight: 1.45 }}>{product?.description?.trim() || "Explora lugares sagrados, puntos de contacto y nodos de la Red planetaria."}</p>
        <div className={prod.footer} style={{ marginTop: "0.75rem" }}><span className={prod.access} style={{ color: GOLD }}>{count} lugares · Explorar</span></div>
      </div>
    </button>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[600] flex items-start justify-center sm:items-center" style={{ background: "rgba(4,5,12,0.9)", backdropFilter: "blur(6px)", padding: "calc(env(safe-area-inset-top,0px) + 16px) 12px calc(env(safe-area-inset-bottom,0px) + 16px)", overscrollBehavior: "contain" }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative flex w-[min(900px,calc(100vw-24px))] flex-col overflow-hidden" style={{ maxHeight: "calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 32px)", borderRadius: 18, border: "1px solid rgba(167,139,202,0.3)", background: "linear-gradient(160deg, rgba(20,18,46,0.98), rgba(8,9,20,0.98))", boxShadow: "0 40px 90px -20px rgba(0,0,0,0.9)" }}>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 z-10 rounded-full p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-white"><X size={20} /></button>
        {children}
      </div>
    </div>
  )
}

function Filters({ q, setQ, level, setLevel, cat, setCat, isAdmin }: {
  q: string; setQ: (v: string) => void
  level: "todos" | "official" | "community" | "pending"; setLevel: (v: "todos" | "official" | "community" | "pending") => void
  cat: string; setCat: (v: string) => void; isAdmin: boolean
}) {
  const levels: { id: typeof level; label: string }[] = [
    { id: "todos", label: "Todos" }, { id: "official", label: "Oficiales" }, { id: "community", label: "Comunidad" },
    ...(isAdmin ? [{ id: "pending" as const, label: "Pendientes" }] : []),
  ]
  return (
    <div>
      <div style={{ position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6a6f92" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar lugar, país, ciudad o etiqueta…" style={{ width: "100%", padding: "0.65rem 0.85rem 0.65rem 2.2rem", borderRadius: 10, border: "1px solid rgba(167,139,202,0.28)", background: "rgba(10,11,26,0.6)", color: "#eef1fb", fontSize: "0.9rem", outline: "none" }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.7rem" }}>
        {levels.map((l) => <button key={l.id} type="button" onClick={() => setLevel(l.id)} style={chip(level === l.id)}>{l.label}</button>)}
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ padding: "0.35rem 0.6rem", borderRadius: 999, border: "1px solid rgba(167,139,202,0.3)", background: "rgba(10,11,26,0.6)", color: VIOLET, fontSize: "0.62rem", fontFamily: "var(--font-mono,monospace)", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
          <option value="">Categoría · todas</option>
          {PLACE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
    </div>
  )
}

function PlaceList({ places, onSelect }: { places: ContactPlace[]; onSelect: (p: ContactPlace) => void }) {
  if (places.length === 0) return <p style={{ marginTop: "1.2rem", textAlign: "center", color: "#8b90b4", fontSize: "0.86rem" }}>No hay lugares para estos filtros.</p>
  return (
    <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: "0.8rem" }}>
      {places.map((p) => {
        const col = categoryColor(p.category)
        const official = p.authorityLevel === "official" || p.authorityLevel === "featured"
        return (
          <button key={p.id} type="button" onClick={() => onSelect(p)} style={{ textAlign: "left", padding: "1rem 1.05rem", borderRadius: 14, border: "1px solid rgba(167,139,202,0.2)", borderLeft: `3px solid ${official ? GOLD : col}`, background: "rgba(10,11,26,0.5)", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><MapPin size={13} style={{ color: col }} /><span style={{ fontFamily: "var(--font-cinzel,serif)", fontWeight: 700, fontSize: "1rem", color: "#fff" }}>{p.name}</span></div>
            <div style={{ marginTop: "0.3rem", fontSize: "0.66rem", letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD_DEEP, fontFamily: "var(--font-mono,monospace)" }}>{p.country}{p.region ? ` · ${p.region}` : ""}</div>
            <div style={{ marginTop: "0.15rem", fontSize: "0.62rem", color: col, fontFamily: "var(--font-mono,monospace)" }}>{categoryLabel(p.category)}</div>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", lineHeight: 1.5, color: "#a8a8c0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.shortDescription}</p>
          </button>
        )
      })}
    </div>
  )
}

function MisRegistros({ places, onSelect }: { places: ContactPlace[]; onSelect: (p: ContactPlace) => void }) {
  const saved = loadSaved()
  const mine = places.filter((p) => p.mine)
  const byId = (id: string) => places.find((p) => p.id === id)
  const savedList = saved.map((s) => ({ s, p: byId(s.placeId) })).filter((x) => x.p) as { s: ReturnType<typeof loadSaved>[number]; p: ContactPlace }[]
  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginTop: "1.2rem" }}><div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: VIOLET, fontFamily: "var(--font-mono,monospace)", marginBottom: "0.6rem" }}>{label}</div>{children}</div>
  )
  const row = (p: ContactPlace, tag: string) => (
    <button key={p.id + tag} type="button" onClick={() => onSelect(p)} style={{ width: "100%", textAlign: "left", padding: "0.7rem 0.9rem", borderRadius: 10, border: "1px solid rgba(167,139,202,0.18)", background: "rgba(10,11,26,0.5)", cursor: "pointer", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
      <span style={{ color: "#eef1fb", fontSize: "0.9rem" }}>{p.name} <span style={{ color: "#6a6f92", fontSize: "0.72rem" }}>· {p.country}</span></span>
      <span style={{ fontSize: "0.56rem", letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD_DEEP, fontFamily: "var(--font-mono,monospace)" }}>{tag}</span>
    </button>
  )
  if (savedList.length === 0 && mine.length === 0) return <p style={{ marginTop: "1.2rem", textAlign: "center", color: "#8b90b4", fontSize: "0.86rem" }}>Aún no tienes registros. Guarda un lugar, marca uno como visitado o añade un punto local.</p>
  return (
    <div>
      {savedList.some((x) => x.s.status === "saved") && <Section label="Guardados">{savedList.filter((x) => x.s.status === "saved").map((x) => row(x.p, "Guardado"))}</Section>}
      {savedList.some((x) => x.s.status === "visited") && <Section label="Visitados">{savedList.filter((x) => x.s.status === "visited").map((x) => row(x.p, "Visitado"))}</Section>}
      {mine.length > 0 && <Section label="Mis aportes">{mine.map((p) => row(p, p.status === "pending_review" ? "Pendiente" : p.status === "published" ? "Publicado" : p.status === "rejected" ? "Rechazado" : "Oculto"))}</Section>}
    </div>
  )
}

// ── Formulario para añadir punto local ─────────────────────────────────────
function SubmitForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: "", country: "", region: "", city: "", category: "comunitario", short: "", why: "", memory: "", tags: "" })
  const [coords, setCoords] = useState<{ lat: number | null; lon: number | null }>({ lat: null, lon: null })
  const [accept, setAccept] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))
  const canSend = f.name.trim().length >= 2 && f.country.trim().length >= 2 && f.short.trim().length >= 4 && accept && !sending

  const onPick = (r: { lat: number; lon: number; country?: string; region?: string; city?: string }) => {
    setCoords({ lat: r.lat, lon: r.lon })
    setF((s) => ({
      ...s,
      country: r.country && COUNTRIES.includes(r.country) ? r.country : (r.country ? "Otro" : s.country),
      region: r.region || s.region,
      city: r.city || s.city,
    }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSend) return
    setSending(true); setErr(null)
    const res = await submitPlace({
      name: f.name, country: f.country, region: f.region, city: f.city,
      latitude: coords.lat, longitude: coords.lon, category: f.category, shortDescription: f.short,
      longDescription: [f.why && `Por qué es importante: ${f.why}`, f.memory && `Memoria/experiencia asociada: ${f.memory}`].filter(Boolean).join("\n\n") || undefined,
      memoryType: f.memory || undefined,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
    })
    setSending(false)
    if (res.ok) setSent(true); else setErr(res.error || "No se pudo enviar")
  }

  if (sent) return (
    <div style={{ marginTop: "1rem", padding: "1.4rem", borderRadius: 14, border: "1px solid rgba(217,184,102,0.4)", background: "rgba(217,184,102,0.06)", textAlign: "center" }}>
      <Check size={26} style={{ color: GOLD }} />
      <p style={{ margin: "0.6rem 0 0", color: "#eef1fb", fontSize: "0.95rem", lineHeight: 1.6 }}>Tu punto fue enviado para revisión. Gracias por contribuir a la cartografía viva de la Red.</p>
      <button type="button" onClick={onDone} style={{ ...goldBtn, marginTop: "1.1rem" }}>Volver al mapa</button>
    </div>
  )

  return (
    <form onSubmit={submit} style={{ marginTop: "0.6rem" }}>
      <Field label="Ubicación exacta" hint="busca o toca el mapa">
        <LocationPicker lat={coords.lat} lon={coords.lon} onPick={onPick} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "0.9rem" }}>
        <Field label="Nombre del lugar" req><input style={input} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Nombre del punto" /></Field>
        <Field label="País" req>
          <select style={input} value={f.country} onChange={(e) => set("country", e.target.value)}>
            <option value="">Selecciona un país…</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Región / estado"><input style={input} value={f.region} onChange={(e) => set("region", e.target.value)} placeholder="Región o estado" /></Field>
        <Field label="Ciudad"><input style={input} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Ciudad (se completa al buscar)" /></Field>
        <Field label="Categoría">
          <select style={input} value={f.category} onChange={(e) => set("category", e.target.value)}>
            {PLACE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Descripción breve" req><input style={input} value={f.short} onChange={(e) => set("short", e.target.value)} placeholder="Descripción del lugar" /></Field>
      <Field label="¿Por qué consideras importante este punto?"><textarea style={{ ...input, minHeight: 60, resize: "vertical" }} value={f.why} onChange={(e) => set("why", e.target.value)} /></Field>
      <Field label="¿Qué experiencia o memoria asocias con este lugar?"><textarea style={{ ...input, minHeight: 60, resize: "vertical" }} value={f.memory} onChange={(e) => set("memory", e.target.value)} /></Field>
      <Field label="Etiquetas" hint="separadas por coma"><input style={input} value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="contacto, montaña, memoria" /></Field>

      <label style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", marginTop: "0.4rem", cursor: "pointer" }}>
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} style={{ marginTop: 3 }} />
        <span style={{ fontSize: "0.8rem", color: "#c6cbe6", lineHeight: 1.5 }}>Acepto que este punto será revisado antes de publicarse.</span>
      </label>
      {err && <p style={{ margin: "0.7rem 0 0", fontSize: "0.8rem", color: "#fca5a5" }}>{err}</p>}
      <button type="submit" disabled={!canSend} style={{ ...goldBtn, width: "100%", justifyContent: "center", marginTop: "1.1rem", opacity: canSend ? 1 : 0.45, cursor: canSend ? "pointer" : "not-allowed" }}>
        {sending ? <><Loader2 size={15} className="animate-spin" /> Enviando…</> : <><Plus size={15} /> Enviar punto para revisión</>}
      </button>
    </form>
  )
}

// ── Ficha del lugar ─────────────────────────────────────────────────────────
function DetailPanel({ place, isAdmin, onClose, onModerated }: { place: ContactPlace; isAdmin: boolean; onClose: () => void; onModerated: () => void }) {
  const [, force] = useState(0)
  const refresh = () => force((n) => n + 1)
  const sv = savedStatus(place.id)
  const official = place.authorityLevel === "official" || place.authorityLevel === "featured"
  const col = categoryColor(place.category)
  const [showTestimony, setShowTestimony] = useState(false)
  const levelBadge = official ? (place.authorityLevel === "featured" ? "Destacado" : "Oficial") : place.status === "pending_review" ? "Pendiente" : "Comunidad"

  useEffect(() => { const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev } }, [])
  const testimonies = loadTestimonies(place.id).filter((t) => !t.isPrivate)

  return (
    <div className="fixed inset-0 z-[650] flex items-end justify-center sm:items-center" style={{ background: "rgba(4,5,12,0.75)", backdropFilter: "blur(4px)", padding: "0 0 env(safe-area-inset-bottom,0px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative flex w-full flex-col overflow-hidden sm:w-[min(560px,calc(100vw-24px))]" style={{ maxHeight: "88dvh", borderTopLeftRadius: 20, borderTopRightRadius: 20, border: "1px solid rgba(167,139,202,0.3)", background: "linear-gradient(160deg, rgba(22,20,48,0.99), rgba(8,9,20,0.99))", boxShadow: "0 -20px 80px -10px rgba(0,0,0,0.9)" }}>
        <div style={{ padding: "1.2rem 1.3rem 0.8rem", borderBottom: "1px solid rgba(167,139,202,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.8rem" }}>
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.56rem", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-mono,monospace)", color: official ? GOLD : col }}>
                {official && <Shield size={11} />}{levelBadge}
              </span>
              <h3 style={{ margin: "0.35rem 0 0", fontFamily: "var(--font-cinzel,serif)", fontWeight: 800, fontSize: "1.4rem", color: "#fff", lineHeight: 1.15 }}>{place.name}</h3>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", letterSpacing: "0.06em", color: GOLD_DEEP, fontFamily: "var(--font-mono,monospace)" }}>{place.country}{place.region ? ` · ${place.region}` : ""}{place.city ? ` · ${place.city}` : ""}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-full p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-white"><X size={18} /></button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ padding: "1.1rem 1.3rem 1.4rem", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>
          <MetaRow label="Categoría" value={categoryLabel(place.category)} color={col} />
          {place.latitude != null && place.longitude != null && <MetaRow label="Coordenadas" value={`${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)}`} />}
          {place.createdBy && <MetaRow label="Registrado por" value={place.createdBy} />}
          <p style={{ margin: "0.9rem 0 0", fontSize: "0.92rem", lineHeight: 1.7, color: "#e6e9f7" }}>{place.shortDescription}</p>
          {place.longDescription && <p style={{ margin: "0.7rem 0 0", fontSize: "0.9rem", lineHeight: 1.7, color: "#c6cbe6", whiteSpace: "pre-wrap" }}>{place.longDescription}</p>}
          {place.visitRecommendations && <p style={{ margin: "0.8rem 0 0", padding: "0.7rem 0.9rem", borderLeft: `2px solid ${GOLD}`, borderRadius: 8, background: "rgba(217,184,102,0.06)", fontSize: "0.85rem", lineHeight: 1.6, color: "#eef1fb" }}><b style={{ color: GOLD }}>Recomendaciones de visita:</b> {place.visitRecommendations}</p>}
          {place.tags.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.9rem" }}>{place.tags.map((t) => <span key={t} style={{ fontSize: "0.62rem", padding: "0.2rem 0.55rem", borderRadius: 999, border: "1px solid rgba(167,139,202,0.3)", color: VIOLET, fontFamily: "var(--font-mono,monospace)" }}>#{t}</span>)}</div>}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1.3rem" }}>
            <button type="button" onClick={() => { setSaved(place.id, "saved"); refresh() }} style={actBtn(sv?.status === "saved")}>{sv?.status === "saved" ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} Guardar</button>
            <button type="button" onClick={() => { setSaved(place.id, "visited"); refresh() }} style={actBtn(sv?.status === "visited")}><Footprints size={14} /> He visitado</button>
            <button type="button" onClick={() => setShowTestimony((v) => !v)} style={actBtn(showTestimony)}><MessageSquarePlus size={14} /> Añadir testimonio</button>
          </div>
          {showTestimony && <TestimonyForm place={place} onDone={() => { setShowTestimony(false); refresh() }} />}
          {testimonies.length > 0 && (
            <div style={{ marginTop: "1.4rem" }}>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: VIOLET, fontFamily: "var(--font-mono,monospace)", marginBottom: "0.5rem" }}>Testimonios compartidos</div>
              {testimonies.map((t) => <div key={t.id} style={{ padding: "0.7rem 0.9rem", borderRadius: 10, border: "1px solid rgba(167,139,202,0.16)", background: "rgba(10,11,26,0.5)", marginBottom: "0.5rem" }}>{t.title && <div style={{ fontWeight: 600, color: "#eef1fb", fontSize: "0.85rem" }}>{t.title}</div>}<p style={{ margin: t.title ? "0.25rem 0 0" : 0, fontSize: "0.85rem", lineHeight: 1.6, color: "#c6cbe6", whiteSpace: "pre-wrap" }}>{t.testimony}</p></div>)}
            </div>
          )}
          {isAdmin && <AdminTools place={place} official={official} onModerated={onModerated} />}
        </div>
      </div>
    </div>
  )
}

function TestimonyForm({ place, onDone }: { place: ContactPlace; onDone: () => void }) {
  const [text, setText] = useState(""); const [share, setShare] = useState(false); const [toBitacora, setToBitacora] = useState(true)
  const save = () => {
    if (text.trim().length < 4) return
    addTestimony({ placeId: place.id, testimony: text, isPrivate: !share })
    if (toBitacora) upsertAnswer({ category: "lugares", source: "lugares", sourceLabel: "Lugares de Contacto", prompt: `${place.name} · ${place.country}`, answer: `Lugar: ${place.name} (${place.country})\nCategoría: ${categoryLabel(place.category)}\nFecha: ${new Date().toLocaleDateString("es")}\nCompartido con la comunidad: ${share ? "sí (pendiente de revisión)" : "no"}\n\nTestimonio / experiencia:\n${text.trim()}`, isPrivate: !share })
    onDone()
  }
  return (
    <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: 12, border: "1px solid rgba(167,139,202,0.22)", background: "rgba(10,11,26,0.5)" }}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Tu testimonio, experiencia o práctica en este lugar…" style={{ ...input, minHeight: 80, resize: "vertical" }} />
      <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.6rem", cursor: "pointer", fontSize: "0.78rem", color: "#c6cbe6" }}><input type="checkbox" checked={toBitacora} onChange={(e) => setToBitacora(e.target.checked)} /> <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><BookmarkPlus size={13} /> Guardar en Mi Gran Bitácora</span></label>
      <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.4rem", cursor: "pointer", fontSize: "0.78rem", color: "#c6cbe6" }}><input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} /> Compartir con la comunidad (pasa por revisión)</label>
      <p style={{ margin: "0.5rem 0 0", fontSize: "0.66rem", color: "#6a6f92" }}>Por defecto tu registro es privado. Solo se publica si eliges compartir y pasa revisión.</p>
      <button type="button" onClick={save} disabled={text.trim().length < 4} style={{ ...goldBtn, width: "100%", justifyContent: "center", marginTop: "0.8rem", opacity: text.trim().length < 4 ? 0.45 : 1 }}><Check size={14} /> Guardar testimonio</button>
    </div>
  )
}

function AdminTools({ place, official, onModerated }: { place: ContactPlace; official: boolean; onModerated: () => void }) {
  const [busy, setBusy] = useState(false)
  const act = async (fn: () => Promise<boolean>) => { setBusy(true); await fn(); setBusy(false); onModerated() }
  if (official && place.id.startsWith("seed_")) return (
    <div style={adminBox}><div style={adminTitle}><Shield size={12} /> Admin · punto oficial (semilla local)</div><p style={{ margin: 0, fontSize: "0.72rem", color: "#8b90b4" }}>Este punto viene de la semilla local (sin conexión a la base). Corre el SQL contact_places.sql para gestionarlos desde el servidor.</p></div>
  )
  return (
    <div style={adminBox}>
      <div style={adminTitle}><Shield size={12} /> Moderación (admin){busy && <Loader2 size={12} className="animate-spin" />}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {place.status === "pending_review" && <button type="button" disabled={busy} onClick={() => act(() => moderatePlace(place.id, { status: "published", authorityLevel: "community" }))} style={adminBtn(GOLD)}>Aprobar</button>}
        <button type="button" disabled={busy} onClick={() => act(() => moderatePlace(place.id, { status: "published", authorityLevel: "featured" }))} style={adminBtn(GOLD)}>Destacar</button>
        <button type="button" disabled={busy} onClick={() => act(() => moderatePlace(place.id, { status: "hidden" }))} style={adminBtn(VIOLET)}>Ocultar</button>
        <button type="button" disabled={busy} onClick={() => act(() => moderatePlace(place.id, { status: "rejected" }))} style={adminBtn(VIOLET)}>Rechazar</button>
        <button type="button" disabled={busy} onClick={() => { if (confirm(`¿Eliminar "${place.name}"?`)) act(() => deletePlace(place.id)) }} style={adminBtn("#e88")}>Eliminar</button>
      </div>
    </div>
  )
}

// ── piezas UI ─────────────────────────────────────────────────────────────
function Field({ label, hint, req, children }: { label: string; hint?: string; req?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginTop: "1rem" }}>
      <span style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: VIOLET, fontFamily: "var(--font-mono,monospace)" }}>{label}{req && <span style={{ color: GOLD }}> *</span>}{hint && <span style={{ color: "#6a6f92", fontWeight: 400 }}> · {hint}</span>}</span>
      {children}
    </label>
  )
}
function MetaRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", gap: "0.6rem", padding: "0.35rem 0", borderBottom: "1px solid rgba(167,139,202,0.1)", fontSize: "0.8rem" }}>
      <span style={{ minWidth: 110, color: "#6a6f92", fontFamily: "var(--font-mono,monospace)", fontSize: "0.66rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: color || "#e6e9f7", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>{color && <i style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block", boxShadow: `0 0 5px ${color}` }} />}{value}</span>
    </div>
  )
}

const input: React.CSSProperties = { width: "100%", padding: "0.6rem 0.75rem", borderRadius: 10, border: "1px solid rgba(167,139,202,0.28)", background: "rgba(10,11,26,0.6)", color: "#eef1fb", fontSize: "0.9rem", outline: "none", fontFamily: "var(--font-geist-sans,sans-serif)" }
const kicker: React.CSSProperties = { margin: 0, fontFamily: "var(--font-mono,monospace)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: GOLD }
const title: React.CSSProperties = { margin: "0.55rem 0 0", fontFamily: "var(--font-cinzel,serif)", fontWeight: 800, fontSize: "clamp(1.6rem,4.5vw,2.3rem)", lineHeight: 1.08, color: "#fff" }
const goldBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem 1.4rem", borderRadius: 12, border: "1px solid rgba(217,184,102,0.6)", background: "linear-gradient(135deg,#e6cf95,#c9a86b)", color: "#1a1204", fontFamily: "var(--font-mono,monospace)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }
function tabBtn(active: boolean): React.CSSProperties { return { display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.6rem 1rem", borderRadius: 999, border: `1px solid ${active ? "rgba(217,184,102,0.55)" : "rgba(167,139,202,0.3)"}`, background: active ? "linear-gradient(135deg,rgba(230,207,149,0.18),rgba(217,184,102,0.06))" : "transparent", color: active ? GOLD : VIOLET, fontFamily: "var(--font-mono,monospace)", fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" } }
function chip(active: boolean): React.CSSProperties { return { padding: "0.35rem 0.8rem", borderRadius: 999, border: `1px solid ${active ? "rgba(217,184,102,0.5)" : "rgba(167,139,202,0.28)"}`, background: active ? "rgba(217,184,102,0.12)" : "transparent", color: active ? GOLD : "#a8a8c0", fontFamily: "var(--font-mono,monospace)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" } }
function actBtn(active: boolean): React.CSSProperties { return { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 0.9rem", borderRadius: 999, border: `1px solid ${active ? "rgba(217,184,102,0.55)" : "rgba(167,139,202,0.35)"}`, background: active ? "rgba(217,184,102,0.12)" : "transparent", color: active ? GOLD : VIOLET, fontFamily: "var(--font-mono,monospace)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" } }
const adminBox: React.CSSProperties = { marginTop: "1.4rem", padding: "0.9rem 1rem", borderRadius: 12, border: "1px dashed rgba(217,184,102,0.4)", background: "rgba(217,184,102,0.05)" }
const adminTitle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, fontFamily: "var(--font-mono,monospace)", marginBottom: "0.6rem" }
function adminBtn(color: string): React.CSSProperties { return { padding: "0.4rem 0.8rem", borderRadius: 8, border: `1px solid ${color}`, background: "transparent", color, fontFamily: "var(--font-mono,monospace)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" } }
