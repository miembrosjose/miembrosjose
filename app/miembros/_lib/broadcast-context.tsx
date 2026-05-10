"use client"

// Provider + hook da fila de broadcasts (popups overlay deslizantes).
// Equivalente ao bloco BROADCAST_QUEUE do area-prototipo.html (11104-11219).
//
// Anti-replay:
//  - localStorage 'cf_broadcast_shown_ids_v1' (max 500 IDs, FIFO)
//  - notif.read_at já preenchido (já vista cross-device) → skip
//  - notif criada há mais de 5min → skip (fresh window)
//  - notifPrefAllowed (Fase 4 — toggle por tipo) → next iteration
//
// Comportamento:
//  - Filas processada uma por vez
//  - Popup mostra por 3.5s, anima entrada/saída (450ms cada)
//  - Auto mark-read no servidor quando popup aparece
//  - Click no popup navega pra /miembros/u/<source_user_id>

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "./api"
import { buildAvatarLetters } from "./format"
import { sounds, type SoundKey } from "./sounds"
import type { NotificationItem } from "./types"
import styles from "../_components/broadcast.module.css"

export type BroadcastVariant = {
  icon: string
  accent: string
  label: string
  // sound será adicionado na próxima iteração (Web Audio API)
  soundKey?: string
}

export const BROADCAST_VARIANTS: Record<string, BroadcastVariant> = {
  public_level_up:        { icon: "🚀", accent: "#3b82f6", label: "NUEVO NIVEL ALCANZADO",       soundKey: "levelUpOther" },
  public_level_up_self:   { icon: "🚀", accent: "#3b82f6", label: "SUBISTE DE NIVEL",             soundKey: "levelUp" },
  public_insignia:        { icon: "🏆", accent: "#c9a961", label: "INSIGNIA RARA",                soundKey: "insigniaOther" },
  public_insignia_self:   { icon: "🔥", accent: "#7f1d1d", label: "INSIGNIA EXCLUSIVA",           soundKey: "topoConquista" },
  public_streak:          { icon: "🔥", accent: "#ef4444", label: "CONSTANCIA EN LLAMAS",         soundKey: "streak" },
  public_funnel_hot:      { icon: "⚡",  accent: "#f59e0b", label: "FUNNEL HOT",                    soundKey: "funnelHot" },
  public_funnel_new:      { icon: "✨", accent: "#22c55e", label: "NUEVO FUNNEL",                  soundKey: "publish" },
  public_top3:            { icon: "👑", accent: "#c9a961", label: "NUEVO TOP 3",                   soundKey: "top3" },
  rank_up:                { icon: "⚔️", accent: "#7f1d1d", label: "NUEVA PATENTE",                 soundKey: "levelUpOther" },
  rank_up_self:           { icon: "⚔️", accent: "#c9a961", label: "ASCENDISTE EN LA COMUNIDAD",    soundKey: "levelUp" },
}

const BROADCAST_LS_KEY = "cf_broadcast_shown_ids_v1"
const BROADCAST_FRESH_WINDOW_MS = 5 * 60 * 1000
const POPUP_DURATION_MS = 3500
const POPUP_EXIT_MS = 400

function loadShownIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(BROADCAST_LS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? new Set(arr.map(String)) : new Set()
  } catch {
    return new Set()
  }
}

function persistShownId(set: Set<string>, id: string) {
  set.add(id)
  try {
    const arr = Array.from(set).slice(-500)
    localStorage.setItem(BROADCAST_LS_KEY, JSON.stringify(arr))
  } catch {
    // ignora — quota cheia ou modo privado
  }
}

type BroadcastContextValue = {
  enqueue: (notif: NotificationItem) => void
}

const BroadcastContext = createContext<BroadcastContextValue>({
  enqueue: () => {},
})

export function useBroadcast(): BroadcastContextValue {
  return useContext(BroadcastContext)
}

