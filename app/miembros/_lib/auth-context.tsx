"use client"

// Context client-side de autenticação pra área de membros.
//
// Por que existir? No código original antigo, a sessão era checada via
// chamadas a /api/profile/role e /api/profile/owned-products, salvando em
// variáveis globais (window.CURRENT_USER, etc). Com Next.js SPA, queremos
// um único provider que mantém user + session + isAdmin em sincronia
// realtime via Supabase Auth onAuthStateChange.
//
// Uso:
//   const { user, isLoading, isAdmin } = useAuth()
//
// O provider é montado no layout.tsx de /miembros, então qualquer
// componente filho tem acesso sem precisar fazer fetch repetido.

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabase/client"

type AuthState = {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  /** Re-busca user atual do Supabase. Use após salvar mudanças em
   *  user_metadata (ex: featured_badge_id, avatar_url, full_name) pra propagar
   *  imediatamente em todos consumidores do useAuth (Navbar, etc). */
  refresh: () => Promise<void>
  /** Atualização OTIMISTA do user_metadata local (sem round-trip). Reflete
   *  imediatamente em Navbar/perfil ao trocar insignia/estrella/llama;
   *  o refresh() posterior confirma contra o servidor. */
  patchMetadata: (partial: Record<string, unknown>) => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isAdmin: false,
  refresh: async () => {},
  patchMetadata: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    // refreshSession() força um novo JWT com user_metadata atualizado.
    // getUser() sozinho retorna metadata do JWT atual (que pode estar
    // desatualizado após auth.updateUser server-side). Combo garante
    // que Navbar/avatares re-renderizem com os campos novos.
    await supabase.auth.refreshSession().catch(() => {})
    const { data } = await supabase.auth.getUser()
    setUser(data.user ?? null)
  }, [])

  const patchMetadata = useCallback((partial: Record<string, unknown>) => {
    setUser((prev) =>
      prev
        ? ({ ...prev, user_metadata: { ...(prev.user_metadata || {}), ...partial } } as User)
        : prev,
    )
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    let mounted = true

    // Estado inicial — sem chamada extra à API, só lê o token persistido
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return
      setUser(user ?? null)
      setIsLoading(false)
    })

    // Realtime: login/logout/refresh em outras abas atualiza aqui
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // is_admin vem em raw_app_meta_data (definido no Supabase Auth, não em user_metadata)
  // Mesmo critério usado em lib/admin.ts no server.
  const isAdmin = Boolean(
    (user?.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true,
  )

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, refresh, patchMetadata }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
