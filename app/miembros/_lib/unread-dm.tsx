"use client"

// Provider global de contagem de mensagens diretas não lidas.
// Usado pelo badge no Navbar (item "Mensajes").
//
// Estratégia:
//  - Fetch inicial via /api/dm/threads (soma unread_count das threads).
//  - Realtime: postgres_changes em direct_messages (INSERT WHERE recipient = me)
//    incrementa o contador.
//  - Quando user abre uma thread, ViewMessages chama /api/dm/read e essa
//    chamada por sua vez gera UPDATE em direct_messages (read_at preenchido)
//    que NÃO podemos detectar via realtime sem subscribe próprio. Solução:
//    expor `refresh()` pra ViewMessages chamar após mark-read.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useAuth } from "./auth-context"
import { api } from "./api"

type UnreadDMContextValue = {
  count: number
  refresh: () => Promise<void>
}

const UnreadDMContext = createContext<UnreadDMContextValue>({
  count: 0,
  refresh: async () => {},
})

export function UnreadDMProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ threads: Array<{ unread_count: number }> }>(
        "/api/dm/threads",
      )
      if (!mountedRef.current) return
      const total = (data.threads || []).reduce((sum, t) => sum + (t.unread_count || 0), 0)
      setCount(total)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    if (!user) {
      setCount(0)
      return
    }

    refresh()

    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel(`unread-dm-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          // Ao receber nova msg, incrementa local. Refetch ocasional sincroniza.
          setCount((c) => c + 1)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          // read_at preenchido → nossa marca-como-lida. Refetch totalCount.
          const updated = payload.new as { read_at: string | null }
          if (updated.read_at) refresh()
        },
      )
      .subscribe()

    return () => {
      mountedRef.current = false
      supabase.removeChannel(channel)
    }
  }, [user, refresh])

  return (
    <UnreadDMContext.Provider value={{ count, refresh }}>
      {children}
    </UnreadDMContext.Provider>
  )
}

export function useUnreadDM(): UnreadDMContextValue {
  return useContext(UnreadDMContext)
}
