// Andrómeda.ADS → SpaHomeShell + ViewProvider parseia /miembros/producto/andromeda
// → view=producto, params.slug=andromeda. Ownership check feito client-side em ViewProducto.

import { requireMiembrosAuth } from "../../_lib/auth-server"
import { SpaHomeShell } from "../../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function AndromedaPage() {
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
