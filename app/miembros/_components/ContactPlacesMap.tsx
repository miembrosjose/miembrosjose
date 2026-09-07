"use client"

// ContactPlacesMap — mapa 2D (FASE 1). Proyección equirectangular sin
// dependencias externas: graticule + siluetas suaves de continentes + marcadores
// luminosos. ContactPlacesGlobe queda como placeholder (FASE 2).

import { Globe2, Map as MapIcon } from "lucide-react"
import { project, categoryLabel, type ContactPlace } from "../_lib/lugares-data"

const GOLD = "#e6cf95"
const VIOLET = "#a78bca"

// Etiquetas de continentes (posición aproximada, solo orientación visual).
const CONTINENTS: { label: string; lat: number; lon: number }[] = [
  { label: "N. AMÉRICA", lat: 45, lon: -100 },
  { label: "S. AMÉRICA", lat: -15, lon: -60 },
  { label: "EUROPA", lat: 52, lon: 15 },
  { label: "ÁFRICA", lat: 2, lon: 20 },
  { label: "ASIA", lat: 45, lon: 90 },
  { label: "OCEANÍA", lat: -25, lon: 134 },
]

export function ContactPlacesMap({
  places, selectedId, onSelect, view, onToggleView,
}: {
  places: ContactPlace[]
  selectedId: string | null
  onSelect: (p: ContactPlace) => void
  view: "map" | "globe"
  onToggleView: (v: "map" | "globe") => void
}) {
  const plotted = places.filter((p) => p.latitude != null && p.longitude != null)

  return (
    <div>
      {/* Conmutador 2D / Globo */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.7rem" }}>
        <button type="button" onClick={() => onToggleView("map")} style={viewBtn(view === "map")}>
          <MapIcon size={13} /> Mapa 2D
        </button>
        <button type="button" onClick={() => onToggleView("globe")} style={viewBtn(view === "globe")}>
          <Globe2 size={13} /> Globo 3D
        </button>
      </div>

      {view === "globe" ? (
        <ContactPlacesGlobe count={plotted.length} />
      ) : (
        <div style={{
          position: "relative", width: "100%", aspectRatio: "2 / 1", borderRadius: 14, overflow: "hidden",
          border: "1px solid rgba(167,139,202,0.25)",
          background: "radial-gradient(120% 120% at 50% 0%, rgba(46,34,80,0.5) 0%, rgba(10,11,26,0.9) 55%, #06060f 100%)",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.6)",
        }}>
          {/* Graticule + siluetas */}
          <svg viewBox="0 0 360 180" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>
            <defs>
              <radialGradient id="cpLand" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(167,139,202,0.16)" />
                <stop offset="100%" stopColor="rgba(167,139,202,0)" />
              </radialGradient>
            </defs>
            {/* Siluetas muy suaves de masas de tierra (orientativas, estilizadas) */}
            {LANDMASSES.map((m, i) => (
              <ellipse key={i} cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry} fill="url(#cpLand)" transform={m.rot ? `rotate(${m.rot} ${m.cx} ${m.cy})` : undefined} />
            ))}
            {/* Meridianos / paralelos cada 30° */}
            {Array.from({ length: 11 }, (_, i) => (i + 1) * 30).map((x) => (
              <line key={`v${x}`} x1={x} y1={0} x2={x} y2={180} stroke="rgba(167,139,202,0.08)" strokeWidth={0.4} />
            ))}
            {Array.from({ length: 5 }, (_, i) => (i + 1) * 30).map((y) => (
              <line key={`h${y}`} x1={0} y1={y} x2={360} y2={y} stroke="rgba(167,139,202,0.08)" strokeWidth={0.4} />
            ))}
            <line x1={0} y1={90} x2={360} y2={90} stroke="rgba(217,184,102,0.22)" strokeWidth={0.5} strokeDasharray="2 2" />
          </svg>

          {/* Etiquetas de continentes */}
          {CONTINENTS.map((c) => {
            const { x, y } = project(c.lat, c.lon)
            return (
              <span key={c.label} style={{
                position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)",
                fontSize: "0.5rem", letterSpacing: "0.18em", color: "rgba(198,203,230,0.35)",
                fontFamily: "var(--font-mono,monospace)", pointerEvents: "none", whiteSpace: "nowrap",
              }}>{c.label}</span>
            )
          })}

          {/* Marcadores */}
          {plotted.map((p) => {
            const { x, y } = project(p.latitude!, p.longitude!)
            const official = p.authorityLevel === "official" || p.authorityLevel === "featured"
            const pending = p.status === "pending_review"
            const sel = p.id === selectedId
            const color = official ? GOLD : VIOLET
            return (
              <button
                key={p.id} type="button" onClick={() => onSelect(p)}
                title={`${p.name} · ${p.country}`}
                style={{
                  position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)",
                  width: sel ? 20 : 14, height: sel ? 20 : 14, borderRadius: "50%", cursor: "pointer",
                  border: pending ? `1.5px dashed ${color}` : `1.5px solid ${color}`,
                  background: pending ? "transparent" : `radial-gradient(circle, ${color} 0%, ${official ? "rgba(217,184,102,0.35)" : "rgba(167,139,202,0.3)"} 60%, transparent 75%)`,
                  boxShadow: official ? `0 0 12px 2px rgba(217,184,102,0.6)` : `0 0 8px 1px rgba(167,139,202,0.45)`,
                  padding: 0, zIndex: sel ? 5 : official ? 3 : 2,
                }}
              />
            )
          })}
        </div>
      )}

      {/* Leyenda */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem", marginTop: "0.7rem", fontSize: "0.66rem", color: "#8b90b4", fontFamily: "var(--font-mono,monospace)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}><i style={dot(GOLD, true)} /> Oficial</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}><i style={dot(VIOLET, false)} /> Comunidad</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}><i style={{ ...dot(VIOLET, false), background: "transparent", border: `1.5px dashed ${VIOLET}` }} /> Pendiente</span>
      </div>
    </div>
  )
}

