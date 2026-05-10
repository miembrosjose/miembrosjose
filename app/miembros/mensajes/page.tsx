// Mensajes → SpaHomeShell + ViewProvider parseia /miembros/mensajes → view=messages.
// Auth check server-side. UI client-side via SpaHomeShell.

import { requireMiembrosAuth } from "../_lib/auth-server"
import { SpaHomeShell } from "../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function MensajesPage() {
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
