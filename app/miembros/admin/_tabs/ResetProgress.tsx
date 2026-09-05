"use client"

import { useState, useTransition } from "react"
import { inputCls, labelCls } from "./_shared"

// Reinicia el avance de un usuario (por email) — pensado para pruebas.
// Borra en el servidor su progreso de episodios, meditaciones, insignias y XP,
// y marca su cuenta para que, en su próximo ingreso, su navegador limpie el
// avance local (episodios, bitácora, sellos, misiones) y recargue una vez.
export function ResetProgress() {
  const [email, setEmail] = useState("")
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(null)
    if (!email.trim() || !email.includes("@")) { setError("Email inválido"); return }
    if (!confirm) { setError("Marca la casilla de confirmación para continuar."); return }
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/reset-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        setSuccess(`Avance reiniciado para ${email}. En su próximo ingreso, su navegador terminará de limpiar el avance local (episodios, bitácora, sellos y misiones) y recargará una vez.`)
        setEmail(""); setConfirm(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error")
      }
    })
  }

  return (
    <form onSubmit={submit} className="border border-red-500/30 bg-[#12121a]/40 p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-red-400 [font-family:var(--font-geist-sans)]">
          Reiniciar avance de un usuario
        </h2>
        <p className="mt-2 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Pensado para pruebas. Borra en el servidor el progreso de episodios, meditaciones, insignias y XP del usuario,
          y marca su cuenta para que su navegador limpie el avance local (episodios, bitácora, sellos y misiones) en su
          próximo ingreso. Esta acción no se puede deshacer.
        </p>
      </div>

      <div>
        <label htmlFor="rp-email" className={labelCls}>Email del usuario *</label>
        <input
          id="rp-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          className={inputCls}
          placeholder="usuario@email.com"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} disabled={isPending} className="mt-1" />
        <span className="text-sm text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
          Confirmo que quiero <strong className="text-red-400">reiniciar todo el avance</strong> de este usuario.
        </span>
      </label>

      {error && <p className="text-xs text-red-500 [font-family:var(--font-geist-sans)]">{error}</p>}
      {success && <p className="text-xs text-[#009d68] [font-family:var(--font-geist-sans)]">{success}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 border border-red-500 bg-red-500 px-6 py-3 text-[#000000] text-xs font-semibold uppercase tracking-[0.3em] transition-colors hover:bg-red-600 hover:border-red-600 hover:text-[#F3F6FA] disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
      >
        {isPending ? "Reiniciando..." : "Reiniciar avance"}
      </button>
    </form>
  )
}
