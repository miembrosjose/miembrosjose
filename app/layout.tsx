import type React from "react"
import type { Metadata, Viewport } from "next"
import { Manrope, Orbitron } from "next/font/google"
import { GlobalAudioProvider } from "@/components/global-audio-provider"
import { StorageMigrator } from "@/components/storage-migrator"
import { ErrorTracker } from "@/components/error-tracker"
import "./globals.css"

// Body font — Manrope (sans-serif moderno, neutro, 200-800 variável).
// Substitui Geist. CSS variable mantém nome legado (--font-geist-sans)
// pra não quebrar ~30 arquivos que referenciam direto.
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
})

// Display font — Orbitron (geométrica futurista aerospace).
// Substitui Cinzel. CSS variable mantém nome legado (--font-cinzel)
// pra não exigir refactor em todos os componentes.
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-cinzel",
})

export const metadata: Metadata = {
  other: {
    "facebook-domain-verification": "ld18wruw48u1gsm1a6qd2nwp71ri61",
    "format-detection": "telephone=no",
  },
  title: "Los 144000",
  description: "[BRAND_DESCRIPTION]",
  keywords: ["copywriting", "anuncios", "marketing digital", "ventas", "conversiones"],
  authors: [{ name: "Los 144000" }],
  openGraph: {
    title: "Los 144000",
    description: "[BRAND_DESCRIPTION]",
    type: "website",
    locale: "es_LA",
    siteName: "Los 144000",
  },
  twitter: {
    card: "summary_large_image",
    title: "Los 144000",
    description: "[BRAND_DESCRIPTION]",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
    generator: 'v0.app'
}

// OTIMIZAÇÃO DE VIEWPORT: Limpo de regras restritivas para garantir nota 100 em SEO e Acessibilidade no Google.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // BLINDAGEM MÁXIMA: Fundo preto cravado na raiz e variáveis de fontes devidamente injetadas
    <html
      lang="es"
      className={`bg-black text-white ${manrope.variable} ${orbitron.variable}`}
    >
      <head>
        {/* DNS prefetch pro R2 (hero video, thumbs de temporada/episódio) */}
        <link rel="preconnect" href="https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev" />
        <link rel="dns-prefetch" href="https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev" />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased bg-black text-white min-h-[100dvh] overflow-x-hidden selection:bg-red-900/30">
        <noscript>
          <div style={{ padding: "32px 24px", textAlign: "center", fontFamily: "system-ui, sans-serif", color: "white", background: "black", minHeight: "100dvh" }}>
            <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>JavaScript desativado</h1>
            <p style={{ fontSize: "14px", color: "#999", maxWidth: "400px", margin: "0 auto" }}>
              Este site requer JavaScript para funcionar. Por favor, ative o JavaScript no seu navegador
              e recarregue a página.
            </p>
          </div>
        </noscript>
        <StorageMigrator />
        <ErrorTracker />
        <GlobalAudioProvider>
          {children}
        </GlobalAudioProvider>
      </body>
    </html>
  )
}
