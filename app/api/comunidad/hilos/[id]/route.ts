// API — moderar una conversación.
//
//   PATCH /api/comunidad/hilos/<id>
//   { fijar?, cerrar?, oficial?, mover_a?: <slug de espacio>, categoria?: <slug> }
//
// Fijar, cerrar, mover y marcar como oficial. Todo con la misma comprobación
// de papel, en servidor: esconder el botón no impide la petición.
//
// CERRAR NO ES BORRAR. Una conversación cerrada se sigue leyendo entera; lo
// único que deja de poder hacerse es responder. Lo que se dijo no desaparece
// porque el hilo se haya agotado.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { categoriasDe, contextoDe, puedeEntrar, puedeModerar } from "@/lib/comunidad/acceso"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, ctxRuta: { params: Promise<{ id: string }> }) {
  const { id } = await ctxRuta.params
  if (!id) return NextResponse.json({ error: "Falta la conversación" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const ctx = await contextoDe(user)
  if (!puedeModerar(ctx.papel)) {
    return NextResponse.json({ error: "Esto es cosa de moderación." }, { status: 403 })
  }

  let body: {
    fijar?: boolean
    cerrar?: boolean
    oficial?: boolean
    mover_a?: string
    categoria?: string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const cambios: Record<string, unknown> = {}

  if (typeof body.fijar === "boolean") {
    cambios.pinned = body.fijar
    // Al desfijar se limpia el orden: dejarlo puesto haría que al volver a
    // fijarla reapareciera en un sitio que nadie recuerda haber elegido.
    if (!body.fijar) cambios.pin_order = null
  }
  if (typeof body.cerrar === "boolean") cambios.is_locked = body.cerrar

  // Marcar algo como OFICIAL es hablar en nombre de la casa. La moderación
  // ordena; solo administración firma.
  if (typeof body.oficial === "boolean") {
    if (ctx.papel !== "administracion") {
      return NextResponse.json(
        { error: "Solo administración puede marcar una conversación como oficial." },
        { status: 403 },
      )
    }
    cambios.is_official = body.oficial
  }

  if (typeof body.mover_a === "string" && body.mover_a.trim()) {
    const destino = ctx.espacios.find((e) => e.slug === body.mover_a!.trim())
    if (!destino) return NextResponse.json({ error: "Ese espacio no existe" }, { status: 400 })
    if (!puedeEntrar(destino, ctx.abiertas)) {
      return NextResponse.json({ error: "No puedes mover algo a un espacio que no tienes abierto." }, { status: 403 })
    }
    cambios.space_id = destino.id

    // Al cambiar de espacio, la categoría de antes deja de existir allí. Se
    // resuelve la nueva: la pedida, o la primera del destino, o ninguna si el
    // destino no usa categorías.
    const categorias = await categoriasDe([destino.id])
    if (categorias.length === 0) {
      cambios.category_id = null
    } else {
      const pedida = (body.categoria || "").trim()
      const elegida = pedida ? categorias.find((c) => c.slug === pedida) : null
      if (pedida && !elegida) {
        return NextResponse.json({ error: "Esa sección no existe en el espacio de destino" }, { status: 400 })
      }
      cambios.category_id = (elegida ?? categorias[0]).id
    }
  } else if (typeof body.categoria === "string" && body.categoria.trim()) {
    // Mover de sección dentro del mismo espacio.
    const { data: actual } = await getSupabaseAdmin()
      .from("forum_posts").select("space_id").eq("id", id).maybeSingle()
    if (!actual?.space_id) {
      return NextResponse.json({ error: "Esa conversación no está en ningún espacio" }, { status: 400 })
    }
    const categorias = await categoriasDe([actual.space_id as string])
    const elegida = categorias.find((c) => c.slug === body.categoria!.trim())
    if (!elegida) return NextResponse.json({ error: "Esa sección no existe aquí" }, { status: 400 })
    cambios.category_id = elegida.id
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "Nada que cambiar" }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from("forum_posts")
    .update(cambios)
    .eq("id", id)
    .select("id, pinned, is_locked, is_official, space_id, category_id")
    .maybeSingle()

  if (error) {
    console.error("[comunidad/hilos] moderar", error.message)
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: "Esa conversación ya no existe" }, { status: 404 })

  return NextResponse.json({ ok: true, hilo: data })
}
