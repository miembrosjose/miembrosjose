"use client"

// Una conversación, en una línea que se lee de un vistazo.
//
// ── POR QUÉ NO SE PINTA EL POST ENTERO ─────────────────────────────────────
// En una lista, lo que hace falta es decidir si entrar o no. El cuerpo entero
// de cada conversación empuja la siguiente fuera de la pantalla y obliga a
// desplazarse para saber qué hay. Aquí va lo que sirve para decidir: de qué
// trata, quién lo abrió, cuánta gente ha respondido y si sigue vivo.
//
// El perfil del autor se reduce a lo imprescindible —foto, nombre e insignia—:
// la conversación es lo importante, no la ficha de quien escribe.

import { Lock, MessageSquare, Pin, Star, Trash2 } from "lucide-react"
import { getAchievementById } from "@/lib/achievements"
import type { ForumPost as THilo } from "../../_lib/types"
import type { EspacioResumen } from "./ViewComunidad"
import s from "./comunidad.module.css"
import { useAuth } from "../../_lib/auth-context"

type Props = {
  hilo: THilo & {
    space_id?: string | null
    is_official?: boolean
    is_locked?: boolean
    last_activity_at?: string | null
  }
  espacios?: EspacioResumen[]
  /** Solo en las listas que cruzan espacios: dice de dónde viene cada una. */
  onAbrirEspacio?: (slug: string) => void
  onAbrir?: (hilo: THilo) => void
  /** Moderación: se retira la conversación entera. Solo administración. */
  onBorrar?: (hilo: THilo) => void
}

export function HiloResumen({ hilo, espacios, onAbrirEspacio, onAbrir, onBorrar }: Props) {
  const { isAdmin } = useAuth()
  const espacio = espacios?.find((e) => e.id === hilo.space_id)
  const insignia = hilo.author_badge_id ? getAchievementById(hilo.author_badge_id) : undefined

  return (
    <article className={hilo.is_official ? s.hiloOficial : s.hilo}>
      <button type="button" className={s.hiloCuerpo} onClick={() => onAbrir?.(hilo)}>
        <span className={s.hiloMarcas}>
          {hilo.pinned && <span className={s.marcaFijada}><Pin size={10} aria-hidden /> Fijada</span>}
          {hilo.is_official && <span className={s.marcaOficial}><Star size={10} aria-hidden /> Oficial</span>}
          {hilo.is_locked && <span className={s.marcaCerrada}><Lock size={10} aria-hidden /> Cerrada</span>}
        </span>

        <span className={s.hiloTitulo}>{hilo.title}</span>

        <span className={s.hiloPie}>
          {hilo.author_avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hilo.author_avatar_url} alt="" className={s.hiloAvatar} />
          ) : (
            <span className={s.hiloAvatarVacio} aria-hidden>{hilo.author_avatar}</span>
          )}
          <span className={s.hiloAutor}>{hilo.author_name}</span>
          {insignia && <span className={s.hiloInsignia}>{insignia.name}</span>}

          <span className={s.hiloSep} aria-hidden>·</span>
          <span className={s.hiloRespuestas}>
            <MessageSquare size={11} aria-hidden />
            {hilo.replies_count === 0
              ? "sin respuestas"
              : `${hilo.replies_count} ${hilo.replies_count === 1 ? "respuesta" : "respuestas"}`}
          </span>

          {hilo.last_activity_at && (
            <>
              <span className={s.hiloSep} aria-hidden>·</span>
              <span className={s.hiloCuando}>{haceCorto(hilo.last_activity_at)}</span>
            </>
          )}
        </span>
      </button>

      {isAdmin && onBorrar && (
        <button
          type="button"
          className={s.hiloBorrar}
          onClick={() => onBorrar(hilo)}
          aria-label={`Borrar la conversación «${hilo.title}»`}
          title="Borrar conversación"
        >
          <Trash2 size={13} aria-hidden />
        </button>
      )}

      {/* De qué espacio viene. Solo cuando la lista cruza varios: dentro de un
          espacio, decirlo en cada fila sería repetirlo veinte veces. */}
      {espacio && onAbrirEspacio && (
        <button
          type="button"
          className={s.hiloEspacio}
          onClick={() => onAbrirEspacio(espacio.slug)}
        >
          {espacio.name}
        </button>
      )}
    </article>
  )
}

function haceCorto(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return ""
  const min = Math.floor(ms / 60000)
  if (min < 1) return "activo ahora"
  if (min < 60) return `activo hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `activo hace ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return "activo ayer"
  if (d < 30) return `activo hace ${d} días`
  const meses = Math.floor(d / 30)
  return meses === 1 ? "activo hace un mes" : `activo hace ${meses} meses`
}
