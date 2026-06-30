"use client"

// Drawer Netflix-style do PRODUTO: hero com nome + thumb + lista de módulos.
// Click num módulo → abre player overlay com vídeo + blocks above/below.

import { ChevronLeft, Play, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useProductModules, type DbModule } from "../_lib/use-product-modules"
import { ModuleBlocksView } from "./ModuleBlocksView"
import type { DbProduct } from "../_lib/use-products"

type Props = {
  product: DbProduct | null
  onClose: () => void
}

export function ProductDrawer({ product, onClose }: Props) {
  const { modules, loading } = useProductModules(product?.id ?? null)
  const [playingModule, setPlayingModule] = useState<DbModule | null>(null)

  // Trava body scroll
  useEffect(() => {
    if (!product) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [product])

  // Esc fecha player ou drawer
  useEffect(() => {
    if (!product) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (playingModule) setPlayingModule(null)
      else onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [product, playingModule, onClose])

  if (!product) return null

  return (
    <>
      {/* Drawer principal (lista de módulos) — esconde quando player aberto */}
      {!playingModule && (
        <div
          className="fixed inset-0 z-[150] overflow-y-auto bg-[#050510]/95 backdrop-blur-sm"
          role="dialog"
          aria-label={product.name}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <div className="relative mx-auto mt-10 mb-10 max-w-4xl border border-[#251f30] bg-[#0a0a18]"
               style={{ borderRadius: 18 }}>
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-[#050510]/80 p-2 text-[#F3F6FA] backdrop-blur transition-colors hover:bg-[#251f30]"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>

            {/* Hero */}
            <div
              className="relative h-72 overflow-hidden"
              style={{ borderRadius: "18px 18px 0 0", background: product.gradient }}
            >
              {product.thumb_url && (
                /\.(mp4|webm|mov)(\?|$)/i.test(product.thumb_url) ? (
                  <video src={product.thumb_url} autoPlay muted loop playsInline
                         className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.thumb_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a18] via-[#0a0a18]/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h1 className="text-3xl font-bold text-[#F3F6FA] [font-family:var(--font-cinzel)]">
                  {product.name}
                </h1>
                {product.description && (
                  <p className="mt-2 max-w-2xl text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
                    {product.description}
                  </p>
                )}
              </div>
            </div>

            {/* Lista de módulos */}
            <div className="p-6 space-y-3">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca] [font-family:var(--font-mono)]">
                Módulos · {modules.length}
              </h2>

              {loading && (
                <p className="text-center text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">Cargando módulos...</p>
              )}

              {!loading && modules.length === 0 && (
                <p className="text-center text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
                  No hay módulos disponibles en este producto todavía.
                </p>
              )}

              <ul className="space-y-2">
                {modules.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setPlayingModule(m)}
                      className="group flex w-full items-center gap-4 border border-[#251f30] bg-[#14142a]/50 p-3 text-left transition-colors hover:border-[#6D4A9B]/50 hover:bg-[#14142a]"
                      style={{ borderRadius: 12 }}
                    >
                      <div className="flex h-16 w-24 flex-shrink-0 items-center justify-center overflow-hidden bg-[#6D4A9B]/15 text-base font-bold text-[#a78bca] [font-family:var(--font-mono)]"
                           style={{ borderRadius: 8 }}>
                        {m.thumb_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.thumb_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          String(m.num).padStart(2, "0")
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a78bca] [font-family:var(--font-mono)]">
                          Módulo {String(m.num).padStart(2, "0")}
                        </div>
                        <div className="text-base font-bold text-[#F3F6FA] truncate [font-family:var(--font-cinzel)]">
                          {m.title}
                        </div>
                        {m.description && (
                          <div className="text-xs text-[#a8a8c0] truncate [font-family:var(--font-geist-sans)]">
                            {m.description}
                          </div>
                        )}
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center bg-[#6D4A9B]/15 text-[#a78bca] transition-colors group-hover:bg-[#6D4A9B] group-hover:text-[#F3F6FA]"
                           style={{ borderRadius: 999 }}>
                        <Play size={16} fill="currentColor" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Player overlay (3º nível) */}
      {playingModule && (
        <ModulePlayerOverlay
          mod={playingModule}
          onClose={() => setPlayingModule(null)}
        />
      )}
    </>
  )
}

// ─── Player overlay: vídeo + blocks above/below ────────────────────────

function ModulePlayerOverlay({ mod, onClose }: { mod: DbModule; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[160] overflow-y-auto bg-[#050510]/98 backdrop-blur-sm"
         role="dialog" aria-label={mod.title}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back + close */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-[#F3F6FA]"
          >
            <ChevronLeft size={18} />
            <span className="text-xs uppercase tracking-[0.2em] [font-family:var(--font-mono)]">Volver</span>
          </button>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#a78bca] [font-family:var(--font-mono)]">
            Módulo {String(mod.num).padStart(2, "0")}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-[#F3F6FA]"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <h1 className="mb-6 text-3xl font-bold text-[#F3F6FA] [font-family:var(--font-cinzel)]">
          {mod.title}
        </h1>

        {/* Blocks acima */}
        <ModuleBlocksView moduleId={mod.id} position="above_video" />

        {/* Vídeo (vários formatos suportados) */}
        {mod.video_url ? (
          <div className="relative aspect-video w-full overflow-hidden bg-black"
               style={{ borderRadius: 12 }}>
            <VideoPlayer url={mod.video_url} title={mod.title} />
          </div>
        ) : (
          <div className="aspect-video w-full flex items-center justify-center bg-[#14142a] text-sm text-[#a8a8c0] [font-family:var(--font-mono)]"
               style={{ borderRadius: 12 }}>
            Sin video configurado
          </div>
        )}

        {/* Blocks abaixo */}
        <ModuleBlocksView moduleId={mod.id} position="below_video" />
      </div>
    </div>
  )
}

// Player que detecta formato (mp4 direto, embed Bunny/YouTube/Stream, ConverteAI snippet, etc)
function VideoPlayer({ url, title }: { url: string; title: string }) {
  // Snippet ConverteAI/VTurb
  const converteai = url.match(/scripts\.converteai\.net\/([a-f0-9-]{8,})\/players\/([a-f0-9-]{8,})\/v4\/(?:player|embed)/i)
  if (converteai) {
    const src = `https://scripts.converteai.net/${converteai[1]}/players/${converteai[2]}/v4/embed.html`
    return (
      <iframe
        src={src}
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        referrerPolicy="origin"
        title={title}
        className="absolute inset-0 h-full w-full border-0"
      />
    )
  }

  // Arquivo direto
  if (/^https?:\/\//i.test(url) && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) {
    return (
      <video src={url} controls autoPlay playsInline className="h-full w-full" />
    )
  }

  // Outra URL externa (YouTube embed, Vimeo, Bunny, etc)
  if (/^https?:\/\//i.test(url)) {
    return (
      <iframe
        src={url}
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
        referrerPolicy="strict-origin-when-cross-origin"
        title={title}
        className="absolute inset-0 h-full w-full border-0"
      />
    )
  }

  // Fallback: nada reconhecido
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-[#a8a8c0]">
      URL de video no reconocida: {url}
    </div>
  )
}
