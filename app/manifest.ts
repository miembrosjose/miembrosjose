import type { MetadataRoute } from "next"

// EL MANIFEST — lo que convierte la web en una aplicación instalable.
//
// ── POR QUÉ HACEN FALTA PNG SI YA HABÍA UN SVG ─────────────────────────────
// Esto declaraba un solo icono SVG con `sizes: "any"`. Es válido, y aun así
// Android NO ofrecía instalar la aplicación: Chrome exige PNG de 192 y 512
// para mostrar el aviso de instalación, y cuando no los encuentra no avisa de
// nada. Simplemente no aparece la opción, sin un error que lo explique.
//
// Los PNG se generan desde app/icon.svg —el mismo emblema de la pestaña— así
// que no hay dos identidades: hay una, en dos formatos.
//
// ── POR QUÉ IMPORTA ESTO MÁS DE LO QUE PARECE ──────────────────────────────
// En iPhone, las notificaciones web SOLO funcionan si la persona ha añadido la
// web a su pantalla de inicio. Si no se puede instalar bien, no hay avisos en
// el móvil. El manifest no es un adorno: es el primer eslabón.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Los 144.000",
    short_name: "Los 144.000",
    description:
      "La Red de Los 144.000: tu preparación, las transmisiones y la comunidad, siempre contigo.",

    // `start_url` y `scope` apuntan al área de miembros, no a la raíz. Quien
    // abre desde el icono quiere entrar, no ver una página de bienvenida.
    start_url: "/miembros",
    scope: "/",
    display: "standalone",
    orientation: "portrait",

    background_color: "#050510",
    theme_color: "#050510",
    lang: "es",
    categories: ["education", "lifestyle"],

    icons: [
      // `any` es el icono normal. `maskable` lo usa Android cuando recorta a
      // la forma del sistema —círculo, gota, cuadrado redondeado—: lleva el
      // emblema encogido para que ninguna forma se coma las esquinas.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      // El vectorial se queda: lo usan los navegadores que lo prefieren, y no
      // estorba a los que piden PNG.
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  }
}
