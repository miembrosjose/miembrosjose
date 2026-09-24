"use client"

// Abrir una conversación.
//
// ── EL CONTEXTO YA SE SABE ─────────────────────────────────────────────────
// Si estoy dentro de «Misión de la Tierra» y pulso iniciar conversación, no
// tiene sentido preguntarme dónde quiero publicar: ya estoy ahí. El espacio
// viene puesto y se enseña como un dato, no como un desplegable que hay que
// rellenar otra vez.
//
// Lo único que se pregunta, y solo en las temporadas, es la sección — y
// también viene elegida si se estaba filtrando por una.

import { useState } from "react"
import { Send, X } from "lucide-react"
import s from "./comunidad.module.css"

type Categoria = { id: string; slug: string; name: string; description: string }

export function ComposerComunidad({
  espacio, categorias, categoriaPorDefecto, onCerrar, onCreada,
}: {
  espacio: { slug: string; name: string; kicker: string }
  categorias: Categoria[]
  categoriaPorDefecto: string | null
  onCerrar: () => void
  onCreada: () => void
}) {
  const [titulo, setTitulo] = useState("")
  const [cuerpo, setCuerpo] = useState("")
  const [categoria, setCategoria] = useState(categoriaPorDefecto ?? categorias[0]?.slug ?? "")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listo = titulo.trim().length > 0 && cuerpo.trim().length > 0

  const publicar = async () => {
    if (!listo || enviando) return
    setEnviando(true)
    setError(null)
    try {
      const r = await fetch("/api/comunidad/hilos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          espacio: espacio.slug,
          categoria: categoria || undefined,
          titulo: titulo.trim(),
          cuerpo: cuerpo.trim(),
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setError(j?.error || "No se pudo publicar"); return }
      onCreada()
    } catch {
      setError("Sin conexión")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      className={s.composer}
      onSubmit={(e) => { e.preventDefault(); void publicar() }}
    >
      <div className={s.composerCabecera}>
        <span className={s.composerDonde}>
          Publicas en <strong>{espacio.name}</strong>
        </span>
        <button type="button" onClick={onCerrar} className={s.composerCerrar} aria-label="Cancelar">
          <X size={16} />
        </button>
      </div>

      {categorias.length > 0 && (
        <div className={s.secciones}>
          {categorias.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={categoria === c.slug ? s.seccionChipOn : s.seccionChip}
              onClick={() => setCategoria(c.slug)}
              title={c.description}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        maxLength={200}
        placeholder="¿De qué quieres hablar?"
        className={s.composerTitulo}
        aria-label="Título de la conversación"
      />

      <textarea
        value={cuerpo}
        onChange={(e) => setCuerpo(e.target.value)}
        maxLength={5000}
        rows={6}
        placeholder="Cuéntalo con tus palabras. No hace falta que esté ordenado."
        className={s.composerCuerpo}
        aria-label="Texto de la conversación"
      />

      {error && <p className={s.composerError}>{error}</p>}

      <div className={s.composerPie}>
        {/* El recordatorio va aquí y no en un aviso legal que nadie lee: es el
            momento en que alguien podría escribir su dirección sin pensarlo. */}
        <p className={s.composerNota}>
          Esto lo lee toda la Red. Para quedar en persona, usa Encuentros: ahí el lugar
          se trata con las reglas que le corresponden.
        </p>
        <button type="submit" className={s.composerPublicar} disabled={!listo || enviando}>
          <Send size={14} aria-hidden /> {enviando ? "Publicando…" : "Publicar"}
        </button>
      </div>
    </form>
  )
}
