// API — abrir una conversación en el Centro de Comunidad.
//
//   POST /api/comunidad/hilos
//   { espacio: <slug>, categoria?: <slug>, titulo, cuerpo, imagen?,
//     oficial?: boolean, contenido?: { tipo, ref } }
//
// ── LO QUE SE COMPRUEBA, Y DÓNDE ───────────────────────────────────────────
//   · Que el espacio exista y esté ABIERTO para quien escribe. Publicar en una
//     temporada que no se ha recorrido es la misma puerta trasera que leerla,
//     y se cierra en el mismo sitio: aquí.
//   · Que la categoría, si viene, pertenezca a ese espacio. Si no viene y el
//     espacio tiene categorías, entra en la primera, que es la de conversación
//     general: nadie se queda sin publicar por no elegir una subsección.
//   · Que `oficial` solo lo pueda marcar administración. Es lo que distingue
//     un aviso de la casa de una opinión, y si cualquiera pudiera ponérselo
//     dejaría de significar nada.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { categoriasDe, contextoDe, puedeEntrar } from "@/lib/comunidad/acceso"
import { instantaneaDe } from "@/lib/comunidad/autor"
import { otorgarXp } from "@/lib/xp-otorgar"

export const dynamic = "force-dynamic"

const TITULO_MAX = 200
const CUERPO_MAX = 5000

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  let body: {
    espacio?: string
    categoria?: string
    titulo?: string
    cuerpo?: string
    imagen?: string
    oficial?: boolean
    contenido?: { tipo?: string; ref?: string }
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const titulo = (body.titulo || "").trim()
  const cuerpo = (body.cuerpo || "").trim()

  if (!titulo) return NextResponse.json({ error: "Ponle un título" }, { status: 400 })
  if (titulo.length > TITULO_MAX) {
    return NextResponse.json({ error: `El título no puede pasar de ${TITULO_MAX} caracteres` }, { status: 400 })
  }
  if (!cuerpo) return NextResponse.json({ error: "Escribe algo antes de publicar" }, { status: 400 })
  if (cuerpo.length > CUERPO_MAX) {
    return NextResponse.json({ error: `El texto no puede pasar de ${CUERPO_MAX} caracteres` }, { status: 400 })
  }

  const ctx = await contextoDe(user)
  const espacio = ctx.espacios.find((e) => e.slug === (body.espacio || "").trim())
  if (!espacio) return NextResponse.json({ error: "Elige dónde quieres publicarlo" }, { status: 400 })

  if (!puedeEntrar(espacio, ctx.abiertas)) {
    return NextResponse.json(
      { error: "Todavía no puedes publicar en ese espacio." },
      { status: 403 },
    )
  }

  const categorias = await categoriasDe([espacio.id])
  let categoriaId: string | null = null
  if (categorias.length > 0) {
    const pedida = (body.categoria || "").trim()
    const elegida = pedida ? categorias.find((c) => c.slug === pedida) : null
    if (pedida && !elegida) {
      return NextResponse.json({ error: "Esa sección no existe en este espacio" }, { status: 400 })
    }
    categoriaId = (elegida ?? categorias[0]).id
  }

  const oficial = body.oficial === true && ctx.papel === "administracion"
  const imagen = typeof body.imagen === "string" && body.imagen.startsWith("https://") ? body.imagen : null

  const ahora = new Date().toISOString()
  const { data, error } = await supabase
    .from("forum_posts")
    .insert({
      user_id: user.id,
      ...instantaneaDe(user),
      title: titulo,
      body: cuerpo,
      image_url: imagen,
      tags: [],
      space_id: espacio.id,
      category_id: categoriaId,
      is_official: oficial,
      last_activity_at: ahora,
    })
    .select("id, title, space_id, category_id")
    .single()

  if (error) {
    console.error("[comunidad/hilos] crear", error.message)
    return NextResponse.json({ error: "No se pudo publicar" }, { status: 500 })
  }

  // Quien abre una conversación la sigue: es lo que espera cualquiera que
  // escribe algo y quiere enterarse de lo que le respondan.
  await getSupabaseAdmin()
    .from("community_thread_follows")
    .upsert({ post_id: data.id, user_id: user.id }, { onConflict: "post_id,user_id", ignoreDuplicates: true })

  // Si venía de un contenido —una meditación, un capítulo—, se deja anotado
  // para poder volver de la conversación al contenido y al revés.
  const tipo = body.contenido?.tipo?.trim()
  const ref = body.contenido?.ref?.trim()
  if (tipo && ref) {
    await getSupabaseAdmin()
      .from("community_content_links")
      .upsert(
        { contenido_tipo: tipo, contenido_ref: ref, space_id: espacio.id, category_id: categoriaId },
        { onConflict: "contenido_tipo,contenido_ref", ignoreDuplicates: true },
      )
  }

  // El origen es la conversación: borrarla y volver a abrirla da puntos por
  // la nueva, no otra vez por la misma.
  const xp = await otorgarXp(user, "forum_post", String(data.id))

  return NextResponse.json({ ok: true, id: data.id, espacio: espacio.slug, xp })
}
