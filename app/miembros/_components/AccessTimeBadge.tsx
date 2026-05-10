"use client"

// Badge de tempo de acesso restante — aparece na Navbar.
// Mostra prazo do front (treinamento) com cor variando conforme proximidade
// do vencimento:
//   > 30 dias: cinza neutro
//   ≤ 30 dias: dourado (atenção)
//   ≤ 15 dias: laranja (warning)
//   ≤ 7 dias: vermelho urgente (pulsante)
//   sem fecha (NULL): não renderiza nada (acesso permanente)
//
// Click abre modal/popup com info detalhada + botão "Renovar".

import { useEffect, useMemo, useState } from "react"
import { Clock, X } from "lucide-react"
import { api } from "../_lib/api"
import { useAuth } from "../_lib/auth-context"
import { StripeInlinePayment, type CurrencyOption } from "./StripeInlinePayment"

type Props = {
  className?: string
}

export function AccessTimeBadge({ className }: Props) {
  const [expiresAt, setExpiresAt] = useState<string | null | undefined>(undefined)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<{ front: boolean; front_expires_at: string | null }>(
          "/api/profile/owned-products",
        )
        if (cancelled) return
        setExpiresAt(data.front_expires_at)
      } catch {
        if (!cancelled) setExpiresAt(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Loading inicial OU sem prazo (permanente) — não renderiza
  if (expiresAt === undefined) return null
  if (expiresAt === null) return null

  const expMs = new Date(expiresAt).getTime()
  const daysLeft = Math.ceil((expMs - Date.now()) / (1000 * 60 * 60 * 24))

  // Já vencido — não mostra (user vai cair na tela acceso-vencido em algum momento)
  if (daysLeft <= 0) return null

  const isUrgent = daysLeft <= 7
  const isWarn = daysLeft <= 15
  const isAttention = daysLeft <= 30

  const styles = {
    container: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      padding: "0.4rem 0.7rem",
      border: "1px solid",
      borderColor: isUrgent ? "#dc2626" : isWarn ? "#ea580c" : isAttention ? "#c9a961" : "#2a2a36",
      background: isUrgent
        ? "rgba(127, 29, 29, 0.15)"
        : isWarn
        ? "rgba(234, 88, 12, 0.12)"
        : isAttention
        ? "rgba(201, 169, 97, 0.1)"
        : "rgba(26, 26, 36, 0.4)",
      color: isUrgent ? "#fca5a5" : isWarn ? "#fdba74" : isAttention ? "#fde68a" : "#a0a0b0",
      fontSize: "0.7rem",
      fontFamily: "var(--font-mono)",
      letterSpacing: "0.1em",
      cursor: "pointer",
      transition: "all 0.2s",
      animation: isUrgent ? "accessBadgePulse 1.5s ease-in-out infinite" : undefined,
    } as React.CSSProperties,
    label: {
      fontWeight: 600,
      textTransform: "uppercase" as const,
    },
  }

  const label = daysLeft === 1 ? "1 día" : `${daysLeft} días`

  return (
    <>
      <style>{`
        @keyframes accessBadgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        style={styles.container}
        title={`Tu acceso vence en ${daysLeft} días`}
        aria-label="Tiempo de acceso restante"
      >
        <Clock size={12} />
        <span style={styles.label}>{label}</span>
      </button>

      {open && <AccessInfoModal daysLeft={daysLeft} expiresAt={expiresAt} onClose={() => setOpen(false)} />}
    </>
  )
}

function AccessInfoModal({
  daysLeft,
  expiresAt,
  onClose,
}: {
  daysLeft: number
  expiresAt: string
  onClose: () => void
}) {
  const { user } = useAuth()
  const isUrgent = daysLeft <= 7
  const isWarn = daysLeft <= 15
  const isAttention = daysLeft <= 30

  const accentColor = isUrgent ? "#dc2626" : isWarn ? "#ea580c" : isAttention ? "#c9a961" : "#a0a0b0"
  const formattedDate = new Date(expiresAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Upgrade state — 1-click off-session via /api/upgrade-to-lifetime
  // Quando 1-click falha (cartão expirado/sem cartão/Hotmart), abre fallback
  // inline com Stripe Elements (StripeInlinePayment) — cliente digita cartão novo.
  const [upgradeStatus, setUpgradeStatus] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "success" }
    | { kind: "fallback"; reason: "expired_card" | "no_customer" | "card_declined" | "other" }
    | { kind: "error"; message: string }
  >({ kind: "idle" })

  // Currency options — carregadas ao abrir o modal pra mostrar preço no CTA.
  // Mesma lista é reutilizada pelo fallback inline (StripeInlinePayment) se 1-click falhar.
  const [pricingOptions, setPricingOptions] = useState<CurrencyOption[] | null>(null)
  // display_local: moeda local LATAM detectada via geo, usada APENAS pra display
  // approximado (≈ R$ X) quando a cobrança é em USD/EUR/GBP/CHF. Não vai
  // pro Stripe Elements — só pro PriceTag mostrar o preço local de referência.
  const [displayLocal, setDisplayLocal] = useState<{ currency: string; formatted: string; amount: number } | null>(null)
  const [hadStripeCustomer, setHadStripeCustomer] = useState(false)

  useEffect(() => {
    // Carrega pricing logo na abertura do modal — só pra exibir; não bloqueia 1-click.
    let cancelled = false
    fetch("/api/profile/upgrade-pricing", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data?.options) setPricingOptions(data.options)
        if (data?.display_local) setDisplayLocal(data.display_local)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  async function handleUpgrade() {
    setUpgradeStatus({ kind: "loading" })
    try {
      const res = await fetch("/api/upgrade-to-lifetime", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setUpgradeStatus({ kind: "success" })
        setTimeout(() => window.location.reload(), 1500)
        return
      }

      // 1-click falhou — abre fallback inline com Elements
      const errorCode = data.error || "other"
      const isFallbackEligible =
        errorCode === "card_declined" ||
        errorCode === "expired_card" ||
        errorCode === "no_customer" ||
        errorCode === "no_payment_method"

      if (isFallbackEligible) {
        setHadStripeCustomer(errorCode === "card_declined" || errorCode === "expired_card")
        // Pricing já carregado no mount; só busca de novo se nunca veio
        if (!pricingOptions) await loadPricingOptions()
        setUpgradeStatus({ kind: "fallback", reason: errorCode as never })
        return
      }

      // Erro não-recuperável (no_annual_sale, payment_failed, etc)
      setUpgradeStatus({
        kind: "error",
        message: data.message || "No se pudo procesar el pago.",
      })
    } catch {
      setUpgradeStatus({
        kind: "error",
        message: "Error de conexión. Intenta nuevamente.",
      })
    }
  }

  async function loadPricingOptions() {
    try {
      const res = await fetch("/api/profile/upgrade-pricing", { credentials: "include" })
      if (!res.ok) {
        setPricingOptions([
          { currency: "usd", amount: 40, label: "Pagar en USD", formatted: "US$ 40,00" },
        ])
        return
      }
      const data = await res.json()
      setPricingOptions(data.options || [])
    } catch {
      setPricingOptions([
        { currency: "usd", amount: 40, label: "Pagar en USD", formatted: "US$ 40,00" },
      ])
    }
  }

  // bodyExtras estável pra StripeInlinePayment (anti remount loop)
  const inlineBodyExtras = useMemo(() => ({}), [])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "1rem",
        // overflow-y no overlay: quando o modal cresce além do viewport
        // (fallback Stripe Elements em mobile), permite rolar pra ver o form completo
        overflowY: "auto",
        overscrollBehavior: "contain",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "linear-gradient(135deg, #12121a 0%, #0f0f17 50%, #12121a 100%)",
          border: `1px solid ${accentColor}`,
          padding: "2rem 1.75rem",
          color: "#f5f5f7",
          fontFamily: "var(--font-body)",
          position: "relative",
          boxShadow: `0 30px 60px -30px ${accentColor}40, inset 0 1px 0 rgba(255,255,255,0.04)`,
          // margin-block dá ar em cima/embaixo quando o overlay scrolla
          marginBlock: "auto",
        }}
      >
        {/* Cantos decorativos */}
        <span style={{ position: "absolute", left: 0, top: 0, width: 8, height: 8, borderLeft: `2px solid ${accentColor}`, borderTop: `2px solid ${accentColor}` }} />
        <span style={{ position: "absolute", right: 0, top: 0, width: 8, height: 8, borderRight: `2px solid ${accentColor}`, borderTop: `2px solid ${accentColor}` }} />
        <span style={{ position: "absolute", left: 0, bottom: 0, width: 8, height: 8, borderLeft: `2px solid ${accentColor}`, borderBottom: `2px solid ${accentColor}` }} />
        <span style={{ position: "absolute", right: 0, bottom: 0, width: 8, height: 8, borderRight: `2px solid ${accentColor}`, borderBottom: `2px solid ${accentColor}` }} />

        {/* Botão X no canto superior direito pra fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            color: "#a0a0b0",
            cursor: "pointer",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#f5f5f7" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#a0a0b0" }}
        >
          <X size={18} />
        </button>

        <p style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", letterSpacing: "0.4em", textTransform: "uppercase", color: accentColor, margin: 0 }}>
          Tu Acceso al Treinamento
        </p>

        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 700, margin: "1rem 0 0.5rem", lineHeight: 1.1 }}>
          {daysLeft} <span style={{ color: accentColor }}>{daysLeft === 1 ? "día" : "días"}</span>
        </h2>

        <p style={{ fontSize: "0.85rem", color: "#a0a0b0", margin: 0 }}>
          Vence el <span style={{ color: "#f5f5f7", fontWeight: 600 }}>{formattedDate}</span>
        </p>

        {/* Mensagens só pra casos de urgência — em estado normal (>30 dias)
         * o card já comunica tudo (dias + data). Texto extra fica fora. */}
        {(isUrgent || isWarn || isAttention) && (
          <>
            <div style={{ height: 1, background: "#2a2a36", margin: "1.5rem 0" }} />
            <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "#d4d4d8", margin: 0 }}>
              {isUrgent
                ? "Tu acceso al área de membros principal está por vencer. Renueva ahora pra continuar accediendo a Inicio, Lecciones, Comunidad y Funnels sin interrupciones."
                : isWarn
                ? "Tu acceso vence en menos de 15 días. Renueva con anticipación pra evitar perder el acceso al treinamento."
                : "Tu acceso al treinamento se renueva una vez al año. Aprovecha pra revisar tu progreso y renovar com tiempo."}
            </p>
          </>
        )}

        {/* CTA UPGRADE — paga só a diferença pra virar vitalício */}
        <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(201,169,97,0.08)", border: "1px solid rgba(201,169,97,0.3)" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
            <p style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a961", margin: 0 }}>
              Convertir en vitalicio
            </p>
            {pricingOptions && pricingOptions.length > 0 && (
              <UpgradePriceTag options={pricingOptions} displayLocal={displayLocal} />
            )}
          </div>

          {/* Estado SUCESSO */}
          {upgradeStatus.kind === "success" && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80", fontSize: "0.8rem", textAlign: "center", fontFamily: "var(--font-mono)" }}>
              ✓ Convertido a Vitalicio
            </div>
          )}

          {/* Estado ERROR (não recuperável) */}
          {upgradeStatus.kind === "error" && (
            <>
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5", fontSize: "0.75rem", lineHeight: 1.4 }}>
                {upgradeStatus.message}
              </div>
            </>
          )}

          {/* Estado IDLE/LOADING — tenta 1-click primeiro */}
          {(upgradeStatus.kind === "idle" || upgradeStatus.kind === "loading") && (
            <>
              <p style={{ fontSize: "0.85rem", color: "#d4d4d8", margin: "0.5rem 0 0", lineHeight: 1.5 }}>
                Paga solo la diferencia y ten acceso permanente a esta comunidad.
              </p>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={upgradeStatus.kind === "loading"}
                style={{
                  width: "100%",
                  marginTop: "1rem",
                  padding: "0.9rem 1.25rem",
                  border: "1px solid #c9a961",
                  background: "#c9a961",
                  color: "#0a0a0f",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  cursor: upgradeStatus.kind === "loading" ? "wait" : "pointer",
                  opacity: upgradeStatus.kind === "loading" ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
              >
                {upgradeStatus.kind === "loading" ? "Procesando..." : "Convertir a Vitalicio"}
              </button>
            </>
          )}

          {/* Estado FALLBACK — Stripe Elements inline pra digitar cartão novo */}
          {upgradeStatus.kind === "fallback" && pricingOptions && (
            <div style={{ marginTop: "0.75rem" }}>
              <StripeInlinePayment
                currencyOptions={pricingOptions}
                createPiEndpoint="/api/upgrade-to-lifetime/create-pi"
                bodyExtras={inlineBodyExtras}
                customerEmail={user?.email}
                headline={
                  hadStripeCustomer
                    ? "Tu tarjeta anterior fue rechazada. Ingresa una nueva:"
                    : "Ingresa tu tarjeta para completar la compra:"
                }
                onSuccess={() => {
                  setUpgradeStatus({ kind: "success" })
                  setTimeout(() => window.location.reload(), 1500)
                }}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// Tag de preço inline pro CTA de upgrade — moeda primária (de cobrança) +
// moeda local LATAM secundária (display approx via geolocalização).
//
// Cenários:
//  - LATAM: options = [USD, BRL/MXN/ARS/etc] → primary=USD, secondary=local
//  - USD/EUR/GBP/CHF + user em LATAM: options=[nativa], displayLocal=local
//    → primary=nativa, secondary=local (approx, não pra cobrança)
function UpgradePriceTag({
  options,
  displayLocal,
}: {
  options: CurrencyOption[]
  displayLocal: { currency: string; formatted: string; amount: number } | null
}) {
  const usd = options.find((o) => o.currency === "usd")
  const optionsLocal = options.find((o) => o.currency !== "usd")
  const primary = usd || options[0]
  // Prioriza local das próprias options (LATAM); senão usa displayLocal (cross-region geo)
  const secondary = optionsLocal || displayLocal

  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "#c9a961", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        {primary.formatted}
      </span>
      {secondary && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.08em", color: "rgba(201, 169, 97, 0.65)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          ≈ {secondary.formatted}
        </span>
      )}
    </div>
  )
}
