import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Cinzel } from "next/font/google"
import { GlobalAudioProvider } from "@/components/global-audio-provider"
import { StorageMigrator } from "@/components/storage-migrator"
import { ErrorTracker } from "@/components/error-tracker"
import "./globals.css"

// OTIMIZAÇÃO DE FONTES: 'display: "swap"' adicionado para garantir que o texto 
// apareça instantaneamente, sem deixar buracos invisíveis na tela.
const geist = Geist({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
})

// MANTIDO: Todos os pesos da Cinzel preservados para garantir fidelidade ao design.
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
  variable: "--font-cinzel",
})

export const metadata: Metadata = {
  other: {
    "facebook-domain-verification": "SEU_FB_DOMAIN_VERIFICATION_TOKEN",
    "format-detection": "telephone=no",
  },
  title: "[BRAND_NAME]",
  description: "[BRAND_DESCRIPTION]",
  keywords: ["copywriting", "anuncios", "marketing digital", "ventas", "conversiones"],
  authors: [{ name: "[BRAND_NAME]" }],
  openGraph: {
    title: "[BRAND_NAME]",
    description: "[BRAND_DESCRIPTION]",
    type: "website",
    locale: "es_LA",
    siteName: "[BRAND_NAME]",
  },
  twitter: {
    card: "summary_large_image",
    title: "[BRAND_NAME]",
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
      className={`bg-black text-white ${geist.variable} ${cinzel.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://cdn.SEU_DOMINIO.com" />
        <link rel="dns-prefetch" href="https://cdn.SEU_DOMINIO.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.facebook.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
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
