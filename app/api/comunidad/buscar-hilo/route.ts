// API — ¿dónde vive esta conversación?
//
//   GET /api/comunidad/buscar-hilo?titulo=...
//
// Los portales del Camino y algunos módulos llevan a un tema concreto del
// foro. Antes bastaba con el título: el foro era una lista y la pantalla
// buscaba esa fila. Ahora hay diez espacios, y el título por sí solo no dice
// en cuál está.
//
// Esto lo resuelve en el servidor y devuelve DÓNDE: el espacio y el
// identificador. Con eso, la pantalla abre el sitio exacto en vez de dejar a
// la gente en la puerta de la comunidad buscando a mano.
//
// El acceso se comprueba igual que en todo lo demás: si la conversación vive
// en una temporada cerrada, aquí no aparece.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { contextoDe } from "@/lib/comunidad/acceso"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const titulo = (req.nextUrl.searchParams.get("titulo") || "").trim()
  if (!titulo) return NextResponse.json({ error: "Falta el título" }, { status: 400 })

  const ctx = await contextoDe(user)
  if (ctx.legibles.length === 0) return NextResponse.json({ encontrado: false })

  // Se busca por el primer tramo del título, antes del guion largo. Los temas
  // del Camino se llaman «Temporada 2 · La Estructura del Cosmos — ¿Qué
  // cambió…?», y quien enlaza desde un portal a veces manda solo la primera
  // parte. Buscar por el tramo inicial aguanta además una edición del final.
  const raiz = titulo.split(" — ")[0].trim().replace(/[,()%*\\]/g, " ")

  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from("forum_posts")
    .select("id, title, space_id")
    .in("space_id", ctx.legibles)
    .ilike("title", `${raiz}%`)
    .order("pinned", { ascending: false })
    .limit(5)

  const filas = (data || []) as Array<{ id: string; title: string; space_id: string }>
  // Exacto primero; si no, el primero que empiece igual.
  const elegida = filas.find((f) => f.title === titulo) ?? filas[0]
  if (!elegida) return NextResponse.json({ encontrado: false })

  const espacio = ctx.espacios.find((e) => e.id === elegida.space_id)
  if (!espacio) return NextResponse.json({ encontrado: false })

  return NextResponse.json({
    encontrado: true,
    espacio: espacio.slug,
    hilo_id: elegida.id,
    titulo: elegida.title,
  })
}
