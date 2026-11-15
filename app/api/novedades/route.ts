// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/novedades · lo que José ha publicado, de lo más nuevo a lo viejo
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ UNA RUTA PROPIA SI LOS DATOS SON DEL FORO ─────────────────────
// Porque la pantalla de Inicio necesita una cosa que la del foro no: el
// CUERPO entero de cada novedad, para poder dibujarla ahí mismo sin que nadie
// tenga que ir a otro sitio a leerla. La lista de un espacio devuelve
// resúmenes, que es lo correcto cuando hay cincuenta conversaciones y aquí
// sería un recorte molesto en mitad de un anuncio.
//
// ── EL ESPACIO PUEDE ESTAR OCULTO ─────────────────────────────────────────
// `visible = false` significa que la sección existe, tiene contenido de
// verdad, y todavía no se ha abierto. Mientras tanto solo la ve la
// administración — que es quien la está revisando.
//
// Eso NO es una comprobación cosmética del lado del navegador: si alguien
// llama a esta dirección a mano, el servidor le contesta que no hay nada.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export type Novedad = {
  id: string
  titulo: string
  cuerpo: string
  autor: string
  creada: string
  eventoAt: string | null
  eventoZona: string | null
  ctaTexto: string | null
  ctaUrl: string | null
  respuestas: number
}

export async function GET() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const admin = getSupabaseAdmin()

  const { data: espacio } = await admin
    .from("community_spaces")
    .select("id, visible")
    .eq("slug", "novedades")
    .maybeSingle<{ id: string; visible: boolean | null }>()

  // Sin espacio, la migración no se ha corrido. No es un error que haya que
  // enseñarle a nadie: simplemente todavía no hay sección.
  if (!espacio) return NextResponse.json({ hay: false, novedades: [] })

  const puedeVer = espacio.visible === true || isAdmin(user)
  if (!puedeVer) return NextResponse.json({ hay: false, novedades: [] })

  const { data, error } = await admin
    .from("forum_posts")
    .select("id, title, body, author_name, created_at, evento_at, evento_zona, cta_texto, cta_url, replies_count")
    .eq("space_id", espacio.id)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("[novedades] no se pudieron leer:", error.message)
    return NextResponse.json({ error: "No se pudieron leer" }, { status: 500 })
  }

  const novedades: Novedad[] = (data || []).map((p) => ({
    id: p.id as string,
    titulo: p.title as string,
    cuerpo: p.body as string,
    autor: p.author_name as string,
    creada: p.created_at as string,
    eventoAt: (p.evento_at as string | null) ?? null,
    eventoZona: (p.evento_zona as string | null) ?? null,
    ctaTexto: (p.cta_texto as string | null) ?? null,
    ctaUrl: (p.cta_url as string | null) ?? null,
    respuestas: (p.replies_count as number | null) ?? 0,
  }))

  return NextResponse.json({
    hay: novedades.length > 0,
    // Para que la pantalla pueda avisar a quien la revisa de que todavía no
    // la ve nadie más. Sin ese aviso, es facilísimo darla por publicada.
    oculta: espacio.visible !== true,
    novedades,
  })
}
