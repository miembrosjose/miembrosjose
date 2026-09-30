// API pública (autenticada) — retorna todos overrides de site_texts.
// Usado no boot da area de membros pra aplicar textos editados pelo admin.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Claves que NUNCA salen de aquí.
 *
 * ── EL FALLO QUE CIERRA ────────────────────────────────────────────────────
 * Esta respuesta lleva TODOS los textos del sitio a CUALQUIER usuario con
 * sesión. Eso está bien para títulos y párrafos, que es para lo que se hizo.
 *
 * Pero `umbral.cta_url` guardaba el enlace del grupo privado al que solo
 * debería llegar quien haya completado la Temporada 4. Estaba viajando al
 * navegador de todo el mundo: bastaba abrir la consola recién registrado y
 * leerlo. La puerta del Umbral se veía cerrada y no lo estaba.
 *
 * El acceso a esa comunidad ya no pasa por aquí —lo emite la Edge Function
 * `telegram-protocols-access`, a nombre de una persona y por cinco minutos—,
 * así que esta clave no tiene nada que hacer en una respuesta pública.
 *
 * Esto es una lista corta a propósito. No es el sitio para decidir qué es
 * sensible en general: es el sitio para que un enlace de acceso no se
 * reparta. Cualquier clave nueva que conceda acceso a algo va aquí.
 */
const NO_SALEN = new Set(["umbral.cta_url"])

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data, error } = await supabase.from("site_texts").select("key, value")
  if (error) {
    console.error("[/api/site-texts]", error)
    return NextResponse.json({ overrides: {} })
  }

  const overrides: Record<string, string> = {}
  for (const row of data || []) {
    if (NO_SALEN.has(row.key)) continue
    overrides[row.key] = row.value
  }
  return NextResponse.json({ overrides })
}
