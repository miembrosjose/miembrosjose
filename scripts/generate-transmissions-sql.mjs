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

import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises"
import { join, basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, "..", "content", "transmissions")
const OUT_FILE = join(__dirname, "..", "docs", "sql", "transmissions_generated.sql")
const PARTS_DIR = join(__dirname, "..", "docs", "sql", "parts")
// Presupuesto por parte. El SQL Editor de Supabase falla con consultas grandes;
// ~150 KB de filas deja margen de sobra para la cabecera y el on-conflict.
const PART_MAX_BYTES = 150_000

const includeMock = process.argv.includes("--include-mock")

// --only slug1,slug2  → además escribe docs/sql/transmissions_delta.sql con
// SOLO esos slugs. Útil para cargar transmisiones nuevas sin repegar todas las
// partes (los trozos se recalculan al añadir archivos y sus límites se corren).
const onlyArg = process.argv.find((a) => a.startsWith("--only="))
const onlySlugs = onlyArg
  ? onlyArg.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean)
  : []
const DELTA_FILE = join(
  dirname(fileURLToPath(import.meta.url)), "..", "docs", "sql", "transmissions_delta.sql",
)

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
  const seen = new Map() // slug -> archivo (para reportar el choque)
  const errors = []
  for (const file of files) {
    const raw = await readFile(file, "utf8")
    const { data, body } = parseFrontmatter(raw)
    if (!data.title) { errors.push(`${basename(file)}: falta 'title' en el frontmatter.`); continue }
    if (!body || !body.trim()) { errors.push(`${basename(file)}: cuerpo vacío.`); continue }
    const slug = data.slug || slugify(data.title)
    if (seen.has(slug)) {
      errors.push(`slug duplicado '${slug}': ${basename(file)} choca con ${seen.get(slug)}.`)
      continue
    }
    seen.set(slug, basename(file))
    rows.push({ data, body, slug })
  }

  // Verificación estricta: NO generar nada si hay problemas (evita omisiones
  // silenciosas). El corpus debe entrar completo o no entrar.
  if (errors.length > 0) {
    console.error(`✗ ${errors.length} problema(s) — no se generó SQL:`)
    errors.forEach((e) => console.error(`  · ${e}`))
    process.exit(1)
  }
  if (rows.length === 0) { console.log("Nada que generar."); return }

  const cols = [
    "slug", "title", "excerpt", "body", "category_slug", "tags", "author_name",
    "status", "featured", "featured_order", "reading_time", "image_url",
    "related_post_slugs", "related_season", "related_episode_id", "overlap_status",
    "source_basis", "editorial_notes", "season_overlap_notes", "is_mock", "stages", "sort_order", "updated_at",
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
      sqlTextArray(Array.isArray(data.stages) ? data.stages : []),
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
  const stamp = new Date().toISOString()

  const sql = `-- ============================================================================
-- TRANSMISIONES — SQL generado automáticamente. NO editar a mano.
-- Fuente: content/transmissions/*.md · Generado: ${stamp}
-- Pegar en Supabase → SQL Editor → Run. Idempotente (upsert por slug).
-- ============================================================================

-- Migración autocontenida: garantiza la columna de etapas de navegación.
alter table public.transmissions add column if not exists stages text[] not null default '{}';

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

  // ── Partes troceadas ──────────────────────────────────────────────────────
  // El SQL Editor de Supabase rechaza consultas muy grandes ("Query is too
  // large"). Emitimos además partes numeradas, cada una autocontenida e
  // idempotente, para pegarlas de una en una y en cualquier orden.
  await rm(PARTS_DIR, { recursive: true, force: true })
  await mkdir(PARTS_DIR, { recursive: true })

  const chunks = []
  let current = []
  let currentBytes = 0
  values.forEach((v, i) => {
    const bytes = Buffer.byteLength(v, "utf8")
    if (current.length && currentBytes + bytes > PART_MAX_BYTES) {
      chunks.push(current)
      current = []
      currentBytes = 0
    }
    current.push({ v, slug: rows[i].slug })
    currentBytes += bytes
  })
  if (current.length) chunks.push(current)

  const pad = (n) => String(n).padStart(2, "0")
  const total = chunks.length
  for (let c = 0; c < total; c++) {
    const isLast = c === total - 1
    const part = chunks[c]
    const partSql = `-- ============================================================================
-- TRANSMISIONES — parte ${c + 1} de ${total}. Generado automáticamente. NO editar a mano.
-- Fuente: content/transmissions/*.md · Generado: ${stamp}
-- Pegar en Supabase → SQL Editor → Run. Idempotente: repetirla no duplica.
-- Contiene ${part.length} transmisión(es): ${part.map((p) => p.slug).join(", ")}
-- ============================================================================

-- Migración autocontenida: garantiza la columna de etapas de navegación.
alter table public.transmissions add column if not exists stages text[] not null default '{}';

insert into public.transmissions
  (${cols.join(", ")})
values
${part.map((p) => p.v).join(",\n")}
on conflict (slug) do update set
  ${updateSet};
${
  isLast && !includeMock && realCount > 0
    ? `
-- Purga de mocks tras cargar todo el contenido real (solo toca is_mock = true).
delete from public.transmissions where is_mock = true;
`
    : ""
}${isLast ? "\nselect count(*) as transmisiones from public.transmissions where is_mock = false;\n" : ""}`
    await writeFile(join(PARTS_DIR, `transmissions_part_${pad(c + 1)}.sql`), partSql, "utf8")
  }

  // ── Delta (--only=slug1,slug2) ────────────────────────────────────────────
  let deltaFiles = []
  if (onlySlugs.length) {
    const idx = new Map(rows.map((r, i) => [r.slug, i]))
    const faltan = onlySlugs.filter((s) => !idx.has(s))
    if (faltan.length) {
      console.error(`✖ --only: slug(s) inexistente(s): ${faltan.join(", ")}`)
      process.exit(1)
    }
    // Trocea el delta igual que las partes: el SQL Editor rechaza consultas
    // grandes. Con pocos slugs sale un único archivo; con muchos, varios.
    const deltaChunks = []
    let dcur = []
    let dbytes = 0
    for (const s of onlySlugs) {
      const v = values[idx.get(s)]
      const b = Buffer.byteLength(v, "utf8")
      if (dcur.length && dbytes + b > PART_MAX_BYTES) {
        deltaChunks.push(dcur)
        dcur = []
        dbytes = 0
      }
      dcur.push({ v, slug: s })
      dbytes += b
    }
    if (dcur.length) deltaChunks.push(dcur)

    const dtotal = deltaChunks.length
    deltaFiles = []
    for (let c = 0; c < dtotal; c++) {
      const isLast = c === dtotal - 1
      const chunk = deltaChunks[c]
      const label = dtotal === 1 ? "delta" : `delta — parte ${c + 1} de ${dtotal}`
      const deltaSql = `-- ============================================================================
-- TRANSMISIONES — ${label}. Generado automáticamente. NO editar a mano.
-- Generado: ${stamp}
-- Contiene SOLO: ${chunk.map((x) => x.slug).join(", ")}
-- Pegar en Supabase → SQL Editor → Run. Idempotente: repetirlo no duplica.
-- No borra ni modifica el resto de transmisiones ya cargadas.
-- ============================================================================

alter table public.transmissions add column if not exists stages text[] not null default '{}';

insert into public.transmissions
  (${cols.join(", ")})
values
${chunk.map((x) => x.v).join(",\n")}
on conflict (slug) do update set
  ${updateSet};
${isLast ? "\nselect count(*) as transmisiones from public.transmissions where is_mock = false;\n" : ""}`
      const name = dtotal === 1
        ? "transmissions_delta.sql"
        : `transmissions_delta_${String(c + 1).padStart(2, "0")}.sql`
      const full = join(dirname(DELTA_FILE), name)
      await writeFile(full, deltaSql, "utf8")
      deltaFiles.push(name)
    }
  }

  console.log(`✔ ${rows.length} transmisión(es) → ${OUT_FILE}`)
  rows.forEach((r) => console.log(`  · ${r.slug}${r.data.featured ? "  ★" : ""}`))
  if (!includeMock && realCount > 0) console.log("  (incluye purga automática de mocks)")
  if (onlySlugs.length) {
    console.log(`\n✔ delta (${onlySlugs.length}) → ${deltaFiles.length} archivo(s):`)
    deltaFiles.forEach((f) => console.log(`  · docs/sql/${f}`))
    console.log(deltaFiles.length === 1
      ? "  Pega SOLO ese archivo para cargar las transmisiones nuevas."
      : "  Pega esos archivos EN ORDEN; el último trae el conteo final.")
  }
  console.log(`\n✔ ${total} parte(s) → docs/sql/parts/transmissions_part_01..${pad(total)}.sql`)
  console.log("Si el SQL Editor dice 'Query is too large', pega las partes EN ORDEN, una por una.")
  console.log("La última parte incluye la purga de mocks y el conteo final.")
}

main().catch((e) => { console.error(e); process.exit(1) })
