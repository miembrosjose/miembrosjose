"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { clasificarAuthError } from "@/lib/auth-error-messages"

/**
 * Formulario de activación de cuenta.
 *
 * Recibe la sesión de una invitación emitida por ESTE Supabase. Supabase
 * entrega los tokens en el hash de la URL (#access_token=…&refresh_token=…
 * &type=invite). Se establece la sesión con setSession y luego se permite
 * crear la contraseña con supabase.auth.updateUser({ password }).
 *
 * Mismo patrón probado en /miembros/cuenta/recuperar.
 */
export function ActivateForm() {
  const router = useRouter()
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [pwd, setPwd] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  // Código técnico del último fallo, solo cuando no supimos traducirlo.
  const [codigo, setCodigo] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Lee la sesión del enlace de invitación y la establece.
  useEffect(() => {
    const supabase = getSupabaseBrowser()

    async function init() {
      const hash = window.location.hash.slice(1) // sin "#"
      const params = new URLSearchParams(hash)
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")
      const errorCode = params.get("error_code")
      const errorDescription = params.get("error_description")

      // Enlace con error explícito (expirado / ya usado)
      if (errorCode || errorDescription) {
        setSessionError(
          errorCode === "otp_expired"
            ? "Este enlace ha expirado."
            : "Este enlace no es válido o ya fue utilizado."
        )
        setSessionReady(false)
        return
      }

      // Flujo por hash (implícito): tokens presentes → establecer sesión
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) {
          setSessionError("Este enlace ha expirado.")
          setSessionReady(false)
          return
        }
        // Limpia el hash de la URL sin recargar (no dejar tokens a la vista)
        window.history.replaceState(null, "", window.location.pathname)
        await comprobarQueLaSesionVale()
        return
      }

      // Fallback: el cliente pudo haber consumido el hash automáticamente
      // (detectSessionInUrl). Si ya hay sesión válida, seguimos.
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        await comprobarQueLaSesionVale()
        return
      }

      setSessionError("Este enlace ha expirado.")
      setSessionReady(false)
    }

    /**
     * Preguntarle al servidor si esta sesión sirve DE VERDAD.
     *
     * ── POR QUÉ HACE FALTA ────────────────────────────────────────────
     * `setSession` y `getSession` no hablan con nadie: se creen los tokens
     * del enlace tal cual vienen. Un enlace caducado o ya usado pasaba ese
     * filtro, la persona veía el formulario, escribía su contraseña dos
     * veces, le daba al botón... y solo entonces fallaba, con un «intenta
     * de nuevo en unos segundos» que no iba a funcionar nunca.
     *
     * `getUser` sí pregunta al servidor. Si el enlace está muerto, se dice
     * ANTES de pedir nada, y con el botón para pedir uno nuevo.
     */
    async function comprobarQueLaSesionVale() {
      const { data, error } = await supabase.auth.getUser()
      if (data?.user) {
        setSessionReady(true)
        return
      }
      // Sin usuario pero sin un error de sesión claro —por ejemplo, el móvil
      // sin cobertura— no se declara muerto el enlace: se deja seguir y, si
      // acaso, fallará al guardar con un mensaje de conexión.
      const fallo = clasificarAuthError(error)
      if (error && !fallo.sesionMuerta) {
        setSessionReady(true)
        return
      }
      setSessionError(fallo.sesionMuerta ? fallo.mensaje : "Este enlace ha expirado.")
      setSessionReady(false)
    }

    init()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCodigo(null)

    if (pwd.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (pwd !== confirm) {
      setError("Las contraseñas no coinciden.")
      return
    }

    startTransition(async () => {
      try {
        const supabase = getSupabaseBrowser()
        const { error } = await supabase.auth.updateUser({ password: pwd })
        if (error) throw error
        setSuccess(true)
        // Redirige a la plataforma tras confirmar visualmente
        setTimeout(() => {
          router.push("/miembros")
          router.refresh()
        }, 1600)
      } catch (e) {
        const fallo = clasificarAuthError(e)
        // Si el enlace murió, no se ofrece reintentar: se manda a pedir uno
        // nuevo. Era el callejón sin salida del 24-11-2026.
        if (fallo.sesionMuerta) {
          setSessionError(fallo.mensaje)
          setSessionReady(false)
          return
        }
        setError(fallo.mensaje)
        setCodigo(fallo.codigo)
      }
    })
  }

  // ── Estados de sesión ──────────────────────────────────────────────
  if (sessionReady === null) {
    return (
      <p className="text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]" role="status">
        Validando enlace…
      </p>
    )
  }

  if (!sessionReady) {
    return (
      <div className="border border-[#6D4A9B]/40 bg-[#6D4A9B]/10 p-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a78bca] [font-family:var(--font-geist-sans)]">
          Enlace no válido
        </p>
        <p className="text-lg font-bold uppercase tracking-[0.02em] text-[#F3F6FA] [font-family:var(--font-cinzel)]">
          Este enlace ha expirado
        </p>
        <p className="mt-2 text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
          {sessionError || "Pide un enlace nuevo para continuar."}
        </p>

        {/* ── POR QUÉ ESTE BOTÓN CAMBIÓ DE SITIO (25-11-2026) ─────────────
            Decía «Solicitar nuevo acceso» y llevaba a la pantalla de login.
            No pedía nada ni enviaba nada: solo cambiaba de página. Quien lo
            pulsaba se quedaba esperando un correo que nunca se había
            mandado. Pasó, y la frase fue «le di click y no me llega nada».

            Ahora lleva a la pantalla donde se escribe el correo y SÍ se
            envía el enlace, por Resend y con registro en email_send_log.
            La etiqueta dice lo que va a pasar, no lo que nos gustaría. */}
        <p className="mt-4 text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
          En la pantalla siguiente escribe tu correo y te mandamos uno nuevo.
          Ábrelo en cuanto llegue: es de un solo uso.
        </p>
        <a
          href="/miembros/recuperar-contrasena"
          className="mt-5 inline-flex w-full items-center justify-center gap-3 border border-[#6D4A9B] bg-[#6D4A9B] px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#F3F6FA] transition-colors hover:border-[#8a63b8] hover:bg-[#8a63b8] [font-family:var(--font-geist-sans)]"
        >
          Pedir un enlace nuevo
        </a>
      </div>
    )
  }

  if (success) {
    return (
      <div className="border border-[#009d68]/40 bg-[#009d68]/10 p-6" role="status">
        <p className="text-lg font-bold uppercase tracking-[0.02em] text-[#F3F6FA] [font-family:var(--font-cinzel)]">
          Acceso activado
        </p>
        <p className="mt-2 text-sm text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
          Entrando a Los 144.000…
        </p>
      </div>
    )
  }

  // ── Formulario de contraseña ───────────────────────────────────────
  const inputCls =
    "block w-full border border-[#251f30] bg-[#0a0a18]/60 px-4 py-3.5 text-base text-[#F3F6FA] placeholder:text-[#6a6a85] transition-colors duration-200 focus:border-[#6D4A9B] focus:bg-[#0a0a18] focus:outline-none focus:ring-1 focus:ring-[#6D4A9B]/40 disabled:opacity-50 [font-family:var(--font-geist-sans)]"
  const labelCls =
    "mb-2 block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a8a8c0] [font-family:var(--font-geist-sans)]"

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="new-password" className={labelCls}>
          Nueva contraseña
        </label>
        <input
          id="new-password"
          name="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          disabled={isPending}
          placeholder="Mínimo 8 caracteres"
          aria-describedby={error ? "activate-error" : undefined}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className={labelCls}>
          Confirmar contraseña
        </label>
        <input
          id="confirm-password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={isPending}
          placeholder="••••••••"
          aria-describedby={error ? "activate-error" : undefined}
          className={inputCls}
        />
      </div>

      {error && (
        <div
          id="activate-error"
          role="alert"
          className="border border-[#6D4A9B]/40 bg-[#6D4A9B]/10 px-4 py-3 text-sm text-[#a78bca] [font-family:var(--font-geist-sans)]"
        >
          {error}
          {/* El código solo aparece cuando no supimos traducir el error. Es
              feo a propósito: sirve para que un pantallazo nos diga qué
              pasó, en vez de dejarnos adivinando. */}
          {codigo && (
            <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a85]">
              código: {codigo}
            </span>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="group relative mt-2 inline-flex w-full items-center justify-center gap-3 border border-[#6D4A9B] bg-[#6D4A9B] px-6 py-4 text-[#F3F6FA] transition-colors duration-300 hover:border-[#8a63b8] hover:bg-[#8a63b8] disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-[#6D4A9B]"
      >
        <span className="text-sm font-semibold uppercase tracking-[0.3em] [font-family:var(--font-geist-sans)]">
          {isPending ? "Activando…" : "Entrar a Los 144.000"}
        </span>
        {!isPending && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1"
            aria-hidden="true"
          >
            <path
              d="M5 12h14M13 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        )}
      </button>
    </form>
  )
}
