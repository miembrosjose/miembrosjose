"use client"

// Widget Crisp — só renderiza dentro de /miembros (decisão do user, 07/05/2026).
// Carrega o snippet oficial via window.$crisp + injeta script externo client.crisp.chat/l.js.
// Quando user logado: passa email/nome/user_id/plano/level pro atendente já ver tudo.
//
// Env: NEXT_PUBLIC_CRISP_WEBSITE_ID (UUID Crisp). Sem ele, componente é no-op.
//
// CSP: middleware libera client.crisp.chat + wss://client.relay.crisp.chat.

import { useEffect } from "react"
import { useAuth } from "../_lib/auth-context"

// Hardcoded com fallback pra env var. ID e publico (vai pro JS do navegador
// de qualquer jeito), entao seguro committar no repo. Pra trocar em staging
// ou usar conta Crisp diferente, basta setar NEXT_PUBLIC_CRISP_WEBSITE_ID
// no Cloudflare que sobrescreve o default.
const CRISP_WEBSITE_ID =
  process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID ||
  "53ead998-3f20-4cc6-8506-43936741a55b"

declare global {
  interface Window {
    $crisp?: unknown[] & { push: (args: unknown) => void }
    CRISP_WEBSITE_ID?: string
    CRISP_TOKEN_ID?: string
  }
}

export function CrispChat() {
  const { user, isAdmin } = useAuth()

  // Boot — uma vez por sessão. Espera user estar disponível pra setar
  // CRISP_TOKEN_ID ANTES do script carregar. Sem isso, Crisp cria sessão
  // anônima a cada refresh/aba nova → cliente perde historico.
  //
  // Com CRISP_TOKEN_ID = user.id, Crisp consolida TODAS as sessões do mesmo
  // user (refresh, outro device, semanas depois) em UMA conversa única.
  // Doc: https://help.crisp.chat/en/article/how-do-i-recognize-a-user-with-the-crisp-chatbox-1k3unt2/
  useEffect(() => {
    if (!CRISP_WEBSITE_ID) return
    if (typeof window === "undefined") return
    if (window.$crisp) return // já carregado nessa aba
    if (!user) return // espera user ficar disponivel pra setar token antes do script

    window.CRISP_TOKEN_ID = user.id
    window.$crisp = [] as unknown as Window["$crisp"]
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID

    const script = document.createElement("script")
    script.src = "https://client.crisp.chat/l.js"
    script.async = true
    document.head.appendChild(script)
  }, [user])

  // Identifica user logado — passa email/nome/user_id + metadata (plano, level,
  // is_admin) pro atendente Crisp já ver no painel sem perguntar.
  // Re-roda quando user/isAdmin mudam (ex: refresh de sessão atualiza metadata).
  useEffect(() => {
    if (!CRISP_WEBSITE_ID) return
    if (typeof window === "undefined") return
    const $crisp = window.$crisp
    if (!$crisp) return

    if (!user) {
      // Logout: reseta sessão pra próximo user que logar não herdar dados
      $crisp.push(["do", "session:reset"])
      return
    }

    const meta = (user.user_metadata || {}) as {
      full_name?: string
      name?: string
      username?: string
    }
    const fullName = meta.full_name || meta.name || user.email?.split("@")[0] || "Miembro"

    if (user.email) $crisp.push(["set", "user:email", [user.email]])
    $crisp.push(["set", "user:nickname", [fullName]])

    // session:data pra atendente ver custom fields no painel
    const sessionData: Array<[string, string]> = [["user_id", user.id]]
    if (meta.username) sessionData.push(["username", meta.username])
    if (isAdmin) sessionData.push(["is_admin", "true"])
    $crisp.push(["set", "session:data", [sessionData]])
  }, [user, isAdmin])

  return null
}
