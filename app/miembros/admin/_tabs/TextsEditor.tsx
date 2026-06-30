"use client"

import { useEffect, useMemo, useState } from "react"
import { SITE_TEXTS } from "@/lib/site-texts"
import { inputCls } from "./_shared"

export function TextsEditor() {
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ key: string; type: "success" | "error"; msg: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const groups = useMemo(() => {
    const map = new Map<string, typeof SITE_TEXTS>()
    for (const e of SITE_TEXTS) {
      const arr = map.get(e.group) || []
      arr.push(e)
      map.set(e.group, arr)
    }
    return Array.from(map.entries())
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/site-texts", { credentials: "include" })
      const data = await res.json()
      const ov = (data.overrides || {}) as Record<string, string>
      setOverrides(ov)
      const initialDrafts: Record<string, string> = {}
      for (const e of SITE_TEXTS) initialDrafts[e.key] = ov[e.key] ?? e.default
      setDrafts(initialDrafts)
    } catch {
      setOverrides({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function saveKey(key: string) {
    const value = (drafts[key] || "").trim()
    if (!value) {
      setStatusMsg({ key, type: "error", msg: "Texto vazio" })
      return
    }
    setSavingKey(key); setStatusMsg(null)
    try {
      const res = await fetch("/api/admin/site-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setOverrides((prev) => ({ ...prev, [key]: value }))
      setStatusMsg({ key, type: "success", msg: "Salvo" })
    } catch (e) {
      setStatusMsg({ key, type: "error", msg: e instanceof Error ? e.message : "Erro" })
    } finally {
      setSavingKey(null)
    }
  }

  async function resetKey(key: string) {
    const entry = SITE_TEXTS.find((e) => e.key === key)
    if (!entry) return
    if (!confirm(`Restaurar "${entry.label}" ao texto original?`)) return
    setSavingKey(key); setStatusMsg(null)
    try {
      const res = await fetch(`/api/admin/site-texts?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error()
      setOverrides((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setDrafts((prev) => ({ ...prev, [key]: entry.default }))
      setStatusMsg({ key, type: "success", msg: "Restaurado" })
    } catch {
      setStatusMsg({ key, type: "error", msg: "Erro ao restaurar" })
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) {
    return <p className="text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <div className="border border-[#1a1a24] bg-[#12121a]/40 p-5">
        <p className="text-xs text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
          Edita os textos visíveis na plataforma. As mudanças são aplicadas assim que você salva. Use <span className="text-[#6D4A9B]">Restaurar</span> para voltar ao texto original.
        </p>
      </div>

      {groups.map(([groupName, entries]) => (
        <div key={groupName} className="border border-[#1a1a24] bg-[#12121a]/40 p-5 sm:p-6">
          <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
            {groupName}
          </h3>
          <div className="space-y-5">
            {entries.map((entry) => {
              const draft = drafts[entry.key] ?? entry.default
              const isOverridden = entry.key in overrides
              const isSaving = savingKey === entry.key
              const status = statusMsg?.key === entry.key ? statusMsg : null
              const dirty = draft !== (overrides[entry.key] ?? entry.default)
              return (
                <div key={entry.key} className="border-b border-[#1a1a24] pb-4 last:border-b-0 last:pb-0">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
                      {entry.label}
                      {isOverridden && (
                        <span className="ml-2 text-[#6D4A9B]" title="Editado">●</span>
                      )}

                    </label>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#3a3a45] [font-family:var(--font-geist-sans)]">
                      {entry.key}
                    </span>
                  </div>
                  {entry.multiline ? (
                    <textarea
                      value={draft}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [entry.key]: e.target.value }))}
                      disabled={isSaving}
                      rows={3}
                      maxLength={5000}
                      className={inputCls}
                    />
                  ) : (
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [entry.key]: e.target.value }))}
                      disabled={isSaving}
                      maxLength={500}
                      className={inputCls}
                    />
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => saveKey(entry.key)}
                      disabled={isSaving || !dirty}
                      className="border border-[#6D4A9B] bg-[#6D4A9B]/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6D4A9B] hover:bg-[#6D4A9B] hover:text-[#000000] disabled:cursor-not-allowed disabled:opacity-40 [font-family:var(--font-geist-sans)]"
                    >
                      {isSaving ? "Salvando..." : "Salvar"}
                    </button>
                    {isOverridden && (
                      <button
                        type="button"
                        onClick={() => resetKey(entry.key)}
                        disabled={isSaving}
                        className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#6a6a7a] hover:text-[#a0a0b0] disabled:opacity-40 [font-family:var(--font-geist-sans)]"
                      >
                        Restaurar
                      </button>
                    )}
                    {status && (
                      <span className={`text-[10px] [font-family:var(--font-geist-sans)] ${
                        status.type === "success" ? "text-[#009d68]" : "text-red-500"
                      }`}>
                        {status.msg}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
