// Catálogo SERVER-ONLY de meditaciones.
//
// Fuente de verdad: tabla Supabase `meditations` (catálogo, precio, acceso y
// object key privado de R2). Fallback a un pequeño mapa en código para la
// meditación INCLUIDA de prueba (así sigue funcionando aunque la tabla aún no
// esté sembrada). El object key jamás llega al cliente (esto es server-only).

import { getSupabaseAdmin } from "@/lib/supabase/admin"

export type MeditationAccess = "included" | "premium"

export type ServerMeditation = {
  id: string
  accessType: MeditationAccess
  /** Object key en el bucket privado los144000-media (NO una URL pública). */
  objectKey: string
  priceCents: number
  currency: string
  title: string
  subtitle: string | null
  isPurchasable: boolean
}

// Fallback en código — solo para la incluida de prueba ya en producción.
const CODE_FALLBACK: Record<string, ServerMeditation> = {
  "s1e5-nombre-included": {
    id: "s1e5-nombre-included",
    accessType: "included",
    objectKey: "audio/included/Temporada 1/nombre-cosmico-sintonia.mp3",
    priceCents: 0,
    currency: "usd",
    title: "Sintonía con el Nombre Cósmico",
    subtitle: null,
    isPurchasable: false,
  },
}

type MeditationRow = {
  id: string
  access_type: MeditationAccess
  audio_object_key: string
  price_cents: number
  currency: string
  title: string
  subtitle: string | null
  is_purchasable: boolean
}

function mapRow(r: MeditationRow): ServerMeditation {
  return {
    id: r.id,
    accessType: r.access_type,
    objectKey: r.audio_object_key,
    priceCents: r.price_cents ?? 0,
    currency: (r.currency || "usd").toLowerCase(),
    title: r.title,
    subtitle: r.subtitle ?? null,
    isPurchasable: !!r.is_purchasable,
  }
}

/** Resuelve una meditación por id (DB → fallback en código). */
export async function getServerMeditation(id: string): Promise<ServerMeditation | null> {
  try {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from("meditations")
      .select("id, access_type, audio_object_key, price_cents, currency, title, subtitle, is_purchasable")
      .eq("id", id)
      .maybeSingle()
    if (data) return mapRow(data as MeditationRow)
  } catch {
    // Sin tabla / sin service key → usa fallback.
  }
  return CODE_FALLBACK[id] ?? null
}
