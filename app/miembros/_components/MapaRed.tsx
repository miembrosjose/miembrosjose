"use client"

// MAPA DE LA RED — mapa propio, separado del Mapa Cósmico.
//
// Tres niveles ligados al zoom, para que 200 miembros en una ciudad no se
// conviertan en 200 círculos superpuestos:
//
//   zoom < 4   PAÍS     burbuja con el total del país
//   zoom 4–7   CIUDAD   burbuja con el total de cada ciudad
//   zoom ≥ 8   MIEMBROS las fotos de perfil con su emblema, AUTOMÁTICAMENTE
//
// PRIVACIDAD: todo se ancla al CENTRO DE LA CIUDAD, que es el único dato que
// guardamos. Al máximo zoom las fotos se reparten en anillos alrededor de ese
// centro para que no se solapen: es una disposición visual, no una afirmación
// sobre dónde vive nadie.

import { useCallback, useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"
import { Loader2 } from "lucide-react"
import { getAchievementById, getAura } from "@/lib/achievements"
import { getAchievementSvg } from "@/lib/achievement-svg"
import styles from "./mapa-red.module.css"

const GOLD_SOFT = "#e6cf95"

// ── El mundo se dibuja, no se descarga en teselas ──────────────────────────
// Ningún proveedor de teselas (CARTO, Stadia, Mapbox…) garantiza seguir siendo
// gratuito: CARTO empezó a exigir clave y el mapa se llenó de «API KEY
// REQUIRED». Aquí la silueta del mundo es un archivo propio —Natural Earth,
// dominio público, servido como asset estático— y el color lo ponemos
// nosotros. Sin claves, sin terceros y con nuestra paleta exacta.
const MUNDO_URL = "/red/mundo.json"

/** Silueta del mundo: array de países, cada uno con sus anillos [lon,lat,…]. */
type Mundo = { v: number; c: Array<{ i: string; r: number[][] }> }

// Se pide una sola vez por pestaña, aunque el mapa se monte y desmonte.
let mundoPromesa: Promise<Mundo> | null = null
function cargarMundo(): Promise<Mundo> {
  if (!mundoPromesa) {
    mundoPromesa = fetch(MUNDO_URL)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .catch((e) => { mundoPromesa = null; throw e })
  }
  return mundoPromesa
}

// Paleta del lienzo — la misma familia violeta/oro del resto de la plataforma.
const TIERRA = "#16132f"
const TIERRA_VIVA = "#241c4d"      // países donde la Red ya tiene presencia
const BORDE = "rgba(217,184,102,0.30)"
const BORDE_VIVO = "rgba(217,184,102,0.80)"
const MERIDIANO = "rgba(124,108,206,0.16)"

// Posición del mapa entre visitas. Igual que la pestaña: sessionStorage, por
// pestaña del navegador, envuelto en try/catch porque puede estar bloqueado.
const MEMORIA_VISTA = "red:mapa"
type VistaGuardada = { lat: number; lon: number; z: number }

function leerVista(): VistaGuardada | null {
  try {
    const crudo = window.sessionStorage.getItem(MEMORIA_VISTA)
    if (!crudo) return null
    const v = JSON.parse(crudo) as Partial<VistaGuardada>
    if (typeof v.lat !== "number" || typeof v.lon !== "number" || typeof v.z !== "number") return null
    return { lat: v.lat, lon: v.lon, z: v.z }
  } catch { return null }
}

function guardarVista(v: VistaGuardada) {
  try { window.sessionStorage.setItem(MEMORIA_VISTA, JSON.stringify(v)) } catch { /* noop */ }
}

const ZOOM_CIUDAD = 4
const ZOOM_MIEMBROS = 8
/** Ciudades cuyos miembros se cargan a la vez al acercarse. */
const MAX_CIUDADES_VISIBLES = 8

export type PaisPunto = { code: string; name: string; flag: string; lat: number; lon: number; members: number; cities: number }
export type CiudadPunto = { id: number; name: string; admin1: string | null; lat: number; lon: number; country: string; country_code: string; members: number }
export type MiembroPunto = {
  id: string; full_name: string; username: string | null
  avatar_url: string | null; badge_id: string | null; roles: string[]; is_self: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadLeaflet(): Promise<any> {
  const mod = await import("leaflet")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mod as any).default ?? mod
}

function iniciales(nombre: string): string {
  const p = (nombre || "").trim().split(/\s+/).filter(Boolean).slice(0, 2)
  return p.map((x) => x.charAt(0).toUpperCase()).join("") || "M"
}

function esc(s: string): string {
  return (s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string))
}

