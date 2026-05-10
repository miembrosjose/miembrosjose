// Mensajes com user específico → SpaHomeShell + ViewProvider parseia
// /miembros/mensajes/<userId> → view=messages, params.withUserId.

import { requireMiembrosAuth } from "../../_lib/auth-server"
import { SpaHomeShell } from "../../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function MensajesWithUserPage() {
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
