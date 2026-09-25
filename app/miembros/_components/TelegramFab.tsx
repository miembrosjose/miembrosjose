"use client"

// El botón flotante del grupo de Telegram.
//
// ── POR QUÉ LA DIRECCIÓN NO ESTÁ EN EL CÓDIGO ──────────────────────────────
// El grupo todavía no existe, y cuando exista su enlace puede cambiar —un
// grupo de Telegram se puede recrear, y entonces el enlace viejo lleva a un
// sitio vacío—. Escribirlo aquí obligaría a tocar el código y desplegar cada
// vez.
//
// Vive en `site_texts`, la misma tabla de textos que ya se edita desde
// Admin → Textos do Site. Poner el enlace es escribir una fila; quitarlo es
// borrarla.
//
// ── Y POR QUÉ NO SE DIBUJA SI NO HAY ENLACE ────────────────────────────────
// Un botón que no lleva a ninguna parte es peor que no tener botón: quien lo
// pulsa se queda mirando una pestaña en blanco y aprende que esta plataforma
// tiene cosas rotas. Mientras no haya dirección, no hay botón.

import { useEffect, useState } from "react"
import { useView } from "../_lib/view-context"
import { useAuth } from "../_lib/auth-context"
import s from "./telegram-fab.module.css"

/** La clave en `site_texts`. Se escribe desde el panel de textos. */
const CLAVE = "telegram_group_url"

/**
 * Solo se acepta un enlace de Telegram.
 *
 * No es desconfianza del administrador: es que un enlace mal pegado —con un
 * espacio delante, o la mitad copiada— rompería el botón en silencio, y desde
 * fuera parecería que Telegram no funciona.
 */
function enlaceValido(v: string | undefined | null): string | null {
  const s = (v || "").trim()
  if (!s) return null
  try {
    const u = new URL(s)
    const esTelegram = u.hostname === "t.me" || u.hostname === "telegram.me" || u.hostname.endsWith(".t.me")
    return u.protocol === "https:" && esTelegram ? u.toString() : null
  } catch {
    return null
  }
}

export function TelegramFab() {
  const { user } = useAuth()
  const { view } = useView()
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let vivo = true
    fetch("/api/site-texts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { overrides?: Record<string, string> } | null) => {
        if (!vivo) return
        setUrl(enlaceValido(d?.overrides?.[CLAVE]))
      })
      .catch(() => { /* sin enlace, sin botón */ })
    return () => { vivo = false }
  }, [user])

  // En la pantalla de mensajes se esconde, igual que la burbuja del chat
  // interno: ahí abajo a la izquierda está la lista de conversaciones.
  if (!user || !url || view === "messages") return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={s.fab}
      aria-label="Entrar al grupo de Telegram"
      title="Grupo de Telegram"
    >
      {/* El avión de papel, dibujado a mano: no hay icono de Telegram en la
          librería que usa el proyecto, y traer una librería entera de marcas
          por un solo símbolo no compensa. */}
      <svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M21.73 3.19a1.2 1.2 0 0 0-1.22-.2L2.9 9.86a1.2 1.2 0 0 0 .07 2.26l4.02 1.3 1.55 4.83a1.2 1.2 0 0 0 1.98.48l2.23-2.12 3.9 2.86a1.2 1.2 0 0 0 1.88-.72l3.6-14.2a1.2 1.2 0 0 0-.4-1.36ZM9.5 14.1l-.86 2.7-1.03-3.2 8.9-5.9-7.01 6.4Z" />
      </svg>
    </a>
  )
}
