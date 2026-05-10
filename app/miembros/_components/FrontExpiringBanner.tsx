"use client"

// Banner de aviso quando o front (treinamento) está próximo de expirar.
// Mostra X dias restantes + CTA pra falar com suporte.
//
// Aparece quando: front_expires_at - now <= 30 dias E > 0 (não vencido).
// Vencido vira redirect server-side pra /miembros/acceso-vencido.
//
// Anti-replay: sessionStorage guarda "dispensed" pra não reaparecer
// na mesma sessão se user fechou. Volta no próximo login/refresh.

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { api } from "../_lib/api"

const DISMISS_KEY = "app_front_expiring_dismissed_v1"
const WHATSAPP_URL =
  "https://wa.me/SEU_WHATSAPP_NUMBER?text=Hola,%20mi%20acceso%20esta%20por%20vencer.%20Quiero%20renovar."

export function FrontExpiringBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<{ front: boolean; front_expires_at: string | null }>(
          "/api/profile/owned-products",
        )
        if (cancelled) return
        if (!data.front || !data.front_expires_at) return
        const expMs = new Date(data.front_expires_at).getTime()
        const days = Math.ceil((expMs - Date.now()) / (1000 * 60 * 60 * 24))
        if (days > 0 && days <= 30) {
          setDaysLeft(days)
        }
      } catch {
        // silent
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function dismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, "1")
    } catch {}
  }

  if (dismissed || daysLeft === null) return null

  // Tom da cor: ≤7 dias = vermelho urgente, ≤15 = laranja, ≤30 = dourado
  const isUrgent = daysLeft <= 7
  const isWarn = daysLeft <= 15

  return (
    <div
      className="relative z-30 border-b backdrop-blur-md"
      style={{
        borderColor: isUrgent ? "rgba(127,29,29,0.5)" : isWarn ? "rgba(234,88,12,0.4)" : "rgba(201,169,97,0.4)",
        background: isUrgent
          ? "linear-gradient(90deg, rgba(127,29,29,0.18), rgba(127,29,29,0.08))"
          : isWarn
          ? "linear-gradient(90deg, rgba(234,88,12,0.15), rgba(234,88,12,0.06))"
          : "linear-gradient(90deg, rgba(201,169,97,0.12), rgba(201,169,97,0.05))",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.3em] [font-family:var(--font-mono)]"
          style={{ color: isUrgent ? "#fca5a5" : isWarn ? "#fdba74" : "#fde68a" }}
        >
          {isUrgent ? "Acceso por vencer" : "Aviso"}
        </span>
        <p className="flex-1 text-xs leading-relaxed text-[#f5f5f7] sm:text-sm [font-family:var(--font-body)]">
          Tu acceso al treinamento{" "}
          <span className="font-semibold" style={{ color: isUrgent ? "#fca5a5" : "#fde68a" }}>
            vence en {daysLeft} {daysLeft === 1 ? "día" : "días"}
          </span>
          . Renueva con nuestro equipo pra continuar accediendo.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] transition-colors sm:inline-block [font-family:var(--font-mono)]"
          style={{
            borderColor: isUrgent ? "#dc2626" : "#c9a961",
            color: isUrgent ? "#fca5a5" : "#fde68a",
          }}
        >
          Renovar →
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="text-[#a0a0b0] transition-colors hover:text-[#f5f5f7]"
          aria-label="Cerrar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
