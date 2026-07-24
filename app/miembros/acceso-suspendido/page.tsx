import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSupabaseServer } from "@/lib/supabase/server"
import { SuspendedActions } from "./suspended-actions"

export const metadata: Metadata = {
  title: "Acceso Suspendido · Los 144000",
  description: "Tu membresía no está activa.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

// Pantalla de acceso suspendido: la ve un usuario CON sesión válida pero cuya
// membresía en member_subscriptions no está "active". No llama a
// requireMiembrosAuth (evita bucle de redirección): solo exige sesión.
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
}

export default async function AccesoSuspendidoPage() {
  const supabase = await getSupabaseServer()

  // En dev no hay gate real (igual que requireMiembrosAuth).
  if (process.env.NODE_ENV !== "development") {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect("/miembros/login")
  }

  // Estado actual (RLS → solo su propia fila). Puede no existir aún.
  let statusLabel = "Sin membresía"
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { data: sub } = await supabase
      .from("member_subscriptions")
      .select("status")
      .maybeSingle()
    if (sub?.status && STATUS_LABEL[sub.status]) statusLabel = STATUS_LABEL[sub.status]
  }

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#050510] text-[#F3F6FA] selection:bg-[#6D4A9B]/40">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,5,16,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_85%_55%,rgba(109,74,155,0.14),transparent_70%)]" />

      <section className="relative z-20 flex min-h-full items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 sm:mb-10">
            <span className="h-px w-8 bg-[#6D4A9B]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
              Membresía
            </span>
          </div>

          <h1 className="mb-3 text-[clamp(2.25rem,7vw,3.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-[#F3F6FA] [font-family:var(--font-cinzel)]">
            Acceso
            <br />
            <span className="text-[#6D4A9B]">Suspendido.</span>
          </h1>

          <p className="mb-8 max-w-sm text-base leading-relaxed text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
            Tu sesión es válida, pero tu membresía no está activa en este momento. Cuando tu
            suscripción se regularice, el acceso se habilita automáticamente.
          </p>

          <div className="mb-8 border border-[#251f30] bg-[#0a0a18]/60 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#6a6a85] [font-family:var(--font-geist-sans)]">
              Estado actual
            </p>
            <p className="text-sm text-[#F3F6FA] [font-family:var(--font-geist-sans)]">{statusLabel}</p>
          </div>

          <div className="mb-10 h-[2px] w-16 bg-[#6D4A9B]" />

          <SuspendedActions />

          <p className="mt-8 max-w-sm text-xs leading-relaxed text-[#6a6a85] [font-family:var(--font-geist-sans)]">
            ¿Crees que es un error? Escríbenos y revisamos el estado de tu suscripción.
          </p>
        </div>
      </section>
    </main>
  )
}
