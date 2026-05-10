"use client"

import { useEffect, useState } from "react"

type PendingFunnel = {
  id: string
  user_id: string
  author_name: string
  author_username: string | null
  author_avatar_url: string | null
  name: string
  niche: string
  url: string
  image_url: string
  created_at: string
  approved: boolean
}

export function FunnelsApproval() {
  const [funnels, setFunnels] = useState<PendingFunnel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"pending" | "all">("pending")
  const [busyId, setBusyId] = useState<string | null>(null)
  // Toast: feedback visual após aprovar/rejeitar pra admin saber que ação completou
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  function showToast(kind: "ok" | "err", text: string) {
    setToast({ kind, text })
    setTimeout(() => setToast(null), 2500)
  }

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/funnels?status=${filter}`, { credentials: "include" })
      const data = await res.json()
      setFunnels(Array.isArray(data.funnels) ? data.funnels : [])
    } catch {
      setFunnels([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  async function approve(id: string) {
    if (busyId) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/funnels?id=${encodeURIComponent(id)}&action=approve`, {
        method: "POST", credentials: "include",
      })
      if (!res.ok) {
        showToast("err", "Erro ao aprovar")
        return
      }
      setFunnels((arr) => arr.filter((f) => f.id !== id))
      showToast("ok", "✓ Funnel aprovado")
    } catch {
      showToast("err", "Erro ao aprovar")
    } finally { setBusyId(null) }
  }

  async function reject(id: string) {
    if (busyId) return
    if (!confirm("Rejeitar e remover este funnel?")) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/funnels?id=${encodeURIComponent(id)}`, {
        method: "DELETE", credentials: "include",
      })
      if (!res.ok) {
        showToast("err", "Erro ao rejeitar")
        return
      }
      setFunnels((arr) => arr.filter((f) => f.id !== id))
      showToast("ok", "✓ Funnel rejeitado")
    } catch {
      showToast("err", "Erro ao rejeitar")
    } finally { setBusyId(null) }
  }

  return (
    <div className="border border-[#1a1a24] bg-[#12121a]/40 p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
          Funnels {filter === "pending" ? "pendentes" : "(todos)"}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] transition-colors [font-family:var(--font-geist-sans)] ${
              filter === "pending"
                ? "border-[#c9a961] bg-[#c9a961]/10 text-[#c9a961]"
                : "border-[#1a1a24] text-[#a0a0b0] hover:border-[#3a3a45]"
            }`}
          >
            Pendentes
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] transition-colors [font-family:var(--font-geist-sans)] ${
              filter === "all"
                ? "border-[#c9a961] bg-[#c9a961]/10 text-[#c9a961]"
                : "border-[#1a1a24] text-[#a0a0b0] hover:border-[#3a3a45]"
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Toast — feedback visual de approve/reject (auto-some em 2.5s) */}
      {toast && (
        <div
          className={`mb-4 border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] [font-family:var(--font-geist-sans)] ${
            toast.kind === "ok"
              ? "border-emerald-700 bg-emerald-900/20 text-emerald-400"
              : "border-red-900 bg-red-950/30 text-red-400"
          }`}
        >
          {toast.text}
        </div>
      )}

      {loading && <p className="text-xs text-[#6a6a7a]">Carregando…</p>}
      {!loading && funnels.length === 0 && (
        <p className="text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
          {filter === "pending" ? "Não há funnels pendentes de aprovação." : "Não há funnels."}
        </p>
      )}

      <div className="space-y-3">
        {funnels.map((f) => (
          <div key={f.id} className="border border-[#1a1a24] bg-[#0a0a0f]/50 p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-[#1a1a24] bg-[#1a1a24]">
                {f.author_avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={f.author_avatar_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#c9a961] [font-family:var(--font-cinzel)]">
                    {(f.author_name || "M").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold text-[#f5f5f7] [font-family:var(--font-geist-sans)]">
                    {f.author_name}
                  </span>
                  {f.author_username && (
                    <span className="text-[11px] text-[#c9a961]">@{f.author_username}</span>
                  )}
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">
                    · {new Date(f.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  {!f.approved && (
                    <span className="border border-[#c9a961]/40 bg-[#c9a961]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
                      Em revisão
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-base font-bold text-[#f5f5f7] [font-family:var(--font-cinzel)]">
                  {f.name}
                </h3>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#a0a0b0]">{f.niche}</p>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block break-all text-xs text-[#c9a961] underline-offset-2 hover:underline"
                >
                  {f.url}
                </a>
              </div>
            </div>
            {!f.approved && (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => approve(f.id)}
                  disabled={busyId === f.id}
                  className="border border-green-500 bg-green-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-green-400 transition-colors hover:bg-green-500 hover:text-[#0a0a0f] disabled:opacity-50 [font-family:var(--font-geist-sans)]"
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => reject(f.id)}
                  disabled={busyId === f.id}
                  className="border border-red-500/50 bg-red-500/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-red-400 transition-colors hover:bg-red-500 hover:text-[#f5f5f7] disabled:opacity-50 [font-family:var(--font-geist-sans)]"
                >
                  Rejeitar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
