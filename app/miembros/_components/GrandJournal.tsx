"use client"

// MI GRAN BITÁCORA — archivo personal del camino.
// Agrega TODO lo escrito por el usuario en portales, integraciones y misiones
// (localStorage), organizado por pestañas. Privada por defecto: no se comparte
// al foro automáticamente. Cada entrada es editable y se autoguarda.

import { useEffect, useMemo, useRef, useState } from "react"
import { X, BookOpen, Check } from "lucide-react"
import {
  JOURNAL_ENTRIES, JOURNAL_TABS, type JournalTab,
  readJournalEntry, writeJournalEntry,
} from "../_lib/journal-registry"

export function GrandJournal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<JournalTab>("proceso")

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey) }
  }, [open, onClose])

  const entries = useMemo(
    () => JOURNAL_ENTRIES.filter((e) => e.tab === tab).sort((a, b) => a.order - b.order),
    [tab],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(4,5,12,0.86)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex max-h-[92vh] w-[min(760px,96vw)] flex-col overflow-hidden"
        style={{
          borderRadius: 20,
          border: "1px solid rgba(217,184,102,0.28)",
          background: "linear-gradient(160deg, rgba(18,20,44,0.98), rgba(8,9,20,0.98))",
          boxShadow: "0 40px 90px -20px rgba(0,0,0,0.9)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[rgba(167,139,202,0.15)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-[#c9a86b] [font-family:var(--font-mono)]">Archivo personal · privado</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-[#F3F6FA] [font-family:var(--font-cinzel)]">
              <BookOpen size={20} className="text-[#e6cf95]" /> Mi Gran Bitácora
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar"
            className="rounded-full p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-[#F3F6FA]">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-[rgba(167,139,202,0.15)] px-3 py-2 sm:px-4">
          {JOURNAL_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] transition-colors [font-family:var(--font-mono)] ${
                tab === t.id
                  ? "text-[#050510]"
                  : "text-[#a8a8c0] hover:text-[#F3F6FA]"
              }`}
              style={tab === t.id
                ? { background: "linear-gradient(135deg,#e6cf95,#c9a86b)", borderRadius: 999 }
                : { borderRadius: 999 }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {entries.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#8b90b4] [font-family:var(--font-geist-sans)]">
              Todavía no hay registros en esta sección. A medida que avances por el camino, tus respuestas aparecerán aquí.
            </p>
          ) : (
            entries.map((e) => <JournalEntryCard key={e.key} entryKey={e.key} title={e.title} stage={e.stage} />)
          )}
        </div>

        <div className="border-t border-[rgba(167,139,202,0.15)] px-5 py-3 text-center sm:px-6">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[#6a6f92] [font-family:var(--font-mono)]">
            Privada · se guarda en este dispositivo · no se comparte al foro
          </p>
        </div>
      </div>
    </div>
  )
}

function JournalEntryCard({ entryKey, title, stage }: { entryKey: string; title: string; stage: string }) {
  const [value, setValue] = useState("")
  const [saved, setSaved] = useState(true)
  const dirtyRef = useRef(false)

  useEffect(() => { setValue(readJournalEntry(entryKey)); setSaved(true); dirtyRef.current = false }, [entryKey])

  useEffect(() => {
    if (!dirtyRef.current) return
    const t = setTimeout(() => { writeJournalEntry(entryKey, value); setSaved(true) }, 600)
    return () => clearTimeout(t)
  }, [value, entryKey])

  return (
    <div style={{ border: "1px solid rgba(167,139,202,0.18)", borderRadius: 14, background: "rgba(10,11,26,0.5)", overflow: "hidden" }}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <div>
          <div className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-[#a78bca] [font-family:var(--font-mono)]">{stage}</div>
          <div className="text-sm font-bold text-[#F3F6FA] [font-family:var(--font-cinzel)]">{title}</div>
        </div>
        <span className="flex-shrink-0 text-[0.58rem] uppercase tracking-[0.16em] [font-family:var(--font-mono)]"
          style={{ color: saved ? "#7ee0a8" : "#c9a86b" }}>
          {value.trim() ? (saved ? <span className="inline-flex items-center gap-1"><Check size={11} /> Guardado</span> : "Guardando…") : "Sin registro"}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false); dirtyRef.current = true }}
        placeholder="Escribe o edita tu registro de esta etapa…"
        className="mt-2 w-full resize-y bg-transparent px-4 pb-4 text-[0.95rem] leading-relaxed text-[#eef1fb] outline-none placeholder:text-[#6a6f92] [font-family:var(--font-geist-sans)]"
        style={{ minHeight: value.trim() ? 120 : 64, border: "none" }}
      />
    </div>
  )
}
