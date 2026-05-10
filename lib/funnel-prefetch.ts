// ───────────────────────────────────────────────────────────────────
// Mapa de prefetch do funil — define quais assets pre-carregar em cada
// página pra que a próxima abra instantânea.
//
// Estratégia em 3 camadas:
//  - critical: <link rel="preload"> (alta prioridade) — assets da PRÓXIMA rota
//  - likely:   <link rel="prefetch"> (idle) — assets de 1-2 rotas à frente
//  - nextRoute: router.prefetch() do Next.js — pre-render do HTML/JS da próxima
//
// Sequência do funil:
// / → /call → /quiz → /audio → /payaso → /pantalla → /whats → /tiktok → /salespage
// ───────────────────────────────────────────────────────────────────

export type AssetType = "video" | "audio" | "image" | "fetch"

export interface PrefetchAsset {
  href: string
  as: AssetType
}

export interface FunnelStageConfig {
  nextRoute?: string
  critical: PrefetchAsset[]
  likely: PrefetchAsset[]
}

import { VIDEO_QUIZ, VIDEO_PAYASO } from "@/lib/cdn-video"

const CDN = "https://cdn.SEU_DOMINIO.com"

// Assets compartilhados / chave
const AUDIO_CALL = `${CDN}/audio-call.mp3`
const IMG_AUDIO = `${CDN}/cdn-cgi/image/format=auto,quality=85,width=1080/Design-sem-nome-2026-04-04T213426.929-_1_.webp`
const IMG_PANTALLA_HERO = `${CDN}/cdn-cgi/image/format=auto,quality=85,width=1080/imgi_1_CRIE-UM-FUNIL-GAMIFICADO-IGUAL-AO-QUE-VOC%C3%8A-VIU-EM-POUCOS-MINUTOS-_40_-mbrj9oNiW1Cjm1y6dfPLbcvfe0yMYJ%20(1).webp`
const IMG_GEMINI = `${CDN}/cdn-cgi/image/format=auto,quality=85,width=360/Gemini_Generated_Image_k41390k41390k413-_1_.webp`
const IMG_WHATS = `${CDN}/cdn-cgi/image/format=auto,quality=85,width=1080/imgi_6_photo-1573339607881-208e75e4b267-ldXMwfVQVYM7GWmvhy9CKhssB4deGt.webp`
const IMG_TIKTOK = `${CDN}/cdn-cgi/image/format=auto,quality=85,width=540/imgi_2_Design-sem-nome-2026-01-03T000026.459-MAaeHvZWK3i4mVOmcgOoVkQQxSCGgl.webp`
const IMG_SALESPAGE_HERO = `${CDN}/cdn-cgi/image/format=auto,quality=85,width=1080/imgi_1_Design-sem-nome-2026-01-10T050158.703-BQv1e79x4ZCrXhGM34GHEklrJxwP7v.webp`

export const FUNNEL_PREFETCH: Record<string, FunnelStageConfig> = {
  // / → /call
  "/": {
    nextRoute: "/call",
    critical: [
      // O vídeo de /call já é preloadado via <link> no head de page.tsx
      // Aqui adicionamos o áudio que toca durante a chamada
      { href: AUDIO_CALL, as: "audio" },
    ],
    // Vídeo do quiz NÃO prefetchado aqui — só em /call (critical) pra evitar
    // baixar 2 MB pra users que dão bounce na home antes de clicar "Entrar".
    likely: [],
  },

  // /call → /quiz
  "/call": {
    nextRoute: "/quiz",
    critical: [{ href: VIDEO_QUIZ, as: "video" }],
    likely: [{ href: IMG_AUDIO, as: "image" }],
  },

  // /quiz → /audio
  "/quiz": {
    nextRoute: "/audio",
    critical: [{ href: IMG_AUDIO, as: "image" }],
    likely: [{ href: VIDEO_PAYASO, as: "video" }],
  },

  // /audio → /payaso
  "/audio": {
    nextRoute: "/payaso",
    critical: [{ href: VIDEO_PAYASO, as: "video" }],
    likely: [
      { href: IMG_PANTALLA_HERO, as: "image" },
      { href: IMG_GEMINI, as: "image" },
    ],
  },

  // /payaso → /pantalla
  "/payaso": {
    nextRoute: "/pantalla",
    critical: [
      { href: IMG_PANTALLA_HERO, as: "image" },
      { href: IMG_GEMINI, as: "image" },
    ],
    likely: [
      { href: IMG_WHATS, as: "image" },
      { href: IMG_GEMINI, as: "image" },
    ],
  },

  // /pantalla → /whats
  "/pantalla": {
    nextRoute: "/whats",
    critical: [
      { href: IMG_WHATS, as: "image" },
      { href: IMG_GEMINI, as: "image" },
    ],
    likely: [{ href: IMG_TIKTOK, as: "image" }],
  },

  // /whats → /tiktok
  "/whats": {
    nextRoute: "/tiktok",
    critical: [{ href: IMG_TIKTOK, as: "image" }],
    likely: [{ href: IMG_SALESPAGE_HERO, as: "image" }],
  },

  // /tiktok → /salespage
  "/tiktok": {
    nextRoute: "/salespage",
    critical: [{ href: IMG_SALESPAGE_HERO, as: "image" }],
    likely: [],
  },
}
