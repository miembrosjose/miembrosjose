"use client"

import { useEffect, useState } from "react"

type ReportItem = {
  id: string
  reporter_id: string
  target_type: string
  target_id: string
  target_user_id: string | null
  reason_category: string
  message: string
  target_snapshot: Record<string, unknown> | null
  status: string
  created_at: string
  reporter: { full_name: string; avatar_url: string | null } | null
  target_user: { full_name: string; avatar_url: string | null } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Inapropriado",
  harassment: "Assédio",
  offensive: "Ofensivo",
  misleading: "Enganoso",
  copyright: "Copyright",
  other: "Outro",
}

const TYPE_LABELS: Record<string, string> = {
  forum_post: "Post do fórum",
  forum_reply: "Resposta do fórum",
  episode_comment: "Comentário de episódio",
  funnel: "Funnel",
  funnel_feedback: "Feedback de funnel",
  user: "Usuário",
}

export function ReportsModeration() {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"pending" | "resolved" | "dismissed" | "all">("pending")
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?status=${filter}`, { credentials: "include" })
      const data = await res.json()
      setReports(Array.isArray(data.reports) ? data.reports : [])
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  async function act(id: string, action: "resolve" | "dismiss") {
    if (busyId) return
    setBusyId(id)
    try {
      await fetch(`/api/admin/reports?id=${encodeURIComponent(id)}&action=${action}`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      setReports((arr) => arr.filter((r) => r.id !== id))
    } finally { setBusyId(null) }
  }

  return (
    <div className="border border-[#1a1a24] bg-[#12121a]/40 p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
          Denúncias {filter !== "all" ? `(${filter === "pending" ? "pendentes" : filter === "resolved" ? "resolvidas" : "descartadas"})` : ""}
        </h2>
        <div className="flex flex-wrap gap-2">
          {(["pending", "resolved", "dismissed", "all"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] transition-colors [font-family:var(--font-geist-sans)] ${
                filter === s
                  ? "border-[#c9a961] bg-[#c9a961]/10 text-[#c9a961]"
                  : "border-[#1a1a24] text-[#a0a0b0] hover:border-[#3a3a45]"
              }`}
            >
              {s === "pending" ? "Pendentes" : s === "resolved" ? "Resolvidas" : s === "dismissed" ? "Descartadas" : "Todas"}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-xs text-[#6a6a7a]">Carregando…</p>}
      {!loading && reports.length === 0 && (
        <p className="text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
          Não há denúncias com este filtro.
        </p>
      )}

      <div className="space-y-3">
        {reports.map((r) => {
          const snap = r.target_snapshot || {}
          const snapText =
            (snap.title as string) || (snap.body as string) || (snap.text as string) || (snap.name as string) || (snap.url as string) || "(sem conteúdo)"
          return (
            <div key={r.id} className="border border-[#1a1a24] bg-[#000000]/50 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-red-400 [font-family:var(--font-geist-sans)]">
                    {CATEGORY_LABELS[r.reason_category] || r.reason_category}
                  </span>
                  <span className="border border-[#1a1a24] bg-[#12121a]/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
                    {TYPE_LABELS[r.target_type] || r.target_type}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")} · {new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">id: {r.id.slice(0, 8)}</span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a0a0b0]">Denunciado por</p>
                  <p className="mt-1 text-sm text-[#f5f5f7]">{r.reporter?.full_name || r.reporter_id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a0a0b0]">Autor do conteúdo</p>
                  <p className="mt-1 text-sm text-[#f5f5f7]">{r.target_user?.full_name || (r.target_user_id ? r.target_user_id.slice(0, 8) : "—")}</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a0a0b0]">Motivo</p>
                <p className="mt-1 text-sm text-[#d4d4d8] whitespace-pre-wrap">{r.message}</p>
              </div>

              <div className="mt-3 border border-[#1a1a24] bg-[#12121a]/40 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#c9a961]">Snapshot</p>
                <p className="mt-1 text-xs text-[#a0a0b0] line-clamp-3 break-words">{String(snapText).slice(0, 400)}</p>
              </div>

              {r.status === "pending" && (
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => act(r.id, "resolve")}
                    disabled={busyId === r.id}
                    className="border border-green-500 bg-green-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-green-400 transition-colors hover:bg-green-500 hover:text-[#000000] disabled:opacity-50 [font-family:var(--font-geist-sans)]"
                  >
                    Resolver
                  </button>
                  <button
                    type="button"
                    onClick={() => act(r.id, "dismiss")}
                    disabled={busyId === r.id}
                    className="border border-[#3a3a45] bg-[#12121a] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a0a0b0] transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-50 [font-family:var(--font-geist-sans)]"
                  >
                    Descartar
                  </button>
                </div>
              )}
              {r.status !== "pending" && (
                <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-[#6a6a7a]">
                  {r.status === "resolved" ? "✓ Resolvido" : "⊘ Descartado"}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
