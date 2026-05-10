"use client"

import { useState, useTransition } from "react"

export function RecoverForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError("Ingresa tu email")
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/profile/recover-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `HTTP ${res.status}`)
        }
        setSent(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error")
      }
    })
  }

  if (sent) {
    return (
      <div className="border border-[#c9a961]/30 bg-[#12121a]/60 p-6">
        <p className="text-sm text-[#f5f5f7] [font-family:var(--font-geist-sans)]">
          ✓ Si existe una cuenta con ese email, recibirás un enlace para crear nueva contraseña en los próximos minutos.
        </p>
        <p className="mt-3 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Revisa tu bandeja de entrada y la carpeta de spam.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a0a0b0] [font-family:var(--font-geist-sans)]"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          placeholder="tu@email.com"
          className="block w-full border border-[#1a1a24] bg-[#12121a]/60 px-4 py-3.5 text-base text-[#f5f5f7] placeholder:text-[#6a6a7a] transition-colors focus:border-red-900 focus:bg-[#0a0a0f] focus:outline-none focus:ring-1 focus:ring-red-900/40 disabled:opacity-50 [font-family:var(--font-geist-sans)]"
        />
      </div>

      {error && (
        <div role="alert" className="border border-red-900/40 bg-red-900/10 px-4 py-3 text-sm text-red-300 [font-family:var(--font-geist-sans)]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-3 border border-[#f5f5f7] bg-[#f5f5f7] px-6 py-4 text-[#0a0a0f] text-sm font-semibold uppercase tracking-[0.3em] transition-colors hover:border-red-900 hover:bg-red-900 hover:text-[#f5f5f7] disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
      >
        {isPending ? "Enviando..." : "Enviar enlace"}
      </button>
    </form>
  )
}
