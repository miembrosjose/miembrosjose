"use client"

// View Mensajes — split layout (lista de threads + conversa).
//
// Realtime via Supabase channel postgres_changes em direct_messages:
//  - INSERT: nova msg → atualiza thread atual + sidebar (last msg/unread)
//  - UPDATE: read_at preenchido → atualiza estado de "visto"
//
// Cada user só recebe events das suas próprias mensagens (RLS filtra).

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, ImagePlus, Mic, Send, X, MoreVertical, Ban } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useAuth } from "../_lib/auth-context"
import { useView } from "../_lib/view-context"
import { useIsOnline, ONLINE_BOX_SHADOW } from "../_lib/online-presence"
import { api } from "../_lib/api"
import { buildAvatarLetters } from "../_lib/format"
import styles from "./view-messages.module.css"

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
  edited_at: string | null
}

const formatTime = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("es-419", { day: "2-digit", month: "2-digit" })
}

export function ViewMessages() {
  const { user } = useAuth()
  const { params, setView } = useView()
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeUserId, setActiveUserId] = useState<string | null>(params.withUserId || null)
  const [messages, setMessages] = useState<Message[]>([])
  const [activeUser, setActiveUser] = useState<OtherUser | null>(null)
  const [composerText, setComposerText] = useState("")
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)
  const isOnline = useIsOnline(activeUserId)

  // ─── Sincroniza activeUserId com URL params ────────────────────────────
  useEffect(() => {
    setActiveUserId(params.withUserId || null)
  }, [params.withUserId])

  // ─── Fetch threads ────────────────────────────────────────────────────
  const refetchThreads = useCallback(async () => {
    try {
      const data = await api<{ threads: Thread[] }>("/api/dm/threads")
      setThreads(data.threads || [])
    } catch (e) {
      console.warn("[ViewMessages] threads fetch", e)
    }
  }, [])

  useEffect(() => {
    refetchThreads()
  }, [refetchThreads])

  // ─── Quando threads carregam e tem activeUserId, popula activeUser ─────
  useEffect(() => {
    if (!activeUserId) {
      setActiveUser(null)
      return
    }
    const t = threads.find((th) => th.other_user_id === activeUserId)
    if (t) setActiveUser(t.other_user)
  }, [activeUserId, threads])

  // Pra abrir thread com user que não está nas threads ainda (clicou "Enviar
  // mensaje" no perfil), busca dados básicos via /api/profile/public
  useEffect(() => {
    if (!activeUserId || activeUser) return
    let cancelled = false
    ;(async () => {
      try {
        const p = await api<{
          user: { full_name: string | null; username: string | null; avatar_url: string | null; is_admin: boolean }
          badges: { featured_ach: { id: string } | null }
        }>(`/api/profile/public/${activeUserId}`)
        if (cancelled) return
        setActiveUser({
          full_name: p.user.full_name || "Miembro",
          username: p.user.username,
          avatar_url: p.user.avatar_url,
          featured_badge_id: p.badges.featured_ach?.id || null,
          is_admin: p.user.is_admin,
        })
      } catch {
        // ignora — UI mostra placeholder
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeUserId, activeUser])

  // ─── Fetch messages da thread ativa ────────────────────────────────────
  const fetchMessages = useCallback(async (otherId: string) => {
    try {
      const data = await api<{ messages: Message[] }>(`/api/dm/messages?with=${otherId}`)
      setMessages((data.messages || []).slice().reverse())
    } catch (e) {
      console.warn("[ViewMessages] messages fetch", e)
      setMessages([])
    }
  }, [])

  useEffect(() => {
    if (!activeUserId) {
      setMessages([])
      return
    }
    fetchMessages(activeUserId)
  }, [activeUserId, fetchMessages])

  // ─── Marca como lida quando abre thread ────────────────────────────────
  useEffect(() => {
    if (!activeUserId) return
    api("/api/dm/read", {
      method: "POST",
      body: { with_user_id: activeUserId },
    }).then(() => {
      // Atualiza unread_count local na sidebar
      setThreads((prev) =>
        prev.map((t) =>
          t.other_user_id === activeUserId ? { ...t, unread_count: 0 } : t,
        ),
      )
    }).catch(() => {})
  }, [activeUserId, messages.length])

  // ─── Auto-scroll pra última mensagem ───────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ─── Realtime: novas mensagens chegam ao vivo ──────────────────────────
  useEffect(() => {
    if (!user) return
    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel(`dm-realtime-${user.id}`)
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
          // Se for da thread aberta, append
          if (activeUserId && msg.sender_id === activeUserId) {
            setMessages((prev) => [...prev, msg])
          }
          // Atualiza sidebar (sempre)
          refetchThreads()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Message
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m)),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, activeUserId, refetchThreads])

  // ─── Enviar mensagem ──────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (params: {
      body?: string | null
      media_url?: string | null
      media_type?: string | null
    }) => {
      if (!activeUserId) return
      const text = params.body?.trim()
      if (!text && !params.media_url) return

      setSending(true)
      try {
        const data = await api<{ message: Message }>("/api/dm/send", {
          method: "POST",
          body: {
            recipient_id: activeUserId,
            body: text || undefined,
            media_url: params.media_url || undefined,
            media_type: params.media_type || undefined,
          },
        })
        setMessages((prev) => [...prev, data.message])
        refetchThreads()
        return true
      } catch (e) {
        console.warn("[ViewMessages] send", e)
        const msg = e instanceof Error ? e.message : "Error al enviar"
        alert(msg)
        return false
      } finally {
        setSending(false)
      }
    },
    [activeUserId, refetchThreads],
  )

  const handleSendText = useCallback(async () => {
    if (!composerText.trim()) return
    const ok = await sendMessage({ body: composerText })
    if (ok) setComposerText("")
  }, [composerText, sendMessage])

  // ─── Upload de imagem ─────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = "" // reset pra permitir re-upload do mesmo
      if (!file) return

      setSending(true)
      try {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/dm/upload", { method: "POST", body: fd, credentials: "include" })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
        const data = (await res.json()) as { media_url: string; media_type: string }
        await sendMessage({ media_url: data.media_url, media_type: data.media_type })
      } catch (e) {
        console.warn("[ViewMessages] upload", e)
        alert(e instanceof Error ? e.message : "Error al subir archivo")
      } finally {
        setSending(false)
      }
    },
    [sendMessage],
  )

  // ─── Gravação de áudio ────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      recordingChunksRef.current = []

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        // Para todos os tracks pra liberar microfone
        stream.getTracks().forEach((t) => t.stop())

        // MediaRecorder retorna mimeType com codecs (ex: "audio/webm;codecs=opus").
        // Backend valida com includes() exato → forca mime type sem codecs pra
        // casar com a whitelist de AUDIO_TYPES.
        const rawMime = mr.mimeType || "audio/webm"
        const cleanMime = rawMime.split(";")[0] || "audio/webm"
        const blob = new Blob(recordingChunksRef.current, { type: cleanMime })
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: cleanMime })

        setSending(true)
        try {
          const fd = new FormData()
          fd.append("file", file)
          const res = await fetch("/api/dm/upload", { method: "POST", body: fd, credentials: "include" })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || `HTTP ${res.status}`)
          }
          const data = (await res.json()) as { media_url: string; media_type: string }
          await sendMessage({ media_url: data.media_url, media_type: data.media_type })
        } catch (e) {
          alert(e instanceof Error ? e.message : "Error al enviar audio")
        } finally {
          setSending(false)
        }
      }

      mr.start()
      setRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime((s) => s + 1)
      }, 1000)
    } catch (e) {
      console.warn("[ViewMessages] mic", e)
      alert("No fue posible acceder al micrófono. Verifica los permisos del navegador.")
    }
  }, [sendMessage])

  const stopRecording = useCallback((cancel: boolean = false) => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state === "recording") {
      if (cancel) {
        // Limpa chunks ANTES de parar pro onstop não enviar
        recordingChunksRef.current = []
      }
      mr.stop()
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    setRecording(false)
    setRecordingTime(0)
  }, [])

  // ─── Bloquear / desbloquear ───────────────────────────────────────────
  const handleBlock = useCallback(async () => {
    if (!activeUserId) return
    if (!confirm("¿Bloquear este usuario? No podrás enviar ni recibir mensajes.")) return
    try {
      await api("/api/dm/block", {
        method: "POST",
        body: { user_id: activeUserId },
      })
      alert("Usuario bloqueado.")
      setShowMenu(false)
      setActiveUserId(null)
      refetchThreads()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }, [activeUserId, refetchThreads])

  // ─── Render ───────────────────────────────────────────────────────────
  if (!user) return null

  const goToThread = (otherId: string) => {
    setActiveUserId(otherId)
    setView("messages", null, { withUserId: otherId })
  }

  const goBack = () => {
    setActiveUserId(null)
    setView("messages")
  }

  return (
    <div className={styles.wrap}>
      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${activeUserId ? styles.hidden : ""}`}>
        <div className={styles.sidebarHeader}>
          <p className={styles.sidebarTitle}>Mensajes</p>
        </div>
        {threads.length === 0 ? (
          <div className={styles.empty}>
            Sin conversaciones todavía.<br />Inicia una desde el perfil de cualquier miembro.
          </div>
        ) : (
          <ul className={styles.threadList}>
            {threads.map((t) => (
              <ThreadRow
                key={t.other_user_id}
                thread={t}
                active={t.other_user_id === activeUserId}
                onClick={() => goToThread(t.other_user_id)}
              />
            ))}
          </ul>
        )}
      </aside>

      {/* THREAD PANE */}
      <section className={`${styles.thread} ${activeUserId ? styles.active : ""}`}>
        {!activeUserId ? (
          <div className={styles.threadPlaceholder}>
            Selecciona una conversación o escribe a alguien desde su perfil.
          </div>
        ) : (
          <>
            <div className={styles.threadHeader}>
              <button className={styles.backBtn} onClick={goBack} aria-label="Volver">
                <ArrowLeft size={20} />
              </button>
              <div
                className={styles.threadAvatarWrap}
                style={{
                  width: 36,
                  height: 36,
                  ...(isOnline && { boxShadow: ONLINE_BOX_SHADOW }),
                }}
              >
                {activeUser?.avatar_url ? (
                  <img src={activeUser.avatar_url} alt="" className={styles.threadAvatarImg} />
                ) : (
                  <span className={styles.threadAvatarInitials}>
                    {buildAvatarLetters(activeUser?.full_name || "M")}
                  </span>
                )}
              </div>
              <div className={styles.headerInfo}>
                <span className={styles.headerName}>{activeUser?.full_name || "Miembro"}</span>
                <span className={styles.headerSub}>
                  {isOnline ? "En línea" : activeUser?.username ? `@${activeUser.username}` : ""}
                </span>
              </div>
              <div className={styles.headerActions}>
                <div style={{ position: "relative" }}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => setShowMenu((v) => !v)}
                    aria-label="Más opciones"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {showMenu && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 4px)",
                        background: "rgba(18, 18, 26, 0.98)",
                        border: "1px solid var(--border-medium)",
                        minWidth: 180,
                        zIndex: 10,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleBlock}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "0.625rem 1rem",
                          background: "transparent",
                          border: "none",
                          color: "var(--accent-red)",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontFamily: "inherit",
                          textAlign: "left",
                        }}
                      >
                        <Ban size={14} /> Bloquear usuario
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.messages}>
              {messages.map((m) => {
                const mine = m.sender_id === user.id
                return (
                  <div
                    key={m.id}
                    className={`${styles.bubbleRow} ${mine ? styles.bubbleRowMine : styles.bubbleRowOther}`}
                  >
                    <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleOther}`}>
                      {m.body && <div>{m.body}</div>}
                      {m.media_url && m.media_type === "image" && (
                        <img
                          src={m.media_url}
                          alt=""
                          className={styles.bubbleImg}
                          loading="lazy"
                          onClick={() => setLightboxUrl(m.media_url)}
                          style={{ marginTop: m.body ? "0.5rem" : 0 }}
                        />
                      )}
                      {m.media_url && m.media_type === "audio" && (
                        <div className={styles.audioPlayer} style={{ marginTop: m.body ? "0.5rem" : 0 }}>
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                          <audio controls preload="metadata" src={m.media_url} />
                        </div>
                      )}
                      <span className={styles.bubbleTime}>{formatTime(m.created_at)}</span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* COMPOSER */}
            <div className={styles.composer}>
              {recording ? (
                <>
                  <div className={styles.recordingIndicator}>
                    <span className={styles.recordingDot} />
                    Grabando · {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
                  </div>
                  <button
                    className={styles.composerBtn}
                    onClick={() => stopRecording(true)}
                    aria-label="Cancelar grabación"
                  >
                    <X size={18} />
                  </button>
                  <button
                    className={styles.sendBtn}
                    onClick={() => stopRecording(false)}
                  >
                    Enviar
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/webp,image/jpeg,image/png,image/gif"
                    style={{ display: "none" }}
                  />
                  <button
                    className={styles.composerBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    aria-label="Adjuntar imagen"
                    title="Imagen"
                  >
                    <ImagePlus size={18} />
                  </button>
                  <button
                    className={styles.composerBtn}
                    onClick={startRecording}
                    disabled={sending}
                    aria-label="Grabar audio"
                    title="Audio"
                  >
                    <Mic size={18} />
                  </button>
                  <textarea
                    className={styles.composerInput}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendText()
                      }
                    }}
                    placeholder="Escribe aquí tu mensaje..."
                    rows={1}
                    disabled={sending}
                  />
                  <button
                    className={styles.sendBtn}
                    onClick={handleSendText}
                    disabled={sending || !composerText.trim()}
                  >
                    <Send size={14} />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </section>

      {lightboxUrl && (
        <div className={styles.lightbox} onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="" className={styles.lightboxImg} />
        </div>
      )}
    </div>
  )
}

