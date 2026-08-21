// Catálogo SERVER-ONLY de meditaciones.
//
// Guarda el OBJECT KEY de R2 (no una URL pública) y el nivel de acceso. Este
// módulo lo importa SOLO el endpoint de streaming en el servidor; nunca un
// componente cliente (así el object key jamás llega al bundle del navegador).
//
// Para añadir una meditación de prueba: sube el .mp3 al bucket privado
// `los144000-media` bajo el key indicado y ajusta `objectKey` aquí.
// (Iteración 1: catálogo en código. Migrable a tabla Supabase más adelante.)

export type MeditationAccess = "included" | "premium"

export type ServerMeditation = {
  id: string
  access: MeditationAccess
  /** Object key en el bucket privado los144000-media (NO una URL pública). */
  objectKey: string
  /** Preparados para el sistema de compras premium (aún sin implementar). */
  stripeProductId?: string | null
  stripePriceId?: string | null
}

const CATALOG: Record<string, ServerMeditation> = {
  // ── Temporada 1 · Ep. 5 "El Nombre que Olvidaste" ──────────────────────────
  "s1e5-nombre-included": {
    id: "s1e5-nombre-included",
    access: "included",
    // ⬇️ Ajusta al key real que subas a R2 (bucket los144000-media).
    objectKey: "audio/included/Temporada 1/nombre-cosmico-sintonia.mp3",
  },
  "s1e5-nombre-premium": {
    id: "s1e5-nombre-premium",
    access: "premium",
    objectKey: "audio/premium/Temporada 1/nombre-cosmico-activacion.mp3",
    stripeProductId: null,
    stripePriceId: null,
  },
}

export function getServerMeditation(id: string): ServerMeditation | null {
  return CATALOG[id] ?? null
}