// FASE 2 — placeholder del globo cósmico. Estructura lista para integrar
// Globe.gl / Three.js más adelante sin tocar el resto del módulo.
export function ContactPlacesGlobe({ count }: { count: number }) {
  return (
    <div style={{
      position: "relative", width: "100%", aspectRatio: "2 / 1", borderRadius: 14, overflow: "hidden",
      border: "1px solid rgba(167,139,202,0.25)",
      background: "radial-gradient(60% 90% at 50% 50%, rgba(46,34,80,0.6) 0%, rgba(10,11,26,0.95) 60%, #06060f 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "0.6rem",
    }}>
      <div aria-hidden style={{
        width: "42%", aspectRatio: "1", borderRadius: "50%",
        background: "radial-gradient(circle at 35% 30%, rgba(167,139,202,0.5), rgba(60,44,110,0.35) 55%, rgba(10,11,26,0.9) 100%)",
        boxShadow: "0 0 60px -10px rgba(167,139,202,0.5), inset -8px -8px 30px rgba(0,0,0,0.5)",
        border: "1px solid rgba(217,184,102,0.25)",
      }} />
      <p style={{ margin: 0, fontFamily: "var(--font-mono,monospace)", fontSize: "0.62rem", letterSpacing: "0.24em", textTransform: "uppercase", color: GOLD }}>
        Vista Globo 3D — próximamente
      </p>
      <p style={{ margin: 0, fontSize: "0.78rem", color: "#9297bb", maxWidth: "40ch", lineHeight: 1.5 }}>
        El planeta giratorio con los {count} puntos luminosos y las capas de Red planetaria llegará en una próxima fase. Por ahora, explora el mapa 2D.
      </p>
    </div>
  )
}

// Blobs orientativos de continentes (estilización, no cartografía precisa).
const LANDMASSES: { cx: number; cy: number; rx: number; ry: number; rot?: number }[] = [
  { cx: 70, cy: 55, rx: 26, ry: 22 },   // N. América
  { cx: 105, cy: 120, rx: 15, ry: 28, rot: -12 }, // S. América
  { cx: 190, cy: 50, rx: 16, ry: 12 },  // Europa
  { cx: 200, cy: 100, rx: 22, ry: 30 }, // África
  { cx: 265, cy: 60, rx: 45, ry: 30 },  // Asia
  { cx: 310, cy: 130, rx: 16, ry: 11 }, // Oceanía
]

function viewBtn(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: "0.4rem",
    padding: "0.45rem 0.9rem", borderRadius: 999,
    border: `1px solid ${active ? "rgba(217,184,102,0.6)" : "rgba(167,139,202,0.3)"}`,
    background: active ? "linear-gradient(135deg,rgba(230,207,149,0.2),rgba(217,184,102,0.08))" : "transparent",
    color: active ? GOLD : VIOLET, fontFamily: "var(--font-mono,monospace)", fontSize: "0.62rem",
    fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
  }
}
function dot(color: string, glow: boolean): React.CSSProperties {
  return { display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: glow ? `0 0 6px ${color}` : "none" }
}
