"use client"

// Admin: el enlace del grupo al que lleva la tarjeta del Umbral.
//
// Vive junto a las ranuras de vídeo en "Gestionar temporadas" porque forma
// parte de la misma tarjeta. Escribe en umbral.cta_url, la clave que ya
// existía: mientras esté vacía la tarjeta abre el portal de siempre, y en
// cuanto se rellena empieza a llevar al grupo.

import { useCallback, useEffect, useState } from "react"
import { Loader2, Save, Check, Link2 } from "lucide-react"

const KEY = "umbral.cta_url"

export function UmbralEnlaceManager() {
  const [valor, setValor] = useState("")
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    fetch("/api/site-texts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo || !d) return
        // El endpoint responde unas veces con un objeto y otras con una lista.
        const bruto = (d.texts || d.overrides || d) as
          | Record<string, string>
          | Array<{ key: string; value: string }>
        setValor(
          Array.isArray(bruto)
            ? bruto.find((x) => x.key === KEY)?.value ?? ""
            : (bruto as Record<string, string>)[KEY] ?? "",
        )
      })
      .catch(() => { /* se abre vacío; guardar sigue funcionando */ })
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [])

  const guardar = useCallback(async () => {
    setGuardando(true)
    setErr(null)
    setGuardado(false)
    try {
      const res = await fetch("/api/admin/site-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: KEY, value: valor.trim() }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2500)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo guardar")
    } finally {
      setGuardando(false)
    }
  }, [valor])

  return (
    <div className="mb-5 border border-[#6D4A9B]/40 bg-[#6D4A9B]/5 p-4" style={{ borderRadius: 12 }}>
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#F3F6FA] [font-family:var(--font-cinzel)]">
        <Link2 size={16} className="text-[#a78bca]" /> El Protocolo de Contacto — Enlace del grupo
      </div>
      <p className="mb-3 text-xs text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
        A dónde lleva el botón “Unirse” de la última tarjeta. Pega aquí el enlace del grupo de WhatsApp.
        Mientras esté vacío, la tarjeta abre el portal de siempre.
      </p>

      {err && (
        <div className="mb-3 border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-300" style={{ borderRadius: 6 }}>
          {err}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="https://chat.whatsapp.com/…"
          disabled={cargando}
          className="min-w-0 flex-1 border border-[#251f30] bg-[#050510] px-3 py-2 text-sm text-[#F3F6FA] outline-none focus:border-[#6D4A9B] disabled:opacity-60 [font-family:var(--font-geist-sans)]"
          style={{ borderRadius: 6 }}
        />
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || cargando}
          className="inline-flex shrink-0 items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#F3F6FA] transition-colors hover:bg-[#6D4A9B]/35 disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
          style={{ borderRadius: 6 }}
        >
          {guardando ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Guardar
        </button>
        {guardado && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 [font-family:var(--font-geist-sans)]">
            <Check size={13} /> Guardado
          </span>
        )}
      </div>
    </div>
  )
}
