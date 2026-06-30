"use client"

// Campo editável inline — pra admin clicar no texto e editar direto.
// Modo display: mostra o valor + ícone de lápis no hover.
// Modo edit: input/textarea + Guardar/Cancelar.
// Membro vê só o texto (canEdit=false).

import { Check, Loader2, Pencil, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  value: string
  canEdit: boolean
  onSave: (value: string) => Promise<void>
  multiline?: boolean
  placeholder?: string
  className?: string
  /** className pra aplicar no <span>/<p> de display */
  displayClassName?: string
}

export function InlineEditableField({
  value,
  canEdit,
  onSave,
  multiline = false,
  placeholder,
  className,
  displayClassName,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      if ("select" in ref.current) ref.current.select?.()
    }
  }, [editing])

  async function commit() {
    if (saving) return
    const trimmed = draft.trim()
    if (trimmed === value) {
      setEditing(false)
      return
    }
    if (!trimmed) {
      // Não permite vazio — restaura
      setDraft(value)
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
      setEditing(false)
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : "desconocido"}`)
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (!canEdit) {
    return <span className={displayClassName ?? className}>{value}</span>
  }

  if (editing) {
    return (
      <span className={className} style={{ display: "inline-flex", alignItems: "flex-start", gap: 6, width: "100%" }}>
        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel()
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) commit()
            }}
            placeholder={placeholder}
            rows={4}
            disabled={saving}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "8px 10px",
              border: "1px solid #6D4A9B",
              background: "#050510",
              color: "#F3F6FA",
              borderRadius: 6,
              fontFamily: "var(--font-geist-sans)",
              fontSize: "inherit",
              lineHeight: "inherit",
              resize: "vertical",
              outline: "none",
            }}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel()
              if (e.key === "Enter") commit()
            }}
            placeholder={placeholder}
            disabled={saving}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "4px 8px",
              border: "1px solid #6D4A9B",
              background: "#050510",
              color: "#F3F6FA",
              borderRadius: 4,
              fontFamily: "inherit",
              fontSize: "inherit",
              outline: "none",
            }}
          />
        )}
        <span style={{ display: "inline-flex", gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={commit}
            disabled={saving}
            title="Guardar (Enter)"
            style={iconBtn("#6D4A9B")}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            title="Cancelar (Esc)"
            style={iconBtn("#251f30")}
          >
            <X size={12} />
          </button>
        </span>
      </span>
    )
  }

  // Modo display (admin) — mostra texto + ícone hover
  return (
    <span
      className={displayClassName ?? className}
      style={{ position: "relative", cursor: "pointer", display: "inline" }}
      onClick={() => setEditing(true)}
      title="Click para editar (admin)"
    >
      {value}{" "}
      <Pencil
        size={11}
        style={{
          display: "inline",
          verticalAlign: "middle",
          opacity: 0.4,
          color: "#a78bca",
          marginLeft: 4,
        }}
      />
    </span>
  )
}

function iconBtn(bg: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    background: bg,
    border: "1px solid #6D4A9B",
    color: "#F3F6FA",
    borderRadius: 4,
    cursor: "pointer",
  }
}
