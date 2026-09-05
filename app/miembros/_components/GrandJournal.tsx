"use client"

// MI GRAN BITÁCORA — archivo vivo de transformación.
// Muestra TODAS las preguntas del camino (respondidas y PENDIENTES), agrupadas
// en 6 secciones y por origen (temporada / portal), para que la persona pueda
// volver y completar antes de usar el Revelador de Misión.
// Privado por defecto; nada se comparte al foro sin decisión.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { X, BookOpen, Check, Trash2, Lock } from "lucide-react"
import {
  type JournalCategory, type JournalEntry,
  entriesByCategory, upsertAnswer, readAnswer, deleteEntry,
  migrateLegacyJournal, JOURNAL_CHANGED_EVENT,
} from "../_lib/journal-store"
import { BANK_CATEGORIES, bankByCategory, type BankQuestion } from "../_lib/question-bank"
import { SEALS, getUnlockedSeals, SEALS_CHANGED_EVENT } from "../_lib/seals"
import { JournalPdfExportButton } from "./JournalPdfExportButton"
import { consumeJournalTab } from "../_lib/journal-registry"

export function GrandJournal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<JournalCategory>("historia")
  const [rev, setRev] = useState(0)
  const refresh = useCallback(() => setRev((n) => n + 1), [])
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    migrateLegacyJournal()
    const target = consumeJournalTab()
    if (target && BANK_CATEGORIES.some((c) => c.id === target)) setTab(target as JournalCategory)
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

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }) }, [tab])

  const unlockedSeals = useMemo(() => (open ? new Set(getUnlockedSeals().map((s) => s.id)) : new Set<string>()), [open, rev])

  const bankQs = useMemo(() => (open ? bankByCategory(tab) : []), [open, tab, rev])
  const extras = useMemo(() => {
    if (!open) return []
    const ids = new Set(bankQs.map((q) => q.id))
    return entriesByCategory(tab).filter((e) => !ids.has(e.id))
  }, [open, tab, rev, bankQs])

  // Preguntas del banco agrupadas por origen (temporada/portal).
  const groups = useMemo(() => {
    const map = new Map<string, BankQuestion[]>()
    for (const q of bankQs) {
      const arr = map.get(q.originLabel) || []
      arr.push(q); map.set(q.originLabel, arr)
    }
    return Array.from(map.entries())
  }, [bankQs])

  // Conteo respondidas por pestaña.
  const tabCount = useCallback((cat: JournalCategory) => {
    const qs = bankByCategory(cat)
    const answered = qs.filter((q) => readAnswer(q.source, q.prompt).trim()).length
    const extraCount = entriesByCategory(cat).filter((e) => !qs.some((q) => q.id === e.id)).length
    return { answered: answered + (cat === "revelaciones" ? extraCount : 0), total: qs.length }
  }, [])

  const activeCat = BANK_CATEGORIES.find((c) => c.id === tab)
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-6"
      style={{ background: "rgba(4,5,12,0.88)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex max-h-[95vh] w-[min(880px,97vw)] flex-col overflow-hidden"
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
            <div className="flex items-center gap-2">
              <JournalPdfExportButton
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] [font-family:var(--font-mono)] transition-colors"
                style={{ border: "1px solid rgba(217,184,102,0.5)", background: "linear-gradient(135deg,rgba(230,207,149,0.18),rgba(217,184,102,0.1))", color: "#e6cf95" }}
              />
              <button type="button" onClick={onClose} aria-label="Cerrar"
                className="rounded-full p-2 text-[#a8a8c0] transition-colors hover:bg-[#251f30] hover:text-[#F3F6FA]">
                <X size={20} />
              </button>
            </div>
          </div>
          <JournalPdfExportButton
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] [font-family:var(--font-mono)] transition-colors sm:hidden"
            style={{ border: "1px solid rgba(217,184,102,0.5)", background: "linear-gradient(135deg,rgba(230,207,149,0.18),rgba(217,184,102,0.1))", color: "#e6cf95" }}
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SEALS.map((s) => {
              const on = unlockedSeals.has(s.id)
              return (
                <span key={s.id} title={`${s.name} — ${on ? "desbloqueado" : s.condition}`}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] [font-family:var(--font-mono)]"
                  style={{ border: `1px solid ${on ? "rgba(217,184,102,0.6)" : "rgba(120,120,140,0.28)"}`, background: on ? "rgba(217,184,102,0.12)" : "transparent", color: on ? "#e6cf95" : "#5a5f80" }}>
                  <span aria-hidden style={{ opacity: on ? 1 : 0.5 }}>{s.glyph}</span>
                </span>
              )
            })}
          </div>
        </div>

        {/* Tabs (6 secciones) */}
        <div className="flex flex-wrap gap-1.5 border-b border-[rgba(167,139,202,0.15)] px-3 py-2.5 sm:px-4">
          {BANK_CATEGORIES.map((c) => {
            const { answered, total } = tabCount(c.id)
            return (
              <button key={c.id} type="button" onClick={() => setTab(c.id)}
                className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-colors [font-family:var(--font-mono)] ${tab === c.id ? "text-[#050510]" : "text-[#a8a8c0] hover:text-[#F3F6FA]"}`}
                style={tab === c.id ? { background: "linear-gradient(135deg,#e6cf95,#c9a86b)", borderRadius: 999 } : { borderRadius: 999 }}>
                {c.label}{total > 0 ? ` · ${answered}/${total}` : answered > 0 ? ` · ${answered}` : ""}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {activeCat && (
            <p className="mb-4 text-[0.78rem] leading-relaxed text-[#8b90b4] [font-family:var(--font-geist-sans)]">{activeCat.hint}</p>
          )}

          {groups.length === 0 && extras.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#8b90b4] [font-family:var(--font-geist-sans)]">
              Aún no hay registros en esta sección. A medida que avanzas en el camino, tus respuestas aparecerán aquí como parte de tu archivo personal.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {groups.map(([origin, items]) => (
                <div key={origin}>
                  <div className="mb-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[#a78bca] [font-family:var(--font-mono)]">{origin}</div>
                  <div className="flex flex-col gap-3">
                    {items.map((q) => <BankQuestionCard key={q.id} q={q} />)}
                  </div>
                </div>
              ))}
              {extras.length > 0 && (
                <div>
                  <div className="mb-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[#a78bca] [font-family:var(--font-mono)]">
                    {tab === "revelaciones" ? "Revelaciones guardadas" : "Otros registros"}
                  </div>
                  <div className="flex flex-col gap-3">
                    {extras.map((e) => <StoredCard key={e.id} entry={e} />)}
                  </div>
                </div>
              )}
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

// Card de una pregunta del banco (respondida o pendiente).
function BankQuestionCard({ q }: { q: BankQuestion }) {
  const [value, setValue] = useState(() => readAnswer(q.source, q.prompt))
  const [saved, setSaved] = useState(true)
  const dirty = useRef(false)

  useEffect(() => { setValue(readAnswer(q.source, q.prompt)); setSaved(true); dirty.current = false }, [q.id])

  const persist = useCallback(() => {
    upsertAnswer({ category: q.category, source: q.source, sourceLabel: q.originLabel, prompt: q.prompt, answer: value, isPrivate: true })
    setSaved(true)
  }, [q, value])

  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(persist, 700)
    return () => clearTimeout(t)
  }, [value, persist])

  const completed = value.trim().length > 0

  return (
    <div style={{ border: "1px solid rgba(167,139,202,0.18)", borderRadius: 12, background: "rgba(10,11,26,0.5)", padding: "0.8rem 0.9rem" }}>
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="text-[0.9rem] font-medium leading-snug text-[#eef1fb] [font-family:var(--font-geist-sans)]">{q.prompt}</div>
        <span className="flex-shrink-0 text-[0.54rem] uppercase tracking-[0.14em] [font-family:var(--font-mono)]"
          style={{ color: completed ? "#7ee0a8" : "#c99a6b" }}>
          {completed ? <span className="inline-flex items-center gap-1"><Check size={10} /> Completado</span> : "Pendiente"}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false); dirty.current = true }}
        className="w-full resize-y bg-transparent text-[0.92rem] leading-relaxed text-[#e6e9f7] outline-none placeholder:text-[#5a5f80] [font-family:var(--font-geist-sans)]"
        style={{ minHeight: 54, border: "1px solid rgba(167,139,202,0.15)", borderRadius: 8, padding: "0.5rem 0.65rem" }}
        placeholder="Escribe aquí… (privado, solo en tu bitácora)"
      />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[0.54rem] uppercase tracking-[0.12em] text-[#6a6f92] [font-family:var(--font-mono)]"><Lock size={10} /> Privada</span>
        <button type="button" onClick={persist} disabled={saved}
          className="rounded-md px-3 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.14em] [font-family:var(--font-mono)] transition-colors disabled:opacity-40"
          style={{ border: "1px solid rgba(217,184,102,0.45)", color: "#e6cf95" }}>
          {saved ? "Guardado" : "Guardar respuesta"}
        </button>
      </div>
    </div>
  )
}

// Card de un registro guardado que NO está en el banco (revelaciones, etc.).
function StoredCard({ entry }: { entry: JournalEntry }) {
  const [value, setValue] = useState(entry.answer)
  const [saved, setSaved] = useState(true)
  const dirty = useRef(false)
  useEffect(() => { setValue(entry.answer); setSaved(true); dirty.current = false }, [entry.id])
  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(() => {
      upsertAnswer({ category: entry.category, source: entry.source, sourceLabel: entry.sourceLabel, prompt: entry.prompt, answer: value, isPrivate: entry.private })
      setSaved(true)
    }, 700)
    return () => clearTimeout(t)
  }, [value, entry])
  const fecha = new Date(entry.updatedAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })
  return (
    <div style={{ border: "1px solid rgba(167,139,202,0.18)", borderRadius: 12, background: "rgba(10,11,26,0.5)", padding: "0.8rem 0.9rem" }}>
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="text-[0.9rem] font-medium leading-snug text-[#eef1fb] [font-family:var(--font-geist-sans)]">{entry.prompt}</div>
        <span className="flex-shrink-0 text-[0.54rem] uppercase tracking-[0.14em] [font-family:var(--font-mono)]" style={{ color: saved ? "#7ee0a8" : "#c99a6b" }}>
          {saved ? "Guardado" : "Guardando…"}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false); dirty.current = true }}
        className="w-full resize-y bg-transparent text-[0.92rem] leading-relaxed text-[#e6e9f7] outline-none placeholder:text-[#5a5f80] [font-family:var(--font-geist-sans)]"
        style={{ minHeight: 54, border: "1px solid rgba(167,139,202,0.15)", borderRadius: 8, padding: "0.5rem 0.65rem" }}
        placeholder="Escribe o edita…"
      />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[0.54rem] uppercase tracking-[0.12em] text-[#6a6f92] [font-family:var(--font-mono)]">{fecha}</span>
        <button type="button" onClick={() => { if (confirm("¿Borrar este registro? No se puede deshacer.")) deleteEntry(entry.id) }}
          aria-label="Borrar registro" className="rounded-full p-1.5 text-[#6a6f92] transition-colors hover:bg-[#2a1f24] hover:text-[#e88]">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
