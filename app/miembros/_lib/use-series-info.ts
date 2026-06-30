"use client"

// Hook useSeriesInfo() — busca metadata editável da série + update (admin).

import { useCallback, useEffect, useState } from "react"

export type SeriesInfo = {
  id: string
  description: string
  cast_text: string
  genres: string
  kind: string
  year: number
  rating: string
  quality: string
}

const EVENT = "app:series-info-changed"

const FALLBACK: SeriesInfo = {
  id: "fallback",
  description:
    "El método para crear embudos gamificados que convierten. Domina los Agentes GPTs, construye tu estructura con producción de contenido audiovisual cinematográfico y entra en la comunidad VIP.",
  cast_text: "Los 144000",
  genres: "Marketing Digital, Embudos Cinematográficos, Gamificación",
  kind: "Informativa, Estratégica",
  year: 2026,
  rating: "+18",
  quality: "HD",
}

export function useSeriesInfo() {
  const [info, setInfo] = useState<SeriesInfo>(FALLBACK)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/series-info", { credentials: "include" })
      if (!res.ok) {
        setLoading(false)
        return
      }
      const data = (await res.json()) as { info: SeriesInfo | null }
      if (data.info) setInfo(data.info)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    if (typeof window === "undefined") return
    const handler = () => refresh()
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [refresh])

  const update = useCallback(
    async (patch: Partial<SeriesInfo>) => {
      const res = await fetch("/api/admin/series-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      await refresh()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(EVENT))
      }
    },
    [refresh],
  )

  return { info, loading, refresh, update }
}
