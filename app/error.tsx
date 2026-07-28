"use client"

import { useEffect } from "react"

// Error boundary de la aplicación. Nunca muestra stack traces ni detalles
// internos. Registra solo el digest (sin datos sensibles) en el servidor/consola.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log seguro: solo el digest opaco de Next, nunca el mensaje/stack completo.
    console.error("[app-error] digest=%s", error?.digest ?? "unknown")
  }, [error])

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#050510] px-6 py-16 text-center text-[#F3F6FA] selection:bg-[#6D4A9B]/40">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,5,16,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_500px_700px_at_50%_20%,rgba(109,74,155,0.14),transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-[#6D4A9B]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
            Algo salió mal
          </span>
          <span className="h-px w-8 bg-[#6D4A9B]" />
        </div>

        <h1 className="text-[clamp(2rem,6vw,3rem)] font-bold leading-[0.95] tracking-[-0.02em] [font-family:var(--font-cinzel)]">
          Tuvimos un
          <br />
          <span className="text-[#6D4A9B]">inconveniente.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-[#a8a8c0] [font-family:var(--font-geist-sans)]">
          No pudimos completar tu solicitud. Puedes reintentar o volver al inicio.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex w-full items-center justify-center border border-[#6D4A9B] bg-[#6D4A9B] px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#F3F6FA] transition-colors hover:border-[#8a63b8] hover:bg-[#8a63b8] [font-family:var(--font-geist-sans)]"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex w-full items-center justify-center border border-[#251f30] px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#a8a8c0] transition-colors hover:border-[#6D4A9B] hover:text-[#F3F6FA] [font-family:var(--font-geist-sans)]"
          >
            Volver al inicio
          </a>
        </div>

        <p className="mt-8 text-xs text-[#6a6a85] [font-family:var(--font-geist-sans)]">
          ¿Persiste el problema?{" "}
          <a href="/soporte" className="text-[#a78bca] underline">
            Soporte
          </a>
        </p>
      </div>
    </main>
  )
}
