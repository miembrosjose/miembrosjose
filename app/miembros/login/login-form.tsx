"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { translateAuthError } from "@/lib/auth-error-messages"

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Acesso revogado: middleware redireciona com ?revoked=1 quando user
  // tenta acessar miembros mas tem app_metadata.access_revoked=true
  // (refund de front, chargeback, ou ban manual via admin).
  useEffect(() => {
    if (searchParams.get("revoked") === "1") {
      // Faz signOut pra limpar cookie e mostrar mensagem
      const supabase = getSupabaseBrowser()
      supabase.auth.signOut().catch(() => {})
      setError("Tu acceso fue revocado. Si crees que es un error, contactá soporte por WhatsApp.")
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setError("Completa email y contraseña para continuar.")
      return
    }

    startTransition(async () => {
      try {
        const supabase = getSupabaseBrowser()
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (authError) {
          setError(translateAuthError(authError.message))
          return
        }

        // Redirect pra raiz do subdomínio (área de membros). Middleware faz
        // o rewrite interno pra /miembros automaticamente.
        router.push("/")
        router.refresh()
      } catch (err) {
        setError(translateAuthError(err instanceof Error ? err.message : undefined))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Email field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-[oklch(0.55_0.012_30)] [font-family:var(--font-geist-sans)]"
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
          className="block w-full border border-[#251f30] bg-[#0a0a18]/60 px-4 py-3.5 text-base text-[#F3F6FA] placeholder:text-[#6a6a85] transition-colors duration-200 focus:border-[#6D4A9B] focus:bg-[#0a0a18] focus:outline-none focus:ring-1 focus:ring-[#6D4A9B]/40 disabled:opacity-50 [font-family:var(--font-geist-sans)]"
        />
      </div>

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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          placeholder="••••••••"
          className="block w-full border border-[#251f30] bg-[#0a0a18]/60 px-4 py-3.5 text-base text-[#F3F6FA] placeholder:text-[#6a6a85] transition-colors duration-200 focus:border-[#6D4A9B] focus:bg-[#0a0a18] focus:outline-none focus:ring-1 focus:ring-[#6D4A9B]/40 disabled:opacity-50 [font-family:var(--font-geist-sans)]"
        />
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="border border-[#6D4A9B]/40 bg-[#6D4A9B]/10 px-4 py-3 text-sm text-[#a78bca] [font-family:var(--font-geist-sans)]"
        >
          {error}
        </div>
      )}

      {/* CTA button */}
      <button
        type="submit"
        disabled={isPending}
        className="group relative mt-2 inline-flex w-full items-center justify-center gap-3 border border-[#6D4A9B] bg-[#6D4A9B] px-6 py-4 text-[#F3F6FA] transition-colors duration-300 hover:border-[#8a63b8] hover:bg-[#8a63b8] disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-[#6D4A9B]"
      >
        <span className="text-sm font-semibold uppercase tracking-[0.3em] [font-family:var(--font-geist-sans)]">
          {isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
        </span>
        {!isPending && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
          </svg>
        )}
      </button>

      {/* Forgot password link */}
      <div className="pt-2">
        <a
          href="/recuperar-contrasena"
          className="text-xs font-medium uppercase tracking-[0.25em] text-[#6a6a85] transition-colors hover:text-[#6D4A9B] [font-family:var(--font-geist-sans)]"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
  )
}
