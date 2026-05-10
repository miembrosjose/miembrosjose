"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { translateAuthError } from "@/lib/auth-error-messages"

const MIN_PASSWORD_LENGTH = 8

const PASSWORD_TOO_SHORT = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`

export default function CreateAccountForm({ token, email }: { token: string; email: string }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function validate(): string | null {
    if (password.length < MIN_PASSWORD_LENGTH) return PASSWORD_TOO_SHORT
    if (password !== confirmPassword) return "Las contraseñas no coinciden."
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/account/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        })
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }

        if (!res.ok || !data.ok) {
          setError(translateAuthError(data.error))
          return
        }

        // Cria sessão fazendo login automático com a senha que acabou de definir
        const supabase = getSupabaseBrowser()
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) {
          // Conta foi criada com sucesso mas auto-login falhou — manda pro login
          router.push("/login?created=1")
          return
        }

        // Redirect pra raiz do subdomínio (área de membros).
        router.push("/")
        router.refresh()
      } catch {
        setError(translateAuthError(undefined))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Password field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-[oklch(0.55_0.012_30)] [font-family:var(--font-geist-sans)]"
          >
            Contraseña
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-[10px] font-medium uppercase tracking-[0.2em] text-[oklch(0.5_0.012_30)] transition-colors hover:text-[oklch(0.7_0.012_30)] [font-family:var(--font-geist-sans)]"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          placeholder="Mínimo 8 caracteres"
          className="block w-full border border-[oklch(0.2_0.015_25)] bg-[oklch(0.05_0.01_25)]/60 px-4 py-3.5 text-base text-[oklch(0.96_0.005_60)] placeholder:text-[oklch(0.4_0.01_30)] transition-colors duration-200 focus:border-red-900 focus:bg-[oklch(0.06_0.01_25)] focus:outline-none focus:ring-1 focus:ring-red-900/40 disabled:opacity-50 [font-family:var(--font-geist-sans)]"
        />
      </div>

      {/* Confirm password field */}
      <div className="space-y-2">
        <label
          htmlFor="confirm-password"
          className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-[oklch(0.55_0.012_30)] [font-family:var(--font-geist-sans)]"
        >
          Confirmar Contraseña
        </label>
        <input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isPending}
          placeholder="Repite tu contraseña"
          className="block w-full border border-[oklch(0.2_0.015_25)] bg-[oklch(0.05_0.01_25)]/60 px-4 py-3.5 text-base text-[oklch(0.96_0.005_60)] placeholder:text-[oklch(0.4_0.01_30)] transition-colors duration-200 focus:border-red-900 focus:bg-[oklch(0.06_0.01_25)] focus:outline-none focus:ring-1 focus:ring-red-900/40 disabled:opacity-50 [font-family:var(--font-geist-sans)]"
        />
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="border border-red-900/40 bg-red-900/10 px-4 py-3 text-sm text-[oklch(0.85_0.04_25)] [font-family:var(--font-geist-sans)]"
        >
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        type="submit"
        disabled={isPending}
        className="group relative mt-2 inline-flex w-full items-center justify-center gap-3 border border-[oklch(0.96_0.005_60)] bg-[oklch(0.96_0.005_60)] px-6 py-4 text-[oklch(0.07_0.012_25)] transition-colors duration-300 hover:border-red-900 hover:bg-red-900 hover:text-[oklch(0.96_0.005_60)] disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-[oklch(0.96_0.005_60)] disabled:hover:text-[oklch(0.07_0.012_25)]"
      >
        <span className="text-sm font-semibold uppercase tracking-[0.3em] [font-family:var(--font-geist-sans)]">
          {isPending ? "Activando cuenta..." : "Crear mi Cuenta"}
        </span>
        {!isPending && (
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
        )}
      </button>

      <p className="pt-2 text-xs leading-relaxed text-[oklch(0.45_0.01_30)] [font-family:var(--font-geist-sans)]">
        Al crear tu cuenta, aceptas los términos del programa Copy Film&apos;s.
      </p>
    </form>
  )
}
