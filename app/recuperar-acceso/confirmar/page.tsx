import type { Metadata } from "next"
import { CinematicShell } from "@/components/cinematic-shell"

export const metadata: Metadata = {
  title: "Recuperar acceso · Los 144000",
  description: "Confirma la recuperación de tu acceso.",
  robots: { index: false, follow: false },
}

// Dinámica y no cacheable: recibe token_hash/type/next por query.
export const dynamic = "force-dynamic"

type SearchParams = Promise<{ token_hash?: string; type?: string; next?: string }>

/**
 * Paso 1 de la recuperación (a prueba de escáneres de email).
 *
 * Esta página SOLO muestra una confirmación. NO llama a verifyOtp ni consume el
 * token en el GET (los escáneres de Gmail/Outlook hacen GET y consumirían un
 * enlace de un solo uso). La verificación ocurre únicamente al pulsar el botón,
 * que envía un POST a /api/auth/recovery-verify.
 */
export default async function ConfirmarRecuperacionPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const tokenHash = sp.token_hash ?? ""
  const type = sp.type ?? ""
  const next = sp.next ?? "/miembros/cuenta/recuperar"

  // ── LA MISMA PANTALLA, DOS MOTIVOS ──────────────────────────────────────
  // Por aquí pasan los dos enlaces de un solo uso: el de quien olvidó su
  // contraseña y el de quien entra por primera vez. Dejar el texto de
  // «recuperar» para alguien que acaba de llegar le hace dudar de si el
  // correo era para él.
  const esInvitacion = type === "invite"
  const copia = esInvitacion
    ? {
        marco: "ACTIVACIÓN DE CUENTA",
        titulo: "Activa tu acceso",
        entrada: "Confirma que quieres continuar y eliges tu contraseña.",
        boton: "Continuar y crear mi contraseña",
        pie: "Por seguridad, el enlace se valida solo cuando pulsas el botón.",
      }
    : {
        marco: "RECUPERACIÓN DE ACCESO",
        titulo: "Recuperar acceso",
        entrada: "Confirma que deseas continuar con la recuperación de tu acceso.",
        boton: "Continuar y crear contraseña",
        pie:
          "Por seguridad, el enlace se valida solo cuando pulsas el botón. Si no solicitaste " +
          "recuperar tu acceso, puedes cerrar esta página.",
      }

  return (
    <CinematicShell frameLabel={copia.marco}>
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-6 py-20">
        <div className="mb-8">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
            Acceso · Miembros
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#F3F6FA] [font-family:var(--font-cinzel)] sm:text-4xl">
            {copia.titulo}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
            {copia.entrada}
          </p>
        </div>

        <form method="POST" action="/api/auth/recovery-verify" className="space-y-5">
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-3 border border-[#F3F6FA] bg-[#F3F6FA] px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#000000] transition-colors hover:border-red-900 hover:bg-red-900 hover:text-[#F3F6FA] [font-family:var(--font-geist-sans)]"
          >
            {copia.boton}
          </button>
        </form>

        <p className="mt-8 text-xs leading-relaxed text-[#6a6a85] [font-family:var(--font-geist-sans)]">
          {copia.pie}
        </p>
      </main>
    </CinematicShell>
  )
}
