"use client"

// Hook useSeasonAccess() — busca lista de season_ids que o user atual
// tem acesso. Helper hasAccess(id) retorna boolean.

import { useCallback, useEffect, useState } from "react"

const EVENT = "app:season-access-changed"

export function useSeasonAccess() {
  const [seasonIds, setSeasonIds] = useState<Set<string>>(new Set())
  const [isAdminOverride, setIsAdminOverride] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/season-access", { credentials: "include" })
      if (!res.ok) {
        setSeasonIds(new Set())
        return
      }
      const data = (await res.json()) as { season_ids: string[]; is_admin_override?: boolean }
      setSeasonIds(new Set(data.season_ids ?? []))
      setIsAdminOverride(!!data.is_admin_override)
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

  const hasAccess = useCallback(
    (seasonId: string | undefined | null) => {
      if (!seasonId) return true // sem id = season estática (fallback) — libera
      return seasonIds.has(seasonId)
    },
    [seasonIds],
  )

  return { seasonIds, hasAccess, isAdminOverride, loading, refresh }
}
