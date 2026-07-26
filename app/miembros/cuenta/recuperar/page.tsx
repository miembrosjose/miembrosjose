import { CinematicShell } from "@/components/cinematic-shell"
import { ResetPasswordForm } from "./reset-password-form"

// Dinámica (no estática): depende de la sesión de recuperación en cookies y de
// query params (?error). force-static hacía que Cloudflare cacheara la página y
// sirviera código viejo → falso "Link inválido".
export const dynamic = "force-dynamic"

/**
 * Página a la que llega el usuario tras hacer clic en el enlace del email.
 * El enlace pasa por /auth/confirm (verifyOtp), que establece la sesión de
 * recuperación en cookies. Esta pantalla comprueba esa sesión (client-side).
 */
export default function RecuperarPasswordPage() {
  return (
    <CinematicShell frameLabel="NUEVA CONTRASEÑA">
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-6 py-20">
        <div className="mb-10">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
            Acceso · Miembros
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#F3F6FA] [font-family:var(--font-cinzel)] sm:text-4xl">
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
