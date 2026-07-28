import { CinematicShell } from "@/components/cinematic-shell"
import { RecoverForm } from "./recover-form"
import { LegalLinks } from "@/components/legal/legal-links"

export const dynamic = "force-static"

export default function RecuperarContrasenaPage() {
  return (
    <CinematicShell frameLabel="RECUPERAR ACCESO">
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-6 py-20">
        <div className="mb-10">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
            Acceso · Miembros
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#F3F6FA] [font-family:var(--font-cinzel)] sm:text-4xl">
            Recuperar contraseña
          </h1>
          <p className="mt-4 text-sm text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
            Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
          </p>
        </div>
        <RecoverForm />
        <div className="mt-8">
          <a
            href="/login"
            className="text-xs font-medium uppercase tracking-[0.25em] text-[#a0a0b0] transition-colors hover:text-[#6D4A9B] [font-family:var(--font-geist-sans)]"
          >
            ← Volver al login
          </a>
        </div>
        <div className="mt-8">
          <LegalLinks align="start" />
        </div>
      </main>
    </CinematicShell>
  )
}
