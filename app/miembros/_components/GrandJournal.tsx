"use client"

// MI GRAN BITÁCORA — archivo vivo de transformación.
// Organiza en 7 secciones todo lo que la persona escribió en portales,
// integraciones, acciones y misiones (journal-store, localStorage).
// PRIVADO POR DEFECTO: nada se comparte al foro automáticamente. Cada entrada
// es editable, se puede marcar privada/compartible y borrar.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { X, BookOpen, Check, Trash2, Lock, Unlock } from "lucide-react"
import {
  JOURNAL_CATEGORIES, type JournalCategory, type JournalEntry,
  entriesByCategory, countByCategory, upsertAnswer, deleteEntry, setEntryPrivate,
  migrateLegacyJournal, JOURNAL_CHANGED_EVENT,
} from "../_lib/journal-store"
import { SEALS, getUnlockedSeals, SEALS_CHANGED_EVENT } from "../_lib/seals"

export function GrandJournal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<JournalCategory>("camino")
  const [rev, setRev] = useState(0) // fuerza recomputar listas al cambiar el store
  const refresh = useCallback(() => setRev((n) => n + 1), [])

  useEffect(() => {
    if (!open) return
    migrateLegacyJournal()
    refresh()
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    window.addEventListener(JOURNAL_CHANGED_EVENT, refresh)
    window.addEventListener(SEALS_CHANGED_EVENT, refresh)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(JOURNAL_CHANGED_EVENT, refresh)
      window.removeEventListener(SEALS_CHANGED_EVENT, refresh)
    }
  }, [open, onClose, refresh])

  const counts = useMemo(() => (open ? countByCategory() : null), [open, rev])
  const entries = useMemo(() => (open ? entriesByCategory(tab) : []), [open, tab, rev])
  const unlockedSeals = useMemo(() => (open ? new Set(getUnlockedSeals().map((s) => s.id)) : new Set<string>()), [open, rev])
  const activeCat = JOURNAL_CATEGORIES.find((c) => c.id === tab)

  // Agrupa por origen (portal/temporada) para que el archivo se lea como un camino.
  const groups = useMemo(() => {
    const map = new Map<string, JournalEntry[]>()
    for (const e of entries) {
      const arr = map.get(e.sourceLabel) || []
      arr.push(e)
      map.set(e.sourceLabel, arr)
    }
    return Array.from(map.entries())
  }, [entries])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-6"
      style={{ background: "rgba(4,5,12,0.88)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex max-h-[95vh] w-[min(860px,97vw)] flex-col overflow-hidden"
        style={{
          borderRadius: 20,
          border: "1px solid rgba(217,184,102,0.28)",
          background: "linear-gradient(160deg, rgba(18,20,44,0.98), rgba(8,9,20,0.98))",
          boxShadow: "0 40px 90px -20px rgba(0,0,0,0.9)",
        }}
      >
        {/* Header */}
        <div className="border-b border-[rgba(167,139,202,0.15)] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-[#c9a86b] [font-family:var(--font-mono)]">Archivo vivo · privado</p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-[#F3F6FA] [font-family:var(--font-cinzel)]">
                <BookOpen size={20} className="text-[#e6cf95]" /> Mi Gran Bitácora
              </h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar"
              className="rounded-full p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-[#F3F6FA]">
              <X size={20} />
            </button>
          </div>

          {/* Sellos iniciáticos */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SEALS.map((s) => {
              const on = unlockedSeals.has(s.id)
              return (
                <span
                  key={s.id}
                  title={`${s.name} — ${on ? "desbloqueado" : s.condition}`}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] [font-family:var(--font-mono)]"
                  style={{
                    border: `1px solid ${on ? "rgba(217,184,102,0.6)" : "rgba(120,120,140,0.28)"}`,
                    background: on ? "rgba(217,184,102,0.12)" : "transparent",
                    color: on ? "#e6cf95" : "#5a5f80",
                  }}
                >
                  <span aria-hidden style={{ opacity: on ? 1 : 0.5 }}>{s.glyph}</span>
                </span>
              )
            })}
          </div>
        </div>

        {/* Tabs (7 secciones) */}
        <div className="flex gap-1 overflow-x-auto border-b border-[rgba(167,139,202,0.15)] px-3 py-2 sm:px-4">
          {JOURNAL_CATEGORIES.map((c) => {
            const n = counts?.[c.id] ?? 0
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setTab(c.id)}
                className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-colors [font-family:var(--font-mono)] ${
                  tab === c.id ? "text-[#050510]" : "text-[#a8a8c0] hover:text-[#F3F6FA]"
                }`}
                style={tab === c.id
                  ? { background: "linear-gradient(135deg,#e6cf95,#c9a86b)", borderRadius: 999 }
                  : { borderRadius: 999 }}
              >
                {c.label}{n > 0 ? ` · ${n}` : ""}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {activeCat && (
            <p className="mb-3 text-[0.78rem] leading-relaxed text-[#8b90b4] [font-family:var(--font-geist-sans)]">{activeCat.hint}</p>
          )}

          {groups.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#8b90b4] [font-family:var(--font-geist-sans)]">
              Todavía no hay registros en esta sección. A medida que atravieses los portales del camino, tus respuestas aparecerán aquí.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {groups.map(([label, items]) => (
                <div key={label}>
                  <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[#a78bca] [font-family:var(--font-mono)]">{label}</div>
                  <div className="flex flex-col gap-2.5">
                    {items.map((e) => <EntryCard key={e.id} entry={e} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[rgba(167,139,202,0.15)] px-5 py-3 text-center sm:px-6">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[#6a6f92] [font-family:var(--font-mono)]">
            Privada por defecto · se guarda en este dispositivo · nada se comparte al foro sin tu decisión
          </p>
        </div>
      </div>
    </div>
  )
}

function EntryCard({ entry }: { entry: JournalEntry }) {
  const [value, setValue] = useState(entry.answer)
  const [saved, setSaved] = useState(true)
  const dirty = useRef(false)

  // Re-seed solo si cambia la entrada (no mientras se escribe).
  useEffect(() => { setValue(entry.answer); setSaved(true); dirty.current = false }, [entry.id])

  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(() => {
      upsertAnswer({
        category: entry.category, source: entry.source, sourceLabel: entry.sourceLabel,
        prompt: entry.prompt, answer: value, isPrivate: entry.private,
      })
      setSaved(true)
    }, 600)
    return () => clearTimeout(t)
  }, [value, entry])

  const fecha = new Date(entry.updatedAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div style={{ border: "1px solid rgba(167,139,202,0.18)", borderRadius: 12, background: "rgba(10,11,26,0.5)", padding: "0.7rem 0.85rem" }}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="text-[0.86rem] font-medium leading-snug text-[#eef1fb] [font-family:var(--font-geist-sans)]">{entry.prompt}</div>
        <span className="flex-shrink-0 text-[0.54rem] uppercase tracking-[0.14em] [font-family:var(--font-mono)]"
          style={{ color: saved ? "#7ee0a8" : "#c9a86b" }}>
          {saved ? <span className="inline-flex items-center gap-1"><Check size={10} /> Guardado</span> : "Guardando…"}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(ev) => { setValue(ev.target.value); setSaved(false); dirty.current = true }}
        className="w-full resize-y bg-transparent text-[0.92rem] leading-relaxed text-[#e6e9f7] outline-none placeholder:text-[#5a5f80] [font-family:var(--font-geist-sans)]"
        style={{ minHeight: 52 }}
        placeholder="Escribe o edita…"
      />
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-[0.56rem] uppercase tracking-[0.12em] text-[#6a6f92] [font-family:var(--font-mono)]">{fecha}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEntryPrivate(entry.id, !entry.private)}
            title={entry.private ? "Privada — solo tú la ves" : "Marcada como compartible"}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.54rem] uppercase tracking-[0.12em] [font-family:var(--font-mono)] transition-colors"
            style={{
              border: `1px solid ${entry.private ? "rgba(167,139,202,0.35)" : "rgba(126,224,168,0.5)"}`,
              color: entry.private ? "#a8a8c0" : "#7ee0a8",
            }}
          >
            {entry.private ? <><Lock size={10} /> Privada</> : <><Unlock size={10} /> Compartible</>}
          </button>
          <button
            type="button"
            onClick={() => { if (confirm("¿Borrar este registro? Esta acción no se puede deshacer.")) deleteEntry(entry.id) }}
            aria-label="Borrar registro"
            className="rounded-full p-1.5 text-[#6a6f92] transition-colors hover:bg-[#2a1f24] hover:text-[#e88]"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
