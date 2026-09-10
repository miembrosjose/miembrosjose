"use client"

// TRANSMISIONES — Archivo vivo de transmisiones de José / Los 144.000.
//
// Reemplaza el antiguo "Feed del Creador". Es un archivo editorial (no un blog
// ni un muro social): hero con presencia de José al fondo, buscador en vivo
// (server-side, con sinónimos), navegación por categorías (data-driven),
// destacadas y archivo. La lectura de cada transmisión ocurre en una ruta real
// (/miembros/feed/[slug]), no en un modal.
//
// NO genera contenido: solo muestra/organiza/busca lo que José cargue vía el
// importador. Sin IA, sin botones de "generar".

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { api } from "../_lib/api"
import styles from "./transmisiones.module.css"

type Category = { slug: string; name: string; description?: string | null; sort_order?: number }
type Transmission = {
  slug: string
  title: string
  excerpt: string | null
  category_slug: string | null
  tags: string[] | null
  author_name: string | null
  featured: boolean
  featured_order: number | null
  reading_time: number | null
  image_url: string | null
  related_season: number | null
  related_episode_id: string | null
  published_at: string
}

const ALL = "todos"
const COLLAPSED_CHIPS = 6 // categorías visibles antes de "Más" (además de TODOS)

// Lee el estado inicial desde la URL (?q=&category=) para deep-links.
function readUrlState(): { q: string; category: string } {
  if (typeof window === "undefined") return { q: "", category: ALL }
  const p = new URLSearchParams(window.location.search)
  return { q: p.get("q") || "", category: p.get("category") || ALL }
}

