"use client"

// ContactPlacesMap — mapa real 2D (Leaflet + OSM oscurecido por CSS, sin API key)
// y globo 3D real (globe.gl con textura de la Tierra). Marcadores coloreados por
// CATEGORÍA; los oficiales llevan aro dorado, los pendientes van punteados.
// LocationPicker: mini-mapa para elegir la ubicación exacta (con buscador).

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"
import { Globe2, Map as MapIcon, Crosshair } from "lucide-react"
import { project, placeColor, placeTipo, tipoLabel, TIPOS, type ContactPlace } from "../_lib/lugares-data"

const GOLD = "#e6cf95"
const VIOLET = "#a78bca"
const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
const DARK_FILTER = "invert(1) hue-rotate(185deg) brightness(0.92) contrast(0.9) saturate(0.75)"

type Plotted = ContactPlace & { latitude: number; longitude: number }
function isOfficial(p: ContactPlace) { return p.authorityLevel === "official" || p.authorityLevel === "featured" }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadLeaflet(): Promise<any> { const mod = await import("leaflet"); return (mod as any).default ?? mod }

export function ContactPlacesMap({
  places, selectedId, onSelect, view, onToggleView,
}: {
  places: ContactPlace[]; selectedId: string | null; onSelect: (p: ContactPlace) => void
  view: "map" | "globe"; onToggleView: (v: "map" | "globe") => void
}) {
  const plotted = places.filter((p) => p.latitude != null && p.longitude != null) as Plotted[]
  return (
    <div>
      <MapStyles />
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.7rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => onToggleView("map")} style={viewBtn(view === "map")}><MapIcon size={13} /> Mapa 2D</button>
        <button type="button" onClick={() => onToggleView("globe")} style={viewBtn(view === "globe")}><Globe2 size={13} /> Globo 3D</button>
      </div>

      {view === "globe"
        ? <GlobeView places={plotted} onSelect={onSelect} />
        : <LeafletMap places={plotted} selectedId={selectedId} onSelect={onSelect} />}

      {/* Leyenda por tipo */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 0.85rem", marginTop: "0.7rem", fontSize: "0.6rem", color: "#8b90b4", fontFamily: "var(--font-mono,monospace)" }}>
        {TIPOS.filter((t) => t.id !== "por_revisar").map((t) => (
          <span key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><i style={dot(t.color)} /> {t.label.split(" / ")[0]}</span>
        ))}
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: GOLD }}><i style={{ ...dot("transparent"), border: `2px solid ${GOLD}`, boxShadow: `0 0 6px ${GOLD}` }} /> Aro dorado = oficial</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><i style={{ ...dot("transparent"), border: `1.5px dashed ${VIOLET}` }} /> Punteado = pendiente</span>
      </div>
    </div>
  )
}

const MAP_WRAP: React.CSSProperties = {
  position: "relative", width: "100%", height: "min(62vh, 460px)", minHeight: 300,
  borderRadius: 14, overflow: "hidden", border: "1px solid rgba(167,139,202,0.25)", background: "#06060f",
}

function MapStyles() {
  return (
    <style>{`
      .cp-map .leaflet-tile{filter:${DARK_FILTER}}
      .leaflet-container{background:#06060f;font-family:var(--font-geist-sans,sans-serif)}
      .leaflet-control-attribution{background:rgba(6,6,15,0.7)!important;color:#6a6f92!important}
      .leaflet-control-attribution a{color:#8b90b4!important}
      .leaflet-bar a{background:#14122c!important;color:#c6cbe6!important;border-color:rgba(167,139,202,0.25)!important}
      .leaflet-bar a:hover{background:#221c40!important}
      .cp-tip{background:#14122c;border:1px solid rgba(217,184,102,0.4);color:#eef1fb;border-radius:8px;font-size:0.72rem;box-shadow:0 6px 20px rgba(0,0,0,0.6)}
      .cp-tip::before{border-top-color:rgba(217,184,102,0.4)}
    `}</style>
  )
}

