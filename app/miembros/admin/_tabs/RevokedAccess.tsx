"use client"

import { useEffect, useState } from "react"
import { FilterBtn } from "./_shared"

type RevokedItem = {
  email: string
  user_id: string | null
  full_name: string
  avatar_url: string | null
  full_access_revoked: boolean
  product_count: number
  has_front: boolean
  last_revoked_at: string
  products: Array<{
    key: string
    reason: string | null
    source: string
    revoked_at: string
    notes: string | null
  }>
}

export function RevokedAccess() {
  const [items, setItems] = useState<RevokedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "front" | "products">("all")
  const [busyKey, setBusyKey] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/revoked", { credentials: "include" })
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function restore(email: string, key: string) {
    const target = key === "all" ? "TODOS os acessos" : `acesso a "${key}"`
    if (!confirm(`Restaurar ${target} para ${email}?`)) return
    const k = `${email}:${key}`
    setBusyKey(k)
    try {
      await fetch(`/api/admin/revoke-product?email=${encodeURIComponent(email)}&key=${encodeURIComponent(key)}`, {
        method: "DELETE", credentials: "include",
      })
      await load()
    } finally { setBusyKey(null) }
  }

  const filtered = items.filter((i) => {
    if (filter === "all") return true
    if (filter === "front") return i.has_front || i.full_access_revoked
    if (filter === "products") return !i.has_front && !i.full_access_revoked
    return true
  })

  const stats = {
    total: items.length,
    front: items.filter((i) => i.has_front || i.full_access_revoked).length,
    products: items.filter((i) => !i.has_front && !i.full_access_revoked).length,
  }

  return (
    <div className="border border-[#1a1a24] bg-[#12121a]/40 p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#c9a961] [font-family:var(--font-geist-sans)]">
          Acessos perdidos
        </h2>
        <div className="flex flex-wrap gap-2">
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
            Todos ({stats.total})
          </FilterBtn>
          <FilterBtn active={filter === "front"} onClick={() => setFilter("front")} variant="red">
            Front + bumps ({stats.front})
          </FilterBtn>
          <FilterBtn active={filter === "products"} onClick={() => setFilter("products")} variant="gold">
            Só produtos ({stats.products})
          </FilterBtn>
        </div>
      </div>

      {loading && <p className="text-xs text-[#6a6a7a]">Carregando…</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-xs text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
          Ninguém perdeu acesso neste filtro. 🙌
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((item) => {
          const isFullRevoked = item.has_front || item.full_access_revoked
          return (
            <div
              key={item.email}
              className={`border p-4 sm:p-5 ${
                isFullRevoked ? "border-red-500/40 bg-red-500/5" : "border-[#1a1a24] bg-[#0a0a0f]/50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-[#1a1a24] bg-[#1a1a24]">
                  {item.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.avatar_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#c9a961] [font-family:var(--font-cinzel)]">
                      {item.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold text-[#f5f5f7] [font-family:var(--font-geist-sans)]">
                      {item.full_name}
                    </span>
                    {isFullRevoked && (
                      <span className="border border-red-500/50 bg-red-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.25em] text-red-400 [font-family:var(--font-geist-sans)]">
                        Acesso completo revogado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#a0a0b0] truncate">{item.email}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#6a6a7a]">
                    Última: {new Date(item.last_revoked_at).toLocaleDateString("pt-BR")} · {new Date(item.last_revoked_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => restore(item.email, "all")}
                  disabled={busyKey?.startsWith(item.email + ":")}
                  className="border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-green-400 transition-colors hover:bg-green-500 hover:text-[#0a0a0f] disabled:opacity-50 [font-family:var(--font-geist-sans)]"
                >
                  Restaurar tudo
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.products.map((p, i) => (
                  <div
                    key={`${item.email}-${p.key}-${i}`}
                    className={`flex items-center gap-2 border px-2 py-1 text-[10px] uppercase tracking-[0.2em] [font-family:var(--font-geist-sans)] ${
                      p.key === "front"
                        ? "border-red-500/40 bg-red-500/10 text-red-400"
                        : "border-[#1a1a24] bg-[#12121a]/60 text-[#a0a0b0]"
                    }`}
                  >
                    <span className="font-bold">{p.key}</span>
                    <span className="text-[#6a6a7a]">·</span>
                    <span>{p.reason}</span>
                    <span className="text-[#6a6a7a]">·</span>
                    <span>{p.source}</span>
                    <button
                      type="button"
                      onClick={() => restore(item.email, p.key)}
                      disabled={busyKey === `${item.email}:${p.key}`}
                      title="Restaurar este produto"
                      className="ml-1 text-[10px] text-green-400 hover:text-green-300 disabled:opacity-50"
                    >
                      ↺
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
