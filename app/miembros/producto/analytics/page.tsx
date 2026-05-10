// Analytics → SpaHomeShell + ViewProvider parseia /miembros/producto/analytics
// → view=producto, params.slug=analytics. Ownership check feito client-side.

import { requireMiembrosAuth } from "../../_lib/auth-server"
import { SpaHomeShell } from "../../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
