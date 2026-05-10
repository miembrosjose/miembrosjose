import { CinematicShell } from "@/components/cinematic-shell"
import { ResetPasswordForm } from "./reset-password-form"

export const dynamic = "force-static"

/**
 * Pagina onde o user chega apos clicar no link do email enviado pelo Supabase.
 * O Supabase passa o token via URL hash (#access_token=...&type=recovery),
 * NAO via query string. Por isso o form e client-side — precisa ler hash via JS.
 */
export default function RecuperarPasswordPage() {
  return (
    <CinematicShell frameLabel="NUEVA CONTRASEÑA">
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-6 py-20">
        <div className="mb-10">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
            Acceso · Miembros
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#f5f5f7] [font-family:var(--font-cinzel)] sm:text-4xl">
            Crear nueva contraseña
          </h1>
          <p className="mt-4 text-sm text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
            Define una nueva contraseña para tu cuenta. Mínimo 8 caracteres.
          </p>
        </div>
        <ResetPasswordForm />
      </main>
    </CinematicShell>
  )
}
