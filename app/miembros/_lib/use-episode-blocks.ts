"use client"

// Hook useEpisodeBlocks(episodeId) — blocos de texto editáveis dentro
// de um episódio. Posições: above_video | below_video. Ordem livre dentro
// de cada posição via sort_order.

import { useCallback, useEffect, useState } from "react"

export type BlockPosition = "above_video" | "below_video"

export type DbBlock = {
  id: string
  episode_id: string
  position: BlockPosition
  sort_order: number
  content: string
  kind: string
  created_at: string
  updated_at: string
}

const EVENT = "app:blocks-changed"
function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT))
}

export function useEpisodeBlocks(episodeId: string | null) {
  const [blocks, setBlocks] = useState<DbBlock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!episodeId) {
      setBlocks([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/episodes/${episodeId}/blocks`, { credentials: "include" })
      if (!res.ok) {
        setBlocks([])
        return
      }
      const data = (await res.json()) as { blocks: DbBlock[] }
      setBlocks(data.blocks ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [episodeId])

  useEffect(() => {
    refresh()
    if (typeof window === "undefined") return
    const handler = () => refresh()
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [refresh])

  const createBlock = useCallback(
    async (position: BlockPosition, content = "", sortOrder = 0) => {
      if (!episodeId) throw new Error("episodeId obrigatório")
      const res = await fetch(`/api/admin/episodes/${episodeId}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ position, content, sort_order: sortOrder }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      await refresh()
      emit()
    },
    [episodeId, refresh],
  )

  const updateBlock = useCallback(
    async (id: string, patch: Partial<DbBlock>) => {
      const res = await fetch(`/api/admin/blocks/${id}`, {
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

  const deleteBlock = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/blocks/${id}`, {
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

  // Helpers de leitura por posição (mantém ordem)
  const aboveVideo = blocks.filter((b) => b.position === "above_video").sort((a, b) => a.sort_order - b.sort_order)
  const belowVideo = blocks.filter((b) => b.position === "below_video").sort((a, b) => a.sort_order - b.sort_order)

  return {
    blocks,
    aboveVideo,
    belowVideo,
    loading,
    error,
    refresh,
    createBlock,
    updateBlock,
    deleteBlock,
  }
}
