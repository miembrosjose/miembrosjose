"use client"

// Tab admin: aprovar/rejeitar lecciones de membros.
// Layout similar ao FunnelsApproval — filas pendente / aprovadas / rejeitadas.

import { useCallback, useEffect, useState } from "react"
import { Check, X, Trash2, Eye } from "lucide-react"
import { buildAvatarLetters } from "../../_lib/format"

type Author = {
  full_name: string
  username: string | null
  avatar_url: string | null
}

type Lesson = {
  id: string
  user_id: string
  title: string
  description: string | null
  video_url: string
  tags: string[]
  approved: boolean
  approved_at: string | null
  rejected_at: string | null
  rejected_reason: string | null
  likes_count: number
  views_count: number
  created_at: string
  author: Author
}

type Status = "pending" | "approved" | "rejected"

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

export function LessonsApproval() {
  const [status, setStatus] = useState<Status>("pending")
  const [lessons, setLessons] = useState<Lesson[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null)

  const load = useCallback(async () => {
    setError(null)
    setLessons(null)
    try {
      const res = await fetch(`/api/admin/lessons?status=${status}`, {
        credentials: "include",
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { lessons: Lesson[] }
      setLessons(data.lessons || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro")
    }
  }, [status])

  useEffect(() => { load() }, [load])

  const tabBtn = (s: Status) =>
    `border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] transition-colors [font-family:var(--font-geist-sans)] ${
      status === s
        ? "border-[#c9a961] bg-[#c9a961]/10 text-[#c9a961]"
        : "border-[#1a1a24] bg-[#12121a]/40 text-[#a0a0b0] hover:border-[#2a2a35]"
    }`

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
          Aprovação de lições
        </h2>
        <p className="mt-2 text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Vídeos publicados por membros passam por revisão antes de aparecer na galeria.
        </p>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setStatus("pending")} className={tabBtn("pending")}>Pendentes</button>
        <button type="button" onClick={() => setStatus("approved")} className={tabBtn("approved")}>Aprovadas</button>
        <button type="button" onClick={() => setStatus("rejected")} className={tabBtn("rejected")}>Rejeitadas</button>
      </div>

      {error && <p className="text-xs text-red-300">{error}</p>}

      {!lessons ? (
        <p className="text-xs text-[#6a6a7a]">Carregando...</p>
      ) : lessons.length === 0 ? (
        <p className="text-xs text-[#6a6a7a]">Sem lições {status === "pending" ? "pendentes" : status === "approved" ? "aprovadas" : "rejeitadas"}.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lessons.map((lesson) => (
            <LessonAdminCard
              key={lesson.id}
              lesson={lesson}
              onOpen={() => setOpenLesson(lesson)}
              onChange={load}
            />
          ))}
        </div>
      )}

      {openLesson && (
        <ReviewModal lesson={openLesson} onClose={() => setOpenLesson(null)} onChange={load} />
      )}
    </div>
  )
}

