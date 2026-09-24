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

// ── LO ÚLTIMO QUE SE VIO, GUARDADO EN LA PESTAÑA ──────────────────────────
// Las temporadas —y con ellas la dirección de cada banner— llegaban siempre de
// una petición. Hasta que respondía, el carrusel enseñaba las estáticas y
// ningún banner podía siquiera empezar a bajarse: primero el JavaScript,
// después la petición, después la imagen. Tres esperas encadenadas en cada
// entrada.
//
// Guardándolas en la pestaña, la segunda visita pinta los banners de
// inmediato y la petición sigue haciéndose por detrás para traer cambios. Se
// olvida al cerrar la pestaña, así que nunca queda nada viejo pegado.
const CACHE = "los144k_temporadas"

function leerCache(): ManagedSeason[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(CACHE)
    if (!raw) return null
    const v = JSON.parse(raw) as ManagedSeason[]
    return Array.isArray(v) && v.length > 0 ? v : null
  } catch { return null }
}

function guardarCache(v: ManagedSeason[]) {
  if (typeof window === "undefined") return
  try { sessionStorage.setItem(CACHE, JSON.stringify(v)) } catch { /* cuota */ }
}

export function useSeasons() {
  const [seasons, setSeasons] = useState<ManagedSeason[]>(
    () => leerCache() ?? STATIC_SEASONS.map((s, i) => ({ ...s, id: `static-${i}` })),
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
      const listas = (data.seasons ?? []).map(dbToSeason)
      setSeasons(listas)
      guardarCache(listas)
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
