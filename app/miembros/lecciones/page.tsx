// Lecciones — view dedicada de "Compartir aprendizaje".
// SpaHomeShell + ViewProvider parseia /miembros/lecciones → view=lecciones.

import { requireMiembrosAuth } from "../_lib/auth-server"
import { SpaHomeShell } from "../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function LeccionesPage() {
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