function LessonAdminCard({
  lesson,
  onOpen,
  onChange,
}: {
  lesson: Lesson
  onOpen: () => void
  onChange: () => void
}) {
  const [busy, setBusy] = useState(false)

  const action = async (act: "approve" | "reject", reason?: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: act, reason }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      onChange()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm("Remover esta lição permanentemente?")) return
    setBusy(true)
    try {
      const res = await fetch(`/api/lessons/${lesson.id}`, { method: "DELETE", credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      onChange()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro")
    } finally {
      setBusy(false)
    }
  }

  const reject = () => {
    const reason = window.prompt("Motivo da rejeição (opcional):") || ""
    action("reject", reason)
  }

  return (
    <div className="border border-[#1a1a24] bg-[#0a0a0f] flex flex-col">
      <div
        onClick={onOpen}
        className="aspect-video bg-black cursor-pointer relative overflow-hidden"
      >
        <video src={lesson.video_url} preload="metadata" muted playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition">
          <Eye size={28} color="white" />
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span style={{ display: "inline-flex", width: 22, height: 22, borderRadius: "50%", background: "#1a1a24", overflow: "hidden", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#c9a961" }}>
            {lesson.author.avatar_url ? (
              <img src={lesson.author.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              buildAvatarLetters(lesson.author.full_name)
            )}
          </span>
          <span className="text-[11px] text-[#a0a0b0] truncate">{lesson.author.full_name}</span>
        </div>
        <h4 className="text-xs text-[#f5f5f7] font-semibold leading-snug line-clamp-2">{lesson.title}</h4>
        <p className="text-[10px] text-[#6a6a7a] [font-family:var(--font-mono)]">
          {formatDateTime(lesson.created_at)}
        </p>
        {lesson.tags && lesson.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lesson.tags.slice(0, 4).map((t) => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 bg-[#c9a961]/10 text-[#c9a961] border border-[#c9a961]/25">#{t}</span>
            ))}
          </div>
        )}
        {lesson.rejected_at && lesson.rejected_reason && (
          <p className="text-[10px] text-red-400/80 italic">Rejeitada: {lesson.rejected_reason}</p>
        )}
        <div className="flex gap-1.5 mt-auto pt-2">
          {!lesson.approved && !lesson.rejected_at && (
            <>
              <button
                type="button"
                onClick={() => action("approve")}
                disabled={busy}
                className="flex-1 border border-[#009d68]/40 bg-[#009d68]/10 text-[#009d68] text-[10px] font-semibold uppercase tracking-[0.2em] py-1.5 hover:bg-[#009d68]/20 disabled:opacity-50 [font-family:var(--font-geist-sans)] flex items-center justify-center gap-1"
              >
                <Check size={11} /> Aprovar
              </button>
              <button
                type="button"
                onClick={reject}
                disabled={busy}
                className="flex-1 border border-red-500/40 bg-red-500/10 text-red-400 text-[10px] font-semibold uppercase tracking-[0.2em] py-1.5 hover:bg-red-500/20 disabled:opacity-50 [font-family:var(--font-geist-sans)] flex items-center justify-center gap-1"
              >
                <X size={11} /> Rejeitar
              </button>
            </>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            title="Remover"
            className="border border-[#1a1a24] bg-[#12121a]/40 text-[#6a6a7a] hover:text-red-400 hover:border-red-500/40 px-2 py-1.5 disabled:opacity-50"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewModal({ lesson, onClose, onChange }: { lesson: Lesson; onClose: () => void; onChange: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 720, background: "#0a0a0f", border: "1px solid #1a1a24", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0, 0, 0, 0.6)", border: "1px solid #1a1a24", color: "white", padding: 8, cursor: "pointer", zIndex: 10 }}>
          <X size={16} />
        </button>
        <div style={{ aspectRatio: "16/9", background: "#000" }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={lesson.video_url} controls autoPlay style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div style={{ padding: "1.25rem", overflow: "auto" }}>
          <h3 style={{ fontSize: "1rem", color: "#f5f5f7", margin: "0 0 0.5rem", fontWeight: 700 }}>{lesson.title}</h3>
          <p style={{ fontSize: "0.7rem", color: "#a0a0b0", marginBottom: "0.875rem" }}>
            {lesson.author.full_name} · {formatDateTime(lesson.created_at)}
          </p>
          {lesson.description && (
            <p style={{ fontSize: "0.85rem", color: "#bdb39d", whiteSpace: "pre-wrap", marginBottom: "0.875rem", lineHeight: 1.5 }}>
              {lesson.description}
            </p>
          )}
          {lesson.tags && lesson.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {lesson.tags.map((t) => (
                <span key={t} style={{ fontSize: "0.65rem", padding: "0.2rem 0.55rem", background: "rgba(201, 169, 97, 0.1)", color: "#c9a961", border: "1px solid rgba(201, 169, 97, 0.25)" }}>#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
