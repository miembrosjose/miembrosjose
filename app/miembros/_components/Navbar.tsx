"use client"

// Navbar fixa do topo da área de membros.
// Troca de view via useView() — sem reload, igual aplicativo.

import { useEffect, useState } from "react"
import { Menu, X, MessageSquare } from "lucide-react"
import { useAuth } from "../_lib/auth-context"
import { useView, type ViewKey, type Anchor } from "../_lib/view-context"
import { useUnreadDM } from "../_lib/unread-dm"
import { buildAvatarLetters } from "../_lib/format"
import { XpBadge } from "./XpBadge"
import { XpDetailsModal } from "./XpDetailsModal"
import { NotificationsBell } from "./NotificationsBell"
import { AvatarBadge, AvatarFlameSmall, AvatarStarSmall } from "./Avatar"
import styles from "./navbar.module.css"

type NavItem = {
  label: string
  view: ViewKey
  anchor: Anchor
}

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", view: "inicio", anchor: null },
  { label: "Mis Productos", view: "inicio", anchor: "cursos" },
  { label: "Comunidad", view: "comunidad", anchor: null },
  { label: "Miembros", view: "miembros_lista", anchor: null },
  { label: "Feed", view: "feed", anchor: null },
  { label: "Tienda", view: "inicio", anchor: "tienda" },
]

export function Navbar() {
  const { user, isAdmin } = useAuth()
  const { view, anchor, setView } = useView()
  const { count: unreadDM } = useUnreadDM()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [xpModalOpen, setXpModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fecha menu mobile quando troca view via clique
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [view, anchor])

  // Trava scroll do body quando menu mobile aberto
  useEffect(() => {
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Smart header (SÓ mobile via CSS): esconde ao rolar pra baixo, mostra ao
  // rolar pra cima ou no topo. Resolve o header que "sumia" no celular (o body
  // é o container de scroll neste layout, o que bagunça position:fixed no iOS).
  // Lê a posição de scroll de forma robusta (window OU documentElement OU body).
  // Desktop NÃO é afetado: o translateY só existe na media query <=968px.
  useEffect(() => {
    const getY = () =>
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
    let lastY = getY()
    let ticking = false
    const update = () => {
      const y = getY()
      if (y <= 8) setHidden(false)
      else if (y > lastY + 6) setHidden(true)
      else if (y < lastY - 6) setHidden(false)
      lastY = y
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const meta = (user?.user_metadata as {
    full_name?: string
    name?: string
    avatar_url?: string
    featured_badge_id?: string | null
    featured_star_id?: string | null
    featured_flame_id?: string | null
  }) || {}
  const fullName = meta.full_name || meta.name || user?.email?.split("@")[0] || "Miembro"
  const initials = buildAvatarLetters(fullName)
  const avatarUrl = (typeof meta.avatar_url === "string" && meta.avatar_url) || null
  // Admin SEMPRE mostra admin_seal. Outros users: featured_badge_id (escolhida
  // em /perfil → BadgeSection) ou fallback "welcome" (todo user tem por default).
  const featuredBadgeId = isAdmin
    ? "admin_seal"
    : (typeof meta.featured_badge_id === "string" && meta.featured_badge_id) || "welcome"
  const featuredStarId =
    (typeof meta.featured_star_id === "string" && meta.featured_star_id) || null
  const featuredFlameId =
    (typeof meta.featured_flame_id === "string" && meta.featured_flame_id) || null

  function isActive(item: NavItem): boolean {
    if (item.anchor) return view === item.view && anchor === item.anchor
    return view === item.view && anchor === null
  }

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""} ${hidden && !mobileMenuOpen ? styles.navHidden : ""}`}>
      {/* Hamburger — só aparece em mobile via media query no CSS */}
      <button
        type="button"
        className={styles.hamburger}
        onClick={() => setMobileMenuOpen((v) => !v)}
        aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className={styles.logo}>
        Los 144000
        <span className={styles.beta}>BETA</span>
      </div>

      <ul className={`${styles.nav} ${mobileMenuOpen ? styles.navOpen : ""}`}>
        {NAV_ITEMS.map((item) => (
          <li key={item.label}>
            <a
              href={item.anchor ? `#${item.anchor}` : item.view === "inicio" ? "#" : `#${item.view}`}
              onClick={(e) => {
                e.preventDefault()
                setView(item.view, item.anchor)
              }}
              className={isActive(item) ? styles.active : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        {/* Mensajes — botão com badge de unread em tempo real */}
        <a
          href="/miembros/mensajes"
          onClick={(e) => {
            e.preventDefault()
            setView("messages")
          }}
          aria-label="Mensajes"
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            color: view === "messages" ? "var(--accent-red)" : "var(--text-secondary)",
            transition: "color 0.2s",
          }}
        >
          <MessageSquare size={18} />
          {unreadDM > 0 && (
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 16,
                height: 16,
                padding: "0 4px",
                borderRadius: 8,
                background: "var(--accent-red)",
                color: "white",
                fontSize: 9,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {unreadDM > 9 ? "9+" : unreadDM}
            </span>
          )}
        </a>
        <NotificationsBell />
        <XpBadge onClick={() => setXpModalOpen(true)} />
        {isAdmin && (
          <a
            href="/miembros/admin"
            onClick={(e) => {
              e.preventDefault()
              setView("admin")
            }}
            className={styles.adminLink}
          >
            ADMIN
          </a>
        )}
        <a
          href="/miembros/perfil"
          onClick={(e) => {
            e.preventDefault()
            setView("perfil")
          }}
          className={styles.avatar}
          aria-label="Editar perfil"
        >
          <span
            className={styles.avatarInner}
            style={isAdmin
              ? { borderColor: "#ffffff", borderWidth: 2, borderStyle: "solid", boxShadow: "0 0 12px #ffffff66" }
              : { border: "none" }
            }
          >
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
          </span>
          <AvatarBadge badgeId={featuredBadgeId} />
          <AvatarStarSmall starId={featuredStarId} />
          <AvatarFlameSmall flameId={featuredFlameId} />
        </a>
      </div>

      <XpDetailsModal open={xpModalOpen} onClose={() => setXpModalOpen(false)} />
    </nav>
  )
}
