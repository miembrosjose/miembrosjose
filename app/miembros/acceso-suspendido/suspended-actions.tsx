"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"

// Botón de cerrar sesión para la pantalla de acceso suspendido.
// Cierra la sesión de Supabase y vuelve al login de la plataforma.
export function SuspendedActions() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      try {
        await getSupabaseBrowser().auth.signOut()
      } catch {
        /* ignora — igual redirigimos */
      }
      router.push("/miembros/login")
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex w-full items-center justify-center gap-3 border border-[#6D4A9B] bg-[#6D4A9B] px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#F3F6FA] transition-colors hover:border-[#8a63b8] hover:bg-[#8a63b8] disabled:cursor-wait disabled:opacity-60 [font-family:var(--font-geist-sans)]"
    >
      {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
    </button>
  )
}
