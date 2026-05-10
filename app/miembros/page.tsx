// Home oficial da área de membros (SPA Next.js).
// Substituiu o redirect histórico pro /area-prototipo.html após a Fase 6
// da migração (branch spa-migration).
//
// IMPORTANTE: validar visualmente em dev antes de pushar pra workers-migration.
// Pra rollback rápido: voltar este arquivo pra `redirect("/area-prototipo.html")`.

import type { Metadata } from "next"
import { requireFrontAccess } from "./_lib/auth-server"
import { SpaHomeShell } from "./_components/SpaHomeShell"

export const metadata: Metadata = {
  title: "Miembros · [BRAND_NAME]",
  description: "Área exclusiva de miembros de [BRAND_NAME].",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function MiembrosHome() {
  // requireFrontAccess: redireciona pra /miembros/acceso-vencido se front
  // expirou. SEM período de graça — vence é vence. Cliente foi avisado
  // por banner 30/15/7 dias antes. Admin pode renovar manualmente via
  // painel /miembros/admin → Miembros → botão Renovar +1 año.
  await requireFrontAccess()
  return <SpaHomeShell />
}
