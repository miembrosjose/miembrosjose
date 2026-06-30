import type { Metadata } from "next"
import { Suspense } from "react"
import LoginForm from "./login-form"

export const metadata: Metadata = {
  title: "Iniciar Sesión · Los 144000",
  description: "Acceso exclusivo para miembros de Los 144000.",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[#050510] text-[#F3F6FA] selection:bg-[#6D4A9B]/40">
      {/* ── Vinheta radial cinematográfica ───────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,5,16,0.85)_100%)]" />

      {/* ── Spot purple sutil esquerda ───────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_15%_45%,rgba(109,74,155,0.08),transparent_70%)]" />

      {/* ── Spot purple direita (mais intenso) ───────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_85%_55%,rgba(109,74,155,0.18),transparent_70%)]" />

      {/* ── Conteúdo central ─────────────────────────────────── */}
      <section className="relative z-20 flex h-full items-center justify-center px-6 py-12 sm:py-16 overflow-hidden">
        <div className="w-full max-w-md">
          {/* Eyebrow */}
          <div className="mb-8 flex items-center gap-3 sm:mb-10">
            <span className="h-px w-8 bg-[#6D4A9B]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
              Acceso Exclusivo
            </span>
          </div>

          {/* Título — editorial, cinematográfico */}
          <h1 className="mb-3 text-[clamp(2.5rem,8vw,4rem)] font-bold leading-[0.95] tracking-[-0.02em] text-[#F3F6FA] [font-family:var(--font-cinzel)]">
            Iniciar
            <br />
            <span className="text-[#6D4A9B]">Sesión.</span>
          </h1>

          {/* Manifesto — uma linha */}
          <p className="mb-12 max-w-sm text-base leading-relaxed text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
            Continúa donde lo dejaste. Tu próximo capítulo te espera.
          </p>

          {/* Linha purple curta — assinatura visual */}
          <div className="mb-10 h-[2px] w-16 bg-[#6D4A9B]" />

          {/* Form (client component) */}
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          {/* Footnote — compradores futuros */}
          <p className="mt-12 max-w-sm text-xs leading-relaxed text-[#6a6a85] [font-family:var(--font-geist-sans)]">
            ¿Aún no eres miembro? El acceso se envía por email después de tu compra.
          </p>
        </div>
      </section>
    </main>
  )
}
