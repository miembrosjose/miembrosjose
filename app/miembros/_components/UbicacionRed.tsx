"use client"

// Selector de ubicación de La Red — país + ciudad + privacidad.
//
// Datos NORMALIZADOS: no hay texto libre. El país sale de los que tienen
// ciudades en el catálogo, y la ciudad de una búsqueda contra la base. Así
// «Ciudad de México», «CDMX» y «Mexico City» no pueden convertirse en tres
// ciudades distintas.
//
// Privacidad: el país se guarda siempre (sirve para recuentos agregados), pero
// la ciudad solo se muestra a otros miembros si se activa el interruptor, que
// nace apagado. Quien no lo active no aparece en el directorio ni en el mapa.

import { useCallback, useEffect, useRef, useState } from "react"
import { MapPin, Search, Check, Loader2, X } from "lucide-react"

type Pais = { code: string; name: string; flag: string; cities: number }
type Ciudad = { id: number; name: string; admin1: string | null; label: string }

export type UbicacionActual = {
  country_code: string
  country_name: string
  city_id: number | null
  city_name: string | null
  city_admin1: string | null
  show_city: boolean
} | null

type Props = {
  /** Estilos heredados del formulario de perfil, para no inventar otro lenguaje visual. */
  inputCls: string
  labelCls: string
  btnCls: string
  /** Se llama al guardar con éxito. */
  onSaved?: (loc: NonNullable<UbicacionActual>) => void
  /** Modo compacto para la invitación contextual del Inicio. */
  compact?: boolean
}

