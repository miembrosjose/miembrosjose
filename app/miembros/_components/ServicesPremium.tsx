"use client"

// Servicios Premium — 2 cards estáticos do area-prototipo.html linhas 6591-6636.
//
// Card 1 (gold): "¿Quieres un área de miembros igual a esta?" → wa.me link
// Card 2 (image): "Embudo gamificado [BRAND_NAME]" → /producto/embudo (view interna)

import { ArrowUpRight } from "lucide-react"
import { useView } from "../_lib/view-context"
import { cdnImage } from "@/lib/cdn-image"
import styles from "./services.module.css"

const WA_PRESUPUESTO_URL =
  "https://wa.me/5547996812781?text=Hola,%20soy%20miembro%20de%20la%20comunidad%20y%20quiero%20un%20presupuesto%20de%20un%20%C3%A1rea%20de%20miembros%20cinematogr%C3%A1fica%20y%20gamificada"

// Original PNG: 1.5 MB (resolução muito alta pra um thumb).
// Com Cloudflare Image Resizing 540w + AVIF: ~18 KB (-99%).
const EMBUDO_THUMB = cdnImage("Design sem nome - 2026-03-28T015000.882.png", { width: 540 })

export function ServicesPremium() {
  const { setView } = useView()

  return (
    <div className={styles.grid}>
      {/* CARD 1 — Área de miembros igual a esta (gold CTA) */}
      <a href={WA_PRESUPUESTO_URL} target="_blank" rel="noopener noreferrer" className={styles.card}>
        <div className={styles.icon}>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" strokeWidth="1" opacity="0.3" />
            <rect x="22" y="38" width="56" height="38" rx="2" fill="none" stroke="#c9a961" strokeWidth="1.8" />
            <polygon
              points="22,28 78,28 74,38 26,38"
              fill="none"
              stroke="#c9a961"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <line x1="32" y1="28" x2="28" y2="38" stroke="#c9a961" strokeWidth="1" />
            <line x1="42" y1="28" x2="38" y2="38" stroke="#c9a961" strokeWidth="1" />
            <line x1="52" y1="28" x2="48" y2="38" stroke="#c9a961" strokeWidth="1" />
            <line x1="62" y1="28" x2="58" y2="38" stroke="#c9a961" strokeWidth="1" />
            <line x1="72" y1="28" x2="68" y2="38" stroke="#c9a961" strokeWidth="1" />
            <polygon points="44,50 44,66 60,58" fill="#c9a961" />
            <path
              d="M 82 18 L 84 14 L 86 18 L 90 20 L 86 22 L 84 26 L 82 22 L 78 20 Z"
              fill="#c9a961"
              opacity="0.85"
            />
          </svg>
        </div>
        <div className={styles.info}>
          <h4 className={styles.title}>¿Quieres un área de miembros igual a esta?</h4>
          <span className={`${styles.cta} ${styles.ctaGold}`}>
            Hablar por WhatsApp <ArrowUpRight size={14} />
          </span>
        </div>
      </a>

      {/* CARD 2 — Embudo Gamificado [BRAND_NAME] (view interna ViewProducto) */}
      <a
        href="/miembros/producto/embudo"
        onClick={(e) => {
          e.preventDefault()
          setView("producto", null, { slug: "embudo" })
        }}
        className={`${styles.card} ${styles.cardImage}`}
      >
        <div className={`${styles.icon} ${styles.iconImage}`}>
          <img src={EMBUDO_THUMB} alt="Embudo [BRAND_NAME]" loading="lazy" />
        </div>
        <div className={styles.info}>
          <h4 className={styles.title}>Embudo gamificado [BRAND_NAME]</h4>
          <span className={styles.cta}>
            Ver Embudo <ArrowUpRight size={14} />
          </span>
        </div>
      </a>
    </div>
  )
}
