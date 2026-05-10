"use client"

// Lista pública de membros — grid de cards com busca + filtros.
// Usa OnlinePresenceProvider pra detectar quem está online em tempo real.

import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { useView } from "../_lib/view-context"
import { useOnlinePresence, useIsOnline, ONLINE_BOX_SHADOW } from "../_lib/online-presence"
import { api } from "../_lib/api"
import { buildAvatarLetters } from "../_lib/format"
import { AvatarBadge, AvatarStarSmall, AvatarFlameSmall } from "./Avatar"
import { CircleImg } from "./CircleImg"
import styles from "./view-miembros.module.css"

type Member = {
  id: string
  full_name: string
  username: string | null
  avatar_url: string | null
  featured_badge_id: string | null
  featured_star_id: string | null
  featured_flame_id: string | null
  is_admin: boolean
  level: number
  total_xp: number
  member_since: string
}

type Filter = "all" | "online" | "top" | "recent"

export function ViewMiembrosLista() {
  const { setView } = useView()
  const { onlineSet } = useOnlinePresence()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<{ members: Member[]; total: number }>("/api/members?sort=name&limit=1000")
      .then((data) => {
        if (cancelled) return
        setMembers(data.members || [])
      })
      .catch(() => {
        if (!cancelled) setMembers([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Aplica busca + filtro
  const filtered = useMemo(() => {
    let list = members

    // Filtro
    if (filter === "online") {
      list = list.filter((m) => onlineSet.has(m.id))
    } else if (filter === "top") {
      list = [...list].sort((a, b) => b.total_xp - a.total_xp)
    } else if (filter === "recent") {
      list = [...list].sort((a, b) => (b.member_since || "").localeCompare(a.member_since || ""))
    }

    // Busca
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((m) => {
        const name = m.full_name.toLowerCase()
        const username = (m.username || "").toLowerCase()
        return name.includes(q) || username.includes(q)
      })
    }

    return list
  }, [members, search, filter, onlineSet])

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>Comunidad</p>
        <h1 className={styles.title}>
          Todos los <span className={styles.titleAccent}>miembros</span>
        </h1>
        <p className={styles.subtitle}>
          Conoce a quienes están construyendo embudos contigo. Click en el avatar para ver su perfil completo.
        </p>

        <div className={styles.searchBar}>
          <div className={styles.searchInputWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o @username..."
              className={styles.searchInput}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className={styles.searchClear}
                aria-label="Limpiar"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <span className={styles.totalCount}>
            {loading ? "..." : `${filtered.length} de ${members.length}`}
          </span>
        </div>

        <div className={styles.filters}>
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>Todos</FilterBtn>
          <FilterBtn active={filter === "online"} onClick={() => setFilter("online")}>
            ● En línea ({onlineSet.size})
          </FilterBtn>
          <FilterBtn active={filter === "top"} onClick={() => setFilter("top")}>Top XP</FilterBtn>
          <FilterBtn active={filter === "recent"} onClick={() => setFilter("recent")}>Recientes</FilterBtn>
        </div>
      </header>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.empty}>Cargando miembros...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            {search ? `Sin resultados para "${search}"` : "Sin miembros encontrados."}
          </div>
        ) : (
          filtered.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              onClick={() => setView("user", null, { userId: m.id })}
            />
          ))
        )}
      </div>
    </div>
  )
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.filterBtn} ${active ? styles.active : ""}`}
    >
      {children}
    </button>
  )
}

function MemberCard({ member, onClick }: { member: Member; onClick: () => void }) {
  const initials = buildAvatarLetters(member.full_name)
  const isOnline = useIsOnline(member.id)

  return (
    <button
      type="button"
      className={styles.card}
      onClick={onClick}
      title={`${member.full_name}${member.username ? ` · @${member.username}` : ""}`}
    >
      <div
        className={`${styles.cardAvatar} cf-circle`}
        style={{
          ...(member.is_admin && { borderColor: "#ffffff", borderWidth: 2 }),
          ...(isOnline && { boxShadow: ONLINE_BOX_SHADOW }),
        }}
      >
        {member.avatar_url ? (
          <CircleImg src={member.avatar_url} alt="" className={styles.cardAvatarImg} loading="lazy" />
        ) : (
          <span className={styles.cardAvatarInitials}>{initials}</span>
        )}
        <AvatarBadge badgeId={member.featured_badge_id} />
        <AvatarStarSmall starId={member.featured_star_id} />
        <AvatarFlameSmall flameId={member.featured_flame_id} />
      </div>
      <h3 className={styles.cardName}>{member.full_name}</h3>
      {member.username && <p className={styles.cardUsername}>@{member.username}</p>}
      <span className={styles.cardLevel}>LV {member.level}</span>
    </button>
  )
}
