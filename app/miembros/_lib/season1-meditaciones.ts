// Metadatos CLIENTE de las meditaciones por episodio (Temporada 1).
// NO contiene el object key de R2 (eso vive solo en el servidor: lib/meditations.ts).
// El audio se solicita al endpoint seguro /api/meditations/<id>/audio, que valida
// sesión + membresía + (para premium) entitlement antes de servir el MP3.

export type MeditationClient = {
  /** Debe coincidir con el id del catálogo servidor (lib/meditations.ts). */
  id: string
  access: "included" | "premium"
  title: string
  subtitle?: string
  /** Portada opcional (URL pública de imagen; el audio NUNCA es público). */
  image?: string
  /** Duración conocida en segundos (para mostrar en el estado bloqueado). */
  durationSec?: number
  /** Precio para premium (ej. "4.99"). */
  price?: string
}

// ── Episodio 5 · El Nombre que Olvidaste ────────────────────────────────────
const EP5_MEDITACIONES: MeditationClient[] = [
  {
    id: "s1e5-nombre-included",
    access: "included",
    title: "Sintonía con el Nombre Cósmico",
    subtitle: "Aquieta la mente y abre el silencio interior para percibir tu vibración.",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/Gu%C3%ADas%20foto%20meditaciones/Sergel-included.jpg",
  },
  {
    id: "s1e5-nombre-premium",
    access: "premium",
    title: "Activación del Nombre Cósmico",
    subtitle: "Práctica guiada completa: recibir, vocalizar y afinar tu nombre cósmico.",
    price: "4.99",
    image: "https://pub-f5fdabac2063461c88f966702309c7a3.r2.dev/Gu%C3%ADas%20foto%20meditaciones/Sergel-premium.jpg",
  },
]

export function getSeason1Meditaciones(num: number, title: string): MeditationClient[] {
  const t = (title || "").toLowerCase()
  if (num === 5 || (/nombre/.test(t) && /olvid/.test(t))) return EP5_MEDITACIONES
  return []
}
