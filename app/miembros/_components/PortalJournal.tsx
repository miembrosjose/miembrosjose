"use client"

// Bitácora del camino iniciático. Editor simple con autoguardado local
// (por dispositivo) — usado por el Portal de Ingreso, los Portales de
// Integración y el Portal de Objetivos (Temporada 5).

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import styles from "./season5.module.css"

export type JournalDef = { key: string; title: string; sub: string; template?: string }

export function PortalJournal({ def, onClose }: { def: JournalDef; onClose: () => void }) {
  const storageKey = `los144k_bitacora_${def.key}`
  const [value, setValue] = useState("")
  const [saved, setSaved] = useState(true)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let initial = ""
    try { initial = localStorage.getItem(storageKey) ?? "" } catch { /* modo privado */ }
    if (!initial && def.template) initial = def.template
    setValue(initial)
    setSaved(true)
    setTimeout(() => areaRef.current?.focus(), 60)
  }, [storageKey, def.template])

  // Autosave con debounce
  useEffect(() => {
    if (saved) return
    const t = setTimeout(() => {
      try { localStorage.setItem(storageKey, value) } catch { /* ignora */ }
      setSaved(true)
    }, 600)
    return () => clearTimeout(t)
  }, [value, saved, storageKey])

  return (
    <div className={styles.journalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.journalPanel} role="dialog" aria-label={def.title}>
        <div className={styles.journalHead}>
          <div>
            <h3 className={styles.journalTitle}>{def.title}</h3>
            <p className={styles.journalSub}>{def.sub}</p>
          </div>
          <button type="button" className={styles.close} style={{ position: "static", width: 38, height: 38 }} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <textarea
          ref={areaRef}
          className={styles.journalArea}
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false) }}
          placeholder="Escribe aquí con calma… comprensiones, sueños, señales, resistencias, emociones y compromisos."
        />
        <div className={styles.journalFoot}>
          <span className={styles.journalStatus}>
            {saved ? "✓ Guardado en este dispositivo" : "Guardando…"}
          </span>
          <button type="button" className={styles.journalClose} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