// ─── Sidebar row ─────────────────────────────────────────────────────────

function ThreadRow({
  thread,
  active,
  onClick,
}: {
  thread: Thread
  active: boolean
  onClick: () => void
}) {
  const isOnline = useIsOnline(thread.other_user_id)
  const initials = buildAvatarLetters(thread.other_user.full_name)

  let preview = thread.last_message_body || ""
  if (!preview && thread.last_message_media_type === "image") preview = "📷 Imagen"
  if (!preview && thread.last_message_media_type === "audio") preview = "🎤 Audio"

  return (
    <li className={styles.threadItem}>
      <button
        type="button"
        onClick={onClick}
        className={`${styles.threadBtn} ${active ? styles.active : ""}`}
      >
        <div
          className={styles.threadAvatarWrap}
          style={isOnline ? { boxShadow: ONLINE_BOX_SHADOW } : undefined}
        >
          {thread.other_user.avatar_url ? (
            <img src={thread.other_user.avatar_url} alt="" className={styles.threadAvatarImg} />
          ) : (
            <span className={styles.threadAvatarInitials}>{initials}</span>
          )}
        </div>
        <div className={styles.threadInfo}>
          <span className={styles.threadName}>{thread.other_user.full_name}</span>
          <span
            className={`${styles.threadPreview} ${thread.last_message_from_self ? styles.threadPreviewMine : ""}`}
          >
            {thread.last_message_from_self ? "Tú: " : ""}
            {preview}
          </span>
        </div>
        <div className={styles.threadMeta}>
          <span className={styles.threadTime}>{formatTime(thread.last_message_at)}</span>
          {thread.unread_count > 0 && (
            <span className={styles.unreadDot}>{thread.unread_count > 9 ? "9+" : thread.unread_count}</span>
          )}
        </div>
      </button>
    </li>
  )
}
