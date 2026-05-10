"use client"

// Widget de miembros online — consome OnlinePresenceProvider (channel global).
// O track/sync acontece no Provider (layout.tsx), em qualquer view do /miembros.
// Esse componente é só a UI da home — o user fica online pros outros mesmo
// quando navega pra outras views (foro, perfil, etc).

import { useView } from "../_lib/view-context"
import { useOnlinePresence } from "../_lib/online-presence"
import { AvatarBadge, AvatarStarSmall, AvatarFlameSmall } from "./Avatar"
import { CircleImg } from "./CircleImg"
import styles from "./online-members.module.css"

export function OnlineMembers() {
  const { setView } = useView()
  const { members } = useOnlinePresence()

  if (members.length === 0) return null

  return (
    <section className={styles.widget} aria-label="Miembros online">
      <header className={styles.header}>
        <div className={styles.title}>
          <span className={styles.dot} aria-hidden />
          <span className={styles.kicker}>En línea · Tiempo real</span>
        </div>
        <span className={styles.count}>{members.length}</span>
      </header>
      <div className={styles.scroll}>
        <ul className={styles.list}>
          {members.map((m) => (
            <li key={m.user_id} className={styles.item}>
              <button
                type="button"
                className={styles.card}
                onClick={() => setView("user", null, { userId: m.user_id })}
                title={`${m.full_name}${m.username ? ` · @${m.username}` : ""}`}
              >
                <div className={`${styles.avatarWrap} cf-circle`}>
                  {m.avatar_url ? (
                    <CircleImg
                      src={m.avatar_url}
                      alt=""
                      loading="lazy"
                      className={styles.avatarImg}
                    />
                  ) : (
                    <span className={styles.avatarInitials}>{m.initials}</span>
                  )}
                  <AvatarBadge badgeId={m.badge_id} />
                  <AvatarStarSmall starId={m.star_id} />
                  <AvatarFlameSmall flameId={m.flame_id} />
                </div>
                <div className={styles.meta}>
                  <span className={styles.name}>{m.full_name}</span>
                  <span className={styles.level}>LV {m.level}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
