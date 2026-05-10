// Helper pra transformar imagens do CDN R2 via Cloudflare Image Resizing.
//
// Cloudflare automaticamente:
//  - Serve AVIF se browser aceita (-66% vs WebP original)
//  - Serve WebP se AVIF não suportado
//  - Cacheia transformações no edge (1ª vez é miss, demais hit)
//
// Uso:
//   cdnImage("imgi_hero.webp", { width: 1080, quality: 85 })
//   → "https://cdn.SEU_DOMINIO.com/cdn-cgi/image/width=1080,quality=85,format=auto/imgi_hero.webp"

const CDN_BASE = "https://cdn.SEU_DOMINIO.com"

type ImageOptions = {
  /** Largura máxima em pixels (Cloudflare ajusta proporcionalmente) */
  width?: number
  /** Qualidade JPEG/AVIF/WebP de 1-100 (default 85, sweet spot visual/peso) */
  quality?: number
  /** Formato — 'auto' deixa Cloudflare escolher melhor pro browser */
  format?: "auto" | "avif" | "webp" | "jpeg" | "png"
}

export function cdnImage(filename: string, opts: ImageOptions = {}): string {
  const { width, quality = 85, format = "auto" } = opts
  const params: string[] = [`format=${format}`, `quality=${quality}`]
  if (width) params.push(`width=${width}`)
  return `${CDN_BASE}/cdn-cgi/image/${params.join(",")}/${filename}`
}

/**
 * Hero cinematográfica usada na home, salespage, pause-intro.
 * Original: 963×1920 webp = 141 KB.
 * Com resize 1080w + AVIF auto: ~50-80 KB.
 *
 * 1080w cobre retina de iPhone Pro Max sem perder nitidez,
 * e fica suave o suficiente em desktop FullHD com gradient overlay.
 */
export const HERO_IMAGE = cdnImage(
  "imgi_1_Design-sem-nome-2026-01-10T050158.703-BQv1e79x4ZCrXhGM34GHEklrJxwP7v.webp",
  { width: 1080, quality: 85 },
)

/**
 * Background cinematográfico da página /call.
 * Original: 3344×6666 = 1.07 MB (over-resolution massiva).
 * Display real: 463×823 px.
 * Com resize 1080w + AVIF: ~50-80 KB (-95%).
 */
export const IMG_CALL_BACKGROUND = cdnImage(
  "imgi_1_Design-sem-nome-2026-02-10T222909.844.webp-BwKYyodXUJVdXyVZtrXzLO173PUyNS.webp",
  { width: 1080, quality: 85 },
)

/**
 * Avatar do Michael — usado em /call (foto de perfil em chamada, 140x140)
 * e /tiktok (circle 56x56). Width 540 cobre 3x retina dos dois casos.
 * Original: 500×500 = 11.7 KB.
 * Com resize 540w + AVIF: ~5-8 KB.
 */
export const IMG_MICHAEL_AVATAR = cdnImage(
  "imgi_2_Design-sem-nome-2026-01-03T000026.459-MAaeHvZWK3i4mVOmcgOoVkQQxSCGgl.webp",
  { width: 540, quality: 85 },
)

/**
 * Avatar Lise — usado em /pantalla (notification preview pequena) e
 * /whats (avatar 40x40 nas mensagens). Original era 2 MB!
 * Com resize 360w + AVIF: ~30 KB (-98%).
 */
export const IMG_LISE_AVATAR = cdnImage(
  "Gemini_Generated_Image_k41390k41390k413-_1_.webp",
  { width: 360, quality: 85 },
)

/**
 * Background do /whats (foto de café/escritório).
 * Original: 662 KB. Com resize 1080w + AVIF: ~80 KB (-88%).
 */
export const IMG_WHATS_BACKGROUND = cdnImage(
  "imgi_6_photo-1573339607881-208e75e4b267-ldXMwfVQVYM7GWmvhy9CKhssB4deGt.webp",
  { width: 1080, quality: 85 },
)

/**
 * Background da /audio (scanner cinematográfico).
 * Original: 327 KB. Com resize 1080w + AVIF: ~50 KB (-85%).
 */
export const IMG_AUDIO_BACKGROUND = cdnImage(
  "Design-sem-nome-2026-04-04T213426.929-_1_.webp",
  { width: 1080, quality: 85 },
)

/**
 * Imagem usada no salespage (proof section "No es promesa").
 * Original: 664 KB. Com resize 720w + AVIF: ~50 KB (-92%).
 */
export const IMG_PROOF_RESULTS = cdnImage(
  "Design-sem-nome-2026-04-09T225813.719.webp",
  { width: 720, quality: 85 },
)

/**
 * Banner topo do checkout — usado em checkout-template e standalone-checkout.
 * Original PNG: 244 KB. Com resize 1080w + AVIF auto: ~40-60 KB (-80%).
 */
export const IMG_CHECKOUT_BANNER = cdnImage(
  "bannercheckout.png",
  { width: 1080, quality: 85 },
)
