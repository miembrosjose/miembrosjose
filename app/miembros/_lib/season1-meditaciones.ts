// Meditaciones complementarias por episodio (Temporada 1).
// Se muestran DEBAJO del archivo del episodio, con <MeditacionCard>.
//
// Cada episodio puede tener varias: normalmente una gratuita y una de pago.
// Los enlaces (mediaUrl para reproducir · checkoutUrl para comprar) se completan
// cuando el creador los envía; sin enlace, la tarjeta queda "Disponible pronto".

import type { MeditacionData } from "@/components/MeditacionCard"

// ── Episodio 5 · El Nombre que Olvidaste ────────────────────────────────────
const EP5_MEDITACIONES: MeditacionData[] = [
  {
    variant: "free",
    title: "Sintonía con el Nombre Cósmico",
    description:
      "Práctica breve para aquietar la mente, abrir el silencio interior y comenzar a percibir la vibración de tu nombre desde planos profundos.",
    // image: "", // portada (opcional) — pendiente
    // mediaUrl: "", // audio/video — pendiente
  },
  {
    variant: "paid",
    title: "Activación del Nombre Cósmico",
    description:
      "Meditación guiada completa para recibir, vocalizar y afinar tu nombre cósmico. Trabaja el sonido de origen y la terminación del despertar, integrando la clave vibracional del alma.",
    price: "4.99",
    // image: "", // portada (opcional) — pendiente
    // checkoutUrl: "", // enlace de compra (Stripe Payment Link) — pendiente
    // mediaUrl: "", // audio/video (se reproduce tras desbloquear) — pendiente
  },
]

export function getSeason1Meditaciones(num: number, title: string): MeditacionData[] {
  const t = (title || "").toLowerCase()
  if (num === 5 || (/nombre/.test(t) && /olvid/.test(t))) return EP5_MEDITACIONES
  return []
}
