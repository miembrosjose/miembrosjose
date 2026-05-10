"use client"

import { useEffect, useState, type ReactNode } from "react"

/**
 * Shell cinematográfico compartilhado entre /creativos, /andromeda, /analytics, /embudo.
 * Aplica:
 *  - Background dark profundo (oklch 0.07)
 *  - 3 camadas de overlay: vinheta radial + spot dourado + spot vermelho
 *  - Frame brackets nos 4 cantos da viewport
 *  - Linhas vermelhas no topo e base
 *  - Studio mark "[BRAND_NAME]" canto superior esquerdo
 *  - Frame counter custom no canto superior direito
 *
 * Quando renderizado dentro de iframe (popup da area de membros), esconde
 * studio mark + frame counter automaticamente — o popup parent já tem header
 * próprio, evita duplicação visual.
 *
 * Estética unificada com a área de membros (miembros.SEU_DOMINIO.com).
 */
export function CinematicShell({
  children,
  frameLabel = "PRODUCTO PREMIUM",
}: {
  children: ReactNode
  frameLabel?: string
}) {
  // Detecta se está renderizado dentro de iframe (popup da area de membros)
  const [isInIframe, setIsInIframe] = useState(false)
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top)
    } catch {
      // Cross-origin frame access throws — assumimos iframe
      setIsInIframe(true)
    }
  }, [])

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#0a0a0f] text-[#f5f5f7] selection:bg-red-900/40">
      {/* ── Vinheta radial cinematográfica ──────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.85)_100%)]" />

      {/* ── Spot dourado lateral esquerdo ───────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_15%_30%,rgba(201,169,97,0.06),transparent_70%)]" />

      {/* ── Spot vermelho lateral direito ───────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_85%_60%,rgba(127,29,29,0.12),transparent_70%)]" />

      {/* ── Frame brackets fixos nos 4 cantos da viewport ───── */}
      {!isInIframe && (
        <>
          <FrameBracket pos="top-left" />
          <FrameBracket pos="top-right" />
          <FrameBracket pos="bottom-left" />
          <FrameBracket pos="bottom-right" />
        </>
      )}

      {/* ── Linhas vermelhas no topo e base ─────────────────── */}
      {!isInIframe && (
        <>
          <div className="pointer-events-none fixed inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-red-900/60 to-transparent" />
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-red-900/60 to-transparent" />
        </>
      )}

      {/* ── Studio mark + frame counter (escondido em iframe — popup parent
            ja tem header proprio) ──────────────────────────── */}
      {!isInIframe && (
        <>
          <div className="pointer-events-none fixed left-5 top-6 z-30 flex items-center gap-3 sm:left-6">
            <span className="block h-4 w-px flex-shrink-0 bg-red-900/70" />
            <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.5em] text-neutral-400 [font-family:var(--font-geist-sans)]">
              [BRAND_NAME]
            </span>
          </div>

          <div className="pointer-events-none fixed right-5 top-6 z-30 hidden items-center gap-3 sm:flex sm:right-6">
            <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.5em] text-neutral-500 [font-family:var(--font-geist-sans)]">
              {frameLabel}
            </span>
            <span className="block h-4 w-px flex-shrink-0 bg-red-900/70" />
          </div>
        </>
      )}

      {/* ── Conteúdo da página ──────────────────────────────── */}
      <div className="relative z-20">{children}</div>
    </div>
  )
}

function FrameBracket({ pos }: { pos: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const isTop = pos.startsWith("top")
  const isLeft = pos.endsWith("left")
  const positionClass = `${isTop ? "top-4 sm:top-6" : "bottom-4 sm:bottom-6"} ${isLeft ? "left-4 sm:left-6" : "right-4 sm:right-6"}`
  return (
    <div className={`pointer-events-none fixed z-10 ${positionClass} h-6 w-6 sm:h-8 sm:w-8`}>
      <div className={`absolute h-px w-full bg-red-900/40 ${isTop ? "top-0" : "bottom-0"}`} />
      <div className={`absolute h-full w-px bg-red-900/40 ${isLeft ? "left-0" : "right-0"}`} />
    </div>
  )
}