// ── 2D: Leaflet + OSM oscurecido ────────────────────────────────────────
function LeafletMap({ places, selectedId, onSelect }: { places: Plotted[]; selectedId: string | null; onSelect: (p: ContactPlace) => void }) {
  const elRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null); const layerRef = useRef<any>(null); const LRef = useRef<any>(null)
  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const L = await loadLeaflet()
        if (cancelled || !elRef.current || mapRef.current) return
        LRef.current = L
        const map = L.map(elRef.current, { center: [8, -30], zoom: 2, minZoom: 1, worldCopyJump: true })
        L.tileLayer(OSM_URL, { subdomains: "abc", maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map)
        mapRef.current = map
        layerRef.current = L.layerGroup().addTo(map)
        renderMarkers()
      } catch { if (!cancelled) setFailed(true) }
    })()
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { renderMarkers() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [places, selectedId])

  // Centra el mapa en el punto seleccionado (al elegirlo desde el buscador).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const p = places.find((x) => x.id === selectedId)
    if (p) { try { map.flyTo([p.latitude, p.longitude], Math.max(map.getZoom(), 5), { duration: 0.8 }) } catch { /* noop */ } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  function renderMarkers() {
    const L = LRef.current, layer = layerRef.current
    if (!L || !layer) return
    layer.clearLayers()
    // Chakras planetarios → halos continentales amplios (debajo de los puntos).
    for (const p of places) {
      if (p.tipoPrincipal !== "chakra" || !p.chakra || p.latitude == null || p.longitude == null) continue
      const c = L.circle([p.latitude, p.longitude], {
        radius: p.chakra.radioKm * 1000, color: p.chakra.color, weight: 1, opacity: 0.4,
        fillColor: p.chakra.color, fillOpacity: p.id === selectedId ? 0.16 : 0.09,
      })
      c.bindTooltip(`${p.name}`, { direction: "top", className: "cp-tip" })
      c.on("click", () => onSelectRef.current(p))
      c.addTo(layer)
    }
    // Puntos.
    for (const p of places) {
      if (p.tipoPrincipal === "chakra" || p.latitude == null || p.longitude == null) continue
      const official = isOfficial(p)
      const pending = p.status === "pending_review"
      const fill = placeColor(p)
      const stroke = official ? GOLD : fill
      const sel = p.id === selectedId
      const m = L.circleMarker([p.latitude, p.longitude], {
        radius: sel ? 9 : official ? 7 : 6,
        color: stroke, weight: official ? 2.5 : pending ? 2 : 1.4,
        fillColor: fill, fillOpacity: pending ? 0.15 : 0.85, dashArray: pending ? "3 3" : undefined,
      })
      m.bindTooltip(`${p.name} · ${tipoLabel(placeTipo(p))}`, { direction: "top", offset: [0, -6], className: "cp-tip" })
      m.on("click", () => onSelectRef.current(p))
      m.addTo(layer)
    }
  }

  if (failed) return <FallbackMap places={places} selectedId={selectedId} onSelect={onSelect} />
  return <div className="cp-map" style={MAP_WRAP}><div ref={elRef} style={{ position: "absolute", inset: 0 }} /></div>
}

// ── LocationPicker — marcar la ubicación tocando el mapa (para añadir punto) ──
export function LocationPicker({ lat, lon, onPick }: {
  lat: number | null; lon: number | null; onPick: (r: { lat: number; lon: number }) => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null); const markerRef = useRef<any>(null); const LRef = useRef<any>(null)
  const onPickRef = useRef(onPick); onPickRef.current = onPick

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const L = await loadLeaflet()
        if (cancelled || !elRef.current || mapRef.current) return
        LRef.current = L
        const map = L.map(elRef.current, { center: [lat ?? 8, lon ?? -30], zoom: lat != null ? 6 : 2, minZoom: 1 })
        L.tileLayer(OSM_URL, { subdomains: "abc", maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map)
        mapRef.current = map
        if (lat != null && lon != null) setMarker(lat, lon)
        map.on("click", (e: { latlng: { lat: number; lng: number } }) => { setMarker(e.latlng.lat, e.latlng.lng); onPickRef.current({ lat: e.latlng.lat, lon: e.latlng.lng }) })
      } catch { /* noop */ }
    })()
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setMarker(la: number, lo: number) {
    const L = LRef.current, map = mapRef.current
    if (!L || !map) return
    if (markerRef.current) markerRef.current.setLatLng([la, lo])
    else markerRef.current = L.circleMarker([la, lo], { radius: 8, color: GOLD, weight: 2.5, fillColor: GOLD, fillOpacity: 0.85 }).addTo(map)
  }

  return (
    <div>
      <MapStyles />
      <div className="cp-map" style={{ ...MAP_WRAP, height: 260, minHeight: 220 }}><div ref={elRef} style={{ position: "absolute", inset: 0 }} /></div>
      <p style={{ margin: "0.4rem 0 0", fontSize: "0.68rem", color: "#8b90b4", fontFamily: "var(--font-mono,monospace)", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
        <Crosshair size={12} /> Arrastra el mapa y toca para marcar la ubicación exacta{lat != null && lon != null ? ` · ${lat.toFixed(3)}, ${lon.toFixed(3)}` : ""}
      </p>
    </div>
  )
}

// ── 3D: globe.gl ─────────────────────────────────────────────────────────
function GlobeView({ places, onSelect }: { places: Plotted[]; onSelect: (p: ContactPlace) => void }) {
  const elRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false; let ro: ResizeObserver | null = null
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
          .width(w).height(h).backgroundColor("rgba(0,0,0,0)")
          .showGlobe(true).globeImageUrl("/textures/earth-night.jpg")
          .showAtmosphere(true).atmosphereColor("#a78bca").atmosphereAltitude(0.18)
          .pointsData(pointData(places))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .pointColor((d: any) => d.color)
          .pointAltitude(0.035)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .pointRadius((d: any) => (d.official ? 0.55 : 0.4))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .pointLabel((d: any) => `${d.place.name} · ${d.place.country}`)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .onPointClick((d: any) => onSelectRef.current(d.place))
        g.controls().autoRotate = true; g.controls().autoRotateSpeed = 0.6; g.controls().enableZoom = true
        g.pointOfView({ lat: 8, lng: -40, altitude: 2.4 })
        globeRef.current = g
        ro = new ResizeObserver(() => { const { w, h } = size(); g.width(w).height(h) }); ro.observe(el)
      } catch { if (!cancelled) setFailed(true) }
    })()
    return () => {
      cancelled = true; if (ro) ro.disconnect()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g: any = globeRef.current
      if (g && typeof g._destructor === "function") { try { g._destructor() } catch { /* noop */ } }
      if (elRef.current) elRef.current.innerHTML = ""
      globeRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { if (globeRef.current) globeRef.current.pointsData(pointData(places)) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [places])

  if (failed) return <GlobeFallback count={places.length} />
  return <div style={{ ...MAP_WRAP, background: "radial-gradient(70% 90% at 50% 40%, rgba(30,22,60,0.6) 0%, #06060f 70%)" }}><div ref={elRef} style={{ position: "absolute", inset: 0 }} /></div>
}
function pointData(places: Plotted[]) {
  return places.map((p) => ({ lat: p.latitude, lng: p.longitude, official: isOfficial(p), color: placeColor(p), place: p }))
}

