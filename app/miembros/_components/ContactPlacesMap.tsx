"use client"

// ContactPlacesMap — mapa real 2D (Leaflet, tiles oscuros) + globo 3D real
// (globe.gl). Ambas librerías se cargan dinámicamente en el cliente (code-split)
// y se sirven desde el mismo origen (permitido por la CSP). Fallback a un mapa
// SVG si alguna no carga. Marcadores oficiales dorados / comunitarios violetas.

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"
import { Globe2, Map as MapIcon } from "lucide-react"
import { project, type ContactPlace } from "../_lib/lugares-data"

const GOLD = "#e6cf95"
const VIOLET = "#a78bca"

type Plotted = ContactPlace & { latitude: number; longitude: number }
function isOfficial(p: ContactPlace) { return p.authorityLevel === "official" || p.authorityLevel === "featured" }

export function ContactPlacesMap({
  places, selectedId, onSelect, view, onToggleView,
}: {
  places: ContactPlace[]
  selectedId: string | null
  onSelect: (p: ContactPlace) => void
  view: "map" | "globe"
  onToggleView: (v: "map" | "globe") => void
}) {
  const plotted = places.filter((p) => p.latitude != null && p.longitude != null) as Plotted[]

  return (
    <div>
      <style>{`
        .leaflet-container{background:#06060f;font-family:var(--font-geist-sans,sans-serif)}
        .leaflet-control-attribution{background:rgba(6,6,15,0.7)!important;color:#6a6f92!important}
        .leaflet-control-attribution a{color:#8b90b4!important}
        .leaflet-bar a{background:#14122c!important;color:#c6cbe6!important;border-color:rgba(167,139,202,0.25)!important}
        .leaflet-bar a:hover{background:#221c40!important}
        .cp-tip{background:#14122c;border:1px solid rgba(217,184,102,0.4);color:#eef1fb;border-radius:8px;font-size:0.72rem;box-shadow:0 6px 20px rgba(0,0,0,0.6)}
        .cp-tip::before{border-top-color:rgba(217,184,102,0.4)}
      `}</style>
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.7rem" }}>
        <button type="button" onClick={() => onToggleView("map")} style={viewBtn(view === "map")}>
          <MapIcon size={13} /> Mapa 2D
        </button>
        <button type="button" onClick={() => onToggleView("globe")} style={viewBtn(view === "globe")}>
          <Globe2 size={13} /> Globo 3D
        </button>
      </div>

      {view === "globe"
        ? <GlobeView places={plotted} onSelect={onSelect} />
        : <LeafletMap places={plotted} selectedId={selectedId} onSelect={onSelect} />}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem", marginTop: "0.7rem", fontSize: "0.66rem", color: "#8b90b4", fontFamily: "var(--font-mono,monospace)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}><i style={dot(GOLD, true)} /> Oficial</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}><i style={dot(VIOLET, false)} /> Comunidad</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}><i style={{ ...dot(VIOLET, false), background: "transparent", border: `1.5px dashed ${VIOLET}` }} /> Pendiente</span>
      </div>
    </div>
  )
}

const MAP_WRAP: React.CSSProperties = {
  position: "relative", width: "100%", height: "min(62vh, 460px)", minHeight: 300,
  borderRadius: 14, overflow: "hidden", border: "1px solid rgba(167,139,202,0.25)",
  background: "#06060f",
}

