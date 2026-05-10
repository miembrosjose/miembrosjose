"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { FUNNEL_PREFETCH } from "@/lib/funnel-prefetch"

/**
 * Componente híbrido que aplica prefetch agressivo da próxima rota do funil.
 *
 * Arquitetura em 3 camadas:
 *  1. Critical → <link rel="preload"> RENDERIZADO NO JSX (vai no SSR HTML).
 *     Browser começa a baixar IMEDIATAMENTE, antes da hidratação React.
 *     Esse é o ganho principal vs. createElement em useEffect (~300-500ms).
 *
 *  2. Likely → <link rel="prefetch"> em useEffect via requestIdleCallback.
 *     Baixa quando browser fica idle — sem competir com critical assets.
 *
 *  3. router.prefetch() do Next.js — pre-render do HTML/JS da próxima rota.
 *
 * Uso: <FunnelPrefetcher route="/call" /> em cada página do funil.
 */
export function FunnelPrefetcher({ route }: { route: string }) {
  const router = useRouter()
  const config = FUNNEL_PREFETCH[route]

  useEffect(() => {
    if (!config) return

    const createdLinks: HTMLLinkElement[] = []

    // ── Camada 2: likely → prefetch idle ─────────────────────────
    const runLikely = () => {
      config.likely.forEach((asset) => {
        const link = document.createElement("link")
        link.rel = "prefetch"
        link.href = asset.href
        link.as = asset.as
        if (asset.as === "video" || asset.as === "audio" || asset.as === "image") {
          link.crossOrigin = "anonymous"
        }
        try {
          ;(link as HTMLLinkElement & { fetchPriority?: string }).fetchPriority = "low"
        } catch {}
        document.head.appendChild(link)
        createdLinks.push(link)
      })
    }

    type IdleWindow = typeof window & { requestIdleCallback?: (cb: () => void) => number }
    const w = window as IdleWindow
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(runLikely)
    } else {
      setTimeout(runLikely, 1500)
    }

    // ── Camada 3: SPA prefetch (HTML/JS da próxima rota) ─────────
    if (config.nextRoute) {
      router.prefetch(config.nextRoute)
    }

    return () => {
      createdLinks.forEach((link) => {
        if (link.parentNode) link.parentNode.removeChild(link)
      })
    }
  }, [route, router, config])

  if (!config) return null

  // ── Camada 1: critical → preload renderizado no JSX ──────────
  // Vai no SSR HTML, browser começa a baixar antes de hidratar React.
  return (
    <>
      {config.critical.map((asset) => {
        const needsCors = asset.as === "video" || asset.as === "audio" || asset.as === "image"
        return (
          <link
            key={asset.href}
            rel="preload"
            href={asset.href}
            as={asset.as}
            crossOrigin={needsCors ? "anonymous" : undefined}
            fetchPriority="high"
          />
        )
      })}
    </>
  )
}
