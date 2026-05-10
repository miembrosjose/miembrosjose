"use client"

// Provider global de presence — Supabase Realtime channel "online_members_v1".
//
// Uma única conexão pra todo o /miembros. O hook useOnlinePresence() expõe
// a lista de membros online (pro widget). O hook useIsOnline(userId) expõe
// só um boolean (pra Avatar/Leaderboard mostrarem borda verde sem precisar
// receber a lista inteira). Ambos compartilham o mesmo state interno —
// 1 channel só, vários consumers.
//
// Track: chamado UMA VEZ quando user loga. Re-track só se metadata mudar
// (mudou avatar, badge featured, etc) — refresh do auth dispara via deps
// do useEffect.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useAuth } from "./auth-context"
import { api } from "./api"
import { buildAvatarLetters } from "./format"
import type { XpMe } from "./types"

const CHANNEL_NAME = "online_members_v1"

export type OnlineMember = {
  user_id: string
  full_name: string
  username: string | null
  avatar_url: string | null
  initials: string
  level: number
  badge_id: string | null
  star_id: string | null
  flame_id: string | null
  is_admin: boolean
  online_at: number
}

type OnlinePresenceContextValue = {
  members: OnlineMember[]
  onlineSet: Set<string>
}

const EMPTY_VALUE: OnlinePresenceContextValue = {
  members: [],
  onlineSet: new Set(),
}

const OnlinePresenceContext = createContext<OnlinePresenceContextValue>(EMPTY_VALUE)

export function OnlinePresenceProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth()
  const [members, setMembers] = useState<OnlineMember[]>([])
  // Set de user_ids vistos no sync anterior — pra detectar quem ENTROU agora
  // (presença nova = não estava no sync anterior). Evita disparar toast pra
  // todos no primeiro load (quando previousIds é vazio, só popula sem disparar).
  const previousIdsRef = useRef<Set<string> | null>(null)

  // Stringify do metadata relevante pra disparar re-track quando mudam
  // (avatar trocado, featured_badge atualizado etc). Sem isso, o card antigo
  // ficaria estático até o user fechar e abrir a aba.
  const metaKey = useMemo(() => {
    if (!user) return ""
    const m = (user.user_metadata || {}) as Record<string, unknown>
    return [
      m.full_name,
      m.name,
      m.username,
      m.avatar_url,
      m.featured_badge_id,
      m.featured_star_id,
      m.featured_flame_id,
    ].join("|")
  }, [user])

  useEffect(() => {
    if (!user) {
      setMembers([])
      return
    }

    const meta = (user.user_metadata || {}) as {
      full_name?: string
      name?: string
      avatar_url?: string
      username?: string
      featured_badge_id?: string
      featured_star_id?: string
      featured_flame_id?: string
    }

    let cancelled = false
    const supabase = getSupabaseBrowser()
    let activeChannel: ReturnType<typeof supabase.channel> | null = null

    async function setup() {
      // Level — mesma fonte do XpBadge. Se falhar, segue com 1 (não bloqueia).
      let level = 1
      try {
        const xp = await api<XpMe>("/api/xp/me")
        if (xp?.level) level = xp.level
      } catch {
        // segue
      }
      if (cancelled || !user) return

      const fullName =
        meta.full_name || meta.name || user.email?.split("@")[0] || "Miembro"
      const myPayload: OnlineMember = {
        user_id: user.id,
        full_name: fullName,
        username: meta.username || null,
        avatar_url: meta.avatar_url || null,
        initials: buildAvatarLetters(fullName),
        level,
        badge_id: isAdmin ? "admin_seal" : meta.featured_badge_id || "welcome",
        star_id: meta.featured_star_id || null,
        flame_id: meta.featured_flame_id || null,
        is_admin: isAdmin,
        online_at: Date.now(),
      }

      // Key = user.id → cada user ocupa 1 slot mesmo com várias abas abertas.
      const channel = supabase.channel(CHANNEL_NAME, {
        config: { presence: { key: user.id } },
      })
      activeChannel = channel

      channel
        .on("presence", { event: "sync" }, () => {
          if (cancelled) return
          const state = channel.presenceState() as Record<string, OnlineMember[]>
          const list: OnlineMember[] = []
          for (const key of Object.keys(state)) {
            const first = state[key][0]
            if (first && first.user_id) list.push(first)
          }
          // Próprio user no topo, depois mais recentes
          list.sort((a, b) => {
            if (a.user_id === user.id) return -1
            if (b.user_id === user.id) return 1
            return b.online_at - a.online_at
          })

          // Detecta users que entraram AGORA (não estavam no sync anterior).
          // No primeiro sync, previousIdsRef é null — só popula, sem disparar
          // toasts (senão a cada login o user veria toast pra todo mundo
          // que já estava online, o que é spam).
          const currentIds = new Set(list.map((m) => m.user_id))
          const previous = previousIdsRef.current
          if (previous !== null) {
            for (const m of list) {
              if (m.user_id === user.id) continue // não toast pra self
              if (!previous.has(m.user_id)) {
                window.dispatchEvent(
                  new CustomEvent("app:user-online", { detail: m }),
                )
              }
            }
          }
          previousIdsRef.current = currentIds

          setMembers(list)
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && !cancelled) {
            await channel.track(myPayload)
          }
        })
    }

    setup()

    return () => {
      cancelled = true
      if (activeChannel) supabase.removeChannel(activeChannel)
    }
    // metaKey força re-track quando avatar/badge/etc mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, metaKey])

  // Set de user_ids derivado da lista — pra useIsOnline ser O(1)
  const onlineSet = useMemo(() => {
    const s = new Set<string>()
    for (const m of members) s.add(m.user_id)
    return s
  }, [members])

  const value = useMemo<OnlinePresenceContextValue>(
    () => ({ members, onlineSet }),
    [members, onlineSet],
  )

  return (
    <OnlinePresenceContext.Provider value={value}>
      {children}
    </OnlinePresenceContext.Provider>
  )
}

/** Lista completa de membros online + Set de user_ids. Usado pelo widget. */
export function useOnlinePresence(): OnlinePresenceContextValue {
  return useContext(OnlinePresenceContext)
}

/** Boolean rápido — usar em Avatar/Leaderboard pra mostrar borda verde. */
export function useIsOnline(userId: string | null | undefined): boolean {
  const { onlineSet } = useContext(OnlinePresenceContext)
  if (!userId) return false
  return onlineSet.has(userId)
}

/** Estilo CSS pra borda verde online — reusado em Avatar e Leaderboard.
 *  Adiciona ring externo + glow sutil. Combina via box-shadow (não conflita
 *  com border existente). */
export const ONLINE_BOX_SHADOW = "0 0 0 2px #22c55e, 0 0 8px rgba(34, 197, 94, 0.5)"
