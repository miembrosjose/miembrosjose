// Lista de miembros — view publica.
import { requireMiembrosAuth } from "../_lib/auth-server"
import { SpaHomeShell } from "../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function PersonasPage() {
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
