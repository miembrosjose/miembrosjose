"use client"

// Hook useProductModules(productId) — módulos de um produto.
// Mesmo padrão do useEpisodes.

import { useCallback, useEffect, useState } from "react"

export type DbModule = {
  id: string
  product_id: string
  num: number
  title: string
  description: string | null
  video_url: string | null
  thumb_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

const EVENT = "app:product-modules-changed"
function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT))
}

export function useProductModules(productId: string | null) {
  const [modules, setModules] = useState<DbModule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!productId) { setModules([]); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/products/${productId}/modules`, { credentials: "include" })
      if (!res.ok) { setModules([]); return }
      const data = (await res.json()) as { modules: DbModule[] }
      setModules(data.modules ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    refresh()
    if (typeof window === "undefined") return
    const handler = () => refresh()
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [refresh])

  const createModule = useCallback(
    async (payload: Partial<DbModule>) => {
      if (!productId) throw new Error("productId obrigatório")
      const res = await fetch(`/api/admin/products/${productId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      await refresh()
      emit()
    },
    [productId, refresh],
  )

  const updateModule = useCallback(async (id: string, patch: Partial<DbModule>) => {
    const res = await fetch(`/api/admin/modules/${id}`, {
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
  }, [refresh])

  const deleteModule = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/modules/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || `HTTP ${res.status}`)
    }
    await refresh()
    emit()
  }, [refresh])

  return { modules, loading, error, refresh, createModule, updateModule, deleteModule }
}
