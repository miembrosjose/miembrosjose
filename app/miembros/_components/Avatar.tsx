"use client"

// Avatar reutilizável (post/reply/comment) — abre perfil via setView() sem reload.
// Renderiza badge da insignia destacada como overlay no canto inferior direito
// (igual proyecto base — avatarBadgeOverlayHtml).

import { useView } from "../_lib/view-context"
import { useIsOnline, ONLINE_BOX_SHADOW } from "../_lib/online-presence"
import { getAchievementById, getTierColor } from "@/lib/achievements"
import { CircleImg } from "./CircleImg"
import type { ForumAuthor } from "../_lib/types"

type AvatarProps = {
  author: ForumAuthor
  className?: string
}

export function Avatar({ author, className }: AvatarProps) {
  const { setView } = useView()
  const isOnline = useIsOnline(author.user_id)
  const url = `/miembros/u/${author.user_id}`
  const showImage = !!author.author_avatar_url
  const inner = showImage ? (
    <CircleImg src={author.author_avatar_url || ""} alt="" loading="lazy" />
  ) : (
    author.author_avatar
  )
  // Border colorida foi removida pra users normais. Apenas admin recebe
  // border branca (figura simbólica). Usa author_is_admin do snapshot do post.
  const isAdmin = !!author.author_is_admin

  // Box-shadow combina admin (white glow) + online (ring verde + glow). Online
  // mostrado em CIMA do admin glow pra ficar visivel quando ambos.
  const boxShadow = [
    isAdmin ? "0 0 10px #ffffff66" : null,
    isOnline ? ONLINE_BOX_SHADOW : null,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <a
      href={url}
      onClick={(e) => {
        e.preventDefault()
        setView("user", null, { userId: author.user_id })
      }}
      className={`${className || ""} cf-circle`}
      style={{
        textDecoration: "none",
        position: "relative",
        display: "inline-flex",
        ...(isAdmin && {
          borderColor: "#ffffff",
          borderWidth: 2,
          borderStyle: "solid",
        }),
        ...(boxShadow && { boxShadow }),
      }}
    >
      {inner}
      <AvatarBadge badgeId={author.author_badge_id} />
      <AvatarStarSmall starId={author.author_star_id} />
      <AvatarFlameSmall flameId={author.author_flame_id} />
    </a>
  )
}

// Badge SVG sobreposto no canto inferior direito do avatar.
// Renderizado quando author tem author_badge_id (insignia destacada).
export function AvatarBadge({ badgeId }: { badgeId?: string | null }) {
  if (!badgeId) return null
  const ach = getAchievementById(badgeId)
  if (!ach) return null

  const isAdminSeal = badgeId === "admin_seal"
  // El Topo e El Estudio compartilham o mesmo glow vermelho (família da marca).
  const isTopoFamily = badgeId === "el_topo" || badgeId === "el_estudio"
  const isRevisaoSeal = badgeId === "product_revisao"

  return (
    <span
      className="avatar-badge"
      data-badge-id={badgeId}
      data-tier={ach.tier}
      title={ach.name}
      style={{
        color: getTierColor(ach.tier),
        animation: isAdminSeal
          ? "admBadgeGlow 2.4s ease-in-out infinite"
          : isTopoFamily
          ? "topoBadgeGlow 2.4s ease-in-out infinite"
          : isRevisaoSeal
          ? "revisaoBadgeGlow 2.4s ease-in-out infinite"
          : undefined,
      }}
      dangerouslySetInnerHTML={{ __html: ach.svg }}
    />
  )
}

// Estrella destacada (community badge) — top-right do avatar pequeno (Navbar).
// Tier topo (Leyenda) recebe topoBadgeGlow vermelho animado.
export function AvatarStarSmall({ starId }: { starId?: string | null }) {
  if (!starId) return null
  const ach = getAchievementById(starId)
  if (!ach || ach.category !== "community") return null
  return (
    <span
      className="avatar-badge"
      data-slot="star"
      data-tier={ach.tier}
      title={ach.name}
      style={{
        color: getTierColor(ach.tier),
        animation: ach.tier === "topo"
          ? "topoBadgeGlow 2.4s ease-in-out infinite"
          : undefined,
      }}
      dangerouslySetInnerHTML={{ __html: ach.svg }}
    />
  )
}

// Llama destacada (time badge) — top-left do avatar pequeno (Navbar).
// Tier topo (Eterno) recebe topoBadgeGlow vermelho animado.
export function AvatarFlameSmall({ flameId }: { flameId?: string | null }) {
  if (!flameId) return null
  const ach = getAchievementById(flameId)
  if (!ach || ach.category !== "time") return null
  return (
    <span
      className="avatar-badge"
      data-slot="flame"
      data-tier={ach.tier}
      title={ach.name}
      style={{
        color: getTierColor(ach.tier),
        animation: ach.tier === "topo"
          ? "topoBadgeGlow 2.4s ease-in-out infinite"
          : undefined,
      }}
      dangerouslySetInnerHTML={{ __html: ach.svg }}
    />
  )
}

type AuthorNameProps = {
  author: ForumAuthor
  className?: string
}

export function AuthorName({ author, className }: AuthorNameProps) {
  const { setView } = useView()
  const url = `/miembros/u/${author.user_id}`
  return (
    <a
      href={url}
      onClick={(e) => {
        e.preventDefault()
        setView("user", null, { userId: author.user_id })
      }}
      className={className}
    >
      {author.author_name}
    </a>
  )
}
