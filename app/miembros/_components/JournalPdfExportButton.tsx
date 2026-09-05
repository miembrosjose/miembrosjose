"use client"

// Descarga "Mi Gran Bitácora" como informe imprimible → el navegador ofrece
// "Guardar como PDF". Sin librerías externas (no rompe build). SOLO incluye la
// bitácora privada del usuario; nunca contenido del foro.

import { FileDown } from "lucide-react"
import { loadEntries, readAnswer, entriesByCategory, type JournalCategory } from "../_lib/journal-store"
import { BANK_CATEGORIES, bankByCategory } from "../_lib/question-bank"

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "long", year: "numeric" }) }
  catch { return "" }
}

export function buildReportHtml(): string {
  loadEntries()
  const today = new Date().toLocaleDateString("es", { day: "2-digit", month: "long", year: "numeric" })

  const sectionsHtml = BANK_CATEGORIES.map((cat, i) => {
    const qs = bankByCategory(cat.id as JournalCategory)
    const bankIds = new Set(qs.map((q) => q.id))
    const extras = entriesByCategory(cat.id as JournalCategory).filter((e) => !bankIds.has(e.id))

    const bankHtml = qs.map((q) => {
      const ans = readAnswer(q.source, q.prompt).trim()
      return `<div class="entry">
        <div class="q">${esc(q.prompt)}</div>
        <div class="${ans ? "a" : "pend"}">${ans ? esc(ans).replace(/\n/g, "<br/>") : "Pendiente de completar."}</div>
        <div class="meta">${esc(q.originLabel)}</div>
      </div>`
    }).join("")

    const extrasHtml = extras.map((e) => `<div class="entry">
        <div class="q">${esc(e.prompt)}</div>
        <div class="a">${esc(e.answer).replace(/\n/g, "<br/>")}</div>
        <div class="meta">${esc(e.sourceLabel)}${e.updatedAt ? " · " + fmtDate(e.updatedAt) : ""}</div>
      </div>`).join("")

    const inner = (bankHtml + extrasHtml) || `<p class="empty">Esta sección aún no ha sido completada.</p>`
    return `<section><h2>${i + 1} · ${esc(cat.label)}</h2>${inner}</section>`
  }).join("")

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/>
<title>Mi Gran Bitácora — Los 144.000</title>
<style>
  @page { margin: 22mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a24; line-height: 1.6; margin: 0; }
  .cover { text-align: center; padding: 40px 0 26px; border-bottom: 2px solid #c9a86b; margin-bottom: 8px; }
  .cover .glyph { font-size: 34px; color: #b8934a; }
  .cover h1 { font-size: 30px; letter-spacing: 2px; margin: 10px 0 4px; }
  .cover .sub { font-size: 13px; color: #555; font-style: italic; max-width: 520px; margin: 6px auto 0; }
  .cover .date { font-size: 11px; color: #888; margin-top: 14px; letter-spacing: 1px; text-transform: uppercase; }
  .note { font-size: 11px; color: #888; text-align: center; margin: 10px 0 22px; }
  section { margin: 22px 0; page-break-inside: auto; }
  h2 { font-size: 15px; letter-spacing: 1px; color: #6d4a9b; border-left: 3px solid #c9a86b; padding-left: 10px; margin: 26px 0 12px; }
  .entry { margin: 0 0 14px; padding: 0 0 12px; border-bottom: 1px solid #eee; page-break-inside: avoid; }
  .q { font-weight: bold; font-size: 13px; color: #2a2a3a; }
  .a { font-size: 13px; margin: 4px 0 5px; white-space: normal; }
  .pend { font-size: 12px; margin: 4px 0 5px; color: #b9863b; font-style: italic; }
  .meta { font-size: 10px; color: #999; letter-spacing: 0.5px; }
  .empty { font-size: 12px; color: #aaa; font-style: italic; }
</style></head>
<body>
  <div class="cover">
    <div class="glyph">✷</div>
    <h1>MI GRAN BITÁCORA</h1>
    <div style="font-size:13px;letter-spacing:3px;color:#b8934a;">LOS 144.000</div>
    <div class="sub">Archivo personal de memoria, desprogramación, linaje, territorio y misión</div>
    <div class="date">Generado el ${esc(today)}</div>
  </div>
  <div class="note">Documento privado · contiene únicamente tu bitácora personal · nada del foro.</div>
  ${sectionsHtml}
  <script>window.onload=function(){setTimeout(function(){window.focus();window.print();},250);};</script>
</body></html>`
}

export function JournalPdfExportButton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  function download() {
    const html = buildReportHtml()
    const w = window.open("", "_blank", "width=820,height=1000")
    if (!w) { alert("Permite las ventanas emergentes para descargar tu informe PDF."); return }
    w.document.open()
    w.document.write(html)
    w.document.close()
  }
  return (
    <button type="button" onClick={download} className={className} style={style}>
      <FileDown size={16} /> Descargar mi informe PDF
    </button>
  )
}
