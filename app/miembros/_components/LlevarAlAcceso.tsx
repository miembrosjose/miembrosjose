"use client"

// Manda a la pantalla de acceso en cuanto la página se dibuja.
//
// ── POR QUÉ ESTO Y NO UNA REDIRECCIÓN DEL SERVIDOR ────────────────────────
// Porque una redirección del servidor no deja HTML, y sin HTML el robot que
// dibuja la tarjeta de WhatsApp o de Telegram no encuentra ningún título que
// leer: pinta el genérico del sitio para todas las grabaciones.
//
// Los robots de previsualización no ejecutan JavaScript. Así que esto manda a
// la persona —que sí lo ejecuta— y deja quieto al robot, que se queda con el
// título y la portada de la página.
//
// ── `replace` Y NO `push` ─────────────────────────────────────────────────
// Para que esta página no quede en el historial. Con `push`, el botón de
// volver del navegador traería aquí otra vez, y desde aquí se saldría de
// nuevo al acceso: la persona quedaría dando vueltas sin poder retroceder.

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function LlevarAlAcceso({ destino }: { destino: string }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/miembros/login?redirectTo=${encodeURIComponent(destino)}`)
  }, [router, destino])

  return null
}
