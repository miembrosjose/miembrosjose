"use client"

// Modal com breakdown de XP por evento. Migra openXpDetailsModal do
// código original.
//
// Comportamento:
//   - Ao abrir: fetch /api/xp/me + /api/xp/breakdown
//   - Mostra: sumário do level (LV grande + barra progresso) + 2 totals
//     (XP acumulado, levels por compra) + lista catálogo XP
//   - Catálogo é INFORMATIVO (todos eventos sempre visíveis com xp ganho).
//     Quando user já fez aquele evento, mostra count + total acumulado.
//   - Esc fecha. Click no backdrop fecha. Trava scroll do body.

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { api } from "../_lib/api"
import type { XpMe } from "../_lib/types"
import styles from "./xp-details-modal.module.css"

type XpEventGroup = {
  event_type: string
  count: number
  total_xp: number
  total_levels: number
}

type XpBreakdown = {
  total_xp: number
  total_levels?: number
  by_event: XpEventGroup[]
}

type CatalogEntry = {
  event_type: string
  icon: string
  label: string
  xp: number
  level?: number
}

const XP_CATALOG: CatalogEntry[] = [
  // ── LO QUE DA EXPERIENCIA ──────────────────────────────────────────────
  // Esta lista es lo que se lee al abrir el nivel, así que dice lo que ESTA
  // plataforma premia. Venía del proyecto de embudos de venta del que salió
  // el sistema —«Funnel con 3+ likes», «Feedback recibido (funnel)»— y no
  // tenía nada que ver con Los 144.000.
  //
  // Ordenada de menos a más: lo que cuesta poco vale poco, y lo que cuesta
  // vale. Los tipos antiguos se conservan al final para que quien los tenga
  // siga viendo de dónde salieron sus puntos.
  { event_type: "forum_like_given",                icon: "👍", label: "Dar un «me gusta»",             xp: 1 },
  { event_type: "forum_reply_like_given",          icon: "👍", label: "«Me gusta» a una respuesta",    xp: 1 },
  { event_type: "episode_comment_like_given",      icon: "👍", label: "«Me gusta» a un comentario",    xp: 1 },
  { event_type: "forum_like_received",             icon: "❤️", label: "Te dieron «me gusta»",          xp: 5 },
  { event_type: "forum_reply_like_received",       icon: "❤️", label: "«Me gusta» en tu respuesta",    xp: 5 },
  { event_type: "episode_comment_like_received",   icon: "❤️", label: "«Me gusta» en tu comentario",   xp: 5 },
  { event_type: "login_day",                       icon: "☀️", label: "Volver un día nuevo",           xp: 10 },
  { event_type: "episode_comment",                 icon: "🎬", label: "Comentar un capítulo",          xp: 10 },
  { event_type: "forum_reply_received",            icon: "💬", label: "Te respondieron",               xp: 15 },
  { event_type: "forum_reply",                     icon: "💬", label: "Responder a alguien",           xp: 20 },
  { event_type: "pulso_respondido",                icon: "🫀", label: "Responder al Pulso semanal",    xp: 25 },
  { event_type: "encuentro_confirmado",            icon: "📍", label: "Confirmar un encuentro",        xp: 30 },
  { event_type: "ubicacion_puesta",                icon: "🗺️", label: "Marcar tu lugar en la Red",     xp: 40 },
  { event_type: "forum_post",                      icon: "✍️", label: "Abrir una conversación",        xp: 50 },
  { event_type: "meditation_complete",             icon: "🧘", label: "Completar una práctica",        xp: 60 },
  { event_type: "episode_complete",                icon: "📺", label: "Ver un capítulo entero",        xp: 100 },
  { event_type: "insignia_unlocked",               icon: "🏆", label: "Desbloquear una insignia",      xp: 200 },
  { event_type: "season_complete",                 icon: "🌌", label: "Completar una temporada",       xp: 400 },
  { event_type: "product_purchase",                icon: "💎", label: "Adquirir un módulo",            xp: 0, level: 1 },
  // Heredados del sistema anterior. Ya no se conceden; quien los tenga los
  // conserva y aquí ve de dónde salieron.
  { event_type: "insignia_aula",                   icon: "🎓", label: "Insignia de aula (histórico)",  xp: 50 },
  { event_type: "user_followed",                   icon: "👥", label: "Te siguieron (histórico)",      xp: 10 },
]

type Props = {
  open: boolean
  onClose: () => void
}

export function XpDetailsModal({ open, onClose }: Props) {
  const [breakdown, setBreakdown] = useState<XpBreakdown | null>(null)
  const [xp, setXp] = useState<XpMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Esc fecha + trava scroll
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Fetch quando abre
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(false)
    Promise.all([
      api<XpMe>("/api/xp/me").catch(() => null),
      api<XpBreakdown>("/api/xp/breakdown").catch(() => null),
    ]).then(([me, br]) => {
      if (cancelled) return
      if (!br) {
        setError(true)
      } else {
        setBreakdown(br)
        setXp(me)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  if (!open) return null

  const userEvents = new Map<string, XpEventGroup>()
  for (const g of breakdown?.by_event || []) userEvents.set(g.event_type, g)

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-label="Detalle de XP"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.headerTitle}>Detalle de XP</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </header>

        {loading && <div className={styles.loading}>Cargando...</div>}
        {error && <div className={styles.error}>Error al cargar</div>}

        {!loading && !error && (
          <>
            {xp && (
              <div className={styles.levelSummary}>
                <div className={styles.levelBig}>LV {xp.level}</div>
                <div className={styles.levelInfo}>
                  <div className={styles.eyebrow}>
                    Progreso al siguiente nivel
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${xp.percent ?? 0}%` }}
                    />
                  </div>
                  <div className={styles.progressLabel}>
                    {(xp.xp_in_level ?? 0).toLocaleString("es-419")} /{" "}
                    {(xp.xp_for_level ?? 0).toLocaleString("es-419")} XP ·{" "}
                    {xp.percent ?? 0}%
                  </div>
                </div>
              </div>
            )}

            <div className={styles.totals}>
              <div>
                <div className={styles.totalLabel}>XP total acumulado</div>
                <div className={`${styles.totalValue} ${styles.totalValuePrimary}`}>
                  {(breakdown?.total_xp || 0).toLocaleString("es-419")}
                </div>
              </div>
              <div>
                <div className={styles.totalLabel}>Levels por compras</div>
                <div className={`${styles.totalValue} ${styles.totalValueSecondary}`}>
                  +{breakdown?.total_levels || 0}
                </div>
              </div>
            </div>

            <div className={styles.list}>
              {XP_CATALOG.map((c) => {
                const userData = userEvents.get(c.event_type)
                const count = userData?.count || 0
                const totalEarned = userData?.total_xp || 0
                const totalLevelsForEvent = userData?.total_levels || 0
                const isDone = count > 0
                const reward = c.level
                  ? `+${c.level} LV`
                  : `+${c.xp} XP`
                const earned = isDone
                  ? c.level
                    ? `Total: +${totalLevelsForEvent} LV`
                    : `Total: +${totalEarned.toLocaleString("es-419")} XP`
                  : null

                return (
                  <div key={c.event_type} className={styles.row}>
                    <div className={styles.rowIcon}>{c.icon}</div>
                    <div className={styles.rowMain}>
                      <div className={styles.rowLabel}>{c.label}</div>
                      <div className={styles.rowMeta}>{count}× hecho</div>
                      {earned && <div className={styles.rowEarned}>{earned}</div>}
                    </div>
                    <div className={styles.rowReward}>{reward}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
