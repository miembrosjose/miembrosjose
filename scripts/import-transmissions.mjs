// ============================================================================
// Importador IDEMPOTENTE de transmisiones → tabla public.transmissions
// ============================================================================
// Lee archivos Markdown con frontmatter desde /content/transmissions/*.md y los
// sube (upsert por `slug`) a Supabase usando la service_role key. Re-ejecutarlo
// NO crea duplicados: actualiza la fila existente con el mismo slug.
//
// NO genera contenido: solo transporta lo que ya está escrito en los .md.
//
// Uso:
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node scripts/import-transmissions.mjs [--include-mock] [--dry]
//
//   --include-mock  incluye los archivos/carpetas que empiezan con "_" (mocks de
//                   desarrollo). Por defecto se OMITEN (no llegan a producción).
//   --dry           no escribe: solo muestra qué haría.
// ============================================================================

import { readdir, readFile } from "node:fs/promises"
import { join, basename } from "node:path"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"
import { createClient } from "@supabase/supabase-js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, "..", "content", "transmissions")

const includeMock = process.argv.includes("--include-mock")
const dryRun = process.argv.includes("--dry")

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.")
  process.exit(1)
}

// ── Parser de frontmatter mínimo (subconjunto YAML: escalares, listas [a,b],
//    listas en bloque con "- ", booleanos, números). Sin dependencias. ──
function parseFrontmatter(raw) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw)
  if (!m) return { data: {}, body: raw.trim() }
  const data = {}
  const lines = m[1].split("\n")
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith("#")) { i++; continue }
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
    if (!kv) { i++; continue }
    const key = kv[1]
    let val = kv[2].trim()
    if (val === "" && lines[i + 1] && /^\s*-\s+/.test(lines[i + 1])) {
      // Lista en bloque
      const arr = []
      i++
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        arr.push(unquote(lines[i].replace(/^\s*-\s+/, "").trim()))
        i++
      }
      data[key] = arr
      continue
    }
    data[key] = coerce(val)
    i++
  }
  return { data, body: m[2].trim() }
}

function unquote(s) {
  return s.replace(/^["'](.*)["']$/, "$1")
}
function coerce(v) {
  if (v.startsWith("[") && v.endsWith("]")) {
    return v.slice(1, -1).split(",").map((x) => unquote(x.trim())).filter(Boolean)
  }
  if (v === "true") return true
  if (v === "false") return false
  if (/^-?\d+$/.test(v)) return parseInt(v, 10)
  return unquote(v)
}

function readingTime(body) {
  const words = (body || "").trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// Slug estable a partir del título (solo si el .md no trae slug propio).
function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

async function collectFiles(dir, depth = 0) {
  const out = []
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    const isMock = e.name.startsWith("_")
    if (isMock && !includeMock) continue
    const full = join(dir, e.name)
    const lower = e.name.toLowerCase()
    if (e.isDirectory()) {
      out.push(...(await collectFiles(full, depth + 1)))
    } else if (e.name.endsWith(".md") && lower !== "readme.md" && lower !== "_template.md") {
      out.push(full)
    }
  }
  return out
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  const files = await collectFiles(CONTENT_DIR)
  if (files.length === 0) {
    console.log("No hay .md en content/transmissions/ (¿usar --include-mock?).")
    return
  }

  const rows = []
  const seenSlugs = new Set()
  for (const file of files) {
    const raw = await readFile(file, "utf8")
    const { data, body } = parseFrontmatter(raw)
    if (!data.title) { console.warn(`⚠ ${basename(file)} sin 'title' — omitido.`); continue }
    const slug = data.slug || slugify(data.title)
    if (seenSlugs.has(slug)) { console.warn(`⚠ slug duplicado '${slug}' (${basename(file)}) — omitido.`); continue }
    seenSlugs.add(slug)

    rows.push({
      slug,
      title: data.title,
      excerpt: data.excerpt || null,
      body,
      category_slug: data.category || data.category_slug || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      author_name: data.author_name || "José",
      status: data.status || "published",
      featured: data.featured === true,
      featured_order: data.featured_order ?? null,
      reading_time: data.reading_time || readingTime(body),
      image_url: data.image_url || null,
      related_post_slugs: Array.isArray(data.related_post_slugs) ? data.related_post_slugs : [],
      related_season: data.related_season ?? null,
      related_episode_id: data.related_episode_id || null,
      overlap_status: data.overlap_status || "none",
      source_basis: data.source_basis || null,
      editorial_notes: data.editorial_notes || null,
      season_overlap_notes: data.season_overlap_notes || null,
      is_mock: data.is_mock === true,
      sort_order: data.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    })
  }

  console.log(`${rows.length} transmisión(es) para importar${dryRun ? " (dry-run)" : ""}:`)
  rows.forEach((r) => console.log(`  · ${r.slug}  [${r.status}]  ${r.featured ? "★" : " "} ${r.title}`))

  if (dryRun) return

  // Upsert por slug (idempotente). onConflict: 'slug'.
  const { error } = await supabase
    .from("transmissions")
    .upsert(rows, { onConflict: "slug" })
  if (error) {
    console.error("Error al importar:", error.message)
    process.exit(1)
  }
  console.log(`✔ Importadas ${rows.length} transmisión(es) sin duplicados.`)

  // ── Purga automática de mocks ──
  // Tras un import REAL exitoso, elimina SOLO las filas is_mock=true (los
  // placeholders de desarrollo, ya sea sembrados por SQL o por --include-mock
  // en corridas previas). El contenido real siempre es is_mock=false, así que
  // NUNCA se toca. No se purga si esta corrida trae mocks (--include-mock) o si
  // no se importó ninguna transmisión real (evita borrar mocks sin sustituto).
  const realCount = rows.filter((r) => !r.is_mock).length
  if (!includeMock && realCount > 0) {
    const { error: delErr, count } = await supabase
      .from("transmissions")
      .delete({ count: "exact" })
      .eq("is_mock", true)
    if (delErr) {
      console.warn(`⚠ No se pudieron purgar los mocks: ${delErr.message}`)
    } else {
      console.log(`✔ Mocks purgados automáticamente: ${count ?? 0} eliminado(s).`)
    }
  } else if (includeMock) {
    console.log("· Corrida con --include-mock: no se purgan mocks.")
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
