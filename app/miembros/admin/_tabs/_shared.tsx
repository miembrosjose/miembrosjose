// Helpers compartilhados entre os tabs do admin panel.
// Mantém estilo consistente sem duplicar strings em cada tab.

import { type ReactNode } from "react"

export const PRODUCT_OPTIONS = [
  { key: "creativos", name: "Creativos.AI" },
  { key: "andromeda", name: "Andrómeda.ADS" },
  { key: "analytics", name: "Analytics.KPI" },
  { key: "minivsl", name: "Agente Copy Mini VSL's" },
  { key: "revisao", name: "Revisión de Tu Embudo" },
  { key: "bonus-ganchos", name: "Pack de Ganchos Neuronales™" },
] as const

export const inputCls =
  "block w-full border border-[#1a1a24] bg-[#12121a]/60 px-4 py-3 text-base text-[#f5f5f7] placeholder:text-[#6a6a7a] transition-colors focus:border-red-900 focus:bg-[#0a0a0f] focus:outline-none focus:ring-1 focus:ring-red-900/40 disabled:opacity-50 [font-family:var(--font-geist-sans)]"

export const labelCls =
  "block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a0a0b0] [font-family:var(--font-geist-sans)] mb-2"

export const btnCls =
  "inline-flex items-center justify-center gap-2 border border-[#f5f5f7] bg-[#f5f5f7] px-6 py-3 text-[#0a0a0f] text-xs font-semibold uppercase tracking-[0.3em] transition-colors hover:border-red-900 hover:bg-red-900 hover:text-[#f5f5f7] disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-[#f5f5f7] disabled:hover:text-[#0a0a0f] [font-family:var(--font-geist-sans)]"

export function FilterBtn({
  children,
  active,
  onClick,
  variant = "gold",
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  variant?: "gold" | "red"
}) {
  const activeCls =
    variant === "red"
      ? "border-red-500 bg-red-500/10 text-red-400"
      : "border-[#c9a961] bg-[#c9a961]/10 text-[#c9a961]"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] transition-colors [font-family:var(--font-geist-sans)] ${
        active ? activeCls : "border-[#1a1a24] text-[#a0a0b0] hover:border-[#3a3a45]"
      }`}
    >
      {children}
    </button>
  )
}

// ─── Componentes visuais modernos ──────────────────────────────────────────

/** Card padrão pra agrupar conteúdo. Use pra cada "seção" do tab. */
export function AdminCard({
  title,
  description,
  children,
  accent = "neutral",
  className = "",
}: {
  title?: string
  description?: string
  children: ReactNode
  accent?: "neutral" | "gold" | "red" | "green"
  className?: string
}) {
  const accentColors = {
    neutral: "border-[#1a1a24]",
    gold: "border-[#c9a961]/40",
    red: "border-red-900/40",
    green: "border-emerald-700/40",
  }
  return (
    <div className={`border ${accentColors[accent]} bg-gradient-to-br from-[#12121a]/40 via-[#0f0f17]/40 to-[#12121a]/40 p-5 sm:p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f5f5f7] [font-family:var(--font-geist-sans)]">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

/** Stat card destaque — usar em fileira pra dashboards. */
export function StatCard({
  label,
  value,
  trend,
  variant = "neutral",
  icon,
}: {
  label: string
  value: ReactNode
  trend?: string
  variant?: "neutral" | "gold" | "red" | "green"
  icon?: ReactNode
}) {
  const colors = {
    neutral: { border: "border-[#1a1a24]", text: "text-[#f5f5f7]", accent: "text-[#a0a0b0]" },
    gold: { border: "border-[#c9a961]/40", text: "text-[#fde68a]", accent: "text-[#c9a961]" },
    red: { border: "border-red-700/50", text: "text-red-300", accent: "text-red-400" },
    green: { border: "border-emerald-700/50", text: "text-emerald-300", accent: "text-emerald-400" },
  }
  const c = colors[variant]
  return (
    <div className={`relative overflow-hidden border ${c.border} bg-[#0a0a0f]/40 p-4`}>
      <div className="flex items-start justify-between">
        <p className={`text-[9px] font-semibold uppercase tracking-[0.3em] ${c.accent} [font-family:var(--font-geist-sans)]`}>
          {label}
        </p>
        {icon && <div className={c.accent}>{icon}</div>}
      </div>
      <p className={`mt-2 text-2xl font-bold [font-family:var(--font-cinzel)] ${c.text}`}>
        {value}
      </p>
      {trend && (
        <p className={`mt-1 text-[10px] uppercase tracking-[0.2em] ${c.accent} [font-family:var(--font-geist-sans)]`}>
          {trend}
        </p>
      )}
    </div>
  )
}

/** Empty state com ícone + mensagem (substitui as <p>Cargando...</p> espalhadas). */
export function AdminEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-[#2a2a36] bg-[#0a0a0f]/40 px-6 py-12 text-center">
      {icon && <div className="text-[#6a6a7a]">{icon}</div>}
      <p className="text-sm font-semibold text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

/** Badge inline pra status (success, error, warning, info). */
export function AdminBadge({
  variant,
  children,
}: {
  variant: "success" | "error" | "warning" | "info" | "neutral"
  children: ReactNode
}) {
  const colors = {
    success: "border-emerald-700/50 bg-emerald-900/30 text-emerald-400",
    error: "border-red-700/50 bg-red-900/30 text-red-400",
    warning: "border-amber-700/50 bg-amber-900/30 text-amber-400",
    info: "border-blue-700/50 bg-blue-900/30 text-blue-400",
    neutral: "border-[#2a2a36] bg-[#1a1a24]/40 text-[#a0a0b0]",
  }
  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.25em] [font-family:var(--font-geist-sans)] ${colors[variant]}`}>
      {children}
    </span>
  )
}
