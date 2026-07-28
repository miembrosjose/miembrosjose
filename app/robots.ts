import type { MetadataRoute } from "next"
import { LEGAL } from "@/lib/site/legal-config"

// Público: raíz + páginas legales/soporte. Privado/no indexable: área de
// miembros, APIs, y flujos de acceso (activación, confirmación, /auth).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/miembros/",
          "/api/",
          "/auth/",
          "/activar-cuenta",
          "/recuperar-acceso/",
          "/recuperar-contrasena",
          "/preview/",
        ],
      },
    ],
    sitemap: `${LEGAL.siteUrl}/sitemap.xml`,
    host: LEGAL.siteUrl,
  }
}
