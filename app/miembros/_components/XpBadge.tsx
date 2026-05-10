"use client"

// Badge de XP/Level do user atual — aparece na Navbar entre nav links e avatar.
// Equivalente ao .nav-xp-badge do area-prototipo.html.
//
// Polling 30s pra detectar level-up: se xp.level > previous.level, despacha
// evento "cf:level-up" pra cada nível subido (LevelUpOverlay enfileira e
// anima 1 por vez). Re-fetch também on visibility/focus pra capturar mudanças
// que rolaram com a aba em background.
//
// Click abre XpDetailsModal (próxima iteração) com breakdown de XP.

import { useEffect, useRef, useState } from "react"
import { Zap } from "lucide-react"
import { api } from "../_lib/api"
import type { XpMe } from "../_lib/types"
import styles from "./xp-badge.module.css"

const POLL_INTERVAL_MS = 30_000

type XpBadgeProps = {
  onClick?: () => void
}

export function XpBadge({ onClick }: XpBadgeProps) {
  const [xp, setXp] = useState<XpMe | null>(null)
  const previousLevelRef = useRef<number | null>(null)
  const isFirstFetchRef = useRef(true)

  useEffect(() => {
    let alive = true

    async function refetch(detectLevelUp: boolean) {
      try {
        const data = await api<XpMe>("/api/xp/me")
        if (!alive) return
        const previous = previousLevelRef.current
        previousLevelRef.current = data.level

        // Detecta level-up: enfileira UM POR UM (não sobrescreve se subiu vários)
        if (detectLevelUp && previous !== null && data.level > previous) {
          for (let lv = previous + 1; lv <= data.level; lv++) {
            window.dispatchEvent(
              new CustomEvent("cf:level-up", { detail: { level: lv } })
            )
          }
        }

        setXp(data)
      } catch {
        // Silent — badge só não aparece se API falhar
      }
    }

    // Primeiro fetch — não detecta level-up (não tem baseline ainda)
    refetch(false).then(() => {
      isFirstFetchRef.current = false
    })

    // Polling 30s — pula se aba está em background (visibilitychange listener
    // abaixo cuida do refetch ao voltar). Evita queimar requests inúteis.
    const interval = window.setInterval(() => {
      if (document.hidden) return
      refetch(!isFirstFetchRef.current)
    }, POLL_INTERVAL_MS)

    // Re-fetch on visibility/focus — captura mudanças que rolaram em background
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        refetch(!isFirstFetchRef.current)
      }
    }
    function onFocus() {
      refetch(!isFirstFetchRef.current)
    }
    // Force sync imediato: dispatchado por checkProductAchievements após grant de level
    function onForceSync() {
      refetch(!isFirstFetchRef.current)
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("focus", onFocus)
    window.addEventListener("cf:xp-force-sync", onForceSync)

    return () => {
      alive = false
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("cf:xp-force-sync", onForceSync)
    }
  }, [])

  if (!xp) return null

  return (
    <button type="button" className={styles.badge} onClick={onClick} aria-label="Detalle de XP">
      <Zap size={11} />
      <span className={styles.level}>LV {xp.level}</span>
      <span className={styles.xp}>{xp.total_xp.toLocaleString("es-419")} XP</span>
    </button>
  )
}
