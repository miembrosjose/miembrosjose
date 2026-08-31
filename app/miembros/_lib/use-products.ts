"use client"

// Hook useProducts() — busca produtos da Tienda do banco + CRUD admin.
// Mesmo padrão de useSeasons. Sincroniza via CustomEvent "app:products-changed".

import { useCallback, useEffect, useState } from "react"

export type DbProduct = {
  id: string
  num: number
  name: string
  description: string | null
  media_url: string | null
  video_url: string | null
  thumb_url: string | null
  gradient: string
  emoji: string
  sort_order: number
  is_locked: boolean
  checkout_url: string | null
  /** Si está definido (ej. "Diciembre 2026"), el producto se muestra como
   *  "Disponible a partir de …" (próximamente), no comprable todavía. */
  available_from: string | null
  created_at: string
  updated_at: string
}

const EVENT = "app:products-changed"
function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT))
}

export function useProducts() {
  const [products, setProducts] = useState<DbProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/products", { credentials: "include" })
      if (!res.ok) {
        setLoading(false)
        return
      }
      const data = (await res.json()) as { products: DbProduct[] }
      setProducts(data.products ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
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

  const createProduct = useCallback(
    async (payload: Partial<DbProduct>) => {
      const res = await fetch("/api/admin/products", {
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
    [refresh],
  )

  const updateProduct = useCallback(
    async (id: string, patch: Partial<DbProduct>) => {
      const res = await fetch(`/api/admin/products/${id}`, {
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

  const deleteProduct = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/products/${id}`, {
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

  return { products, loading, error, refresh, createProduct, updateProduct, deleteProduct }
}
