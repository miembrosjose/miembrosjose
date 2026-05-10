"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Captura erros globais do navegador que o React não pega sozinho
// e loga em funnel_events pra investigação (event_type = "js_error").
//
// Desligado em /miembros/* e /dashboard/* — área de membros é pra alunos
// pagos (não-funil) e dashboard é interno; nenhum dos dois deve emitir
// eventos de tracking/observability pro funnel_events.
export function ErrorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/miembros" ||
      pathname.startsWith("/miembros/")
    ) {
      return
    }

    // Evita logar o mesmo erro várias vezes na mesma sessão
    const seen = new Set<string>()

    const send = (payload: {
      kind: string
      message: string
      source?: string
      line?: number
      col?: number
      stack?: string
    }) => {
      const key = payload.kind + "|" + payload.message + "|" + (payload.source || "")
      if (seen.has(key)) return
      seen.add(key)
      if (seen.size > 20) return // guarda contra loop de erro

      try {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            session_id: "jserr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
            page: typeof window !== "undefined" ? window.location.pathname : "/unknown",
            event_type: "js_error",
            form_data: {
              kind: payload.kind,
              message: (payload.message || "").slice(0, 500),
              source: (payload.source || "").slice(0, 300),
              line: payload.line ?? null,
              col: payload.col ?? null,
              stack: (payload.stack || "").slice(0, 1000),
              user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : "",
            },
          }),
        }).catch(() => {})
      } catch {}
    }

    const onError = (ev: ErrorEvent) => {
      send({
        kind: "error",
        message: ev.message || "unknown",
        source: ev.filename,
        line: ev.lineno,
        col: ev.colno,
        stack: ev.error?.stack,
      })
    }

    const onRejection = (ev: PromiseRejectionEvent) => {
      const reason = ev.reason
      const msg =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : JSON.stringify(reason)?.slice(0, 500) || "unknown"
      send({
        kind: "unhandledrejection",
        message: msg,
        stack: reason instanceof Error ? reason.stack : undefined,
      })
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)

    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [pathname])

  return null
}
