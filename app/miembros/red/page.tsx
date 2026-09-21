// La Red — explorar miembros por territorio. Vista del SPA con ruta propia,
// igual que /miembros/personas: permite enlazar y compartir la sección.
import { requireMiembrosAuth } from "../_lib/auth-server"
import { SpaHomeShell } from "../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function RedPage() {
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
