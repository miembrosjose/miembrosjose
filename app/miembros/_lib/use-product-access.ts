"use client"

// Hook useProductAccess() — lista de product_ids que o user tem acesso.

import { useCallback, useEffect, useState } from "react"

const EVENT = "app:product-access-changed"

export function useProductAccess() {
  const [productIds, setProductIds] = useState<Set<string>>(new Set())
  const [isAdminOverride, setIsAdminOverride] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/product-access", { credentials: "include" })
      if (!res.ok) {
        setProductIds(new Set())
        return
      }
      const data = (await res.json()) as { product_ids: string[]; is_admin_override?: boolean }
      setProductIds(new Set(data.product_ids ?? []))
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
    (productId: string | undefined | null) => {
      if (!productId) return false
      return productIds.has(productId)
    },
    [productIds],
  )

  return { productIds, hasAccess, isAdminOverride, loading, refresh }
}
