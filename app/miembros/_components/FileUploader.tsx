"use client"

// Componente reutilizável de upload de imagem/vídeo + fallback de URL.
// Converte imagens pra WebP automaticamente (max 1280px) antes de subir.
// Vídeos vão direto.
//
// Em DEV local: upload pode falhar com "Storage not configured" porque o
// R2 binding do Cloudflare só existe em prod. Pra esses casos, usuário
// pode clicar "Pegar URL externa" e colar uma URL pública (mesma UX que
// tinha antes da Fase 6).

import { useRef, useState } from "react"
import { Upload, X, Loader2, Link2 } from "lucide-react"
import { convertToWebpIfImage, uploadMedia } from "../_lib/image-upload"

type Props = {
  value?: string | null
  onChange: (url: string | null) => void
  accept?: string
  label?: string
}

export function FileUploader({
  value,
  onChange,
  accept = "image/*,video/*",
  label = "Subir imagen o video",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlMode, setUrlMode] = useState(false)
  const [urlInput, setUrlInput] = useState("")

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const prepared = await convertToWebpIfImage(file)
      const url = await uploadMedia(prepared)
      onChange(url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir"
      setError(msg)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function clear() {
    onChange(null)
    setError(null)
  }

  function applyUrl() {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("URL debe empezar con http:// o https://")
      return
    }
    setError(null)
    onChange(trimmed)
    setUrlMode(false)
    setUrlInput("")
  }

  const isVideo = !!value && /\.(mp4|webm|mov)(\?|$)/i.test(value)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {value && (
        <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
          {isVideo ? (
            <video
              src={value}
              controls
              style={{ maxWidth: "100%", maxHeight: "260px", border: "1px solid var(--border-subtle)" }}
            />
          ) : (
            <img
              src={value}
              alt=""
              style={{ maxWidth: "100%", maxHeight: "260px", display: "block", border: "1px solid var(--border-subtle)" }}
            />
          )}
          <button
            type="button"
            onClick={clear}
            aria-label="Quitar"
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.7)",
              border: "1px solid var(--border-medium)",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {!value && !urlMode && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1rem",
              background: "transparent",
              border: "1px dashed var(--border-medium)",
              color: busy ? "var(--text-muted)" : "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? <Loader2 size={14} /> : <Upload size={14} />}
            {busy ? "Subiendo..." : label}
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleFile}
              disabled={busy}
              style={{ display: "none" }}
            />
          </label>
          <button
            type="button"
            onClick={() => setUrlMode(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.8rem",
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            <Link2 size={12} /> O pegar URL externa
          </button>
        </div>
      )}

      {!value && urlMode && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="url"
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyUrl()}
            autoFocus
            style={{
              flex: 1,
              padding: "0.6rem 0.85rem",
              background: "var(--bg-deep)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={applyUrl}
            disabled={!urlInput.trim()}
            style={{
              padding: "0.6rem 1rem",
              background: "var(--accent-red)",
              border: "1px solid var(--accent-red-hover)",
              color: "white",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Usar
          </button>
          <button
            type="button"
            onClick={() => {
              setUrlMode(false)
              setUrlInput("")
              setError(null)
            }}
            style={{
              padding: "0.6rem 0.85rem",
              background: "transparent",
              border: "1px solid var(--border-medium)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {error && (
        <span style={{ color: "#ef4444", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
          {error}
          {error.includes("Storage") && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setUrlMode(true)
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-gold)",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                }}
              >
                Usar URL externa
              </button>
            </>
          )}
        </span>
      )}
    </div>
  )
}
