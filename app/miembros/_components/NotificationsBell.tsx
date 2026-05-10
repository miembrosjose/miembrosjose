"use client"

// Bell de notificações na navbar com badge de não-lidas + dropdown.
// Equivalente ao bloco fetchNotifications/renderNotificationsDropdown do
// area-prototipo.html (linhas 11337-11477).
//
// Comportamento:
//  - Polling a cada 30s (refresh badge silencioso)
//  - Click no bell abre/fecha dropdown
//  - Click em notif marca como lida + (se source_user_id) navega pra perfil
//  - Filtros: "Todas" / "Nuevas" (unread_only=1)
//  - Botão "Marcar todas" (apenas quando há unread)
//  - Click fora fecha dropdown
//  - Esc fecha dropdown

import { useEffect, useRef, useState, useCallback } from "react"
import { Bell, Settings } from "lucide-react"
import { api } from "../_lib/api"
import { timeAgoEs } from "../_lib/format"
import { useBroadcast } from "../_lib/broadcast-context"
import { useView } from "../_lib/view-context"
import { useAuth } from "../_lib/auth-context"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { NotifPrefsModal } from "./NotifPrefsModal"
import type { NotificationItem } from "../_lib/types"
import styles from "./notifications.module.css"

const POLL_INTERVAL_MS = 30_000

// Top tier — fullscreen overlays. Quando user volta na pagina (ou faz boot)
// a notif persistida dispara o overlay normal mesmo se foi criada dias atras.
// Outras notifs broadcast (gold/silver, level_up, top3) so disparam em REALTIME.
function isTopTierNotif(n: NotificationItem): boolean {
  if (n.type !== "public_insignia" && n.type !== "public_insignia_self") return false
  const t = (n.title || "").toUpperCase()
  return t.includes("EL TOPO") || t.includes("EL ESTUDIO") || t.includes("ETERNO") || t.includes("LEYENDA")
}

type Filter = "all" | "new"

export function NotificationsBell() {
  const { setView } = useView()
  const { enqueue: enqueueBroadcast } = useBroadcast()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [items, setItems] = useState<NotificationItem[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)
  // Tracking de IDs ja vistos no boot — evita re-disparar broadcast quando
  // Realtime entrega notif que ja foi puxada via fetchNotifs (race condition).
  const bootIdsRef = useRef<Set<string>>(new Set())

  const fetchNotifs = useCallback(async (currentFilter: Filter) => {
    const url =
      currentFilter === "new"
        ? "/api/notifications?unread_only=1"
        : "/api/notifications"
    try {
      const data = await api<{ notifications: NotificationItem[] }>(url)
      const list = data.notifications || []
      setItems(list)
      // No boot/replay: SO enfileira top tier (fullscreen overlays). Outras
      // broadcasts (insignia gold, level_up, top3, etc) sao efemeras — so
      // aparecem em REALTIME via subscription abaixo. User foi explicito:
      // "se alguem nao estiver na hora nao ver, nem depois de 5 minutos
      // e quando volta a pagina, deve ser somente em tempo real" (07/05/2026).
      list.forEach((n) => {
        bootIdsRef.current.add(n.id)
        if (isTopTierNotif(n)) enqueueBroadcast(n)
      })
    } catch {
      // silencioso — badge fica como tava
    }
  }, [enqueueBroadcast])

  // Polling de 30s — primeira chamada imediata, depois a cada 30s.
  // Pula tick se aba está em background; refetcha ao voltar via
  // visibilitychange (evita queimar requests com aba minimizada).
  useEffect(() => {
    fetchNotifs(filter)
    const id = setInterval(() => {
      if (document.hidden) return
      fetchNotifs(filter)
    }, POLL_INTERVAL_MS)
    function onVisibilityChange() {
      if (document.visibilityState === "visible") fetchNotifs(filter)
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [filter, fetchNotifs])

  // Refetch quando dropdown abre
  useEffect(() => {
    if (open) fetchNotifs(filter)
  }, [open, filter, fetchNotifs])

  // Realtime — notifs novas chegam via postgres_changes INSERT na tabela
  // notifications filtrada por user_id=me. Aqui SIM enfileira broadcast
  // pra TUDO (top tier + insignias gold + level_up + top3 + etc) porque
  // a notif acabou de ser criada — o user esta presente "na hora".
  // Filtro bootIdsRef evita re-disparar pra notifs que vieram via fetchNotifs.
  useEffect(() => {
    if (!user?.id) return
    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel(`notifs:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as NotificationItem
          if (!n?.id) return
          // Skip se ja viu no fetchNotifs (race condition entre INSERT
          // e fetch inicial — notif pode aparecer nas duas fontes)
          if (bootIdsRef.current.has(n.id)) return
          bootIdsRef.current.add(n.id)
          // Update local list (badge atualiza imediato)
          setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)])
          // Dispatch broadcast — tudo dispara em RT
          enqueueBroadcast(n)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, enqueueBroadcast])

  // Click fora do dropdown fecha
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("click", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("click", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const unreadCount = items.filter((n) => !n.read_at).length

  async function markRead(id: string) {
    try {
      await api("/api/notifications/mark-read", { method: "POST", body: { id } })
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      )
    } catch {
      // silencioso
    }
  }

  async function markAllRead() {
    try {
      await api("/api/notifications/mark-read", { method: "POST", body: { all: true } })
      const now = new Date().toISOString()
      setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })))
    } catch {
      // silencioso
    }
  }

  function handleItemClick(n: NotificationItem) {
    void markRead(n.id)
    if (n.source_user_id) {
      setView("user", null, { userId: n.source_user_id })
      setOpen(false)
    }
  }

  return (
    <div className={styles.bellWrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.bell}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <header className={styles.header}>
            <span className={styles.headerTitle}>Notificaciones</span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className={styles.filter}>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
                  onClick={() => setFilter("all")}
                >
                  Todas
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${filter === "new" ? styles.active : ""}`}
                  onClick={() => setFilter("new")}
                >
                  Nuevas
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className={styles.markAllBtn}
                  onClick={markAllRead}
                  title="Marcar todas como leídas"
                >
                  ✓
                </button>
              )}
              <button
                type="button"
                className={styles.prefsBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  setPrefsOpen(true)
                  setOpen(false)
                }}
                title="Configurar notificaciones"
                aria-label="Configurar notificaciones"
              >
                <Settings size={14} />
              </button>
            </div>
          </header>

          <div className={styles.list}>
            {items.length === 0 ? (
              <div className={styles.empty}>Sin notificaciones</div>
            ) : (
              items.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={`${styles.item} ${n.read_at ? "" : styles.unread}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className={styles.itemAvatar}>
                    {n.source_user_avatar_url ? (
                      <img src={n.source_user_avatar_url} alt="" loading="lazy" />
                    ) : (
                      (n.source_user_name || "M").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTitle}>{n.title}</div>
                    {n.preview && <div className={styles.itemPreview}>{n.preview}</div>}
                    <div className={styles.itemTime}>{timeAgoEs(n.created_at)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <NotifPrefsModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </div>
  )
}