// ── Fallbacks ─────────────────────────────────────────────────────────────
function FallbackMap({ places, selectedId, onSelect }: { places: Plotted[]; selectedId: string | null; onSelect: (p: ContactPlace) => void }) {
  return (
    <div style={{ ...MAP_WRAP, aspectRatio: "2 / 1", height: "auto", background: "radial-gradient(120% 120% at 50% 0%, rgba(46,34,80,0.5) 0%, rgba(10,11,26,0.9) 55%, #06060f 100%)" }}>
      <svg viewBox="0 0 360 180" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>
        {Array.from({ length: 11 }, (_, i) => (i + 1) * 30).map((x) => <line key={x} x1={x} y1={0} x2={x} y2={180} stroke="rgba(167,139,202,0.08)" strokeWidth={0.4} />)}
        {Array.from({ length: 5 }, (_, i) => (i + 1) * 30).map((y) => <line key={y} x1={0} y1={y} x2={360} y2={y} stroke="rgba(167,139,202,0.08)" strokeWidth={0.4} />)}
      </svg>
      {places.map((p) => { const { x, y } = project(p.latitude, p.longitude); const c = placeColor(p)
        return <button key={p.id} type="button" onClick={() => onSelect(p)} title={`${p.name} · ${tipoLabel(placeTipo(p))}`}
          style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", width: p.id === selectedId ? 18 : 13, height: p.id === selectedId ? 18 : 13, borderRadius: "50%", cursor: "pointer", border: `1.5px solid ${isOfficial(p) ? GOLD : c}`, background: `radial-gradient(circle, ${c}, transparent 72%)`, boxShadow: `0 0 8px ${c}`, padding: 0 }} />
      })}
    </div>
  )
}
function GlobeFallback({ count }: { count: number }) {
  return (
    <div style={{ ...MAP_WRAP, aspectRatio: "2 / 1", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "0.6rem", background: "radial-gradient(60% 90% at 50% 50%, rgba(46,34,80,0.6) 0%, rgba(10,11,26,0.95) 60%, #06060f 100%)" }}>
      <div aria-hidden style={{ width: "40%", aspectRatio: "1", borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, rgba(167,139,202,0.5), rgba(60,44,110,0.35) 55%, rgba(10,11,26,0.9) 100%)", boxShadow: "0 0 60px -10px rgba(167,139,202,0.5)" }} />
      <p style={{ margin: 0, fontFamily: "var(--font-mono,monospace)", fontSize: "0.62rem", letterSpacing: "0.24em", textTransform: "uppercase", color: GOLD }}>Globo 3D no disponible</p>
      <p style={{ margin: 0, fontSize: "0.78rem", color: "#9297bb", maxWidth: "40ch", lineHeight: 1.5 }}>No se pudo cargar el globo ({count} puntos). Usa el mapa 2D.</p>
    </div>
  )
}

function viewBtn(active: boolean): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", borderRadius: 999, border: `1px solid ${active ? "rgba(217,184,102,0.6)" : "rgba(167,139,202,0.3)"}`, background: active ? "linear-gradient(135deg,rgba(230,207,149,0.2),rgba(217,184,102,0.08))" : "transparent", color: active ? GOLD : VIOLET, fontFamily: "var(--font-mono,monospace)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }
}
function dot(color: string): React.CSSProperties {
  return { display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: color !== "transparent" ? `0 0 5px ${color}` : "none", flexShrink: 0 }
}
