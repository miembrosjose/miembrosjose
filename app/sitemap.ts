import type { MetadataRoute } from "next"
import { LEGAL } from "@/lib/site/legal-config"

// Solo URLs públicas indexables (legales + soporte). No incluye /miembros,
// APIs ni flujos de acceso privados.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const paths = [LEGAL.termsPath, LEGAL.privacyPath, LEGAL.refundsPath, LEGAL.supportPath]
  return paths.map((p) => ({
    url: `${LEGAL.siteUrl}${p}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }))
}
