import type { ReactNode } from "react"
import { LegalLinks } from "./legal-links"

// Chrome compartido de las páginas legales y de soporte. Reutiliza el lenguaje
// visual aprobado de Los 144.000 (fondo #050510, spots violeta, línea+eyebrow,
// título Orbitron vía --font-cinzel, cuerpo Manrope vía --font-geist-sans).
// Público (sin sesión). Legible en móvil, headings semánticos, navegación entre docs.

export function LegalPage({
  eyebrow = "Legal",
  title,
  updated,
  version,
  summary,
  children,
}: {
  eyebrow?: string
  title: ReactNode
  updated?: string
  version?: string
  summary?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#050510] text-[#F3F6FA] selection:bg-[#6D4A9B]/40">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,5,16,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_85%_10%,rgba(109,74,155,0.12),transparent_70%)]" />

      <article className="relative z-10 mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
        <a
          href="/"
          className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#6a6a85] transition-colors hover:text-[#a78bca] [font-family:var(--font-geist-sans)]"
        >
          ← Los 144.000
        </a>

        <div className="mb-6 mt-10 flex items-center gap-3">
          <span className="h-px w-8 bg-[#6D4A9B]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
            {eyebrow}
          </span>
        </div>

        <h1 className="text-[clamp(2rem,6vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[#F3F6FA] [font-family:var(--font-cinzel)]">
          {title}
        </h1>

        {(updated || version) && (
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#6a6a85] [font-family:var(--font-geist-sans)]">
            {updated ? <>Última actualización: {updated}</> : null}
            {updated && version ? " · " : null}
            {version ? <>Versión {version}</> : null}
          </p>
        )}

        {summary && (
          <div className="mt-8 border border-[#24243a] bg-[#0c0c1a]/60 p-5 text-sm leading-relaxed text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
            {summary}
          </div>
        )}

        <div className="mt-10 space-y-8">{children}</div>

        <div className="mt-16 border-t border-[#1b1c2a] pt-8">
          <LegalLinks align="start" />
        </div>
      </article>
    </main>
  )
}

// ── Helpers tipográficos (para no depender del plugin prose) ───────────

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 mt-2 text-lg font-semibold tracking-[-0.01em] text-[#F3F6FA] [font-family:var(--font-cinzel)]">
      {children}
    </h2>
  )
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[15px] leading-relaxed text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
      {children}
    </p>
  )
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[#a8a8c0] marker:text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
      {children}
    </ul>
  )
}

export function Section({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      {children}
    </section>
  )
}
