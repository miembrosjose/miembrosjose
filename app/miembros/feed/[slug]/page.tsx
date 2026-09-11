// Página de lectura de una transmisión — ruta REAL (no modal), gated por
// requireMiembrosAuth. Server component: consulta Supabase directamente (RLS
// solo devuelve publicadas / admin), renderiza el markdown de forma segura y
// muestra transmisiones relacionadas ("SEGUIR EXPLORANDO").

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requireMiembrosAuth } from "../../_lib/auth-server"
import { renderMarkdown, readingTimeMinutes } from "@/lib/markdown"
import { TransmisionEngagement } from "../../_components/TransmisionEngagement"
import styles from "./lectura.module.css"

export const dynamic = "force-dynamic"

type TxRow = {
  slug: string
  title: string
  excerpt: string | null
  body: string
  category_slug: string | null
  tags: string[] | null
  author_name: string | null
  reading_time: number | null
  related_post_slugs: string[] | null
  related_season: number | null
  status: string
}

type RelatedRow = {
  slug: string
  title: string
  excerpt: string | null
  category_slug: string | null
  reading_time: number | null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return { title: "Transmisión · Los 144000", robots: { index: false, follow: false }, alternates: { canonical: `/miembros/feed/${slug}` } }
}

export default async function TransmisionLectura({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { supabase } = await requireMiembrosAuth()

  const { data: tx } = await supabase
    .from("transmissions")
    .select(
      "slug, title, excerpt, body, category_slug, tags, author_name, reading_time, related_post_slugs, related_season, status",
    )
    .eq("slug", slug)
    .maybeSingle<TxRow>()

  if (!tx) notFound()

  // Nombre de la categoría (para el eyebrow).
  let categoryName: string | null = null
  if (tx.category_slug) {
    const { data: cat } = await supabase
      .from("transmission_categories")
      .select("name")
      .eq("slug", tx.category_slug)
      .maybeSingle<{ name: string }>()
    categoryName = cat?.name || null
  }

  // Relacionadas: explícitas si existen; si no, misma categoría (máx 3).
  let related: RelatedRow[] = []
  const relCols = "slug, title, excerpt, category_slug, reading_time"
  if (tx.related_post_slugs && tx.related_post_slugs.length > 0) {
    const { data } = await supabase
      .from("transmissions")
      .select(relCols)
      .in("slug", tx.related_post_slugs)
      .eq("status", "published")
      .limit(3)
    related = (data as RelatedRow[]) || []
  }
  if (related.length < 3 && tx.category_slug) {
    const need = 3 - related.length
    const exclude = [tx.slug, ...related.map((r) => r.slug)]
    const { data } = await supabase
      .from("transmissions")
      .select(relCols)
      .eq("category_slug", tx.category_slug)
      .eq("status", "published")
      .not("slug", "in", `(${exclude.join(",")})`)
      .order("published_at", { ascending: false })
      .limit(need)
    related = [...related, ...((data as RelatedRow[]) || [])]
  }

  const bodyHtml = renderMarkdown(tx.body)
  const minutes = tx.reading_time || readingTimeMinutes(tx.body)

  return (
    <main className={styles.page}>
      <article className={styles.article}>
        {/* Enlace duro (no next/link): fuerza recarga de /miembros para que el
            SPA lea el hash #feed y abra el archivo de Transmisiones (el
            ViewProvider vive en el layout y no se re-sincroniza con pushState). */}
        <a href="/miembros#feed" className={styles.back}>
          ← Volver a Transmisiones
        </a>

        {categoryName && <div className={styles.eyebrow}>{categoryName}</div>}
        <h1 className={styles.title}>{tx.title}</h1>
        {tx.excerpt && <p className={styles.excerpt}>{tx.excerpt}</p>}

        <div className={styles.meta}>
          <span>{tx.author_name || "José"} · Los 144.000</span>
          <span className={styles.dot}>·</span>
          <span>{minutes} min de lectura</span>
        </div>

        {tx.related_season && (
          <div className={styles.seasonRel}>
            Relacionado con Temporada {tx.related_season}
          </div>
        )}

        <div
          className={styles.body}
          // Seguro: renderMarkdown escapa todo el texto y solo reintroduce un
          // subconjunto controlado de tags. No hay HTML arbitrario del autor.
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />

        {tx.tags && tx.tags.length > 0 && (
          <div className={styles.tags}>
            {tx.tags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
              </span>
            ))}
          </div>
        )}
      </article>

      <TransmisionEngagement slug={tx.slug} />

      {related.length > 0 && (
        <section className={styles.related}>
          <h2 className={styles.relatedTitle}>SEGUIR EXPLORANDO</h2>
          <div className={styles.relatedGrid}>
            {related.slice(0, 3).map((r) => (
              <Link key={r.slug} href={`/miembros/feed/${r.slug}`} className={styles.relatedCard}>
                <div className={styles.relatedCardTitle}>{r.title}</div>
                {r.excerpt && <p className={styles.relatedCardExcerpt}>{r.excerpt}</p>}
                <span className={styles.relatedCardCta}>Leer transmisión →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
