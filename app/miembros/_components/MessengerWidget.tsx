"use client"

// Messenger flutuante — botão fixo canto inferior esquerdo + popover compacto.
// Estilo Facebook Messenger: click abre janelinha por cima da página, sem
// trocar de view. Aparece em qualquer view do /miembros, EXCETO em /mensajes
// (onde já tem a view dedicada).
//
// Estados internos:
//  - mode "list": lista de threads (sidebar compacta)
//  - mode "thread": conversa aberta
//
// Realtime: usa as mesmas APIs que ViewMessages. Lógica simplificada
// (sem upload de áudio/imagem aqui — pra mídia, abre a view completa via
// botão "Abrir" no header).

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, MessageCircle, Send, X, Maximize2 } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useAuth } from "../_lib/auth-context"
import { useView } from "../_lib/view-context"
import { useUnreadDM } from "../_lib/unread-dm"
import { useIsOnline } from "../_lib/online-presence"
import { api } from "../_lib/api"
import { buildAvatarLetters } from "../_lib/format"
import { CircleImg } from "./CircleImg"
import styles from "./messenger.module.css"

type OtherUser = {
  full_name: string
  username: string | null
  avatar_url: string | null
  featured_badge_id: string | null
  is_admin: boolean
}

type Thread = {
  other_user_id: string
  last_message_id: string
  last_message_body: string | null
  last_message_media_type: string | null
  last_message_at: string
  last_message_from_self: boolean
  unread_count: number
  other_user: OtherUser
}

type Message = {
  id: string
  sender_id: string
  recipient_id: string
  body: string | null
  media_url: string | null
  media_type: string | null
  created_at: string
  read_at: string | null
}

const formatTime = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("es-419", { day: "2-digit", month: "2-digit" })
}

