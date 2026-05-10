// Perfil público de outro membro → SpaHomeShell + ViewProvider parseia
// /miembros/u/<id> → view=user, params.userId. Dados via /api/profile/public/[id].

import { requireMiembrosAuth } from "../../_lib/auth-server"
import { SpaHomeShell } from "../../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function PublicProfilePage() {
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
