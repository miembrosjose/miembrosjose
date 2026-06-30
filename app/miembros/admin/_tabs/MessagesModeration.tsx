"use client"

// Tab admin: moderação de DMs.
// Lista threads recentes (últimas 100 pares de users com msgs) → click abre
// modal com a conversa completa. Admin pode deletar msgs individuais.

import { useEffect, useState, useCallback } from "react"
import { Trash2, X } from "lucide-react"
import { buildAvatarLetters } from "../../_lib/format"

type UserInfo = {
  full_name: string
  avatar_url: string | null
  is_admin: boolean
}

type Pair = {
  user_a: string
  user_b: string
  last_message_at: string
  last_message_body: string | null
  last_message_media_type: string | null
  total_messages: number
  user_a_info: UserInfo
  user_b_info: UserInfo
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
  deleted_at: string | null
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

export function MessagesModeration() {
  const [pairs, setPairs] = useState<Pair[] | null>(null)
  const [openPair, setOpenPair] = useState<Pair | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPairs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dm", { credentials: "include", cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { threads: Pair[] }
      setPairs(data.threads || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro")
    }
  }, [])

  useEffect(() => { loadPairs() }, [loadPairs])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
          Moderação de mensagens diretas
        </h2>
        <p className="mt-2 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Últimas 100 conversas (das últimas 1.000 mensagens). Click numa thread pra ver o conteúdo. Pode apagar mensagens individuais.
        </p>
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!pairs ? (
        <p className="text-xs text-[#6a6a7a]">Carregando...</p>
      ) : pairs.length === 0 ? (
        <p className="text-xs text-[#6a6a7a]">Sem conversas ainda.</p>
      ) : (
        <div className="border border-[#1a1a24] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1a1a24] bg-[#12121a]/40">
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Conversa</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Última msg</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Total</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">Última atividade</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((p) => (
                <tr
                  key={`${p.user_a}|${p.user_b}`}
                  onClick={() => setOpenPair(p)}
                  className="cursor-pointer border-b border-[#1a1a24] hover:bg-[#12121a]/40"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar info={p.user_a_info} />
                      <span className="text-[12px] text-[#F3F6FA]">{p.user_a_info.full_name}</span>
                      <span className="text-[10px] text-[#6a6a7a]">↔</span>
                      <Avatar info={p.user_b_info} />
                      <span className="text-[12px] text-[#F3F6FA]">{p.user_b_info.full_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-[#a0a0b0] truncate max-w-xs">
                    {p.last_message_body || (p.last_message_media_type === "image" ? "📷 Imagem" : p.last_message_media_type === "audio" ? "🎤 Áudio" : "—")}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-[#a0a0b0]">{p.total_messages}</td>
                  <td className="px-3 py-2 text-[11px] text-[#a0a0b0]">{formatDateTime(p.last_message_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openPair && (
        <ThreadModal pair={openPair} onClose={() => { setOpenPair(null); loadPairs() }} />
      )}
    </div>
  )
}

function Avatar({ info }: { info: UserInfo }) {
  return (
    <span
      style={{
        display: "inline-flex",
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "#1a1a24",
        border: info.is_admin ? "1.5px solid #fff" : "1px solid #2a2a35",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        fontWeight: 700,
        color: "#6D4A9B",
      }}
    >
      {info.avatar_url ? (
        <img src={info.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        buildAvatarLetters(info.full_name)
      )}
    </span>
  )
}

function ThreadModal({ pair, onClose }: { pair: Pair; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/dm?with_a=${pair.user_a}&with_b=${pair.user_b}`, {
        credentials: "include",
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { messages: Message[] }
      setMessages(data.messages || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro")
    }
  }, [pair])

  useEffect(() => { load() }, [load])

  const deleteMsg = async (id: string) => {
    if (!confirm("Apagar esta mensagem? Esta ação não pode ser revertida.")) return
    try {
      const res = await fetch(`/api/admin/dm?id=${id}`, { method: "DELETE", credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro")
    }
  }

  const userInfoById: Record<string, UserInfo> = {
    [pair.user_a]: pair.user_a_info,
    [pair.user_b]: pair.user_b_info,
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.85)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          background: "#000000",
          border: "1px solid #1a1a24",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #1a1a24", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "#6a6a7a", textTransform: "uppercase", margin: 0 }}>Conversa</p>
            <h3 style={{ fontSize: "0.95rem", color: "#F3F6FA", margin: "0.25rem 0 0", fontWeight: 700 }}>
              {pair.user_a_info.full_name} ↔ {pair.user_b_info.full_name}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#a0a0b0", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "1rem 1.25rem", overflow: "auto", flex: 1 }}>
          {error && <p style={{ color: "#fca5a5", fontSize: "0.8rem" }}>{error}</p>}
          {!messages ? (
            <p style={{ color: "#6a6a7a", fontSize: "0.75rem" }}>Carregando...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {messages.map((m) => {
                const senderInfo = userInfoById[m.sender_id]
                const isDeleted = !!m.deleted_at
                return (
                  <div
                    key={m.id}
                    style={{
                      padding: "0.625rem 0.875rem",
                      background: isDeleted ? "rgba(109, 74, 155, 0.1)" : "#12121a",
                      border: "1px solid #1a1a24",
                      opacity: isDeleted ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.7rem", color: "#6D4A9B", fontWeight: 600 }}>
                        {senderInfo?.full_name || "?"}
                      </span>
                      <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.65rem", color: "#6a6a7a", fontFamily: "var(--font-mono)" }}>
                          {formatDateTime(m.created_at)}
                        </span>
                        {!isDeleted && (
                          <button
                            type="button"
                            onClick={() => deleteMsg(m.id)}
                            title="Apagar mensagem"
                            style={{ background: "transparent", border: "none", color: "#fca5a5", cursor: "pointer", padding: 2 }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    {isDeleted ? (
                      <span style={{ fontSize: "0.75rem", color: "#fca5a5", fontStyle: "italic" }}>Mensagem apagada pela moderação</span>
                    ) : (
                      <>
                        {m.body && <div style={{ fontSize: "0.85rem", color: "#F3F6FA", whiteSpace: "pre-wrap" }}>{m.body}</div>}
                        {m.media_url && m.media_type === "image" && (
                          <a href={m.media_url} target="_blank" rel="noopener noreferrer">
                            <img src={m.media_url} alt="" style={{ maxWidth: 200, marginTop: "0.5rem", display: "block" }} />
                          </a>
                        )}
                        {m.media_url && m.media_type === "audio" && (
                          /* eslint-disable-next-line jsx-a11y/media-has-caption */
                          <audio controls preload="metadata" src={m.media_url} style={{ marginTop: "0.5rem", height: 32 }} />
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
