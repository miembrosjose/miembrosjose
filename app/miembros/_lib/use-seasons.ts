"use client"

// Hook useSeasons() — busca temporadas do banco com fallback pro array
// estático SEASONS (quando o banco ainda não tem nada ou falha por algum
// motivo). Também expõe ações de admin: create, update, delete.
//
// Sincroniza múltiplas instâncias do hook (carrossel + modal admin) via
// CustomEvent "app:seasons-changed" — toda mutação dispara o evento,
// outras instâncias re-fetcham.

import { useCallback, useEffect, useState } from "react"
import { SEASONS as STATIC_SEASONS, type Season } from "./seasons"

const SEASONS_CHANGED_EVENT = "app:seasons-changed"

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SEASONS_CHANGED_EVENT))
  }
}

type DbSeason = {
  id: string
  num: number
  name: string
  episodes: number
  starter: boolean
  external: boolean
  redirect_url: string | null
  video_bg: string | null
  gradient: string
  emoji: string
  sort_order: number
  is_locked?: boolean
  checkout_url?: string | null
}

function dbToSeason(s: DbSeason): ManagedSeason {
  return {
    id: s.id,
    num: s.num,
    name: s.name,
    episodes: s.episodes,
    starter: s.starter || undefined,
    external: s.external || undefined,
    redirectUrl: s.redirect_url ?? undefined,
    videoBg: s.video_bg ?? undefined,
    gradient: s.gradient,
    emoji: s.emoji,
    is_locked: !!s.is_locked,
    checkout_url: s.checkout_url ?? null,
    sort_order: s.sort_order,
  }
}

export type ManagedSeason = Season & {
  id: string
  is_locked?: boolean
  checkout_url?: string | null
  sort_order?: number
}

export function useSeasons() {
  const [seasons, setSeasons] = useState<ManagedSeason[]>(
    STATIC_SEASONS.map((s, i) => ({ ...s, id: `static-${i}` })),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/seasons", { credentials: "include" })
      if (!res.ok) {
        // 401/etc = não logado ou erro de rede → mantém fallback estático
        // pra não deixar a tela em branco. Não atualiza seasons.
        setLoading(false)
        return
      }
      // Request OK: sempre usa o que veio do banco — MESMO que seja []
      // (admin pode ter deletado tudo). Senão fica fallback fantasma com
      // IDs "static-X" e ações tipo "criar episodio" falham.
      const data = (await res.json()) as { seasons: DbSeason[] }
      setSeasons((data.seasons ?? []).map(dbToSeason))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    // Re-fetcha quando outra instância do hook fizer mutation
    if (typeof window === "undefined") return
    const handler = () => refresh()
    window.addEventListener(SEASONS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(SEASONS_CHANGED_EVENT, handler)
  }, [refresh])

  const createSeason = useCallback(
    async (payload: Partial<DbSeason>) => {
      const res = await fetch("/api/admin/seasons", {
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
      emitChange()
    },
    [refresh],
  )

  const updateSeason = useCallback(
    async (id: string, patch: Partial<DbSeason>) => {
      const res = await fetch(`/api/admin/seasons/${id}`, {
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
      emitChange()
    },
    [refresh],
  )

  const deleteSeason = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/seasons/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      await refresh()
      emitChange()
    },
    [refresh],
  )

  return { seasons, loading, error, refresh, createSeason, updateSeason, deleteSeason }
}
