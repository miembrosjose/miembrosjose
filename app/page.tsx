// Raiz do site (/) redireciona pra área de membros.
// Esse projeto é uma plataforma de membros pura — não tem landing/salespage.
// Quem acessa o domínio cai direto em /miembros (ou na tela de login se não
// estiver autenticado, controlado pelo middleware da própria rota).

import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/miembros")
}
