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
import { TelegramFab } from "./_components/TelegramFab"
import { InvitarAInstalar } from "./_components/InvitarAInstalar"
import { PwaProvider } from "./_lib/pwa-contexto"
import { AvisoImportante } from "./_components/AvisoImportante"
import { SpaceBackground } from "./_components/SpaceBackground"
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
      {/* Fondo de estrellas persistente (capa fija detrás de todo el contenido).
          Se ve en los espacios vacíos: márgenes, huecos entre tarjetas y detrás
          de las temporadas. El contenido va en una capa con z-index encima. */}
      <SpaceBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <AuthProvider>
          {/* El estado de la aplicación en este aparato. Va aquí arriba y no
              dentro de la invitación porque Chrome lanza su evento de
              instalación a los pocos segundos de cargar: un oyente que se
              registrara medio minuto después llegaría tarde, y en Android no
              habría botón de instalar nunca. */}
          <PwaProvider>
            <OnlinePresenceProvider>
              <UnreadDMProvider>
                <ViewProvider>
                  <BroadcastProvider>{children}</BroadcastProvider>
                  {/* Toast 'fulano se conectó' — escuta app:user-online */}
                  <OnlineToast />
                  {/* Messenger flutuante (DMs internas) — bolinha canto inferior esquerdo */}
                  <MessengerWidget />
                  {/* Grupo de Telegram — encima de la burbuja del chat. Solo aparece
                      cuando hay un enlace puesto en Admin → Textos do Site. */}
                  <TelegramFab />
                  {/* Decide cuál de las dos invitaciones toca —instalar o activar
                      los avisos— y se asegura de que nunca salgan las dos a la
                      vez. No bloquea nada: la hoja se cierra tocando fuera, con
                      Escape o con el «ahora no». Los plazos: lib/pwa/reglas.ts. */}
                  {/* Lo que de verdad no puede pasarse por alto. Sale una
                      sola vez por persona, y la marca de haberlo cerrado vive
                      en el servidor: cambiar de móvil o limpiar el navegador
                      no lo hace volver. Si no hay ninguno pendiente, no
                      pinta nada. */}
                  <AvisoImportante />
                  <InvitarAInstalar />
                </ViewProvider>
              </UnreadDMProvider>
            </OnlinePresenceProvider>
          </PwaProvider>
        </AuthProvider>
      </div>
    </div>
  )
}
