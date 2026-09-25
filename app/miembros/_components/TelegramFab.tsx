"use client"

// El botón flotante de Telegram.
//
// ── POR QUÉ NO ES UN ENLACE FIJO ───────────────────────────────────────────
// Un enlace fijo al grupo lleva a todo el mundo al mismo sitio, y ahí Telegram
// no tiene forma de saber quién ha entrado. La cuenta de Telegram y la cuenta
// de Los 144.000 quedarían sin relación: ni se puede dar acceso según lo que
// alguien tenga contratado, ni retirarlo cuando deja de tenerlo.
//
// La Edge Function `telegram-link-start` devuelve una dirección para ESTA
// persona —con lo que haga falta dentro para reconocerla al otro lado—, así
// que la dirección se pide en el momento de pulsar y no se guarda en ningún
// sitio. Guardarla sería volver a tener un enlace fijo, solo que escondido.

import { useState } from "react"
import { useView } from "../_lib/view-context"
import { useAuth } from "../_lib/auth-context"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import s from "./telegram-fab.module.css"

export function TelegramFab() {
  const { user } = useAuth()
  const { view } = useView()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // En la pantalla de mensajes se esconde, igual que la burbuja del chat
  // interno: ahí abajo a la izquierda está la lista de conversaciones.
  if (!user || view === "messages") return null

  const abrir = async () => {
    if (ocupado) return
    setError(null)

    // ── LA PESTAÑA SE ABRE ANTES DE LA LLAMADA ──────────────────────────
    // Un window.open() después de un await ya no cuenta como respuesta a un
    // clic, y los navegadores lo bloquean. Se abre vacía ahora —dentro del
    // gesto— y se le pone la dirección cuando llega.
    const pestana = window.open("", "_blank")
    setOcupado(true)

    try {
      const supabase = getSupabaseBrowser()
      const { data, error: fallo } = await supabase.functions.invoke("telegram-link-start")
      if (fallo) throw fallo

      const url = (data as { telegram_url?: string } | null)?.telegram_url
      if (!url) throw new Error("No llegó ninguna dirección de Telegram.")

      if (pestana) pestana.location.href = url
      else window.location.href = url // el bloqueador paró la pestaña
    } catch (e) {
      pestana?.close()
      console.error("[telegram] link-start:", e)
      setError("No se pudo abrir Telegram. Inténtalo en un momento.")
      // El aviso se va solo: es un botón flotante, no una pantalla, y un
      // mensaje de error pegado ahí para siempre estorba más de lo que ayuda.
      window.setTimeout(() => setError(null), 6000)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className={s.zona}>
      {error && <p className={s.error} role="status">{error}</p>}

      <button
        type="button"
        onClick={abrir}
        disabled={ocupado}
        className={s.fab}
        aria-label="Entrar a Telegram"
        title="Telegram"
      >
        {ocupado ? (
          <span className={s.girando} aria-hidden />
        ) : (
          /* El avión de papel, dibujado a mano: no hay icono de Telegram en la
             librería que usa el proyecto, y traer una librería entera de
             marcas por un solo símbolo no compensa. */
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
            <path d="M21.73 3.19a1.2 1.2 0 0 0-1.22-.2L2.9 9.86a1.2 1.2 0 0 0 .07 2.26l4.02 1.3 1.55 4.83a1.2 1.2 0 0 0 1.98.48l2.23-2.12 3.9 2.86a1.2 1.2 0 0 0 1.88-.72l3.6-14.2a1.2 1.2 0 0 0-.4-1.36ZM9.5 14.1l-.86 2.7-1.03-3.2 8.9-5.9-7.01 6.4Z" />
          </svg>
        )}
      </button>
    </div>
  )
}
