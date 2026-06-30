"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { translateAuthError } from "@/lib/auth-error-messages"

/**
 * Form de nova senha. Le hash da URL (#access_token=...&type=recovery)
 * e seta sessao via supabase.auth.setSession antes de permitir trocar senha.
 */
export function ResetPasswordForm() {
  const router = useRouter()
  const [tokenReady, setTokenReady] = useState<boolean | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Le hash da URL e seta sessao Supabase
  useEffect(() => {
    const hash = window.location.hash.slice(1) // remove "#"
    if (!hash) {
      setTokenReady(false)
      setTokenError("Link inválido. Solicita un nuevo enlace de recuperación.")
      return
    }
    const params = new URLSearchParams(hash)
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")
    const type = params.get("type")
    const errorCode = params.get("error_code")
    const errorDescription = params.get("error_description")

    if (errorCode || errorDescription) {
      setTokenReady(false)
      setTokenError(
        errorCode === "otp_expired"
          ? "El enlace expiró. Solicita un nuevo enlace de recuperación."
          : errorDescription || "Error al validar el link."
      )
      return
    }

    if (!accessToken || !refreshToken || type !== "recovery") {
      setTokenReady(false)
      setTokenError("Link inválido o ya utilizado. Solicita un nuevo enlace.")
      return
    }

    const supabase = getSupabaseBrowser()
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setTokenReady(false)
          setTokenError("Error al validar el link. Solicita uno nuevo.")
        } else {
          setTokenReady(true)
          // Limpa hash da URL (sem reload)
          window.history.replaceState(null, "", window.location.pathname)
        }
      })
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPwd.length < 8) {
      setError("Contraseña debe tener mín. 8 caracteres")
      return
    }
    if (newPwd !== confirmPwd) {
      setError("Las contraseñas no coinciden")
      return
    }
    startTransition(async () => {
      try {
        const supabase = getSupabaseBrowser()
        const { error } = await supabase.auth.updateUser({ password: newPwd })
        if (error) throw error
        setSuccess(true)
        // Redirect pra area de membros apos 2s
        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 2000)
      } catch (e) {
        const raw = e instanceof Error ? e.message : ""
        setError(translateAuthError(raw))
      }
    })
  }

  if (tokenReady === null) {
    return (
      <p className="text-sm text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
        Validando enlace...
      </p>
    )
  }

  if (!tokenReady) {
    return (
      <div className="border border-red-900/40 bg-red-900/10 p-6">
        <p className="text-sm text-red-300 [font-family:var(--font-geist-sans)]">
          {tokenError}
        </p>
        <a
          href="/recuperar-contrasena"
          className="mt-4 inline-block text-xs font-medium uppercase tracking-[0.25em] text-[#6D4A9B] transition-colors hover:text-[#F3F6FA] [font-family:var(--font-geist-sans)]"
        >
          → Solicitar nuevo enlace
        </a>
      </div>
    )
  }

  if (success) {
    return (
      <div className="border border-[#009d68]/40 bg-[#009d68]/10 p-6">
        <p className="text-sm text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
          ✓ Contraseña actualizada. Redirigiendo...
        </p>
      </div>
    )
  }

  const inputCls = "block w-full border border-[#1a1a24] bg-[#12121a]/60 px-4 py-3.5 text-base text-[#F3F6FA] placeholder:text-[#6a6a7a] transition-colors focus:border-red-900 focus:bg-[#000000] focus:outline-none focus:ring-1 focus:ring-red-900/40 disabled:opacity-50 [font-family:var(--font-geist-sans)]"
  const labelCls = "block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a0a0b0] [font-family:var(--font-geist-sans)] mb-2"

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="new-pwd" className={labelCls}>Nueva contraseña</label>
        <input
          id="new-pwd"
          type="password"
          autoComplete="new-password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          disabled={isPending}
          className={inputCls}
          placeholder="Mínimo 8 caracteres"
        />
      </div>
      <div>
        <label htmlFor="confirm-pwd" className={labelCls}>Confirmar contraseña</label>
        <input
          id="confirm-pwd"
          type="password"
          autoComplete="new-password"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          disabled={isPending}
          className={inputCls}
          placeholder="••••••••"
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
        className="inline-flex w-full items-center justify-center gap-3 border border-[#F3F6FA] bg-[#F3F6FA] px-6 py-4 text-[#000000] text-sm font-semibold uppercase tracking-[0.3em] transition-colors hover:border-red-900 hover:bg-red-900 hover:text-[#F3F6FA] disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
      >
        {isPending ? "Actualizando..." : "Actualizar contraseña"}
      </button>
    </form>
  )
}
