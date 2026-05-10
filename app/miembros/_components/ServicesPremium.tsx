"use client"

// Servicios Premium — card estático que abre view interna /producto/embudo.

import { ArrowUpRight } from "lucide-react"
import { useView } from "../_lib/view-context"
import { cdnImage } from "@/lib/cdn-image"
import styles from "./services.module.css"

const EMBUDO_THUMB = cdnImage("embudo-thumb.png", { width: 540 })

export function ServicesPremium() {
  const { setView } = useView()

  return (
    <div className={styles.grid}>
      <a
        href="/miembros/producto/embudo"
        onClick={(e) => {
          e.preventDefault()
          setView("producto", null, { slug: "embudo" })
        }}
        className={`${styles.card} ${styles.cardImage}`}
      >
        <div className={`${styles.icon} ${styles.iconImage}`}>
          <img src={EMBUDO_THUMB} alt="Servicio Premium" loading="lazy" />
        </div>
        <div className={styles.info}>
          <h4 className={styles.title}>Servicio Premium</h4>
          <span className={styles.cta}>
            Ver más <ArrowUpRight size={14} />
          </span>
        </div>
      </a>
    </div>
  )
}
