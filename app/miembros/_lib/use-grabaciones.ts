"use client"

// Las grabaciones de los Encuentros de la Red, desde el navegador.
//
// Dos ganchos, porque son dos necesidades distintas:
//
//   useGrabaciones()       el archivo que ve cualquiera. Paginado: trae una
//                          tanda y va añadiendo las siguientes.
//   useGrabacionesAdmin()  la lista completa para el panel, borradores
//                          incluidos, con crear / editar / borrar.
//
// Se avisan entre sí con un evento: cuando el panel publica una grabación, el
// archivo que está detrás se entera sin recargar la página.

import { useCallback, useEffect, useState } from "react"

const CAMBIO = "app:grabaciones-cambiadas"

function avisarDelCambio() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CAMBIO))
  }
}

/** Una grabación tal como la ve quien la mira. */
export type GrabacionVista = {
  id: number
  titulo: string
  descripcion: string
  fecha: string
  miniatura: string | null
  borrador: boolean
  iframe: string | null
  script: string | null
  elementoId: string | null
}

/** Una grabación tal como la edita el panel. */
export type GrabacionAdmin = {
  id: number
  titulo: string
  descripcion: string
  fecha: string
  miniatura: string | null
  cuenta_id: string | null
  player_id: string | null
  embed: string
  estado: "borrador" | "publicado"
  sort_order: number
}

export type Previsualizacion = {
  encontrada: boolean
  url: string | null
  origen: "codigo" | "deducida"
} | null

// ═══════════════════════════════════════════════════════════════════════════
//  EL ARCHIVO
// ═══════════════════════════════════════════════════════════════════════════

const POR_TANDA = 12

export function useGrabaciones() {
  const [grabaciones, setGrabaciones] = useState<GrabacionVista[]>([])
  const [total, setTotal] = useState(0)
  const [hayMas, setHayMas] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [trayendoMas, setTrayendoMas] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** La migración todavía no se ha corrido. Solo se le dice a administración. */
  const [sinTabla, setSinTabla] = useState(false)

  const traer = useCallback(async (pagina: number) => {
    const r = await fetch(
      `/api/red/grabaciones?pagina=${pagina}&por=${POR_TANDA}`,
      { credentials: "include" },
    )
    if (!r.ok) {
      const d = (await r.json().catch(() => ({}))) as { error?: string }
      throw new Error(d.error || `HTTP ${r.status}`)
    }
    return (await r.json()) as {
      grabaciones: GrabacionVista[]
      total: number
      hayMas: boolean
      sinTabla?: boolean
    }
  }, [])

  /** Vuelve a empezar desde la primera tanda. */
  const refrescar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const j = await traer(0)
      setGrabaciones(j.grabaciones)
      setTotal(j.total)
      setHayMas(j.hayMas)
      setSinTabla(!!j.sinTabla)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el archivo.")
    } finally {
      setCargando(false)
    }
  }, [traer])

  const cargarMas = useCallback(async () => {
    if (trayendoMas || !hayMas) return
    setTrayendoMas(true)
    setError(null)
    try {
      // La página se calcula desde lo que YA hay, no desde un contador
      // aparte: con un contador, dos pulsaciones seguidas pedían la misma
      // tanda o se saltaban una.
      const siguiente = Math.floor(grabaciones.length / POR_TANDA)
      const j = await traer(siguiente)
      setGrabaciones((previas) => {
        // Si una grabación nueva entró arriba entre tanda y tanda, la de la
        // frontera llegaría dos veces. Se filtra por identificador.
        const vistos = new Set(previas.map((g) => g.id))
        return [...previas, ...j.grabaciones.filter((g) => !vistos.has(g.id))]
      })
      setTotal(j.total)
      setHayMas(j.hayMas)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron traer más.")
    } finally {
      setTrayendoMas(false)
    }
  }, [grabaciones.length, hayMas, traer, trayendoMas])

  useEffect(() => {
    void refrescar()
    if (typeof window === "undefined") return
    const alCambiar = () => void refrescar()
    window.addEventListener(CAMBIO, alCambiar)
    return () => window.removeEventListener(CAMBIO, alCambiar)
  }, [refrescar])

  return {
    grabaciones, total, hayMas, cargando, trayendoMas, error, sinTabla,
    cargarMas, refrescar,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  EL PANEL
// ═══════════════════════════════════════════════════════════════════════════

export function useGrabacionesAdmin() {
  const [grabaciones, setGrabaciones] = useState<GrabacionAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sinTabla, setSinTabla] = useState(false)

  const refrescar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const r = await fetch("/api/admin/grabaciones", { credentials: "include" })
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))) as { error?: string }
        throw new Error(d.error || `HTTP ${r.status}`)
      }
      const j = (await r.json()) as {
        grabaciones: GrabacionAdmin[]
        sinTabla?: boolean
      }
      setGrabaciones(j.grabaciones ?? [])
      setSinTabla(!!j.sinTabla)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la lista.")
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void refrescar()
  }, [refrescar])

  const crear = useCallback(
    async (datos: { titulo: string; descripcion: string; embed: string; fecha?: string }) => {
      const r = await fetch("/api/admin/grabaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(datos),
      })
      const j = (await r.json().catch(() => ({}))) as {
        error?: string
        grabacion?: GrabacionAdmin
        previsualizacion?: Previsualizacion
      }
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
      await refrescar()
      avisarDelCambio()
      return j.previsualizacion ?? null
    },
    [refrescar],
  )

  const editar = useCallback(
    async (id: number, parche: Partial<GrabacionAdmin> & { embed?: string }) => {
      const r = await fetch(`/api/admin/grabaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parche),
      })
      const j = (await r.json().catch(() => ({}))) as {
        error?: string
        previsualizacion?: Previsualizacion
      }
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
      await refrescar()
      avisarDelCambio()
      return j.previsualizacion ?? null
    },
    [refrescar],
  )

  const borrar = useCallback(
    async (id: number) => {
      const r = await fetch(`/api/admin/grabaciones/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))) as { error?: string }
        throw new Error(d.error || `HTTP ${r.status}`)
      }
      await refrescar()
      avisarDelCambio()
    },
    [refrescar],
  )

  return { grabaciones, cargando, error, sinTabla, refrescar, crear, editar, borrar }
}
