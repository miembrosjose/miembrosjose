"use client"

// View interna /miembros/u/<id> — sem reload, dentro do SpaHomeShell.
// Substitui app/miembros/u/[id]/page.tsx (Server Component).
// Fetcha dados via /api/profile/public/[id] (criada nesta migração).

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { useView } from "../_lib/view-context"
import { api } from "../_lib/api"
import { ProfileFollowButton } from "../u/[id]/follow-button"
import { FollowsCountersAndModal } from "../u/[id]/follows-counters"
import styles from "./views.module.css"

type PublicProfileResponse = {
  user: {
    id: string
    email: string
    created_at: string
    full_name: string | null
    username: string | null
    bio: string | null
    niche: string | null
    instagram: string | null
    instagram_url: string | null
    avatar_url: string | null
    featured_badge_id: string | null
    is_admin: boolean
    unique_login_days: number
  }
  isSelf: boolean
  counts: { posts: number; replies: number; followers: number; following: number }
  xp: { level: number; total_xp: number; xp_in_level: number; xp_for_level: number; percent: number }
  rank: { label: string; badge_id: string | null }
  badges: {
    rank_ach: BadgeInfo | null
    featured_ach: BadgeInfo | null
    star_ach: BadgeInfo | null
    flame_ach: BadgeInfo | null
    unlocked: Array<UnlockedBadge>
  }
  isFollowing: boolean
  recentPosts: Array<{
    id: string
    title: string
    created_at: string
    likes_count: number
    dislikes_count?: number
    replies_count: number
    image_url: string | null
  }>
}

type BadgeInfo = {
  id: string
  name: string
  tier: string
  svg: string
  color: string
}

type UnlockedBadge = {
  id: string
  name: string
  desc: string
  tier: string
  category: string
  svg: string
  color: string
  unlocked_at: string
}

