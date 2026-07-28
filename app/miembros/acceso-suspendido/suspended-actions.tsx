"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"

type Props = {
  /** Estado de la membresía: define la acción principal. */
  status: "past_due" | "canceled" | "inactive"
}

// Acciones de la pantalla de acceso suspendido.
//  - past_due  → abrir el portal para actualizar el método de pago.
//  - canceled  → abrir el portal para ver facturas / gestionar.
//  - inactive  → sin acción de facturación; solo cerrar sesión.
// Siempre ofrece "Cerrar sesión".
export function SuspendedActions({ status }: Props) {
  const router = useRouter()
  const [isLoggingOut, startLogout] = useTransition()
  const [isPortalPending, startPortal] = useTransition()
  const [portalError, setPortalError] = useState<string | null>(null)

  function handleLogout() {
    startLogout(async () => {
      try {
        await getSupabaseBrowser().auth.signOut()
      } catch {
        /* ignora — igual redirigimos */
      }
      router.push("/miembros/login")
      router.refresh()
    })
  }

  function openBillingPortal() {
    setPortalError(null)
    startPortal(async () => {
      try {
        const res = await fetch("/api/stripe/customer-portal", { method: "POST" })
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          setPortalError(
            data.error === "no_billing_account"
              ? "No encontramos una suscripción asociada a tu cuenta."
              : "No pudimos abrir el portal ahora. Intenta de nuevo en unos minutos.",
          )
          return
        }
        const data = (await res.json()) as { url?: string }
        if (data.url) window.location.href = data.url
        else setPortalError("No pudimos abrir el portal. Intenta de nuevo.")
      } catch {
        setPortalError("No pudimos abrir el portal. Revisa tu conexión e intenta de nuevo.")
      }
    })
  }

  const showPortal = status === "past_due" || status === "canceled"
  const portalLabel =
    status === "past_due" ? "Actualizar método de pago" : "Gestionar mi suscripción"

  const primaryCls =
    "inline-flex w-full items-center justify-center gap-3 border border-[#6D4A9B] bg-[#6D4A9B] px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#F3F6FA] transition-colors hover:border-[#8a63b8] hover:bg-[#8a63b8] disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
  const secondaryCls =
    "mt-3 inline-flex w-full items-center justify-center gap-3 border border-[#251f30] bg-transparent px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:text-[#F3F6FA] disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"

  return (
    <div>
      {showPortal && (
        <button type="button" onClick={openBillingPortal} disabled={isPortalPending} className={primaryCls}>
          {isPortalPending ? "Abriendo…" : portalLabel}
        </button>
      )}

      {portalError && (
        <div
          role="alert"
          className="mt-4 border border-red-900/40 bg-red-900/10 px-4 py-3 text-sm text-red-300 [font-family:var(--font-geist-sans)]"
        >
          {portalError}
        </div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={showPortal ? secondaryCls : primaryCls}
      >
        {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
    </div>
  )
}
