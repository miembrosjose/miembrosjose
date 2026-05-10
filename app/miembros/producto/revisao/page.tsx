// Revisión de Embudo (producto) → SpaHomeShell + ViewProvider parseia
// /miembros/producto/revisao → view=producto, params.slug=revisao.

import { requireMiembrosAuth } from "../../_lib/auth-server"
import { SpaHomeShell } from "../../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function RevisaoProductoPage() {
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
