import { LEGAL } from "@/lib/site/legal-config"

// Enlaces legales/soporte reutilizables. Discretos pero legibles, con el
// lenguaje visual de Los 144.000 (tenue, mayúsculas, tracking, hover violeta).
//
// Uso en superficies de la plataforma (login, activación, recuperación, acceso
// suspendido, perfil, footer). Rutas internas del propio dominio.

type Props = {
  className?: string
  /** Incluye el enlace de Soporte (por defecto sí). */
  includeSupport?: boolean
  /** Alineación del grupo. */
  align?: "center" | "start"
}

const items = [
  { href: LEGAL.termsPath, label: "Términos" },
  { href: LEGAL.privacyPath, label: "Privacidad" },
  { href: LEGAL.refundsPath, label: "Cancelaciones" },
]

export function LegalLinks({ className = "", includeSupport = true, align = "center" }: Props) {
  const links = includeSupport ? [...items, { href: LEGAL.supportPath, label: "Soporte" }] : items
  return (
    <nav
      aria-label="Enlaces legales"
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${
        align === "center" ? "justify-center" : "justify-start"
      } ${className}`}
    >
      {links.map((l, i) => (
        <span key={l.href} className="flex items-center gap-x-4">
          {i > 0 && <span aria-hidden className="text-[#3a3a52]">·</span>}
          <a
            href={l.href}
            className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#6a6a85] transition-colors hover:text-[#a78bca] focus-visible:text-[#a78bca] focus-visible:outline-none [font-family:var(--font-geist-sans)]"
          >
            {l.label}
          </a>
        </span>
      ))}
    </nav>
  )
}
