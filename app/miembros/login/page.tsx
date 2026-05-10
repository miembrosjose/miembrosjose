import type { Metadata } from "next"
import LoginForm from "./login-form"

export const metadata: Metadata = {
  title: "Iniciar Sesión · [BRAND_NAME]",
  description: "Acceso exclusivo para miembros de [BRAND_NAME].",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[oklch(0.07_0.012_25)] text-[oklch(0.95_0.008_60)] selection:bg-red-900/40">
      {/* ── Vinheta radial cinematográfica ───────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.85)_100%)]" />

      {/* ── Spot dourado sutil (luz lateral esquerda) ───────── */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_15%_45%,rgba(201,169,97,0.08),transparent_70%)]" />

      {/* ── Spot vermelho (luz lateral direita) ─────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_85%_55%,rgba(127,29,29,0.18),transparent_70%)]" />

      {/* ── Frame brackets nos cantos (corner marks de filme) ── */}
      <FrameBracket pos="top-left" />
      <FrameBracket pos="top-right" />
      <FrameBracket pos="bottom-left" />
      <FrameBracket pos="bottom-right" />

      {/* ── Linha vermelha topo e base (assinatura visual) ───── */}
      <div className="absolute left-0 right-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-red-900/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-red-900/60 to-transparent" />

      {/* ── STUDIO MARK ──────────────────────────────────────── */}
      <div className="absolute left-5 top-6 z-30 flex items-center gap-3 sm:left-6">
        <span className="block h-4 w-px flex-shrink-0 bg-red-900/70" />
        <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.5em] text-neutral-400 [font-family:var(--font-geist-sans)]">
          Copy Film&apos;s
        </span>
      </div>

      {/* ── Frame counter top-right ─────────────────────────── */}
      <div className="absolute right-5 top-6 z-30 hidden items-center gap-3 sm:flex sm:right-6">
        <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.5em] text-neutral-500 [font-family:var(--font-geist-sans)]">
          ACCESO · MIEMBROS
        </span>
        <span className="block h-4 w-px flex-shrink-0 bg-red-900/70" />
      </div>

      {/* ── Conteúdo central ─────────────────────────────────── */}
      <section className="relative z-20 flex h-full items-center justify-center px-6 py-12 sm:py-16 overflow-hidden">
        <div className="w-full max-w-md">
          {/* Eyebrow */}
          <div className="mb-8 flex items-center gap-3 sm:mb-10">
            <span className="h-px w-8 bg-red-900" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[oklch(0.6_0.015_30)] [font-family:var(--font-geist-sans)]">
              Acceso Exclusivo
            </span>
          </div>

          {/* Título — editorial, cinematográfico */}
          <h1 className="mb-3 text-[clamp(2.5rem,8vw,4rem)] font-bold leading-[0.95] tracking-[-0.02em] text-[oklch(0.96_0.005_60)] [font-family:var(--font-cinzel)]">
            Iniciar
            <br />
            <span className="text-red-900">Sesión.</span>
          </h1>

          {/* Manifesto — uma linha */}
          <p className="mb-12 max-w-sm text-base leading-relaxed text-[oklch(0.65_0.012_30)] [font-family:var(--font-geist-sans)]">
            Continúa donde lo dejaste. Tu próximo capítulo te espera.
          </p>

          {/* Linha vermelha curta — assinatura visual */}
          <div className="mb-10 h-[2px] w-16 bg-red-900" />

          {/* Form (client component) */}
          <LoginForm />

          {/* Footnote — compradores futuros */}
          <p className="mt-12 max-w-sm text-xs leading-relaxed text-[oklch(0.45_0.01_30)] [font-family:var(--font-geist-sans)]">
            ¿Aún no eres miembro? El acceso se envía por email después de tu compra.
          </p>
        </div>
      </section>
    </main>
  )
}

function FrameBracket({ pos }: { pos: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const isTop = pos.startsWith("top")
  const isLeft = pos.endsWith("left")
  const positionClass = `${isTop ? "top-4 sm:top-6" : "bottom-4 sm:bottom-6"} ${isLeft ? "left-4 sm:left-6" : "right-4 sm:right-6"}`

  return (
    <div className={`pointer-events-none absolute z-10 ${positionClass} h-6 w-6 sm:h-8 sm:w-8`}>
      <div
        className={`absolute h-px w-full bg-[oklch(0.55_0.04_25)]/60 ${isTop ? "top-0" : "bottom-0"}`}
      />
      <div
        className={`absolute h-full w-px bg-[oklch(0.55_0.04_25)]/60 ${isLeft ? "left-0" : "right-0"}`}
      />
    </div>
  )
}
