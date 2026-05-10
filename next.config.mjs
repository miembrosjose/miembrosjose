/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/dashapp",       destination: "/analytics",  permanent: true },
      { source: "/michaelazo",    destination: "/creativos",  permanent: true },
      { source: "/campanas",      destination: "/andromeda",  permanent: true },
      { source: "/salespagees",   destination: "/salespage",  permanent: true },
      { source: "/salespageusa",  destination: "/salespage",  permanent: true },
      { source: "/salespagelib",  destination: "/salespage",  permanent: true },
      { source: "/salespagech",   destination: "/salespage",  permanent: true },
    ]
  },
  // Headers de segurança são aplicados via middleware.ts (única fonte de verdade).
  // Manter aqui também causaria CSP duplicado no Workers (intersecção bloqueia scripts
  // legítimos como Clarity, Adsmurai). No Pages legacy, isso era ok porque next.config
  // só aplicava em rotas estáticas e middleware nas Edge — comportamento mudou no Workers.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Cloudflare Pages não suporta o otimizador de imagens do Next.js
  // (rota /_next/image) — sem isso, todo <Image> de next/image quebra.
  images: {
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  skipProxyUrlNormalize: true,
  trailingSlash: false,
}

export default nextConfig