export function Transmisiones() {
  const initial = readUrlState()
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState(initial.category)
  const [q, setQ] = useState(initial.q)
  const [items, setItems] = useState<Transmission[]>([])
  const [featured, setFeatured] = useState<Transmission[]>([])
  const [loading, setLoading] = useState(true)
  const [chipsExpanded, setChipsExpanded] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDefaultView = !q.trim() && (category === ALL || !category)

  const catName = useCallback(
    (slug: string | null) => categories.find((c) => c.slug === slug)?.name || "",
    [categories],
  )

  // Categorías + destacadas (una sola vez).
  useEffect(() => {
    api<{ categories: Category[] }>("/api/transmission-categories")
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]))
    api<{ transmissions: Transmission[] }>("/api/transmissions?featured=1&limit=3")
      .then((d) => setFeatured(d.transmissions || []))
      .catch(() => setFeatured([]))
  }, [])

  // Sincroniza la URL (?q=&category=) sin recargar.
  useEffect(() => {
    if (typeof window === "undefined") return
    const p = new URLSearchParams(window.location.search)
    if (q.trim()) p.set("q", q.trim()); else p.delete("q")
    if (category && category !== ALL) p.set("category", category); else p.delete("category")
    const qs = p.toString()
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`
    window.history.replaceState(null, "", url)
  }, [q, category])

  // Búsqueda/filtrado en vivo (debounce 250ms) — server-side.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      const p = new URLSearchParams()
      if (q.trim()) p.set("q", q.trim())
      if (category && category !== ALL) p.set("category", category)
      p.set("limit", "60")
      api<{ transmissions: Transmission[] }>(`/api/transmissions?${p.toString()}`)
        .then((d) => setItems(d.transmissions || []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q, category])

  const visibleChips = useMemo(() => {
    const base = [{ slug: ALL, name: "Todos" } as Category, ...categories]
    if (chipsExpanded) return base
    return base.slice(0, COLLAPSED_CHIPS + 1)
  }, [categories, chipsExpanded])

  const hasMoreChips = categories.length > COLLAPSED_CHIPS

  const featuredMain = featured[0]
  const featuredRest = featured.slice(1, 3)

  function clearAll() {
    setQ("")
    setCategory(ALL)
    setChipsExpanded(false)
  }

  return (
    <div className={styles.wrap}>
      {/* ── HERO con presencia de José al fondo ── */}
      <header className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>LOS 144.000 · ARCHIVO VIVO</p>
          <h1 className={styles.heroTitle}>TRANSMISIONES</h1>
          <p className={styles.heroSubtitle}>
            Comprensiones, revelaciones y enseñanzas compartidas por José a través de años
            de búsqueda, experiencia y contacto. Un archivo vivo para explorar las grandes
            preguntas de nuestra existencia.
          </p>

          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Buscar una transmisión, pregunta o concepto…"
              aria-label="Buscar una transmisión, pregunta o concepto"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button type="button" className={styles.searchClear} onClick={() => setQ("")} aria-label="Limpiar búsqueda">
                ×
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Categorías (data-driven) ── */}
      {categories.length > 0 && (
        <nav className={styles.chipsRow} aria-label="Categorías de transmisiones">
          {visibleChips.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={`${styles.chip} ${category === c.slug ? styles.chipActive : ""}`}
              aria-pressed={category === c.slug}
              onClick={() => setCategory(c.slug)}
            >
              {c.name}
            </button>
          ))}
          {hasMoreChips && (
            <button
              type="button"
              className={styles.chipMore}
              onClick={() => setChipsExpanded((v) => !v)}
              aria-expanded={chipsExpanded}
            >
              {chipsExpanded ? "Menos" : "Más"}
            </button>
          )}
        </nav>
      )}

      {/* ── Destacadas (solo en la vista por defecto) ── */}
      {isDefaultView && featuredMain && (
        <section className={styles.featuredSection} aria-labelledby="tx-featured-title">
          <h2 id="tx-featured-title" className={styles.blockTitle}>TRANSMISIONES DESTACADAS</h2>
          <div className={styles.featuredGrid}>
            <TxCard t={featuredMain} catName={catName} variant="hero" />
            {featuredRest.length > 0 && (
              <div className={styles.featuredSide}>
                {featuredRest.map((t) => (
                  <TxCard key={t.slug} t={t} catName={catName} variant="side" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Archivo / resultados ── */}
      <section className={styles.archiveSection} aria-labelledby="tx-archive-title">
        <h2 id="tx-archive-title" className={styles.blockTitle}>
          {isDefaultView ? "ARCHIVO" : q.trim() ? "RESULTADOS" : catName(category) || "ARCHIVO"}
        </h2>

        {loading ? (
          <div className={styles.stateMsg}>Buscando en el archivo…</div>
        ) : items.length === 0 ? (
          <EmptyState hasQuery={!!q.trim()} categories={categories} onClear={clearAll} onPick={setCategory} />
        ) : (
          <div className={styles.archiveGrid}>
            {items.map((t) => (
              <TxCard key={t.slug} t={t} catName={catName} variant="grid" />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ── Tarjeta de transmisión ──
function TxCard({
  t,
  catName,
  variant,
}: {
  t: Transmission
  catName: (slug: string | null) => string
  variant: "hero" | "side" | "grid"
}) {
  const minutes = t.reading_time || null
  return (
    <a href={`/miembros/feed/${t.slug}`} className={`${styles.card} ${styles[`card_${variant}`]}`}>
      <div className={styles.cardCat}>{catName(t.category_slug)}</div>
      <h3 className={styles.cardTitle}>{t.title}</h3>
      {t.excerpt && <p className={styles.cardExcerpt}>{t.excerpt}</p>}
      <div className={styles.cardMeta}>
        <span>{t.author_name || "José"} · Los 144.000</span>
        {minutes && (
          <>
            <span className={styles.metaDot}>·</span>
            <span>{minutes} min de lectura</span>
          </>
        )}
      </div>
      {t.related_season && (
        <div className={styles.cardSeason}>Relacionado con Temporada {t.related_season}</div>
      )}
      <span className={styles.cardCta}>Leer transmisión →</span>
    </a>
  )
}

// ── Estado vacío ──
function EmptyState({
  hasQuery,
  categories,
  onClear,
  onPick,
}: {
  hasQuery: boolean
  categories: Category[]
  onClear: () => void
  onPick: (slug: string) => void
}) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyMsg}>
        {hasQuery
          ? "No encontramos una transmisión con esas palabras."
          : "Aún no hay transmisiones publicadas en esta categoría."}
      </p>
      <button type="button" className={styles.emptyBtn} onClick={onClear}>
        Explorar todas las transmisiones
      </button>
      {categories.length > 0 && (
        <div className={styles.emptySuggest}>
          {categories.slice(0, 6).map((c) => (
            <button key={c.slug} type="button" className={styles.emptyChip} onClick={() => onPick(c.slug)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