/** Reparte n puntos en anillos alrededor del centro, sin solaparse. */
function anillo(i: number, total: number, zoom: number): [number, number] {
  if (total === 1) return [0, 0]
  const base = 0.09 / Math.pow(1.85, zoom - ZOOM_MIEMBROS)
  const porAnillo = 8
  const nivel = Math.floor(i / porAnillo)
  const enNivel = Math.min(porAnillo, total - nivel * porAnillo)
  const idx = i % porAnillo
  const ang = (idx / enNivel) * Math.PI * 2 + nivel * 0.45
  const r = base * (nivel + 1)
  return [r * Math.sin(ang), r * Math.cos(ang) * 1.7]
}

type Props = {
  paises: PaisPunto[]
  ciudades: CiudadPunto[]
  /** Miembros ya cargados, por id de ciudad. */
  miembrosPorCiudad: Map<number, MiembroPunto[]>
  cargando: boolean
  /** Pide los miembros de estas ciudades (las que han entrado en pantalla). */
  onNecesitaCiudades: (ids: number[]) => void
  /** Abre el perfil DENTRO de la SPA, sin recargar. */
  onAbrirMiembro: (id: string) => void
}

export function MapaRed({ paises, ciudades, miembrosPorCiudad, cargando, onNecesitaCiudades, onAbrirMiembro }: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const capaRef = useRef<any>(null)

  // `listo` es imprescindible: sin él, el primer dibujo se perdía. El mapa
  // arranca en zoom 2 y al terminar de crearse hacía setZoom(2) — mismo valor,
  // React no re-renderiza, y el efecto de dibujo nunca llegaba a ejecutarse.
  const [listo, setListo] = useState(false)
  const [zoom, setZoom] = useState(2)
  const [ciudadFoco, setCiudadFoco] = useState<CiudadPunto | null>(null)
  const [fallo, setFallo] = useState(false)

  const necesitaRef = useRef(onNecesitaCiudades); necesitaRef.current = onNecesitaCiudades
  const ciudadesRef = useRef(ciudades); ciudadesRef.current = ciudades
  const abrirRef = useRef(onAbrirMiembro); abrirRef.current = onAbrirMiembro

  // Polígonos del mundo indexados por país, para poder encender los que tienen
  // miembros cuando lleguen los datos.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tierraRef = useRef<Map<string, any[]>>(new Map())

  // ── Qué ciudades están en pantalla ──────────────────────────────────────
  const revisarVisibles = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const z = map.getZoom()
    setZoom(z)
    if (z < ZOOM_MIEMBROS) { setCiudadFoco(null); return }
    try {
      const b = map.getBounds()
      const dentro = ciudadesRef.current
        .filter((c) => b.contains([c.lat, c.lon]))
        .sort((a, b2) => b2.members - a.members)
        .slice(0, MAX_CIUDADES_VISIBLES)
      setCiudadFoco(dentro[0] ?? null)
      if (dentro.length) necesitaRef.current(dentro.map((c) => c.id))
    } catch { /* noop */ }
  }, [])

  // ── Arranque ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelado = false
    ;(async () => {
      try {
        const [L, mundo] = await Promise.all([loadLeaflet(), cargarMundo()])
        if (cancelado || !elRef.current || mapRef.current) return
        LRef.current = L

        const map = L.map(elRef.current, {
          center: [20, 0], zoom: 2, minZoom: 2, maxZoom: 13,
          zoomControl: true, attributionControl: true,
          // Sin teselas no hay mundo repetido a los lados: en vez de dejar
          // vacío el océano al pasar de ±180°, se frena el arrastre ahí.
          maxBounds: [[-84, -179], [84, 179]],
          maxBoundsViscosity: 1,
        })
        map.attributionControl.addAttribution("Natural Earth")

        // Un único lienzo de canvas para toda la geografía: 288 polígonos como
        // SVG independientes ahogarían el navegador al arrastrar.
        const lienzo = L.canvas({ padding: 0.3 })

        // Meridianos y paralelos cada 30°: dan profundidad y sensación de globo.
        const rejilla: number[][][] = []
        for (let lon = -180; lon <= 180; lon += 30) rejilla.push([[-84, lon], [84, lon]])
        for (let lat = -60; lat <= 60; lat += 30) rejilla.push([[lat, -180], [lat, 180]])
        for (const linea of rejilla) {
          L.polyline(linea, {
            renderer: lienzo, color: MERIDIANO, weight: 1, interactive: false,
          }).addTo(map)
        }

        // La tierra. Los anillos vienen aplanados como [lon,lat,lon,lat,…].
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const porPais = new Map<string, any[]>()
        for (const pais of mundo.c) {
          for (const plano of pais.r) {
            const puntos: [number, number][] = []
            for (let k = 0; k < plano.length; k += 2) puntos.push([plano[k + 1], plano[k]])
            const poly = L.polygon(puntos, {
              renderer: lienzo, interactive: false,
              color: BORDE, weight: 0.8, fillColor: TIERRA, fillOpacity: 1,
            }).addTo(map)
            if (pais.i) {
              const yaVistos = porPais.get(pais.i)
              if (yaVistos) yaVistos.push(poly)
              else porPais.set(pais.i, [poly])
            }
          }
        }
        tierraRef.current = porPais

        capaRef.current = L.layerGroup().addTo(map)

        // El zoom mínimo depende del ancho real del contenedor: con teselas
        // sobraba un valor fijo porque el mundo se repetía, pero aquí hay un
        // solo mundo dibujado y un zoom demasiado lejano dejaría franjas
        // vacías a los lados. `inside: true` busca el zoom en que el mundo
        // cubre la vista. Se recalcula al cambiar el tamaño de la ventana.
        const MUNDO_BBOX: [[number, number], [number, number]] = [[-84, -179], [84, 179]]
        const ajustarMinZoom = () => {
          try {
            const zMin = map.getBoundsZoom(MUNDO_BBOX, true)
            map.setMinZoom(zMin)
            if (map.getZoom() < zMin) map.setZoom(zMin)
          } catch { /* noop */ }
        }
        ajustarMinZoom()
        // Si veníamos de un perfil, el mapa se retoma donde se dejó.
        const guardada = leerVista()
        if (guardada) map.setView([guardada.lat, guardada.lon], Math.max(guardada.z, map.getMinZoom()))
        else map.setView([20, 0], map.getMinZoom())
        map.on("resize", ajustarMinZoom)
        map.on("zoomend moveend", revisarVisibles)
        map.on("zoomend moveend", () => {
          try {
            const c = map.getCenter()
            guardarVista({ lat: c.lat, lon: c.lng, z: map.getZoom() })
          } catch { /* noop */ }
        })
        mapRef.current = map
        setListo(true)     // ← dispara el primer dibujo
        revisarVisibles()
      } catch {
        if (!cancelado) setFallo(true)
      }
    })()
    return () => {
      cancelado = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [revisarVisibles])

  // ── Países encendidos ───────────────────────────────────────────────────
  // La geografía no es decorado. Los países donde la Red ya tiene a alguien se
  // aclaran y toman borde dorado: desde el zoom más lejano se lee de un
  // vistazo hasta dónde ha llegado, aunque las burbujas se solapen.
  useEffect(() => {
    if (!listo) return
    const conMiembros = new Set(paises.map((p) => p.code))
    for (const [iso, poligonos] of tierraRef.current) {
      const vivo = conMiembros.has(iso)
      for (const poly of poligonos) {
        poly.setStyle({
          fillColor: vivo ? TIERRA_VIVA : TIERRA,
          color: vivo ? BORDE_VIVO : BORDE,
          weight: vivo ? 1.2 : 0.8,
        })
      }
    }
  }, [listo, paises])

  // ── Dibujo ──────────────────────────────────────────────────────────────
  const dibujar = useCallback(() => {
    const L = LRef.current, capa = capaRef.current, map = mapRef.current
    if (!L || !capa || !map) return
    capa.clearLayers()
    const z = map.getZoom()

    // Nivel 3 — personas de las ciudades en pantalla
    if (z >= ZOOM_MIEMBROS) {
      let b: { contains: (p: [number, number]) => boolean } | null = null
      try { b = map.getBounds() } catch { b = null }
      for (const c of ciudades) {
        if (b && !b.contains([c.lat, c.lon])) continue
        const lista = miembrosPorCiudad.get(c.id)
        if (!lista || lista.length === 0) continue
        lista.forEach((m, i) => {
          const [dLat, dLon] = anillo(i, lista.length, z)
          const ach = m.badge_id ? getAchievementById(m.badge_id) : undefined
          const aura = getAura(m.badge_id)
          const foto = m.avatar_url
            ? `<img src="${esc(m.avatar_url)}" alt="" loading="lazy" />`
            : `<span class="mr-ini">${esc(iniciales(m.full_name))}</span>`
          const emblema = ach ? `<span class="mr-badge">${getAchievementSvg(ach.id)}</span>` : ""
          // El anillo lleva el color del grado alcanzado: así el mapa se lee
          // por colores y no solo por caras. Las variables CSS se inyectan en
          // el estilo del marcador porque este HTML vive fuera de React.
          const estiloAura = aura
            ? `--a:${aura.color};--a2:${aura.color2}`
            : ""
          const clases = [
            "mr-person",
            m.is_self ? "is-self" : "",
            aura ? "has-aura" : "",
            aura?.vivo ? "aura-viva" : "",
          ].filter(Boolean).join(" ")
          const icon = L.divIcon({
            className: "mr-icon",
            html: `<span class="${clases}" style="${estiloAura}">${foto}${emblema}</span>`,
            iconSize: [46, 46], iconAnchor: [23, 23],
          })
          const mk = L.marker([c.lat + dLat, c.lon + dLon], { icon, riseOnHover: true })
          mk.bindTooltip(esc(m.full_name), { direction: "top", offset: [0, -20], className: "mr-tip" })
          // Nunca window.location: eso recarga el navegador entero, la shell se
          // vuelve a montar y el intro arranca de cero. El perfil es una vista
          // más de esta misma SPA.
          mk.on("click", () => abrirRef.current(m.id))
          mk.addTo(capa)
        })
      }
      return
    }

    // Nivel 2 — ciudades
    if (z >= ZOOM_CIUDAD) {
      for (const c of ciudades) {
        const tam = c.members >= 100 ? 62 : c.members >= 20 ? 54 : c.members >= 5 ? 48 : 42
        const icon = L.divIcon({
          className: "mr-icon",
          html: `<span class="mr-orb" style="--s:${tam}px">
                   <span class="mr-orbPulse"></span>
                   <b>${c.members}</b>
                 </span>
                 <span class="mr-orbName">${esc(c.name)}</span>`,
          iconSize: [tam, tam], iconAnchor: [tam / 2, tam / 2],
        })
        const mk = L.marker([c.lat, c.lon], { icon, riseOnHover: true })
        mk.bindTooltip(
          `${esc(c.name)}, ${esc(c.country)} · ${c.members === 1 ? "1 miembro" : `${c.members} miembros`}`,
          { direction: "top", offset: [0, -tam / 2 - 4], className: "mr-tip" },
        )
        mk.on("click", () => {
          try { map.flyTo([c.lat, c.lon], Math.max(map.getZoom(), ZOOM_MIEMBROS), { duration: 0.9 }) } catch { /* noop */ }
        })
        mk.addTo(capa)
      }
      return
    }

    // Nivel 1 — países
    for (const p of paises) {
      const tam = p.members >= 200 ? 66 : p.members >= 50 ? 58 : p.members >= 10 ? 50 : 44
      const icon = L.divIcon({
        className: "mr-icon",
        html: `<span class="mr-orb is-country" style="--s:${tam}px">
                 <span class="mr-orbPulse"></span>
                 <b>${p.members}</b>
               </span>
               <span class="mr-orbName">${esc(p.name)}</span>`,
        iconSize: [tam, tam], iconAnchor: [tam / 2, tam / 2],
      })
      const mk = L.marker([p.lat, p.lon], { icon, riseOnHover: true })
      mk.bindTooltip(
        `${esc(p.name)} · ${p.members === 1 ? "1 miembro" : `${p.members} miembros`} · ${p.cities === 1 ? "1 ciudad" : `${p.cities} ciudades`}`,
        { direction: "top", offset: [0, -tam / 2 - 4], className: "mr-tip" },
      )
      mk.on("click", () => {
        try { map.flyTo([p.lat, p.lon], ZOOM_CIUDAD + 1, { duration: 0.9 }) } catch { /* noop */ }
      })
      mk.addTo(capa)
    }
  }, [paises, ciudades, miembrosPorCiudad])

  // `listo` en las dependencias: así el primer dibujo ocurre en cuanto el mapa
  // existe, sin esperar a que el usuario toque el zoom.
  useEffect(() => { if (listo) dibujar() }, [listo, dibujar, zoom])

  const nivel = zoom >= ZOOM_MIEMBROS ? "miembros" : zoom >= ZOOM_CIUDAD ? "ciudad" : "pais"

  if (fallo) {
    return (
      <div className={styles.fallo}>
        <p>No se pudo cargar el mapa.</p>
        <button type="button" onClick={() => window.location.reload()} className={styles.reintentar}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <MapaEstilos />

      <div className={styles.niveles} aria-live="polite">
        <span className={`${styles.nivel} ${nivel === "pais" ? styles.nivelOn : ""}`}>Países</span>
        <span className={styles.nivelSep} aria-hidden>›</span>
        <span className={`${styles.nivel} ${nivel === "ciudad" ? styles.nivelOn : ""}`}>Ciudades</span>
        <span className={styles.nivelSep} aria-hidden>›</span>
        <span className={`${styles.nivel} ${nivel === "miembros" ? styles.nivelOn : ""}`}>Miembros</span>
        <span className={styles.nivelHint}>
          {nivel === "pais" && "Acerca para ver las ciudades"}
          {nivel === "ciudad" && "Acerca para ver a las personas"}
          {nivel === "miembros" && (ciudadFoco ? `${ciudadFoco.name}, ${ciudadFoco.country}` : "Explorando")}
        </span>
      </div>

      <div ref={elRef} className={styles.canvas} />

      {(cargando || !listo) && (
        <div className={styles.cargando}>
          <Loader2 size={13} className={styles.spin} /> {listo ? "Cargando miembros…" : "Cargando mapa…"}
        </div>
      )}
    </div>
  )
}

