import type { MetadataRoute } from "next"

// Manifest mínimo (identidad Los 144.000).
//
// El icono es app/icon.svg, que Next.js sirve en /icon.svg. Antes apuntaba a
// "/favicon.png", que no existía: el navegador no podía leerlo y al guardar la
// web en la pantalla de inicio salía sin icono.
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
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  }
}
