"use client"

// Hook useEpisodes(seasonId) — busca episodios do banco, sincroniza
// múltiplas instâncias via CustomEvent "app:episodes-changed".

import { useCallback, useEffect, useState } from "react"

export type DbEpisode = {
  id: string
  season_id: string
  num: number
  title: string
  description: string | null
  video_url: string | null
  thumb_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

const EVENT = "app:episodes-changed"
function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT))
}

export function useEpisodes(seasonId: string | null) {
  const [episodes, setEpisodes] = useState<DbEpisode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!seasonId) {
      setEpisodes([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/episodes`, { credentials: "include" })
      if (!res.ok) {
        setEpisodes([])
        return
      }
      const data = (await res.json()) as { episodes: DbEpisode[] }
      setEpisodes(data.episodes ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [seasonId])

  useEffect(() => {
    refresh()
    if (typeof window === "undefined") return
    const handler = () => refresh()
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [refresh])

  const createEpisode = useCallback(
    async (payload: Partial<DbEpisode>) => {
      if (!seasonId) throw new Error("seasonId obrigatório")
      const res = await fetch(`/api/admin/seasons/${seasonId}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      await refresh() // refresh local imediato pra garantir UI atualizada
      emit()          // notifica outras instâncias (drawer dos membros)
    },
    [seasonId, refresh],
  )

  const updateEpisode = useCallback(
    async (id: string, patch: Partial<DbEpisode>) => {
      const res = await fetch(`/api/admin/episodes/${id}`, {
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
      emit()
    },
    [refresh],
  )

  const deleteEpisode = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/episodes/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      await refresh()
      emit()
    },
    [refresh],
  )

  return { episodes, loading, error, refresh, createEpisode, updateEpisode, deleteEpisode }
}