// ── 2D: Leaflet + tiles oscuros (CARTO) ─────────────────────────────────
function LeafletMap({ places, selectedId, onSelect }: {
  places: Plotted[]; selectedId: string | null; onSelect: (p: ContactPlace) => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const [failed, setFailed] = useState(false)

  // Init una sola vez.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mod = await import("leaflet")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = ((mod as any).default ?? mod)
        if (cancelled || !elRef.current || mapRef.current) return
        LRef.current = L
        const map = L.map(elRef.current, {
          center: [8, -30], zoom: 2, minZoom: 1, worldCopyJump: true,
          zoomControl: true, attributionControl: true,
        })
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          subdomains: "abcd", maxZoom: 19,
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        }).addTo(map)
        mapRef.current = map
        layerRef.current = L.layerGroup().addTo(map)
        renderMarkers()
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redibuja marcadores cuando cambian los lugares o la selección.
  useEffect(() => { renderMarkers() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [places, selectedId])

  function renderMarkers() {
    const L = LRef.current
    const layer = layerRef.current
    if (!L || !layer) return
    layer.clearLayers()
    for (const p of places) {
      const official = isOfficial(p)
      const pending = p.status === "pending_review"
      const color = official ? GOLD : VIOLET
      const sel = p.id === selectedId
      const m = L.circleMarker([p.latitude, p.longitude], {
        radius: sel ? 9 : official ? 7 : 6,
        color, weight: pending ? 2 : 1.5,
        fillColor: color, fillOpacity: pending ? 0.15 : 0.85,
        dashArray: pending ? "3 3" : undefined,
      })
      m.bindTooltip(`${p.name} · ${p.country}`, { direction: "top", offset: [0, -6], className: "cp-tip" })
      m.on("click", () => onSelectRef.current(p))
      m.addTo(layer)
    }
  }

  if (failed) return <FallbackMap places={places} selectedId={selectedId} onSelect={onSelect} />
  return (
    <div style={MAP_WRAP}>
      <div ref={elRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  )
}

// ── 3D: globe.gl (globo cósmico giratorio) ──────────────────────────────
function GlobeView({ places, onSelect }: { places: Plotted[]; onSelect: (p: ContactPlace) => void }) {
  const elRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let ro: ResizeObserver | null = null
    ;(async () => {
      try {
        const mod = await import("globe.gl")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Globe = ((mod as any).default ?? mod)
        if (cancelled || !elRef.current || globeRef.current) return
        const el = elRef.current
        const size = () => ({ w: el.clientWidth || 320, h: el.clientHeight || 320 })
        const { w, h } = size()
        const g = Globe()(el)
          .width(w).height(h)
          .backgroundColor("rgba(0,0,0,0)")
          .showGlobe(true)
          .globeImageUrl("/textures/earth-night.jpg")
          .showAtmosphere(true)
          .atmosphereColor("#a78bca")
          .atmosphereAltitude(0.18)
          .pointsData(pointData(places))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .pointColor((d: any) => (d.official ? GOLD : VIOLET))
          .pointAltitude(0.035)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .pointRadius((d: any) => (d.official ? 0.55 : 0.4))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .pointLabel((d: any) => `${d.place.name} · ${d.place.country}`)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .onPointClick((d: any) => onSelectRef.current(d.place))
        g.controls().autoRotate = true
        g.controls().autoRotateSpeed = 0.6
        g.controls().enableZoom = true
        g.pointOfView({ lat: 8, lng: -40, altitude: 2.4 })
        globeRef.current = g
        ro = new ResizeObserver(() => { const { w, h } = size(); g.width(w).height(h) })
        ro.observe(el)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
      if (ro) ro.disconnect()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g: any = globeRef.current
      if (g && typeof g._destructor === "function") { try { g._destructor() } catch { /* noop */ } }
      if (elRef.current) elRef.current.innerHTML = ""
      globeRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Actualiza puntos si cambian.
  useEffect(() => {
    if (globeRef.current) globeRef.current.pointsData(pointData(places))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places])

  if (failed) return <GlobeFallback count={places.length} />
  return (
    <div style={{ ...MAP_WRAP, background: "radial-gradient(70% 90% at 50% 40%, rgba(30,22,60,0.6) 0%, #06060f 70%)" }}>
      <div ref={elRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  )
}
function pointData(places: Plotted[]) {
  return places.map((p) => ({ lat: p.latitude, lng: p.longitude, official: isOfficial(p), place: p }))
}

// ── Fallbacks (si una librería no carga) ────────────────────────────────
function FallbackMap({ places, selectedId, onSelect }: { places: Plotted[]; selectedId: string | null; onSelect: (p: ContactPlace) => void }) {
  return (
    <div style={{ ...MAP_WRAP, aspectRatio: "2 / 1", height: "auto", background: "radial-gradient(120% 120% at 50% 0%, rgba(46,34,80,0.5) 0%, rgba(10,11,26,0.9) 55%, #06060f 100%)" }}>
      <svg viewBox="0 0 360 180" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>
        {Array.from({ length: 11 }, (_, i) => (i + 1) * 30).map((x) => <line key={x} x1={x} y1={0} x2={x} y2={180} stroke="rgba(167,139,202,0.08)" strokeWidth={0.4} />)}
        {Array.from({ length: 5 }, (_, i) => (i + 1) * 30).map((y) => <line key={y} x1={0} y1={y} x2={360} y2={y} stroke="rgba(167,139,202,0.08)" strokeWidth={0.4} />)}
      </svg>
      {places.map((p) => {
        const { x, y } = project(p.latitude, p.longitude)
        const official = isOfficial(p)
        const color = official ? GOLD : VIOLET
        return <button key={p.id} type="button" onClick={() => onSelect(p)} title={`${p.name} · ${p.country}`}
          style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", width: p.id === selectedId ? 18 : 13, height: p.id === selectedId ? 18 : 13, borderRadius: "50%", cursor: "pointer", border: `1.5px solid ${color}`, background: `radial-gradient(circle, ${color}, transparent 72%)`, boxShadow: `0 0 8px ${color}`, padding: 0 }} />
      })}
    </div>
  )
}
function GlobeFallback({ count }: { count: number }) {
  return (
    <div style={{ ...MAP_WRAP, aspectRatio: "2 / 1", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "0.6rem", background: "radial-gradient(60% 90% at 50% 50%, rgba(46,34,80,0.6) 0%, rgba(10,11,26,0.95) 60%, #06060f 100%)" }}>
      <div aria-hidden style={{ width: "40%", aspectRatio: "1", borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, rgba(167,139,202,0.5), rgba(60,44,110,0.35) 55%, rgba(10,11,26,0.9) 100%)", boxShadow: "0 0 60px -10px rgba(167,139,202,0.5), inset -8px -8px 30px rgba(0,0,0,0.5)", border: "1px solid rgba(217,184,102,0.25)" }} />
      <p style={{ margin: 0, fontFamily: "var(--font-mono,monospace)", fontSize: "0.62rem", letterSpacing: "0.24em", textTransform: "uppercase", color: GOLD }}>Globo 3D no disponible</p>
      <p style={{ margin: 0, fontSize: "0.78rem", color: "#9297bb", maxWidth: "40ch", lineHeight: 1.5 }}>No se pudo cargar el globo ({count} puntos). Usa el mapa 2D mientras tanto.</p>
    </div>
  )
}

function viewBtn(active: boolean): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", borderRadius: 999, border: `1px solid ${active ? "rgba(217,184,102,0.6)" : "rgba(167,139,202,0.3)"}`, background: active ? "linear-gradient(135deg,rgba(230,207,149,0.2),rgba(217,184,102,0.08))" : "transparent", color: active ? GOLD : VIOLET, fontFamily: "var(--font-mono,monospace)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }
}
function dot(color: string, glow: boolean): React.CSSProperties {
  return { display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: glow ? `0 0 6px ${color}` : "none" }
}
