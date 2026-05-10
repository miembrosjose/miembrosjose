// Perfil → SpaHomeShell + ViewProvider parseia /miembros/perfil → view=perfil.
// Auth check server-side mantido. UI inteira é client-side via SpaHomeShell.

import { requireMiembrosAuth } from "../_lib/auth-server"
import { SpaHomeShell } from "../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
