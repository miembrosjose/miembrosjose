// ============================================================================
// Generador de SQL para transmisiones (sin credenciales, sin red)
// ============================================================================
// Lee content/transmissions/*.md (frontmatter + cuerpo) y escribe UN archivo
// docs/sql/transmissions_generated.sql con un upsert IDEMPOTENTE por slug que
// pegas en Supabase → SQL Editor → Run. Re-generarlo/re-pegarlo NO duplica.
//
// Al final incluye la PURGA de mocks (delete where is_mock = true): tus
// transmisiones reales son is_mock=false, así que nunca se tocan; los
// placeholders de prueba desaparecen en cuanto pegas este SQL con contenido real.
//
// Uso:
//   node scripts/generate-transmissions-sql.mjs
//   node scripts/generate-transmissions-sql.mjs --include-mock   (incluye los _mock/, para practicar)
// ============================================================================

import { readdir, readFile, writeFile } from "node:fs/promises"
import { join, basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, "..", "content", "transmissions")
const OUT_FILE = join(__dirname, "..", "docs", "sql", "transmissions_generated.sql")

const includeMock = process.argv.includes("--include-mock")

// ── Frontmatter mínimo (subconjunto YAML) ──
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
    const val = kv[2].trim()
    if (val === "" && lines[i + 1] && /^\s*-\s+/.test(lines[i + 1])) {
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
function unquote(s) { return s.replace(/^["'](.*)["']$/, "$1") }
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
function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)
}

// ── Escapado SQL ──
// Texto multilínea → dollar-quoting con una etiqueta que no aparezca en el valor.
function sqlText(v) {
  if (v === null || v === undefined || v === "") return "null"
  const s = String(v)
  let tag = "tx"
  while (s.includes(`$${tag}$`)) tag += "x"
  return `$${tag}$${s}$${tag}$`
}
function sqlTextArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "array[]::text[]"
  const items = arr.map((x) => `'${String(x).replace(/'/g, "''")}'`).join(", ")
  return `array[${items}]::text[]`
}
function sqlInt(v) { return v === null || v === undefined || v === "" ? "null" : String(parseInt(v, 10)) }
function sqlBool(v) { return v === true ? "true" : "false" }

async function collectFiles(dir) {
  const out = []
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    const isMock = e.name.startsWith("_")
    if (isMock && !includeMock) continue
    const full = join(dir, e.name)
    const lower = e.name.toLowerCase()
    if (e.isDirectory()) out.push(...(await collectFiles(full)))
    else if (e.name.endsWith(".md") && lower !== "readme.md" && lower !== "_template.md") out.push(full)
  }
  return out
}

async function main() {
  const files = await collectFiles(CONTENT_DIR)
  if (files.length === 0) {
    console.log("No hay .md reales en content/transmissions/ (¿usar --include-mock para practicar?).")
    return
  }

  const rows = []
  const seen = new Set()
  for (const file of files) {
    const raw = await readFile(file, "utf8")
    const { data, body } = parseFrontmatter(raw)
    if (!data.title) { console.warn(`⚠ ${basename(file)} sin 'title' — omitido.`); continue }
    const slug = data.slug || slugify(data.title)
    if (seen.has(slug)) { console.warn(`⚠ slug duplicado '${slug}' (${basename(file)}) — omitido.`); continue }
    seen.add(slug)
    rows.push({ data, body, slug })
  }
  if (rows.length === 0) { console.log("Nada que generar."); return }

  const cols = [
    "slug", "title", "excerpt", "body", "category_slug", "tags", "author_name",
    "status", "featured", "featured_order", "reading_time", "image_url",
    "related_post_slugs", "related_season", "related_episode_id", "overlap_status",
    "source_basis", "editorial_notes", "season_overlap_notes", "is_mock", "sort_order", "updated_at",
  ]

  const values = rows.map(({ data, body, slug }) => {
    const v = [
      sqlText(slug),
      sqlText(data.title),
      sqlText(data.excerpt || null),
      sqlText(body),
      sqlText(data.category || data.category_slug || null),
      sqlTextArray(Array.isArray(data.tags) ? data.tags : []),
      sqlText(data.author_name || "José"),
      sqlText(data.status || "published"),
      sqlBool(data.featured === true),
      sqlInt(data.featured_order),
      sqlInt(data.reading_time || readingTime(body)),
      sqlText(data.image_url || null),
      sqlTextArray(Array.isArray(data.related_post_slugs) ? data.related_post_slugs : []),
      sqlInt(data.related_season),
      sqlText(data.related_episode_id || null),
      sqlText(data.overlap_status || "none"),
      sqlText(data.source_basis || null),
      sqlText(data.editorial_notes || null),
      sqlText(data.season_overlap_notes || null),
      sqlBool(data.is_mock === true),
      sqlInt(data.sort_order ?? 0),
      "now()",
    ]
    return `  (${v.join(", ")})`
  })

  // Columnas a actualizar en conflicto (todas menos slug; published_at intacto).
  const updateSet = cols
    .filter((c) => c !== "slug")
    .map((c) => (c === "updated_at" ? "updated_at = now()" : `${c} = excluded.${c}`))
    .join(",\n  ")

  const realCount = rows.filter((r) => r.data.is_mock !== true).length

  const sql = `-- ============================================================================
-- TRANSMISIONES — SQL generado automáticamente. NO editar a mano.
-- Fuente: content/transmissions/*.md · Generado: ${new Date().toISOString()}
-- Pegar en Supabase → SQL Editor → Run. Idempotente (upsert por slug).
-- ============================================================================

insert into public.transmissions
  (${cols.join(", ")})
values
${values.join(",\n")}
on conflict (slug) do update set
  ${updateSet};
${
  !includeMock && realCount > 0
    ? `
-- Purga de mocks tras cargar contenido real (solo toca is_mock = true).
delete from public.transmissions where is_mock = true;
`
    : ""
}
select count(*) as transmisiones from public.transmissions where is_mock = false;
`

  await writeFile(OUT_FILE, sql, "utf8")
  console.log(`✔ ${rows.length} transmisión(es) → ${OUT_FILE}`)
  rows.forEach((r) => console.log(`  · ${r.slug}${r.data.featured ? "  ★" : ""}`))
  if (!includeMock && realCount > 0) console.log("  (incluye purga automática de mocks)")
  console.log("\nAhora pega el contenido de docs/sql/transmissions_generated.sql en Supabase → SQL Editor → Run.")
}

main().catch((e) => { console.error(e); process.exit(1) })
