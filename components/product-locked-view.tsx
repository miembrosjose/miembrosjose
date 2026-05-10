// View "produto bloqueado" — mostrada quando user logado tenta acessar
// /miembros/producto/<slug> mas não comprou aquele bump/upsell.
// Não usa redirect mudo: explica o motivo e oferece o checkout.

import Link from "next/link"

export function ProductLockedView({
  productName,
  checkoutSlug,
  tagline,
  description,
}: {
  productName: string
  checkoutSlug: string | null
  tagline: string
  description: string
}) {
  const checkoutHref = checkoutSlug ? `https://SEU_DOMINIO.com/checkout/${checkoutSlug}` : null

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-20 text-center sm:py-32">
      <Link
        href="/"
        aria-label="Cerrar"
        className="fixed right-4 top-16 z-50 flex h-9 w-9 items-center justify-center border border-[#1a1a24] bg-[#000000]/95 text-[#a0a0b0] backdrop-blur-sm transition-colors hover:border-red-900 hover:bg-red-900 hover:text-[#f5f5f7] sm:right-6 sm:top-16 sm:h-10 sm:w-10"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
      </Link>

      <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a961]/30 bg-[#c9a961]/5">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#c9a961]" aria-hidden="true">
          <path d="M5 11V7a7 7 0 0 1 14 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
        Producto bloqueado
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-[#f5f5f7] [font-family:var(--font-cinzel)] sm:text-4xl">
        {productName}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
        {tagline}
      </p>

      <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
        {description} Aún no figura en tu cuenta. Si ya compraste y no aparece,
        contáctanos por el soporte.
      </p>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        {checkoutHref && (
          <a
            href={checkoutHref}
            className="border border-[#c9a961] bg-[#c9a961] px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#000000] transition-colors hover:bg-red-900 hover:border-red-900 hover:text-[#f5f5f7] [font-family:var(--font-geist-sans)]"
          >
            Desbloquear ahora
          </a>
        )}
        <Link
          href="/"
          className="border border-[#1a1a24] bg-[#12121a]/40 px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a0a0b0] transition-colors hover:border-[#3a3a45] hover:text-[#f5f5f7] [font-family:var(--font-geist-sans)]"
        >
          Volver
        </Link>
      </div>
    </main>
  )
}
