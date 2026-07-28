import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSupabaseServer } from "@/lib/supabase/server"
import { LegalLinks } from "@/components/legal/legal-links"
import { LEGAL } from "@/lib/site/legal-config"
import { SuspendedActions } from "./suspended-actions"

export const metadata: Metadata = {
  title: "Acceso Suspendido · Los 144000",
  description: "Tu membresía no está activa.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

// La ve un usuario CON sesión válida pero cuya membresía no está "active".
// No llama a requireMiembrosAuth (evitaría un bucle): solo exige sesión.
type State = "past_due" | "canceled" | "inactive"

function copyFor(state: State): { eyebrow: string; title: React.ReactNode; text: string } {
  if (state === "past_due") {
    return {
      eyebrow: "Membresía",
      title: (
        <>
          Tu pago
          <br />
          <span className="text-[#6D4A9B]">necesita atención.</span>
        </>
      ),
      text: "Actualiza tu método de pago para recuperar el acceso a Los 144.000.",
    }
  }
  if (state === "canceled") {
    return {
      eyebrow: "Membresía",
      title: (
        <>
          Membresía
          <br />
          <span className="text-[#6D4A9B]">cancelada.</span>
        </>
      ),
      text: "Tu suscripción está cancelada. Puedes revisar tus facturas o reactivar tu acceso cuando quieras.",
    }
  }
  return {
    eyebrow: "Membresía",
    title: (
      <>
        Acceso
        <br />
        <span className="text-[#6D4A9B]">suspendido.</span>
      </>
    ),
    text: "Tu sesión es válida, pero tu membresía no está activa en este momento. Cuando tu suscripción se regularice, el acceso se habilita automáticamente.",
  }
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" })
}

export default async function AccesoSuspendidoPage() {
  const supabase = await getSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user && process.env.NODE_ENV !== "development") {
    redirect("/miembros/login")
  }

  let status: string | null = null
  let periodEnd: string | null = null
  if (user) {
    const { data: sub } = await supabase
      .from("member_subscriptions")
      .select("status, current_period_end")
      .maybeSingle()
    status = sub?.status ?? null
    periodEnd = sub?.current_period_end ?? null
  }

  const state: State = status === "past_due" ? "past_due" : status === "canceled" ? "canceled" : "inactive"
  const { eyebrow, title, text } = copyFor(state)
  const endLabel = state === "canceled" ? fmtDate(periodEnd) : null

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#050510] text-[#F3F6FA] selection:bg-[#6D4A9B]/40">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,5,16,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_85%_55%,rgba(109,74,155,0.14),transparent_70%)]" />

      <section className="relative z-20 flex min-h-full items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 sm:mb-10">
            <span className="h-px w-8 bg-[#6D4A9B]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
              {eyebrow}
            </span>
          </div>

          <h1 className="mb-3 text-[clamp(2.25rem,7vw,3.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-[#F3F6FA] [font-family:var(--font-cinzel)]">
            {title}
          </h1>

          <p className="mb-8 max-w-sm text-base leading-relaxed text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
            {text}
          </p>

          {endLabel && (
            <div className="mb-8 border border-[#251f30] bg-[#0a0a18]/60 px-4 py-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#6a6a85] [font-family:var(--font-geist-sans)]">
                Acceso hasta
              </p>
              <p className="text-sm text-[#F3F6FA] [font-family:var(--font-geist-sans)]">{endLabel}</p>
            </div>
          )}

          <div className="mb-10 h-[2px] w-16 bg-[#6D4A9B]" />

          <SuspendedActions status={state} />

          <p className="mt-8 max-w-sm text-xs leading-relaxed text-[#6a6a85] [font-family:var(--font-geist-sans)]">
            ¿Crees que es un error?{" "}
            <a href={LEGAL.supportPath} className="text-[#a78bca] underline">
              Escríbenos por soporte
            </a>{" "}
            y revisamos el estado de tu suscripción.
          </p>

          <div className="mt-8">
            <LegalLinks align="start" />
          </div>
        </div>
      </section>
    </main>
  )
}
