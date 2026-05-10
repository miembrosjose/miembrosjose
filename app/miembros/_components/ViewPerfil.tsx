"use client"

// View interna /miembros/perfil — sem reload, dentro do SpaHomeShell.
// Reusa ProfileForm que já é client component.

import { useAuth } from "../_lib/auth-context"
import { useView } from "../_lib/view-context"
import { ProfileForm } from "../perfil/profile-form"
import styles from "./views.module.css"

export function ViewPerfil() {
  const { user, isLoading } = useAuth()
  const { setView } = useView()

  if (isLoading) {
    return (
      <div className={styles.view}>
        <section className={styles.section}>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            Cargando perfil...
          </p>
        </section>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.view}>
        <section className={styles.section}>
          <p style={{ color: "var(--text-muted)" }}>No autenticado.</p>
        </section>
      </div>
    )
  }

  const meta = (user.user_metadata || {}) as {
    full_name?: string
    avatar_url?: string
    featured_badge_id?: string | null
    featured_star_id?: string | null
    featured_flame_id?: string | null
    avatar_border_color?: string | null
    username?: string
    bio?: string
    niche?: string
    instagram?: string
    instagram_url?: string
  }
  const isUserAdmin = Boolean(
    (user.app_metadata as { is_admin?: boolean } | undefined)?.is_admin === true
  )
  const initialName = meta.full_name || (user.email ? user.email.split("@")[0] : "")
  const initialAvatar = meta.avatar_url || null
  const initialFeaturedBadgeId =
    (typeof meta.featured_badge_id === "string" && meta.featured_badge_id) || null
  const initialFeaturedStarId =
    (typeof meta.featured_star_id === "string" && meta.featured_star_id) || null
  const initialFeaturedFlameId =
    (typeof meta.featured_flame_id === "string" && meta.featured_flame_id) || null

  return (
    <div className={styles.view}>
      <section className={styles.section} style={{ maxWidth: 880, margin: "0 auto" }}>
        <header className={styles.sectionHeader} style={{ alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <p className={styles.sectionKicker}>Tu Perfil</p>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDivider} />
              Editar perfil
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
              Personaliza tu nombre, foto y contraseña. Tu email es{" "}
              <span style={{ color: "var(--text-primary)" }}>{user.email}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView("inicio")}
            aria-label="Cerrar"
            className="rounded-full"
            style={{
              width: 36,
              height: 36,
              border: "1px solid var(--border-subtle)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <ProfileForm
          initialName={initialName}
          initialAvatar={initialAvatar}
          initialFeaturedBadgeId={initialFeaturedBadgeId}
          initialFeaturedStarId={initialFeaturedStarId}
          initialFeaturedFlameId={initialFeaturedFlameId}
          initialUsername={meta.username || ""}
          initialBio={meta.bio || ""}
          initialNiche={meta.niche || ""}
          initialInstagram={meta.instagram || ""}
          initialInstagramUrl={meta.instagram_url || ""}
          isAdmin={isUserAdmin}
        />
      </section>
    </div>
  )
}
