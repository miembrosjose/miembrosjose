import type { Metadata } from "next"
import { getInviteByToken } from "@/lib/account-invites"
import CreateAccountForm from "./create-account-form"

export const metadata: Metadata = {
  title: "Crear Cuenta · [BRAND_NAME]",
  description: "Crea tu acceso al área de miembros de [BRAND_NAME].",
  robots: { index: false, follow: false },
}

type SearchParams = Promise<{ token?: string }>

export default async function CrearCuentaPage({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams
  const cleanToken = (token || "").trim()
  const invite = cleanToken ? await getInviteByToken(cleanToken) : null

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#000000] text-[oklch(0.95_0.008_60)] selection:bg-red-900/40">
      {/* Vinheta + spots */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_85%_45%,rgba(201,169,97,0.08),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_15%_55%,rgba(127,29,29,0.18),transparent_70%)]" />

      {/* Frame brackets */}
      <FrameBracket pos="top-left" />
      <FrameBracket pos="top-right" />
      <FrameBracket pos="bottom-left" />
      <FrameBracket pos="bottom-right" />

      <div className="absolute left-0 right-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-red-900/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-red-900/60 to-transparent" />

      {/* Studio mark */}
      <div className="absolute left-5 top-6 z-30 flex items-center gap-3 sm:left-6">
        <span className="block h-4 w-px flex-shrink-0 bg-red-900/70" />
        <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.5em] text-neutral-400 [font-family:var(--font-geist-sans)]">
          [BRAND_NAME]
        </span>
      </div>
      <div className="absolute right-5 top-6 z-30 hidden items-center gap-3 sm:flex sm:right-6">
        <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.5em] text-neutral-500 [font-family:var(--font-geist-sans)]">
          ACTIVACIÓN · CUENTA
        </span>
        <span className="block h-4 w-px flex-shrink-0 bg-red-900/70" />
      </div>

      {/* Conteúdo central */}
      <section className="relative z-20 flex min-h-[100dvh] items-center justify-center px-6 py-24 sm:py-32">
        <div className="w-full max-w-md">
          {invite ? <ValidInviteShell invite={invite} /> : <InvalidTokenShell hasToken={!!cleanToken} />}
        </div>
      </section>
    </main>
  )
}

function ValidInviteShell({
  invite,
}: {
  invite: { id: string; email: string; token: string; customer_name: string | null }
}) {
  const firstName = invite.customer_name?.split(" ")[0] ?? null
  return (
    <>
      <div className="mb-8 flex items-center gap-3 sm:mb-10">
        <span className="h-px w-8 bg-red-900" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[oklch(0.6_0.015_30)] [font-family:var(--font-geist-sans)]">
          Activación de Cuenta
        </span>
      </div>

      <h1 className="mb-3 text-[clamp(2.5rem,8vw,4rem)] font-bold leading-[0.95] tracking-[-0.02em] text-[oklch(0.96_0.005_60)] [font-family:var(--font-cinzel)]">
        {firstName ? <>Bienvenido,<br /><span className="text-red-900">{firstName}.</span></> : <>Crea tu<br /><span className="text-red-900">cuenta.</span></>}
      </h1>

      <p className="mb-8 max-w-sm text-base leading-relaxed text-[oklch(0.65_0.012_30)] [font-family:var(--font-geist-sans)]">
        Define tu contraseña para acceder al área de miembros. Este enlace solo puede usarse una vez.
      </p>

      <div className="mb-8 border border-[oklch(0.2_0.015_25)] bg-[oklch(0.05_0.01_25)]/60 px-4 py-3">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[oklch(0.5_0.012_30)] [font-family:var(--font-geist-sans)]">
          Email confirmado
        </p>
        <p className="text-sm text-[oklch(0.85_0.005_60)] [font-family:var(--font-geist-sans)]">
          {invite.email}
        </p>
      </div>

      <div className="mb-10 h-[2px] w-16 bg-red-900" />

      <CreateAccountForm token={invite.token} email={invite.email} />
    </>
  )
}

function InvalidTokenShell({ hasToken }: { hasToken: boolean }) {
  return (
    <>
      <div className="mb-8 flex items-center gap-3 sm:mb-10">
        <span className="h-px w-8 bg-red-900" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[oklch(0.6_0.015_30)] [font-family:var(--font-geist-sans)]">
          Enlace Inválido
        </span>
      </div>

      <h1 className="mb-3 text-[clamp(2.5rem,8vw,4rem)] font-bold leading-[0.95] tracking-[-0.02em] text-[oklch(0.96_0.005_60)] [font-family:var(--font-cinzel)]">
        Enlace<br />
        <span className="text-red-900">no válido.</span>
      </h1>

      <p className="mb-8 max-w-sm text-base leading-relaxed text-[oklch(0.65_0.012_30)] [font-family:var(--font-geist-sans)]">
        {hasToken
          ? "Este enlace ya fue utilizado o ha expirado. Cada token de activación funciona una sola vez y caduca a los 7 días."
          : "Falta el token de activación. Verifica el enlace que recibiste por email."}
      </p>

      <div className="mb-10 h-[2px] w-16 bg-red-900" />

      <div className="space-y-4">
        <a
          href="/login"
          className="group inline-flex items-center gap-3 border border-[oklch(0.96_0.005_60)] bg-[oklch(0.96_0.005_60)] px-6 py-4 text-[#000000] transition-colors duration-300 hover:border-red-900 hover:bg-red-900 hover:text-[oklch(0.96_0.005_60)]"
        >
          <span className="text-sm font-semibold uppercase tracking-[0.3em] [font-family:var(--font-geist-sans)]">
            Ir al Inicio de Sesión
          </span>
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
        </a>
        <p className="max-w-sm text-xs leading-relaxed text-[oklch(0.45_0.01_30)] [font-family:var(--font-geist-sans)]">
          ¿Necesitas un nuevo enlace? Responde al email que recibiste de [BRAND_NAME] y el equipo te enviará uno nuevo.
        </p>
      </div>
    </>
  )
}

function FrameBracket({ pos }: { pos: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const isTop = pos.startsWith("top")
  const isLeft = pos.endsWith("left")
  const positionClass = `${isTop ? "top-4 sm:top-6" : "bottom-4 sm:bottom-6"} ${isLeft ? "left-4 sm:left-6" : "right-4 sm:right-6"}`
  return (
    <div className={`pointer-events-none absolute z-10 ${positionClass} h-6 w-6 sm:h-8 sm:w-8`}>
      <div className={`absolute h-px w-full bg-[oklch(0.55_0.04_25)]/60 ${isTop ? "top-0" : "bottom-0"}`} />
      <div className={`absolute h-full w-px bg-[oklch(0.55_0.04_25)]/60 ${isLeft ? "left-0" : "right-0"}`} />
    </div>
  )
}
