// Admin → SpaHomeShell + ViewProvider parseia /miembros/admin → view=admin.
// Auth + isAdmin check server-side mantidos.

import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin"
import { requireMiembrosAuth } from "../_lib/auth-server"
import { SpaHomeShell } from "../_components/SpaHomeShell"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const { user } = await requireMiembrosAuth()
  // Dev bypass devolve user=null — só checa admin em prod (com user real)
  if (user && !isAdmin(user)) redirect("/miembros")
  return <SpaHomeShell />
}