export function BroadcastProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [current, setCurrent] = useState<NotificationItem | null>(null)
  const [show, setShow] = useState(false)

  const queueRef = useRef<NotificationItem[]>([])
  const shownIdsRef = useRef<Set<string>>(new Set())
  const playingRef = useRef(false)

  // Carrega IDs persistidos no mount (client-only)
  useEffect(() => {
    shownIdsRef.current = loadShownIds()
  }, [])

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) {
      playingRef.current = false
      return
    }
    playingRef.current = true
    const notif = queueRef.current.shift()!
    setCurrent(notif)
    setShow(false) // reset pra trigger animação
    requestAnimationFrame(() => setShow(true))

    // Toca som da variant (best-effort — sons.ts respeita NOTIF_PREFS.sound)
    const variant = BROADCAST_VARIANTS[notif.type]
    if (variant?.soundKey && variant.soundKey in sounds) {
      sounds[variant.soundKey as SoundKey]()
    }

    // Marca como lida no servidor (best-effort, não bloqueia popup)
    // Pula IDs de teste (__cfTestBroadcast usa prefix "dev_") pra evitar
    // 500 errors no console quando o ID não existe no banco.
    if (notif.id && !notif.id.startsWith("dev_")) {
      api(`/api/notifications/mark-read`, {
        method: "POST",
        body: { id: notif.id },
      }).catch(() => {})
    }

    // Schedule exit
    setTimeout(() => {
      setShow(false)
      setTimeout(() => {
        setCurrent(null)
        // pequeno gap entre popups
        setTimeout(processQueue, 350)
      }, POPUP_EXIT_MS)
    }, POPUP_DURATION_MS)
  }, [])

  const enqueue = useCallback((notif: NotificationItem) => {
    if (!notif?.id || !notif.type) return
    if (!BROADCAST_VARIANTS[notif.type]) return
    if (shownIdsRef.current.has(notif.id)) return
    if (notif.read_at) return // já lida cross-device

    // ── 4 INSIGNIAS TOPO TIER: SEMPRE fullscreen, sem fresh window ─────
    // Insignias top tier são RARAS — quando alguém conquista, é evento maior
    // que o fluxo normal. Usuário precisa ver fullscreen mesmo se entrou no
    // site 7 dias depois. Anti-replay continua robusto via shownIdsRef
    // (localStorage) + read_at server-side, então mesmo bypassando o fresh
    // window, ninguém vê a mesma 2x.
    //
    // Cobre os 2 tipos:
    //   public_insignia_self  → recipient ("¡Conquistaste...!")
    //   public_insignia       → outros    ("Fulano conquistó...")
    //
    // Cada uma tem seu overlay próprio + CustomEvent dedicado:
    //   EL TOPO     → cf:topo-conquista     → trumpet victory
    //   EL ESTUDIO  → cf:estudio-conquista  → trumpet victory
    //   ETERNO      → cf:eterno-conquista   → level up shahiera (música antiga)
    //   LEYENDA     → cf:leyenda-conquista  → level up shahiera (música antiga)
    const isPremiumInsignia =
      notif.type === "public_insignia_self" || notif.type === "public_insignia"
    const titleUpper = notif.title?.toUpperCase() || ""
    const isTopoNotif = isPremiumInsignia && titleUpper.includes("EL TOPO")
    const isEstudioNotif = isPremiumInsignia && titleUpper.includes("EL ESTUDIO")
    const isEternoNotif = isPremiumInsignia && titleUpper.includes("ETERNO")
    const isLeyendaNotif = isPremiumInsignia && titleUpper.includes("LEYENDA")

    if (isTopoNotif || isEstudioNotif || isEternoNotif || isLeyendaNotif) {
      persistShownId(shownIdsRef.current, notif.id)
      const isSelf = notif.type === "public_insignia_self"
      const userName = notif.source_user_name || "Miembro"
      const eventName = isTopoNotif
        ? "cf:topo-conquista"
        : isEstudioNotif
        ? "cf:estudio-conquista"
        : isEternoNotif
        ? "cf:eterno-conquista"
        : "cf:leyenda-conquista"
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { userName, isSelf },
        }),
      )
      if (!notif.id.startsWith("dev_")) {
        api(`/api/notifications/mark-read`, {
          method: "POST",
          body: { id: notif.id },
        }).catch(() => {})
      }
      return
    }

    // ── Outros broadcasts: respeitam fresh window (5min) ──────────────
    // Self-types (level_up_self, rank_up_self) bypassam — user precisa
    // ver sua própria conquista mesmo dias depois.
    const isSelfNotif = notif.type.endsWith("_self")
    if (!isSelfNotif) {
      const createdAt = notif.created_at ? new Date(notif.created_at).getTime() : 0
      if (!createdAt || Date.now() - createdAt > BROADCAST_FRESH_WINDOW_MS) return
    }

    persistShownId(shownIdsRef.current, notif.id)
    queueRef.current.push(notif)
    if (!playingRef.current) processQueue()
  }, [processQueue])

  // Helper pra testar broadcasts sem precisar de notif real no banco.
  // Disponível em DEV e PROD — não toca DB, só injeta um popup local
  // no browser de quem chamar. Anti-replay via shownIdsRef + ID único
  // por chamada evita repetição. Uso no console:
  //   __cfTestBroadcast("public_insignia_self", "Tu Nombre",
  //                      "Insignia exclusiva — Creación de Embudo",
  //                      "¡Conquistaste EL TOPO! 🔥")
  //   args: type, name, preview, title?
  //
  // CRÍTICO: chama enqueue(notif), não queueRef.push direto. Sem isso o
  // helper bypassa a detecção de EL TOPO/EL ESTUDIO e o popup vai pro
  // toast lateral em vez do overlay fullscreen dedicado.
  useEffect(() => {
    if (typeof window === "undefined") return
    ;(window as unknown as {
      __cfTestBroadcast?: (
        type: string,
        name?: string,
        preview?: string,
        title?: string
      ) => void
    }).__cfTestBroadcast = (type, name = "Test User", preview = "", title = "") => {
      const notif: NotificationItem = {
        id: `dev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        title,
        preview,
        source_user_id: null,
        source_user_name: name,
        source_user_avatar_url: null,
        created_at: new Date().toISOString(),
        read_at: null,
      }
      enqueue(notif)
    }
  }, [enqueue])

  function handleClick() {
    if (!current?.source_user_id) return
    router.push(`/miembros/u/${current.source_user_id}`)
    setShow(false)
  }

  return (
    <BroadcastContext.Provider value={{ enqueue }}>
      {children}
      <BroadcastOverlay current={current} show={show} onClick={handleClick} />
    </BroadcastContext.Provider>
  )
}

// Componente de display, separado pra evitar re-render do tree todo
function BroadcastOverlay({
  current,
  show,
  onClick,
}: {
  current: NotificationItem | null
  show: boolean
  onClick: () => void
}) {
  if (!current) return null
  const variant = BROADCAST_VARIANTS[current.type] || BROADCAST_VARIANTS.public_level_up
  const userName = current.source_user_name || "Miembro"
  const initials = buildAvatarLetters(userName)
  const clickable = !!current.source_user_id

  /* eslint-disable @next/next/no-img-element */
  const classes = [
    styles.toast,
    show && styles.show,
    clickable && styles.clickable,
  ]
    .filter(Boolean)
    .join(" ")

  const actionText = current.title || current.preview

  return (
    <div
      className={classes}
      style={{ ["--bc-accent" as string]: variant.accent }}
      onClick={clickable ? onClick : undefined}
    >
      <div className={styles.frame}>
        <span className={styles.accentBar} aria-hidden="true" />
        <div className={styles.avatar}>
          {current.source_user_avatar_url ? (
            <img src={current.source_user_avatar_url} alt="" loading="lazy" />
          ) : (
            initials
          )}
        </div>
        <div className={styles.content}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowIcon} aria-hidden="true">
              {variant.icon}
            </span>
            <span>{variant.label}</span>
          </div>
          <div className={styles.name}>{userName}</div>
          {actionText && <div className={styles.action}>{actionText}</div>}
        </div>
      </div>
    </div>
  )
}
