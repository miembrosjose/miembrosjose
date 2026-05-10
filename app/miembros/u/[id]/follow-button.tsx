"use client"

import { useState, useTransition } from "react"

export function ProfileFollowButton({
  targetId,
  initialFollowing,
}: {
  targetId: string
  initialFollowing: boolean
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    if (isPending) return
    const previous = following
    setFollowing(!previous)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${targetId}/follow`, {
          method: "POST",
          credentials: "include",
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        setFollowing(data.following)
      } catch {
        setFollowing(previous)
      }
    })
  }

  const label = following ? "Siguiendo · Notificaciones ON" : "Activar notificaciones"

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] transition-colors [font-family:var(--font-geist-sans)] disabled:opacity-50 ${
        following
          ? "border border-[#009d68] bg-[#009d68]/10 text-[#009d68] hover:bg-[#009d68] hover:text-[#0a0a0f]"
          : "border border-[#f5f5f7] bg-[#f5f5f7] text-[#0a0a0f] hover:border-red-900 hover:bg-red-900 hover:text-[#f5f5f7]"
      }`}
    >
      {label}
    </button>
  )
}
