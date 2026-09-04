"use client"

// Admin: gestiona el VIDEO DE FONDO del Portal de Ingreso ("Antes del Llamado").
// Sube a R2 con uploadMedia (igual que el fondo de una temporada) y guarda la
// URL en site_texts (key "portal.ingreso.video"). Se renderiza dentro del modal
// "Gestionar temporadas".

import { useEffect, useRef, useState } from "react"
import { Upload, Trash2, Loader2, Film } from "lucide-react"
import { uploadMedia } from "../_lib/media-upload"

export function PortalIngresoBannerManager({
  storeKey = "portal.ingreso.video",
  title = "Portal de Ingreso — Video de fondo",
  hint = "Banner del “Antes del Llamado”. Se muestra en loop, silenciado y con un velo oscuro para que el texto se lea.",
}: {
  storeKey?: string
  title?: string
  hint?: string
} = {}) {
  const KEY = storeKey
  const [url, setUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Carga el valor actual desde los overrides de site_texts.
  useEffect(() => {
    let cancelled = false
    fetch("/api/site-texts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return
        const map = (d.texts || d.overrides || d) as Record<string, string> | { key: string; value: string }[]
        let v = ""
        if (Array.isArray(map)) v = map.find((x) => x.key === KEY)?.value || ""
        else v = (map as Record<string, string>)[KEY] || ""
        setUrl(v)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [KEY])

  async function handleFile(file: File) {
    setBusy(true); setErr(null)
    try {
      const { url: uploaded } = await uploadMedia(file, "seasons")
      const res = await fetch("/api/admin/site-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: KEY, value: uploaded }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      setUrl(uploaded)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al subir")
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (!confirm("¿Quitar el video de fondo del Portal de Ingreso?")) return
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`/api/admin/site-texts?key=${encodeURIComponent(KEY)}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      setUrl("")
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al quitar")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-5 border border-[#6D4A9B]/40 bg-[#6D4A9B]/5 p-4" style={{ borderRadius: 12 }}>
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#F3F6FA] [font-family:var(--font-cinzel)]">
        <Film size={16} className="text-[#a78bca]" /> {title}
      </div>
      <p className="mb-3 text-xs text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
        {hint}
      </p>

      {err && (
        <div className="mb-3 border border-[#6D4A9B]/60 bg-[#6D4A9B]/10 px-3 py-2 text-xs text-[#a78bca]" style={{ borderRadius: 6 }}>
          {err}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-20 w-32 flex-shrink-0 items-center justify-center overflow-hidden border border-[#251f30] bg-[#050510]" style={{ borderRadius: 8 }}>
          {loading ? (
            <Loader2 size={18} className="animate-spin text-[#6a6a85]" />
          ) : url ? (
            /\.(mp4|webm|mov)(\?|$)/i.test(url)
              ? <video src={url} className="h-full w-full object-cover" muted playsInline loop autoPlay />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Film size={22} className="text-[#6a6a85]" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 border border-[#6D4A9B]/50 bg-[#6D4A9B]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bca] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/25 disabled:cursor-wait disabled:opacity-50 [font-family:var(--font-mono)]"
            style={{ borderRadius: 8 }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {url ? "Cambiar video" : "Subir video"}
          </button>
          {url && !busy && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-2 border border-[#251f30] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:bg-[#6D4A9B]/20 hover:text-[#F3F6FA] [font-family:var(--font-mono)]"
              style={{ borderRadius: 8 }}
            >
              <Trash2 size={14} /> Quitar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