export function MessengerWidget() {
  const { user } = useAuth()
  const { view, setView } = useView()
  const { count: unread } = useUnreadDM()
  const [open, setOpen] = useState(false)
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [activeUser, setActiveUser] = useState<OtherUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [composerText, setComposerText] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const isOnline = useIsOnline(activeUserId)

  // Esconde widget quando user já está na view dedicada (/miembros/mensajes)
  const shouldRender = !!user && view !== "messages"

  // ─── Fetch threads quando popover abre ───────────────────────────────
  const refetchThreads = useCallback(async () => {
    try {
      const data = await api<{ threads: Thread[] }>("/api/dm/threads")
      setThreads(data.threads || [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (!open) return
    refetchThreads()
  }, [open, refetchThreads])

  // ─── Fetch messages da thread ativa ──────────────────────────────────
  const fetchMessages = useCallback(async (otherId: string) => {
    try {
      const data = await api<{ messages: Message[] }>(`/api/dm/messages?with=${otherId}`)
      setMessages((data.messages || []).slice().reverse())
    } catch {
      setMessages([])
    }
  }, [])

  useEffect(() => {
    if (!activeUserId) {
      setMessages([])
      setActiveUser(null)
      return
    }
    fetchMessages(activeUserId)
    const t = threads.find((th) => th.other_user_id === activeUserId)
    if (t) setActiveUser(t.other_user)
  }, [activeUserId, fetchMessages, threads])

  // Marca como lida ao abrir thread
  useEffect(() => {
    if (!activeUserId) return
    api("/api/dm/read", {
      method: "POST",
      body: { with_user_id: activeUserId },
    })
      .then(() => {
        setThreads((prev) =>
          prev.map((t) =>
            t.other_user_id === activeUserId ? { ...t, unread_count: 0 } : t,
          ),
        )
      })
      .catch(() => {})
  }, [activeUserId, messages.length])

  // Auto-scroll
  useEffect(() => {
    if (activeUserId) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, activeUserId])

  // ─── Realtime: novas msgs ────────────────────────────────────────────
  useEffect(() => {
    if (!user || !shouldRender) return
    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel(`messenger-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as Message
          if (activeUserId && msg.sender_id === activeUserId) {
            setMessages((prev) => [...prev, msg])
          }
          if (open) refetchThreads()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, shouldRender, activeUserId, open, refetchThreads])

  // ─── Enviar mensagem ─────────────────────────────────────────────────
  const sendText = useCallback(async () => {
    const text = composerText.trim()
    if (!text || !activeUserId) return
    setSending(true)
    try {
      const data = await api<{ message: Message }>("/api/dm/send", {
        method: "POST",
        body: { recipient_id: activeUserId, body: text },
      })
      setMessages((prev) => [...prev, data.message])
      setComposerText("")
      refetchThreads()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }, [activeUserId, composerText, refetchThreads])

  if (!shouldRender) return null

  const goBack = () => setActiveUserId(null)
  const closePopover = () => {
    setOpen(false)
    setActiveUserId(null)
  }
  const openFullView = () => {
    setOpen(false)
    setView("messages", null, activeUserId ? { withUserId: activeUserId } : {})
  }

  return (
    <>
      {/* BOTÃO FAB */}
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label="Mensajes"
      >
        <MessageCircle size={26} />
        {unread > 0 && (
          <span className={styles.fabBadge}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {/* POPOVER */}
      <div className={`${styles.popover} ${open ? styles.open : ""}`}>
        {/* HEADER */}
        <div className={styles.header}>
          {activeUserId ? (
            <>
              <button className={styles.headerBack} onClick={goBack} aria-label="Volver">
                <ArrowLeft size={18} />
              </button>
              <div className={styles.headerInfo}>
                <span className={styles.headerName}>{activeUser?.full_name || "Miembro"}</span>
                <span className={styles.headerSub}>
                  {isOnline ? "● En línea" : activeUser?.username ? `@${activeUser.username}` : ""}
                </span>
              </div>
              <button
                className={styles.headerOpen}
                onClick={openFullView}
                title="Abrir vista completa"
              >
                <Maximize2 size={12} />
              </button>
              <button className={styles.headerClose} onClick={closePopover} aria-label="Cerrar">
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <div className={styles.headerInfo}>
                <span className={styles.headerTitle}>Mensajes</span>
              </div>
              <button
                className={styles.headerOpen}
                onClick={openFullView}
                title="Abrir vista completa"
              >
                <Maximize2 size={12} />
              </button>
              <button className={styles.headerClose} onClick={closePopover} aria-label="Cerrar">
                <X size={16} />
              </button>
            </>
          )}
        </div>

        {/* BODY: lista de threads OU thread aberta */}
        {!activeUserId ? (
          threads.length === 0 ? (
            <div className={styles.empty}>
              Sin conversaciones todavía.<br />Abre el perfil de un miembro y haz click en &quot;Enviar mensaje&quot;.
            </div>
          ) : (
            <ul className={styles.threadList}>
              {threads.map((t) => (
                <ThreadItem
                  key={t.other_user_id}
                  thread={t}
                  onClick={() => setActiveUserId(t.other_user_id)}
                />
              ))}
            </ul>
          )
        ) : (
          <>
            <div className={styles.messages}>
              {messages.map((m) => {
                const mine = m.sender_id === user.id
                return (
                  <div
                    key={m.id}
                    className={`${styles.bubbleRow} ${mine ? styles.bubbleRowMine : styles.bubbleRowOther}`}
                  >
                    <div
                      className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleOther}`}
                      style={m.media_type === "audio" ? { minWidth: 240, maxWidth: 280 } : undefined}
                    >
                      {m.body && <div>{m.body}</div>}
                      {m.media_url && m.media_type === "image" && (
                        <img src={m.media_url} alt="" className={styles.bubbleImg} loading="lazy" />
                      )}
                      {m.media_url && m.media_type === "audio" && (
                        /* eslint-disable-next-line jsx-a11y/media-has-caption */
                        <audio
                          controls
                          preload="metadata"
                          src={m.media_url}
                          style={{ display: "block", width: "100%", marginTop: m.body ? 6 : 0, height: 36, borderRadius: 18 }}
                        />
                      )}
                      <span className={styles.bubbleTime}>{formatTime(m.created_at)}</span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.composer}>
              <textarea
                className={styles.composerInput}
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendText()
                  }
                }}
                placeholder="Escribe..."
                rows={1}
                disabled={sending}
              />
              <button
                className={styles.sendBtn}
                onClick={sendText}
                disabled={sending || !composerText.trim()}
                aria-label="Enviar"
              >
                <Send size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── Thread row ─────────────────────────────────────────────────────────

function ThreadItem({ thread, onClick }: { thread: Thread; onClick: () => void }) {
  const initials = buildAvatarLetters(thread.other_user.full_name)
  let preview = thread.last_message_body || ""
  if (!preview && thread.last_message_media_type === "image") preview = "📷 Imagen"
  if (!preview && thread.last_message_media_type === "audio") preview = "🎤 Audio"

  return (
    <li className={styles.threadItem}>
      <button type="button" onClick={onClick} className={styles.threadBtn}>
        <div className={`${styles.threadAvatar} cf-circle`}>
          {thread.other_user.avatar_url ? (
            <CircleImg src={thread.other_user.avatar_url} alt="" className={styles.threadAvatarImg} />
          ) : (
            <span className={styles.threadAvatarInitials}>{initials}</span>
          )}
        </div>
        <div className={styles.threadInfo}>
          <span className={styles.threadName}>{thread.other_user.full_name}</span>
          <span className={styles.threadPreview}>
            {thread.last_message_from_self ? "Tú: " : ""}
            {preview}
          </span>
        </div>
        <div className={styles.threadMeta}>
          <span className={styles.threadTime}>{formatTime(thread.last_message_at)}</span>
          {thread.unread_count > 0 && (
            <span className={styles.unreadDot}>
              {thread.unread_count > 9 ? "9+" : thread.unread_count}
            </span>
          )}
        </div>
      </button>
    </li>
  )
}
