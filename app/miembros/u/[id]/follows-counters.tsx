"use client"

import { useEffect, useState } from "react"

type FollowUser = {
  id: string
  full_name: string
  username: string | null
  avatar_url: string | null
  followed_at: string | null
}

export function FollowsCountersAndModal({
  userId,
  followersCount,
  followingCount,
}: {
  userId: string
  followersCount: number
  followingCount: number
}) {
  const [open, setOpen] = useState<"followers" | "following" | null>(null)
  const [list, setList] = useState<FollowUser[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setList(null)
    fetch(`/api/users/${userId}/follows?type=${open}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setList(data?.users || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [open, userId])

  return (
    <>
      <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.25em] text-[#a0a0b0] [font-family:var(--font-geist-sans)]">
        <button
          type="button"
          onClick={() => setOpen("followers")}
          className="hover:text-[#6D4A9B]"
        >
          <span className="text-[#F3F6FA] font-bold">{followersCount}</span> Seguidores
        </button>
        <span className="text-[#3a3a45]">·</span>
        <button
          type="button"
          onClick={() => setOpen("following")}
          className="hover:text-[#6D4A9B]"
        >
          <span className="text-[#F3F6FA] font-bold">{followingCount}</span> Siguiendo
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(null) }}
        >
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden border border-[#1a1a24] bg-[#000000]">
            <div className="flex items-center justify-between border-b border-[#1a1a24] px-5 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
                {open === "followers" ? "Seguidores" : "Siguiendo"}
              </span>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Cerrar"
                className="text-xl text-[#a0a0b0] hover:text-[#F3F6FA]"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="px-5 py-10 text-center text-[10px] uppercase tracking-[0.25em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                  Cargando…
                </div>
              )}
              {!loading && list && list.length === 0 && (
                <div className="px-5 py-10 text-center text-[10px] uppercase tracking-[0.25em] text-[#6a6a7a] [font-family:var(--font-geist-sans)]">
                  {open === "followers" ? "Aún no tiene seguidores" : "No sigue a nadie todavía"}
                </div>
              )}
              {!loading && list && list.length > 0 && (
                <ul className="divide-y divide-[#1a1a24]">
                  {list.map((u) => (
                    <li key={u.id}>
                      <a
                        href={`/miembros/u/${u.id}`}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#12121a]"
                      >
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-[#2a2a35] bg-[#1a1a24]">
                          {u.avatar_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={u.avatar_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#6D4A9B] [font-family:var(--font-cinzel)]">
                              {u.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
                            {u.full_name}
                          </div>
                          {u.username && (
                            <div className="truncate text-[11px] text-[#6D4A9B] [font-family:var(--font-geist-sans)]">
                              @{u.username}
                            </div>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