// Estilos de los marcadores: van en <style> plano porque Leaflet inyecta el
// HTML de los divIcon fuera del árbol de React y los CSS Modules no lo
// alcanzarían.
function MapaEstilos() {
  return (
    <style>{`
      /* Leaflet pinta un recuadro blanco con borde en TODO divIcon. Ese era el
         «cuadrante feo» alrededor del número. Se anula aquí. */
      .leaflet-div-icon,
      .mr-icon{background:transparent!important;border:none!important}
      .mr-icon{display:flex;flex-direction:column;align-items:center;overflow:visible}

      .mr-tip{background:#0e0f18;border:1px solid rgba(217,184,102,0.5);color:#eef1fb;border-radius:8px;font-size:0.74rem;padding:0.28rem 0.55rem;box-shadow:0 8px 26px rgba(0,0,0,0.7)}
      .mr-tip::before{border-top-color:rgba(217,184,102,0.5)}

      /* ── Orbe: número de miembros ────────────────────────────────────── */
      .mr-orb{
        position:relative;width:var(--s);height:var(--s);
        display:flex;align-items:center;justify-content:center;border-radius:50%;
        background:radial-gradient(circle at 50% 32%, rgba(230,207,149,0.42) 0%, rgba(217,184,102,0.16) 55%, rgba(217,184,102,0.04) 100%);
        border:1.5px solid rgba(217,184,102,0.85);
        box-shadow:0 0 22px rgba(217,184,102,0.45), inset 0 0 18px rgba(217,184,102,0.18);
        color:${GOLD_SOFT};cursor:pointer;
        transition:transform 200ms cubic-bezier(.34,1.2,.64,1), box-shadow 200ms ease;
      }
      .mr-orb:hover{transform:scale(1.12);box-shadow:0 0 34px rgba(217,184,102,0.7), inset 0 0 22px rgba(217,184,102,0.28)}
      .mr-orb b{
        font-family:var(--font-mono,monospace);font-weight:700;
        font-size:calc(var(--s) * 0.34);line-height:1;letter-spacing:-0.02em;
        text-shadow:0 0 14px rgba(217,184,102,0.7);position:relative;z-index:2;
      }
      .mr-orb.is-country{border-color:rgba(230,207,149,0.95)}

      /* Pulso lento: da sensación de red viva sin distraer. */
      .mr-orbPulse{
        position:absolute;inset:-6px;border-radius:50%;
        border:1px solid rgba(217,184,102,0.55);
        animation:mrPulse 3.4s ease-out infinite;pointer-events:none;
      }
      @keyframes mrPulse{
        0%{transform:scale(0.82);opacity:0.85}
        70%{transform:scale(1.35);opacity:0}
        100%{transform:scale(1.35);opacity:0}
      }

      .mr-orbName{
        margin-top:4px;font-family:var(--font-mono,monospace);font-size:0.56rem;
        letter-spacing:0.14em;text-transform:uppercase;color:rgba(230,207,149,0.85);
        text-shadow:0 2px 8px rgba(0,0,0,0.95);white-space:nowrap;pointer-events:none;
      }

      /* ── Persona ─────────────────────────────────────────────────────── */
      .mr-person{
        display:block;position:relative;width:46px;height:46px;border-radius:50%;
        border:2px solid rgba(217,184,102,0.6);background:#14142a;cursor:pointer;
        box-shadow:0 0 16px rgba(0,0,0,0.8), 0 0 10px rgba(217,184,102,0.25);
        transition:transform 200ms cubic-bezier(.34,1.2,.64,1), border-color 200ms ease, box-shadow 200ms ease;
      }
      .mr-person:hover{transform:scale(1.18);border-color:${GOLD_SOFT};box-shadow:0 0 22px rgba(217,184,102,0.65)}
      .mr-person.is-self{border-color:${GOLD_SOFT};box-shadow:0 0 24px rgba(217,184,102,0.75)}
      .mr-person img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
      .mr-ini{
        display:flex;align-items:center;justify-content:center;width:100%;height:100%;
        border-radius:50%;font-family:var(--font-mono,monospace);font-size:0.82rem;color:${GOLD_SOFT}
      }
      /* ── Aura del grado ──────────────────────────────────────────────── */
      /* El anillo va en box-shadow, no en un ::before. Un pseudo-elemento con
         z-index:-1 quedaría DETRÁS del fondo del propio marcador (que lo
         tiene, para las iniciales) y no se vería nada. Con box-shadow el
         anillo se dibuja siempre por fuera del borde. */
      .mr-person.has-aura{
        border-color:var(--a2);
        box-shadow:0 0 0 3px var(--a), 0 0 20px var(--a), 0 0 8px rgba(0,0,0,0.85);
      }
      .mr-person.has-aura:hover{box-shadow:0 0 0 3px var(--a2), 0 0 30px var(--a)}
      .mr-person.aura-viva{animation:mrAuraLatir 3.2s ease-in-out infinite}
      @keyframes mrAuraLatir{
        0%,100%{box-shadow:0 0 0 3px var(--a), 0 0 18px var(--a), 0 0 8px rgba(0,0,0,0.85)}
        50%    {box-shadow:0 0 0 4px var(--a2), 0 0 32px var(--a), 0 0 8px rgba(0,0,0,0.85)}
      }

      .mr-badge{position:absolute;right:-5px;bottom:-5px;width:19px;height:19px;pointer-events:none;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.9))}
      .mr-badge svg{width:100%;height:100%}

      @media (prefers-reduced-motion: reduce){
        .mr-orbPulse{animation:none;opacity:0.35}
        .mr-person.aura-viva{animation:none}
        .mr-orb,.mr-person{transition:none}
      }
    `}</style>
  )
}
