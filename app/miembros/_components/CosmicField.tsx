"use client"

// Fondo cósmico compartido por los portales del camino iniciático:
// estrellas + red planetaria (nodos + líneas) + aro de geometría sagrada.

import styles from "./season5.module.css"

export function CosmicField() {
  return (
    <div className={styles.field} aria-hidden>
      <div className={styles.starsFar} />
      <div className={styles.stars} />

      {/* Red planetaria (nodos + líneas) */}
      <svg className={styles.network} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="s5line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d9b866" stopOpacity="0.0" />
            <stop offset="50%" stopColor="#a78bca" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#6f9bf0" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {NET_LINES.map((l, i) => (
          <line key={i} className={styles.netLine} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} style={{ animationDelay: `${(i % 6) * -3}s` }} />
        ))}
        {NET_NODES.map((n, i) => (
          <circle key={i} className={styles.netNode} cx={n[0]} cy={n[1]} r={2} style={{ animationDelay: `${(i % 5) * -0.8}s` }} />
        ))}
      </svg>

      {/* Geometría sagrada tras el hero */}
      <svg className={styles.sacredRing} viewBox="0 0 400 400" fill="none">
        <circle cx="200" cy="200" r="150" stroke="#a78bca" strokeOpacity="0.5" strokeWidth="0.6" />
        <circle cx="200" cy="200" r="110" stroke="#d9b866" strokeOpacity="0.4" strokeWidth="0.6" />
        <circle cx="200" cy="200" r="188" stroke="#6f9bf0" strokeOpacity="0.3" strokeWidth="0.6" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2
          const x = 200 + Math.cos(a) * 150
          const y = 200 + Math.sin(a) * 150
          return <circle key={i} cx={x} cy={y} r="2.4" fill="#e6cf95" fillOpacity="0.7" />
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2
          const x = 200 + Math.cos(a) * 110
          const y = 200 + Math.sin(a) * 110
          return <line key={i} x1="200" y1="200" x2={x} y2={y} stroke="#a78bca" strokeOpacity="0.25" strokeWidth="0.5" />
        })}
      </svg>
    </div>
  )
}

// Coordenadas de la red (viewBox 0..1000). Nodos + líneas que los conectan.
const NET_NODES: [number, number][] = [
  [120, 160], [300, 90], [480, 200], [700, 120], [860, 260],
  [180, 420], [420, 380], [640, 460], [820, 520], [90, 640],
  [340, 640], [560, 700], [760, 720], [500, 520], [920, 700],
  [260, 860], [520, 900], [720, 880], [140, 300], [880, 420],
]
const NET_LINES: [number, number, number, number][] = [
  [120, 160, 300, 90], [300, 90, 480, 200], [480, 200, 700, 120], [700, 120, 860, 260],
  [120, 160, 180, 420], [480, 200, 420, 380], [420, 380, 640, 460], [640, 460, 820, 520],
  [180, 420, 90, 640], [420, 380, 340, 640], [640, 460, 560, 700], [820, 520, 760, 720],
  [500, 520, 420, 380], [500, 520, 560, 700], [340, 640, 260, 860], [560, 700, 520, 900],
  [760, 720, 720, 880], [860, 260, 880, 420], [880, 420, 920, 700], [140, 300, 300, 90],
]
