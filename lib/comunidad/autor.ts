// La foto fija de quien escribe, en el momento de escribir.
//
// El foro guarda el nombre, el avatar y la insignia DENTRO de cada mensaje, no
// los consulta al pintarlo. Así una conversación de hace un año sigue
// enseñando cómo se llamaba entonces esa persona, y leerla no cuesta una
// consulta por autor.
//
// Estaba escrito dentro de la ruta que crea posts. Se saca aquí porque ahora
// lo necesitan dos sitios —esa ruta y la del Centro de Comunidad— y dos copias
// de esto acabarían divergiendo en la insignia o en el nombre por defecto.

import type { User } from "@supabase/supabase-js"
import { isAdmin } from "@/lib/admin"

export type AutorInstantanea = {
  author_name: string
  author_username: string | null
  author_avatar: string
  author_avatar_url: string | null
  author_badge_id: string | null
  author_star_id: string | null
  author_flame_id: string | null
  author_avatar_border: string | null
  author_is_admin: boolean
}

/** Iniciales para cuando no hay foto. */
export function inicialesDe(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "??"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function instantaneaDe(user: User): AutorInstantanea {
  const meta = (user.user_metadata || {}) as {
    full_name?: string
    name?: string
    avatar_url?: string
    featured_badge_id?: string | null
    featured_star_id?: string | null
    featured_flame_id?: string | null
    avatar_border_color?: string | null
    username?: string
  }

  const nombre = meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "Miembro")
  const elegida = (typeof meta.featured_badge_id === "string" && meta.featured_badge_id) || null

  return {
    author_name: nombre,
    author_username: (typeof meta.username === "string" && meta.username) || null,
    author_avatar: inicialesDe(nombre),
    author_avatar_url: (typeof meta.avatar_url === "string" && meta.avatar_url) || null,
    // Sin insignia elegida no se pone ninguna. El respaldo era «welcome», que
    // está retirada del catálogo: ponerla era inventarle a alguien una
    // distinción que no eligió ni ganó.
    author_badge_id: elegida || (isAdmin(user) ? "admin_seal" : null),
    author_star_id: (typeof meta.featured_star_id === "string" && meta.featured_star_id) || null,
    author_flame_id: (typeof meta.featured_flame_id === "string" && meta.featured_flame_id) || null,
    author_avatar_border:
      (typeof meta.avatar_border_color === "string" && meta.avatar_border_color) || null,
    author_is_admin: isAdmin(user),
  }
}
