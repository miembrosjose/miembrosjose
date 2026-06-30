// Home oficial da área de membros (SPA Next.js).
// Substituiu o redirect histórico pro /legacy após a Fase 6
// da migração (branch spa-migration).
//
// IMPORTANTE: validar visualmente em dev antes de pushar pra workers-migration.
// Pra rollback rápido: voltar este arquivo pra `redirect("/legacy")`.

import type { Metadata } from "next"
import { requireMiembrosAuth } from "./_lib/auth-server"
import { SpaHomeShell } from "./_components/SpaHomeShell"

export const metadata: Metadata = {
  title: "Miembros · Los 144000",
  description: "Área exclusiva de miembros de Los 144000.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function MiembrosHome() {
  // Los 144000 não usa modelo Stripe com expiração de front. Quem está
  // logado entra. Acesso por temporada/produto é controlado granularmente
  // pelas tabelas user_season_access / user_product_access.
  await requireMiembrosAuth()
  return <SpaHomeShell />
}
