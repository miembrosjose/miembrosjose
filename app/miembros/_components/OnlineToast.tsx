"use client"

// Toast quando um membro fica online. Escuta evento custom "cf:user-online"
// disparado em _lib/online-presence.tsx (sync detecta user_id que não estava
// na lista anterior).
//
// Fila: se vários users entram em sequência, processa um por vez (3s cada).

import { useEffect, useRef, useState } from "react"
import { buildAvatarLetters } from "../_lib/format"
import type { OnlineMember } from "../_lib/online-presence"
import styles from "./online-toast.module.css"

const SHOW_MS = 3000
const EXIT_MS = 450
const GAP_MS = 200

export function OnlineToast() {
  const [current, setCurrent] = useState<OnlineMember | null>(null)
  const [visible, setVisible] = useState(false)
  const queueRef = useRef<OnlineMember[]>([])
  const processingRef = useRef(false)

  useEffect(() => {
    function processQueue() {
      if (queueRef.current.length === 0) {
        processingRef.current = false
        return
      }
      processingRef.current = true
      const next = queueRef.current.shift()!
      setCurrent(next)
      // Próximo tick: ativa transição
      requestAnimationFrame(() => {
        setVisible(true)
      })
      // Após SHOW_MS, slide-out
      setTimeout(() => {
        setVisible(false)
        // Após exit anim, remove e processa próximo
        setTimeout(() => {
          setCurrent(null)
          setTimeout(processQueue, GAP_MS)
        }, EXIT_MS)
      }, SHOW_MS)
    }

    function onUserOnline(e: Event) {
      const detail = (e as CustomEvent<OnlineMember>).detail
      if (!detail) return
      queueRef.current.push(detail)
      if (!processingRef.current) processQueue()
    }

    window.addEventListener("cf:user-online", onUserOnline)
    return () => window.removeEventListener("cf:user-online", onUserOnline)
  }, [])

  if (!current) return null

  const initials = buildAvatarLetters(current.full_name)

  return (
    <div className={`${styles.toast} ${visible ? styles.visible : ""}`}>
      <div className={styles.avatar}>
        {current.avatar_url ? (
          <img src={current.avatar_url} alt="" className={styles.avatarImg} />
        ) : (
          <span className={styles.avatarInitials}>{initials}</span>
        )}
      </div>
      <div className={styles.text}>
        <span className={styles.name}>{current.full_name}</span>
        <span className={styles.label}>● Se conectó</span>
      </div>
    </div>
  )
}
