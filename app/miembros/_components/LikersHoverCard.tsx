"use client"

// Popover que aparece ao passar o mouse sobre um botão de like —
// lista os users que curtiram (max 50). Fetch lazy: só dispara após
// hover de 400ms, evitando carga desnecessária em hover acidental.

import { useEffect, useRef, useState } from "react"
import { api } from "../_lib/api"
import { useView } from "../_lib/view-context"
import { buildAvatarLetters } from "../_lib/format"
import styles from "./likers-hover.module.css"

const HOVER_DELAY_MS = 400

type Liker = {
  user_id: string
  name: string
  avatar_url: string | null
}

type Props = {
  endpoint: string // ex: "/api/forum/posts/123/likers"
  count: number
  children: React.ReactNode // o botão envolvido
}

export function LikersHoverCard({ endpoint, count, children }: Props) {
  const [show, setShow] = useState(false)
  const [likers, setLikers] = useState<Liker[] | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<number | null>(null)
  const fetchedRef = useRef(false)
  const { setView } = useView()

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  function handleEnter() {
    if (count === 0) return
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setShow(true)
      if (!fetchedRef.current && !loading) {
        fetchedRef.current = true
        setLoading(true)
        api<{ likers: Liker[] }>(endpoint)
          .then((data) => setLikers(data.likers || []))
          .catch(() => setLikers([]))
          .finally(() => setLoading(false))
      }
    }, HOVER_DELAY_MS)
  }

  function handleLeave() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setShow(false)
  }

  return (
    <span
      className={styles.wrap}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {show && count > 0 && (
        <div className={`${styles.popover} ${styles.show}`} role="tooltip">
          <div className={styles.frame}>
            <div className={styles.header}>
              {count} {count === 1 ? "Le gusta" : "Les gusta"}
            </div>
            {loading && <div className={styles.loading}>Cargando...</div>}
            {!loading && likers && likers.length === 0 && (
              <div className={styles.empty}>Sin likes aún</div>
            )}
            {!loading &&
              likers?.map((u) => (
                <a
                  key={u.user_id}
                  href={`/miembros/u/${u.user_id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    setView("user", null, { userId: u.user_id })
                  }}
                  className={styles.row}
                >
                  <span className={styles.avatar}>
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar_url} alt="" loading="lazy" />
                    ) : (
                      buildAvatarLetters(u.name)
                    )}
                  </span>
                  <span className={styles.name}>{u.name}</span>
                </a>
              ))}
          </div>
        </div>
      )}
    </span>
  )
}