export function UbicacionRed({ inputCls, labelCls, btnCls, onSaved, compact }: Props) {
  const [paises, setPaises] = useState<Pais[]>([])
  const [pais, setPais] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [ciudad, setCiudad] = useState<Ciudad | null>(null)
  const [showCity, setShowCity] = useState(false)

  const [cargandoPaises, setCargandoPaises] = useState(true)
  const [buscando, setBuscando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [errorCarga, setErrorCarga] = useState(false)

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Carga inicial: países disponibles + ubicación actual ─────────────────
  useEffect(() => {
    let vivo = true
    ;(async () => {
      setCargandoPaises(true)
      setErrorCarga(false)
      try {
        const [rp, ru] = await Promise.all([
          fetch("/api/red/ciudades", { credentials: "include" }),
          fetch("/api/red/ubicacion", { credentials: "include" }),
        ])
        if (!vivo) return
        if (!rp.ok) throw new Error("paises")
        const dp = await rp.json()
        setPaises(dp.paises || [])

        if (ru.ok) {
          const du = await ru.json()
          const loc: UbicacionActual = du.location
          if (loc) {
            setPais(loc.country_code)
            setShowCity(loc.show_city)
            if (loc.city_id && loc.city_name) {
              setCiudad({
                id: loc.city_id,
                name: loc.city_name,
                admin1: loc.city_admin1,
                label: loc.city_admin1 && loc.city_admin1 !== loc.city_name
                  ? `${loc.city_name} · ${loc.city_admin1}`
                  : loc.city_name,
              })
            }
          }
        }
      } catch {
        if (vivo) setErrorCarga(true)
      } finally {
        if (vivo) setCargandoPaises(false)
      }
    })()
    return () => { vivo = false }
  }, [])

  // ── Búsqueda de ciudades con retardo, para no consultar en cada tecla ────
  const buscarCiudades = useCallback((codigoPais: string, q: string) => {
    if (debounce.current) clearTimeout(debounce.current)
    if (!codigoPais) { setCiudades([]); return }
    debounce.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const url = `/api/red/ciudades?pais=${encodeURIComponent(codigoPais)}${q ? `&q=${encodeURIComponent(q)}` : ""}`
        const r = await fetch(url, { credentials: "include" })
        if (!r.ok) throw new Error("ciudades")
        const d = await r.json()
        setCiudades(d.ciudades || [])
      } catch {
        setCiudades([])
      } finally {
        setBuscando(false)
      }
    }, 250)
  }, [])

  useEffect(() => {
    if (pais && !ciudad) buscarCiudades(pais, busqueda)
  }, [pais, busqueda, ciudad, buscarCiudades])

  function cambiarPais(code: string) {
    setPais(code)
    setCiudad(null)
    setBusqueda("")
    setCiudades([])
    setMsg(null)
  }

  async function guardar() {
    if (!pais) { setMsg({ ok: false, text: "Elige tu país." }); return }
    setGuardando(true)
    setMsg(null)
    try {
      const r = await fetch("/api/red/ubicacion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          country_code: pais,
          city_id: ciudad?.id ?? null,
          show_city: showCity,
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        setMsg({ ok: false, text: d.error || "No se pudo guardar." })
        return
      }
      setShowCity(d.show_city)
      setMsg({ ok: true, text: "Ubicación guardada." })
      onSaved?.({
        country_code: pais,
        country_name: paises.find((p) => p.code === pais)?.name || pais,
        city_id: ciudad?.id ?? null,
        city_name: ciudad?.name ?? null,
        city_admin1: ciudad?.admin1 ?? null,
        show_city: d.show_city,
      })
    } catch {
      setMsg({ ok: false, text: "Error de conexión." })
    } finally {
      setGuardando(false)
    }
  }

  // ── Estados de carga y error ─────────────────────────────────────────────
  if (cargandoPaises) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
        <Loader2 size={14} className="animate-spin" />
        Cargando países…
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="py-4">
        <p className="text-xs text-red-500 [font-family:var(--font-geist-sans)]">
          No se pudo cargar el catálogo de ubicaciones.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 text-[10px] uppercase tracking-[0.25em] text-[#a78bca] underline [font-family:var(--font-geist-sans)]"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {/* País */}
      <div>
        <label htmlFor="red-pais" className={labelCls}>País</label>
        <select
          id="red-pais"
          value={pais}
          onChange={(e) => cambiarPais(e.target.value)}
          disabled={guardando}
          className={inputCls}
        >
          <option value="">Elige tu país…</option>
          {paises.map((p) => (
            <option key={p.code} value={p.code}>
              {p.flag} {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Ciudad */}
      {pais && (
        <div>
          <label htmlFor="red-ciudad" className={labelCls}>Ciudad</label>

          {ciudad ? (
            <div className="flex items-center justify-between gap-3 border border-[#4A3170] bg-[#12121a]/60 px-4 py-3">
              <span className="flex items-center gap-2 text-base text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
                <MapPin size={15} className="text-[#d9b866]" />
                {ciudad.label}
              </span>
              <button
                type="button"
                onClick={() => { setCiudad(null); setBusqueda("") }}
                disabled={guardando}
                aria-label="Cambiar ciudad"
                className="text-[#6a6a7a] transition-colors hover:text-[#F3F6FA]"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a7a]" />
                <input
                  id="red-ciudad"
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  disabled={guardando}
                  className={`${inputCls} pl-9`}
                  placeholder="Escribe para buscar tu ciudad…"
                  autoComplete="off"
                />
                {buscando && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#6a6a7a]" />
                )}
              </div>

              {ciudades.length > 0 && (
                <ul className="mt-2 max-h-56 overflow-y-auto border border-[#1a1a24] bg-[#0c0c14]">
                  {ciudades.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => { setCiudad(c); setCiudades([]) }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#d8d3c6] transition-colors hover:bg-[#12121a] hover:text-[#F3F6FA] [font-family:var(--font-geist-sans)]"
                      >
                        <MapPin size={13} className="shrink-0 text-[#6a6a7a]" />
                        {c.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!buscando && busqueda.length >= 2 && ciudades.length === 0 && (
                <p className="mt-2 text-[11px] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                  No encontramos esa ciudad. Prueba con el nombre completo o con la ciudad
                  importante más cercana.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Privacidad */}
      {ciudad && (
        <label className="flex cursor-pointer items-start gap-3 border border-[#1a1a24] bg-[#12121a]/40 p-4">
          <input
            type="checkbox"
            checked={showCity}
            onChange={(e) => setShowCity(e.target.checked)}
            disabled={guardando}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#d9b866]"
          />
          <span>
            <span className="block text-sm text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
              Mostrar mi ciudad a otros miembros de la Red
            </span>
            <span className="mt-1 block text-[11px] leading-relaxed text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
              Si lo activas aparecerás en tu ciudad al explorar la Red y en el mapa. Nunca se
              guarda tu domicilio ni tu ubicación exacta: el punto del mapa es el centro de la
              ciudad, el mismo para todos sus miembros.
            </span>
          </span>
        </label>
      )}

      <div className="flex items-center gap-4">
        <button type="button" onClick={guardar} disabled={guardando || !pais} className={btnCls}>
          {guardando ? "Guardando…" : "Guardar ubicación"}
        </button>
        {msg && (
          <span
            className={`flex items-center gap-1.5 text-xs [font-family:var(--font-geist-sans)] ${msg.ok ? "text-[#009d68]" : "text-red-500"}`}
          >
            {msg.ok && <Check size={13} />}
            {msg.text}
          </span>
        )}
      </div>
    </div>
  )
}
