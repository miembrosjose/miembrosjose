"use client"

// Leaderboard sidebar (TOP 100 ranking).
// Equivalente ao bloco renderLeaderboard. (linhas
// 12976-13062). Pódio top 3 (gold/silver/bronze com stats expandidas)
// + lista 4-100.

import { useEffect, useState } from "react"
import { Trophy, ChevronDown, ChevronUp } from "lucide-react"
import { api } from "../_lib/api"
import { useAuth } from "../_lib/auth-context"
import { useView } from "../_lib/view-context"
import { useIsOnline, ONLINE_BOX_SHADOW } from "../_lib/online-presence"
import { buildAvatarLetters } from "../_lib/format"
import { AvatarBadge } from "./Avatar"
import type { LeaderboardUser } from "../_lib/types"
import styles from "./leaderboard.module.css"

const TIER_CLASS = ["gold", "silver", "bronze"] as const

const STAT_LABELS: Array<[keyof NonNullable<LeaderboardUser["stats"]>, string]> = [
  ["forum_post", "Posts"],
  ["forum_reply", "Respuestas"],
  ["episode_comment", "Comentarios"],
  ["forum_like_received", "Likes"],
  ["funnel_created", "Funnels"],
  ["insignia_total", "Insignias"],
  ["login_day", "Días"],
]

export function Leaderboard() {
  const { user } = useAuth()
  const viewerId = user?.id ?? null
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Em mobile (<968px), começa colapsado pra não empurrar o foro pra baixo
  const [mobileCollapsed, setMobileCollapsed] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api<{ users: LeaderboardUser[]; viewer_id?: string }>("/api/leaderboard?limit=100")
      .then((data) => {
        if (!alive) return
        setUsers(data.users || [])
      })
      .catch((e) => {
        if (!alive) return
        const msg = e instanceof Error ? e.message : "Error desconocido"
        setError(msg)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const top3 = users.slice(0, 3)
  const restList = users.slice(3, 100)

  return (
    <aside className={`${styles.sidebar} ${mobileCollapsed ? styles.sidebarCollapsed : ""}`}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>RANKING TOP 100</h2>
          <p className={styles.sub}>Comunidad · Tiempo real</p>
        </div>
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setMobileCollapsed((v) => !v)}
          aria-label={mobileCollapsed ? "Mostrar ranking" : "Ocultar ranking"}
          aria-expanded={!mobileCollapsed}
        >
          {mobileCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </header>

      <div className={styles.body}>
        {loading && <p className={styles.empty}>Cargando ranking...</p>}
        {error && !loading && <p className={styles.empty}>No se pudo cargar el ranking</p>}
        {!loading && !error && users.length === 0 && (
          <p className={styles.empty}>Sin miembros aún en el ranking</p>
        )}

        {top3.length > 0 && (
          <div className={styles.podium}>
            {top3.map((u, i) => (
              <PodiumCard key={u.id} user={u} position={i + 1} tier={TIER_CLASS[i]} />
            ))}
          </div>
        )}

        {restList.length > 0 && (
          <div className={styles.rest}>
            {restList.map((u, idx) => (
              <RestRow
                key={u.id}
                user={u}
                position={idx + 4}
                isSelf={u.id === viewerId}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

function PodiumCard({
  user,
  position,
  tier,
}: {
  user: LeaderboardUser
  position: number
  tier: "gold" | "silver" | "bronze"
}) {
  const initials = buildAvatarLetters(user.full_name || "M")
  const { setView } = useView()
  const isOnline = useIsOnline(user.id)
  return (
    <a
      href={`/miembros/u/${user.id}`}
      onClick={(e) => {
        e.preventDefault()
        setView("user", null, { userId: user.id })
      }}
      className={`${styles.podiumCard} ${styles[tier]}`}
    >
      <span className={styles.medal}>{position}</span>
      <div
        className={styles.podiumAvatar}
        style={{ position: "relative", ...(isOnline && { boxShadow: ONLINE_BOX_SHADOW }) }}
      >
        {user.avatar_url ? <img src={user.avatar_url} alt="" loading="lazy" /> : initials}
        <AvatarBadge badgeId={user.featured_badge?.id} />
      </div>
      <div className={styles.podiumInfo}>
        <div className={styles.podiumName}>{user.full_name || "Miembro"}</div>
        {user.username && <div className={styles.podiumUsername}>@{user.username}</div>}
        <div className={styles.podiumMetaRow}>
          <span className={styles.podiumLevel}>
            LV {user.level} · {user.total_xp.toLocaleString("es-419")} XP
          </span>
          {user.rank_label && user.rank_label !== "Civil" && (
            <span className={styles.podiumRank}>{user.rank_label}</span>
          )}
        </div>
        {user.featured_badge && (
          <span className={styles.podiumInsignia} title={user.featured_badge.name}>
            <Trophy size={12} /> {user.featured_badge.name}
          </span>
        )}
      </div>
      <div className={styles.podiumStats}>
        {STAT_LABELS.map(([key, label]) => (
          <div key={key} className={styles.podiumStatRow}>
            <span>{label}</span>
            <span className={styles.statNum}>{user.stats?.[key] || 0}</span>
          </div>
        ))}
      </div>
    </a>
  )
}

function RestRow({
  user,
  position,
  isSelf,
}: {
  user: LeaderboardUser
  position: number
  isSelf: boolean
}) {
  const initials = buildAvatarLetters(user.full_name || "M")
  const { setView } = useView()
  const isOnline = useIsOnline(user.id)
  return (
    <a
      href={`/miembros/u/${user.id}`}
      onClick={(e) => {
        e.preventDefault()
        setView("user", null, { userId: user.id })
      }}
      className={`${styles.restRow} ${isSelf ? styles.isSelf : ""}`}
    >
      <span className={styles.restPosition}>{position}</span>
      <div
        className={styles.restAvatar}
        style={{ position: "relative", ...(isOnline && { boxShadow: ONLINE_BOX_SHADOW }) }}
      >
        {user.avatar_url ? <img src={user.avatar_url} alt="" loading="lazy" /> : initials}
        <AvatarBadge badgeId={user.featured_badge?.id} />
      </div>
      <div className={styles.restInfo}>
        <div className={styles.restName}>{user.full_name || "Miembro"}</div>
        {user.username && <div className={styles.restUsername}>@{user.username}</div>}
      </div>
      <span className={styles.restLevel}>
        LV {user.level}
        {user.rank_label && user.rank_label !== "Civil" && (
          <span className={styles.restRank}> · {user.rank_label}</span>
        )}
      </span>
    </a>
  )
}
