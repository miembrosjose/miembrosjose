// BANCO CENTRAL DE PREGUNTAS del camino.
//
// Fuente única de verdad para: (a) qué preguntas existen en cada categoría,
// (b) Mi Gran Bitácora (que muestra TODAS, respondidas y pendientes),
// (c) el progreso por categoría que usa el Revelador de Misión.
//
// Se deriva de los portales de integración (portals-data) + Portal de Ingreso
// + Misiones de Custodia (objetivos-data), para no duplicar textos.

import { INTEGRATION_PORTALS } from "./portals-data"
import { CUSTODIA } from "./objetivos-data"
import { entryId, readAnswer, type JournalCategory } from "./journal-store"

export type BankQuestion = {
  id: string
  category: JournalCategory
  source: string
  prompt: string
  originLabel: string
  originSeason: number
  order: number
}

// Etiquetas de las 6 secciones de Mi Gran Bitácora (sin "Mi Camino").
export const BANK_CATEGORIES: { id: JournalCategory; label: string; hint: string }[] = [
  { id: "historia", label: "Mi Historia Personal", hint: "Heridas, infancia, no pertenencia, cuerpo, voz, propósito." },
  { id: "linaje", label: "Mi Linaje", hint: "Creencias heredadas, patrones familiares, silencios." },
  { id: "territorio", label: "Mi Territorio", hint: "Historia del lugar, heridas colectivas, memoria ancestral." },
  { id: "acciones", label: "Acciones Alquímicas", hint: "Cartas, actos simbólicos, reparación." },
  { id: "misiones", label: "Mis Misiones", hint: "Custodia, territorio, nodos, irradiación." },
  { id: "revelaciones", label: "Mis Revelaciones", hint: "Lecturas del Revelador de Misión." },
]

const PORTAL_LABEL: Record<string, { label: string; season: number }> = {
  ingreso: { label: "Portal de Ingreso", season: 0 },
  t1_compromiso: { label: "Temporada 1 · Portal del Compromiso", season: 1 },
  t2_desprogramacion: { label: "Temporada 2 · Portal de la Desprogramación Cósmica", season: 2 },
  t3_dignidad: { label: "Temporada 3 · Portal de la Memoria y la Dignidad", season: 3 },
  t4_alquimia_solar: { label: "Temporada 4 · Portal de la Alquimia Solar", season: 4 },
}

const INGRESO_QUESTIONS = [
  "¿Por qué siento que llegué a este camino?",
  "¿Qué busco realmente al entrar en Los 144.000?",
  "¿Estoy dispuesto a recibir información sin perder el discernimiento?",
]

function build(): BankQuestion[] {
  const out: BankQuestion[] = []
  let order = 0
  const push = (category: JournalCategory, source: string, prompt: string, originLabel: string, originSeason: number) => {
    out.push({ id: entryId(source, prompt), category, source, prompt, originLabel, originSeason, order: order++ })
  }

  // Portal de Ingreso → Historia personal
  for (const q of INGRESO_QUESTIONS) push("historia", "ingreso", q, "Portal de Ingreso", 0)

  // Portales de integración (T1–T4): espejos + acciones alquímicas
  for (const p of INTEGRATION_PORTALS) {
    const meta = PORTAL_LABEL[p.source] || { label: p.name, season: p.nextSeason - 1 }
    for (const q of p.espejoPersonal) push("historia", `${p.source}_personal`, q, meta.label, meta.season)
    for (const q of p.espejoLinaje) push("linaje", `${p.source}_linaje`, q, meta.label, meta.season)
    for (const q of p.espejoTerritorio ?? []) push("territorio", `${p.source}_territorio`, q, meta.label, meta.season)
    for (const a of p.acciones) {
      for (const f of a.fields ?? []) push("acciones", `${p.source}_${a.key}`, f, `${meta.label} · ${a.name}`, meta.season)
    }
  }

  // Misiones de Custodia → Mis Misiones
  for (const m of CUSTODIA) {
    for (const f of m.fields) push("misiones", `custodia_${m.id}`, f, `Misión de Custodia · ${m.title}`, 5)
  }

  return out
}

export const QUESTION_BANK: BankQuestion[] = build()

export function bankByCategory(cat: JournalCategory): BankQuestion[] {
  return QUESTION_BANK.filter((q) => q.category === cat).sort((a, b) => a.order - b.order)
}

export type CategoryProgress = { answered: number; total: number; pct: number }

export function bankProgress(): Record<string, CategoryProgress> {
  const cats: JournalCategory[] = ["historia", "linaje", "territorio", "acciones", "misiones"]
  const out: Record<string, CategoryProgress> = {}
  for (const c of cats) {
    const qs = bankByCategory(c)
    const answered = qs.filter((q) => readAnswer(q.source, q.prompt).trim()).length
    out[c] = { answered, total: qs.length, pct: qs.length ? Math.round((answered / qs.length) * 100) : 0 }
  }
  return out
}

/** Total de preguntas respondidas del banco (para el umbral del Revelador). */
export function totalAnswered(): number {
  return QUESTION_BANK.filter((q) => readAnswer(q.source, q.prompt).trim()).length
}
