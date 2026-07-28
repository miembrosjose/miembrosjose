import type { Metadata } from "next"
import { Suspense } from "react"
import { ActivateForm } from "./activate-form"
import { LegalLinks } from "@/components/legal/legal-links"

export const metadata: Metadata = {
  title: "Activa tu Acceso · Los 144000",
  description: "Crea tu contraseña para ingresar a Los 144000.",
  robots: { index: false, follow: false },
}

// La sesión de la invitación llega en el hash de la URL (#access_token…),
// que solo existe en el cliente. Render dinámico, sin caché.
export const dynamic = "force-dynamic"

export default function ActivarCuentaPage() {
  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#050510] text-[#F3F6FA] selection:bg-[#6D4A9B]/40">
      {/* ── Vinheta radial cinematográfica ───────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,5,16,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_15%_45%,rgba(109,74,155,0.08),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_85%_55%,rgba(109,74,155,0.18),transparent_70%)]" />

      <section className="relative z-20 flex min-h-full items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-md">
          {/* Eyebrow */}
          <div className="mb-8 flex items-center gap-3 sm:mb-10">
            <span className="h-px w-8 bg-[#6D4A9B]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
              Activación de Cuenta
            </span>
          </div>

          {/* Título */}
          <h1 className="mb-3 text-[clamp(2.25rem,7vw,3.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-[#F3F6FA] [font-family:var(--font-cinzel)]">
            Activa tu
            <br />
            <span className="text-[#6D4A9B]">Acceso.</span>
          </h1>

          {/* Texto */}
          <p className="mb-12 max-w-sm text-base leading-relaxed text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
            Tu identidad ya ha sido vinculada a Los 144.000. Crea una contraseña para ingresar a la
            plataforma.
          </p>

          <div className="mb-10 h-[2px] w-16 bg-[#6D4A9B]" />

          <Suspense fallback={null}>
            <ActivateForm />
          </Suspense>

          <div className="mt-10">
            <LegalLinks align="start" />
          </div>
        </div>
      </section>
    </main>
  )
}
