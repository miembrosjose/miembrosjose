// Renderizador de Markdown mínimo y SEGURO para el cuerpo de las transmisiones.
//
// Por qué propio y no una lib pesada (remark/markdown-it):
//   - Cero dependencias nuevas en el bundle del Worker (evita peso/1102).
//   - NUNCA pasa HTML arbitrario del autor al DOM: escapamos TODO el texto
//     primero y solo después reintroducimos un subconjunto controlado de tags.
//     El contenido lo carga José vía importador (fuente de confianza), pero aun
//     así lo tratamos como no confiable por defensa en profundidad.
//
// Subconjunto soportado (editorial, contemplativo):
//   # / ## / ### encabezados · párrafos · **negrita** · *cursiva* ·
//   > cita · --- separador · listas - / 1. · [texto](https|http|/…) enlaces ·
//   línea en blanco = separación de bloque.
//
// El resultado es un string HTML seguro para dangerouslySetInnerHTML.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// Inline: se aplica sobre texto YA escapado. Solo reintroduce tags seguros.
function renderInline(escaped: string): string {
  let out = escaped
  // Enlaces [txt](url) — solo http(s) o rutas internas; nada de javascript:.
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, txt, url) => {
    const safe = /^(https?:\/\/|\/)/i.test(url)
    if (!safe) return txt
    const ext = /^https?:\/\//i.test(url)
    const rel = ext ? ' target="_blank" rel="noopener noreferrer nofollow"' : ""
    return `<a href="${url}"${rel}>${txt}</a>`
  })
  // Negrita. Caso especial: etiqueta de hablante (una sola palabra + ":")
  // como **José:** o **Sergel:** → se marca con una clase para colorear solo
  // el nombre. José = dorado; cualquier otro hablante (guías) = violeta.
  // Reutilizable para todas las transmisiones sin estilos por archivo.
  out = out.replace(/\*\*([^*]+)\*\*/g, (_m, inner) => {
    const label = /^([\p{L}]+):$/u.exec(inner.trim())
    if (label) {
      const key = label[1].toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
      const who = key === "jose" ? "jose" : "guide"
      return `<strong class="speaker speaker-${who}">${inner}</strong>`
    }
    return `<strong>${inner}</strong>`
  })
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
  return out
}

export function renderMarkdown(md: string): string {
  if (!md) return ""
  const src = escapeHtml(md.replace(/\r\n/g, "\n"))
  const lines = src.split("\n")
  const html: string[] = []
  let i = 0
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${renderInline(paragraph.join(" ").trim())}</p>`)
      paragraph = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Línea en blanco → cierra párrafo.
    if (trimmed === "") {
      flushParagraph()
      i++
      continue
    }
    // Separador ---
    if (/^-{3,}$/.test(trimmed)) {
      flushParagraph()
      html.push("<hr />")
      i++
      continue
    }
    // Encabezados
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed)
    if (h) {
      flushParagraph()
      const level = h[1].length + 1 // # → h2 (h1 es el título de la página)
      html.push(`<h${level}>${renderInline(h[2].trim())}</h${level}>`)
      i++
      continue
    }
    // Cita >
    if (/^&gt;\s?/.test(trimmed)) {
      flushParagraph()
      const quote: string[] = []
      while (i < lines.length && /^&gt;\s?/.test(lines[i].trim())) {
        quote.push(lines[i].trim().replace(/^&gt;\s?/, ""))
        i++
      }
      html.push(`<blockquote>${renderInline(quote.join(" "))}</blockquote>`)
      continue
    }
    // Lista no ordenada
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph()
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(`<li>${renderInline(lines[i].trim().replace(/^[-*]\s+/, ""))}</li>`)
        i++
      }
      html.push(`<ul>${items.join("")}</ul>`)
      continue
    }
    // Lista ordenada
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph()
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(`<li>${renderInline(lines[i].trim().replace(/^\d+\.\s+/, ""))}</li>`)
        i++
      }
      html.push(`<ol>${items.join("")}</ol>`)
      continue
    }
    // Texto normal → acumula en párrafo.
    paragraph.push(trimmed)
    i++
  }
  flushParagraph()
  return html.join("\n")
}

// Tiempo de lectura en minutos (~200 palabras/min, mínimo 1).
export function readingTimeMinutes(body: string): number {
  const words = (body || "").trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// ── Navegación por etapas ──────────────────────────────────────────────
// Cada transmisión define internamente "etapas" (metadata, NO títulos visibles
// en el texto). Cada etapa se localiza por un fragmento textual (snippet) que
// aparece al inicio del bloque donde empieza esa etapa. Aquí inyectamos anclas
// invisibles (<span class="tx-stage" id="tx-stage-N">) justo antes del <p> que
// contiene ese fragmento, sin alterar el texto. El texto sigue leyéndose como
// una sola transmisión continua.

export type StageDef = { title: string; snippet: string }
export type Stage = { n: number; id: string; title: string }

export function renderMarkdownWithStages(
  md: string,
  stageDefs: StageDef[],
): { html: string; stages: Stage[] } {
  const html = renderMarkdown(md)
  if (!stageDefs || stageDefs.length === 0) return { html, stages: [] }

  const inserts: { pos: number; frag: string }[] = []
  const stages: Stage[] = []
  let searchFrom = 0

  for (const def of stageDefs) {
    const snippet = (def.snippet || "").trim()
    if (!snippet) continue
    const idx = html.indexOf(snippet, searchFrom)
    if (idx === -1) continue // no matchea → se omite (degradación elegante)
    const pStart = html.lastIndexOf("<p>", idx)
    const anchorAt = pStart === -1 ? idx : pStart
    const n = stages.length + 1
    const id = `tx-stage-${n}`
    inserts.push({ pos: anchorAt, frag: `<span class="tx-stage" id="${id}" aria-hidden="true"></span>` })
    stages.push({ n, id, title: def.title })
    searchFrom = idx + snippet.length
  }

  if (inserts.length === 0) return { html, stages: [] }

  inserts.sort((a, b) => a.pos - b.pos)
  let out = ""
  let last = 0
  for (const ins of inserts) {
    out += html.slice(last, ins.pos) + ins.frag
    last = ins.pos
  }
  out += html.slice(last)
  return { html: out, stages }
}

// Parsea la columna `stages` (text[]) donde cada item es "TÍTULO :: snippet".
export function parseStageDefs(raw: unknown): StageDef[] {
  if (!Array.isArray(raw)) return []
  const out: StageDef[] = []
  for (const item of raw) {
    if (typeof item !== "string") continue
    const i = item.indexOf("::")
    if (i === -1) continue
    const title = item.slice(0, i).trim()
    const snippet = item.slice(i + 2).trim()
    if (title && snippet) out.push({ title, snippet })
  }
  return out
}
