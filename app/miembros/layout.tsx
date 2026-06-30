// Layout raiz da área de membros — wrappa TODAS as rotas /miembros/*
//
// Responsabilidades:
//  - Carrega fontes da marca (Bebas Neue, DM Sans, JetBrains Mono — Cinzel já vem do app/layout.tsx)
//  - Aplica .miembros-shell wrapper com design tokens escopados
//  - Monta AuthProvider client-side (user/session/isAdmin disponível em qualquer filho)
//
// NÃO renderiza UI específica — só providers e wrapper. Cada page.tsx filha
// cuida do próprio layout visual. Assim páginas existentes (/perfil, /admin,
// /u/[id], etc) continuam funcionando sem regressão.

import type { Metadata } from "next"
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google"
import { AuthProvider } from "./_lib/auth-context"
import { BroadcastProvider } from "./_lib/broadcast-context"
import { ViewProvider } from "./_lib/view-context"
import { OnlinePresenceProvider } from "./_lib/online-presence"
import { UnreadDMProvider } from "./_lib/unread-dm"
import { OnlineToast } from "./_components/OnlineToast"
import { MessengerWidget } from "./_components/MessengerWidget"
import "./_styles/tokens.css"
import "./_styles/episode-notes.css"

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-bebas",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-dm-sans",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  title: "Miembros · Los 144000",
  description: "Área exclusiva de miembros de Los 144000.",
  robots: { index: false, follow: false },
}

export default function MiembrosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${bebas.variable} ${dmSans.variable} ${jetbrains.variable} miembros-shell`}>
      <AuthProvider>
        <OnlinePresenceProvider>
          <UnreadDMProvider>
            <ViewProvider>
              <BroadcastProvider>{children}</BroadcastProvider>
              {/* Toast 'fulano se conectó' — escuta app:user-online */}
              <OnlineToast />
              {/* Messenger flutuante (DMs internas) — bolinha canto inferior esquerdo */}
              <MessengerWidget />
            </ViewProvider>
          </UnreadDMProvider>
        </OnlinePresenceProvider>
      </AuthProvider>
    </div>
  )
}
