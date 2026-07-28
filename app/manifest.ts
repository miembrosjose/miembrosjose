import type { MetadataRoute } from "next"

// Manifest mínimo (identidad Los 144.000). Usa el favicon público existente.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Los 144.000",
    short_name: "Los 144.000",
    description: "Área de miembros de Los 144.000.",
    start_url: "/miembros",
    display: "standalone",
    background_color: "#050510",
    theme_color: "#050510",
    icons: [
      { src: "/favicon.png", sizes: "any", type: "image/png" },
    ],
  }
}