export function ViewUserProfile() {
  const { params, setView } = useView()
  const [data, setData] = useState<PublicProfileResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const userId = params.userId

  useEffect(() => {
    if (!userId) {
      setView("inicio")
      return
    }
    let cancelled = false
    setData(null)
    setError(null)
    ;(async () => {
      try {
        const result = await api<PublicProfileResponse>(`/api/profile/public/${userId}`)
        if (!cancelled) setData(result)
      } catch (e) {
        if (!cancelled) {
          const status = (e as { status?: number }).status
          if (status === 404) setError("Usuario no encontrado")
          else setError("No se pudo cargar el perfil")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, setView])

  if (!userId) return null

  if (error) {
    return (
      <div className={styles.view}>
        <section className={styles.section} style={{ position: "relative" }}>
          <CloseButton onClose={() => setView("inicio")} />
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
            {error}
          </p>
        </section>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={styles.view}>
        <section className={styles.section} style={{ position: "relative" }}>
          <CloseButton onClose={() => setView("inicio")} />
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            Cargando perfil...
          </p>
        </section>
      </div>
    )
  }

  const { user, isSelf, counts, xp, rank, badges, isFollowing, recentPosts } = data
  const fullName = user.full_name || (user.email ? user.email.split("@")[0] : "Miembro")
  const memberSince = new Date(user.created_at).toLocaleDateString("es-419", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className={styles.view}>
      <main style={{ margin: "0 auto", width: "100%", maxWidth: 880, padding: "4rem 1.5rem", position: "relative" }}>
        <CloseButton onClose={() => setView("inicio")} />
        {/* Header com avatar + identidade */}
        <header style={{ marginBottom: "3rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "flex-start" }}>
            <div style={{ position: "relative", width: 128, height: 128, flexShrink: 0 }}>
              <div
                className="rounded-full"
                style={{
                  width: 128,
                  height: 128,
                  overflow: "hidden",
                  // Border branca exclusiva pra admin (figura simbólica).
                  // Outros users sem borda colorida — feature removida.
                  border: user.is_admin
                    ? "3px solid #ffffff"
                    : "1px solid var(--border-medium)",
                  boxShadow: user.is_admin
                    ? "0 0 16px #ffffff66"
                    : undefined,
                  background: "var(--bg-elevated)",
                }}
              >
                {user.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.avatar_url}
                    alt={fullName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.5rem",
                      fontWeight: 700,
                      color: "var(--accent-gold)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {badges.featured_ach && (() => {
                const isAdminSeal = badges.featured_ach.id === "admin_seal"
                const isTopoSeal = badges.featured_ach.id === "el_topo"
                const isRevisaoSeal = badges.featured_ach.id === "product_revisao"
                const isExclusive = isAdminSeal || isTopoSeal || isRevisaoSeal
                return (
                  <div
                    className="rounded-full"
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      display: "flex",
                      width: 48,
                      height: 48,
                      alignItems: "center",
                      justifyContent: "center",
                      border: isExclusive ? "none" : "1px solid var(--border-subtle)",
                      background: isExclusive ? "transparent" : "var(--bg-deep)",
                      color: badges.featured_ach.color,
                      boxShadow: isExclusive ? "none" : "0 0 12px rgba(0, 0, 0, 0.6)",
                      animation: isAdminSeal
                        ? "admBadgeGlow 2.4s ease-in-out infinite"
                        : isTopoSeal
                        ? "topoBadgeGlow 2.4s ease-in-out infinite"
                        : isRevisaoSeal
                        ? "revisaoBadgeGlow 2.4s ease-in-out infinite"
                        : undefined,
                    }}
                    title={badges.featured_ach.name}
                    dangerouslySetInnerHTML={{ __html: badges.featured_ach.svg }}
                  />
                )
              })()}
              {/* Estrella destacada — top-right (Leyenda topo brilha vermelho) */}
              {badges.star_ach && (
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    display: "flex",
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    color: badges.star_ach.color,
                    animation: badges.star_ach.tier === "topo"
                      ? "topoBadgeGlow 2.4s ease-in-out infinite"
                      : undefined,
                  }}
                  title={badges.star_ach.name}
                  dangerouslySetInnerHTML={{ __html: badges.star_ach.svg }}
                />
              )}
              {/* Llama destacada — top-left (Eterno topo brilha vermelho) */}
              {badges.flame_ach && (
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    left: -4,
                    display: "flex",
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    color: badges.flame_ach.color,
                    animation: badges.flame_ach.tier === "topo"
                      ? "topoBadgeGlow 2.4s ease-in-out infinite"
                      : undefined,
                  }}
                  title={badges.flame_ach.name}
                  dangerouslySetInnerHTML={{ __html: badges.flame_ach.svg }}
                />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span
                  style={{
                    border: "1px solid var(--accent-gold)",
                    background: "rgba(201, 169, 97, 0.1)",
                    padding: "0.125rem 0.5rem",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "var(--accent-gold)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  LV {xp.level}
                </span>
                <span style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.25em", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                  {xp.total_xp.toLocaleString("es-419")} XP
                </span>
                <span style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.25em", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  · {rank.label}
                </span>
              </div>
              <h1
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                  margin: 0,
                }}
              >
                {fullName}
              </h1>
              {user.username && (
                <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--accent-gold)" }}>
                  @{user.username}
                </p>
              )}
              <div style={{ marginTop: "0.75rem", maxWidth: 320 }}>
                <div style={{ height: 6, overflow: "hidden", background: "var(--bg-elevated)" }}>
                  <div
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, var(--accent-red), var(--accent-gold))",
                      width: `${xp.percent}%`,
                    }}
                  />
                </div>
                <p
                  style={{
                    marginTop: "0.25rem",
                    fontSize: "0.5625rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {xp.xp_in_level} / {xp.xp_for_level} XP · {xp.percent}%
                </p>
              </div>
              {user.niche && (
                <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.25em", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                  Nicho · <span style={{ color: "var(--text-primary)" }}>{user.niche}</span>
                </p>
              )}

              <div style={{ marginTop: "0.75rem" }}>
                <FollowsCountersAndModal
                  userId={userId}
                  followersCount={counts.followers}
                  followingCount={counts.following}
                />
              </div>

              <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
                {!isSelf && <ProfileFollowButton targetId={userId} initialFollowing={isFollowing} />}
                {!isSelf && (
                  <button
                    type="button"
                    onClick={() => setView("messages", null, { withUserId: userId })}
                    style={{
                      border: "1px solid var(--accent-red)",
                      background: "rgba(127, 29, 29, 0.15)",
                      padding: "0.5rem 1rem",
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.3em",
                      color: "#fca5a5",
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    Enviar mensaje
                  </button>
                )}
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => setView("perfil")}
                    style={{
                      border: "1px solid var(--accent-gold)",
                      background: "rgba(201, 169, 97, 0.1)",
                      padding: "0.5rem 1rem",
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.3em",
                      color: "var(--accent-gold)",
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Editar perfil →
                  </button>
                )}
                {(user.instagram_url || user.instagram) && (
                  <a
                    href={user.instagram_url || `https://instagram.com/${user.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      background: "rgba(18, 18, 26, 0.4)",
                      padding: "0.5rem 1rem",
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.3em",
                      color: "var(--text-secondary)",
                      textDecoration: "none",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {user.instagram ? `@${user.instagram} · IG ↗` : "Mi link ↗"}
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        {user.bio && (
          <section style={{ marginBottom: "2.5rem", borderLeft: "2px solid var(--accent-red)", paddingLeft: "1.5rem" }}>
            <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {user.bio}
            </p>
          </section>
        )}

        <section style={{ marginBottom: "2.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
          <StatCard label="Publicaciones" value={counts.posts} />
          <StatCard label="Respuestas" value={counts.replies} />
          <StatCard label="Días activo" value={user.unique_login_days} />
          <StatCard label="Miembro desde" value={memberSince} />
        </section>

        {badges.unlocked.length > 0 && (
          <section
            style={{
              marginBottom: "2.5rem",
              border: "1px solid var(--border-subtle)",
              background: "rgba(18, 18, 26, 0.4)",
              padding: "1.5rem",
            }}
          >
            <h2 style={{ marginBottom: "1.25rem", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.25em", color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>
              Insignias desbloqueadas · {badges.unlocked.length}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
              {badges.unlocked.map((b) => (
                <UnlockedBadgeCard key={b.id} badge={b} />
              ))}
            </div>
          </section>
        )}

        {recentPosts.length > 0 && (
          <section>
            <h2 style={{ marginBottom: "1.25rem", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.25em", color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>
              Publicaciones recientes
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentPosts.map((p) => (
                <div key={p.id} style={{ border: "1px solid var(--border-subtle)", background: "rgba(10, 10, 15, 0.4)", padding: "1.25rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-display)", margin: 0 }}>
                    {p.title}
                  </h3>
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem", fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    <span>♥ {p.likes_count}</span>
                    <span>👎 {p.dislikes_count ?? 0}</span>
                    <span>💬 {p.replies_count}</span>
                    <span style={{ marginLeft: "auto" }}>{new Date(p.created_at).toLocaleDateString("es-419")}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ border: "1px solid var(--border-subtle)", background: "rgba(10, 10, 15, 0.4)", padding: "1rem", textAlign: "center" }}>
      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", margin: 0 }}>
        {value}
      </p>
      <p style={{ marginTop: "0.25rem", fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.25em", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
    </div>
  )
}

function BadgeCard({ ach, label }: { ach: BadgeInfo; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border-subtle)", background: "rgba(10, 10, 15, 0.5)", padding: "0.75rem", textAlign: "center" }}>
      <div
        style={{ width: 64, height: 64, color: ach.color }}
        dangerouslySetInnerHTML={{ __html: ach.svg }}
      />
      <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-primary)", fontFamily: "var(--font-mono)", margin: 0 }}>
        {ach.name}
      </p>
      <p style={{ fontSize: "0.5625rem", textTransform: "uppercase", letterSpacing: "0.25em", color: "var(--text-muted)", fontFamily: "var(--font-mono)", margin: 0 }}>
        {label}
      </p>
    </div>
  )
}

function UnlockedBadgeCard({ badge }: { badge: UnlockedBadge }) {
  const isAdminSeal = badge.id === "admin_seal"
  const isTopoSeal = badge.id === "el_topo"
  const isRevisaoSeal = badge.id === "product_revisao"
  const isExclusive = isAdminSeal || isTopoSeal || isRevisaoSeal
  return (
    <div
      title={badge.desc}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        border: isExclusive ? "none" : "1px solid var(--border-subtle)",
        background: isExclusive ? "transparent" : "rgba(10, 10, 15, 0.5)",
        padding: "0.75rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          color: badge.color,
          animation: isAdminSeal
            ? "admBadgeGlow 2.4s ease-in-out infinite"
            : isTopoSeal
            ? "topoBadgeGlow 2.4s ease-in-out infinite"
            : isRevisaoSeal
            ? "revisaoBadgeGlow 2.4s ease-in-out infinite"
            : undefined,
        }}
        dangerouslySetInnerHTML={{ __html: badge.svg }}
      />
      <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-primary)", fontFamily: "var(--font-mono)", margin: 0, lineHeight: 1.2 }}>
        {badge.name}
      </p>
      <p style={{ fontSize: "0.5625rem", textTransform: "uppercase", letterSpacing: "0.25em", color: badge.color, fontFamily: "var(--font-mono)", margin: 0 }}>
        {badge.tier}
      </p>
    </div>
  )
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Cerrar"
      className="rounded-full"
      style={{
        position: "absolute",
        right: 16,
        top: 16,
        zIndex: 5,
        width: 36,
        height: 36,
        background: "rgba(10, 10, 15, 0.85)",
        border: "1px solid var(--border-subtle)",
        backdropFilter: "blur(8px)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <X size={18} />
    </button>
  )
}
