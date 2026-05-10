// Embudo (producto) → SpaHomeShell + ViewProvider parseia /miembros/producto/embudo
// → view=producto, params.slug=embudo. UI inteira é client-side.

import { requireMiembrosAuth } from "../../_lib/auth-server"
import { SpaHomeShell } from "../../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function EmbudoProductoPage() {
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
