"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  COMPARTIR UNA GRABACIÓN
// ═══════════════════════════════════════════════════════════════════════════
//
// Da el enlace de ESTA grabación para pegarlo en el grupo de Telegram.
//
// ── QUÉ SE COMPARTE, Y QUÉ NO ─────────────────────────────────────────────
// Se comparte una dirección de la plataforma, no el vídeo. Quien la abra sin
// sesión cae en la pantalla de acceso y, al entrar, vuelve a la grabación.
// Quien no sea miembro no pasa de ahí.
//
// Esto importa porque la alternativa —pegar en Telegram el enlace del vídeo
// en VTurb— lo dejaría abierto a cualquiera que lo reciba, para siempre y sin
// forma de retirarlo. El enlace de aquí no vale nada sin una cuenta.
//
// ── POR QUÉ SE COPIA Y NO SOLO «COMPARTIR» ────────────────────────────────
// El botón de Telegram abre su aplicación con el mensaje empezado, que es el
// camino rápido. Pero no siempre está Telegram instalado en el aparato desde
// el que se mira, y a veces el enlace va a un correo o a una nota. Copiar
// nunca falla, así que está siempre.

import { useState } from "react"
import { Check, Copy, Send } from "lucide-react"

export function CompartirGrabacion({
  id,
  titulo,
  compacto,
}: {
  id: number
  titulo: string
  /** En la tarjeta de la rejilla, donde solo cabe un icono. */
  compacto?: boolean
}) {
  const [copiado, setCopiado] = useState(false)
  const [aLaVista, setALaVista] = useState<string | null>(null)

  /** Se arma en el momento: así vale igual en producción y en pruebas. */
  function enlace(): string {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/miembros/encuentro/${id}`
  }

  async function copiar() {
    const url = enlace()
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setALaVista(null)
      window.setTimeout(() => setCopiado(false), 2200)
    } catch {
      // Sin permiso de portapapeles —pasa en algunos navegadores del móvil—
      // se enseña el enlace para copiarlo a mano. Un botón que no hace nada y
      // no dice nada es peor que no tener botón.
      setALaVista(url)
    }
  }

  function aTelegram() {
    const url = enlace()
    if (!url) return
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}` +
      `&text=${encodeURIComponent(titulo)}`,
      "_blank",
      "noopener,noreferrer",
    )
  }

  if (compacto) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); void copiar() }}
        title={copiado ? "Enlace copiado" : "Copiar el enlace de esta grabación"}
        aria-label={copiado ? "Enlace copiado" : "Copiar el enlace de esta grabación"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          border: "none",
          background: "none",
          padding: 0,
          cursor: "pointer",
          color: copiado ? "#6ee7a8" : "#8b90b4",
          fontSize: "0.68rem",
          fontFamily: "var(--font-mono, monospace)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {copiado ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
        {copiado ? "Copiado" : "Compartir"}
      </button>
    )
  }

  return (
    <div style={{ marginTop: "1.4rem" }}>
      <p
        style={{
          margin: "0 0 0.6rem",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#6a6a7a",
        }}
      >
        Compartir
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        <button type="button" onClick={() => void copiar()} style={BOTON(copiado)}>
          {copiado ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copiado ? "Enlace copiado" : "Copiar enlace"}
        </button>

        <button type="button" onClick={aTelegram} style={BOTON(false)}>
          <Send size={14} aria-hidden /> Enviar a Telegram
        </button>
      </div>

      {aLaVista && (
        <input
          readOnly
          value={aLaVista}
          onFocus={(e) => e.currentTarget.select()}
          style={{
            marginTop: "0.7rem",
            width: "100%",
            border: "1px solid #2f2f42",
            background: "#0a0a14",
            color: "#c3c6d8",
            padding: "0.6rem 0.7rem",
            fontSize: "0.78rem",
            fontFamily: "var(--font-mono, monospace)",
          }}
        />
      )}

      <p
        style={{
          margin: "0.7rem 0 0",
          fontSize: "0.72rem",
          lineHeight: 1.6,
          color: "#6a6a7a",
          maxWidth: "52ch",
        }}
      >
        Quien abra este enlace sin ser miembro verá la pantalla de acceso. Al
        entrar, vuelve directo a esta grabación.
      </p>
    </div>
  )
}

const BOTON = (hecho: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.65rem 1.1rem",
  border: `1px solid ${hecho ? "rgba(110,231,168,0.5)" : "rgba(217,184,102,0.45)"}`,
  background: hecho ? "rgba(110,231,168,0.08)" : "rgba(217,184,102,0.08)",
  color: hecho ? "#6ee7a8" : "#e6cf95",
  fontFamily: "var(--font-mono, monospace)",
  fontSize: "0.64rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  cursor: "pointer",
})
