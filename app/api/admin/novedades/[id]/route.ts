// PATCH  /api/admin/novedades/<id>  → editar, o retirar poniendo la caducidad
// DELETE /api/admin/novedades/<id>  → borrarla del todo
//
// ── RETIRAR Y BORRAR NO SON LO MISMO ──────────────────────────────────────
// Retirar es poner `caduca_at` en el pasado: deja de salir en la portada y
// sigue en el espacio de Novedades con sus respuestas. Eso es lo que quiere
// hacerse casi siempre, porque una convocatoria con conversación debajo es
// parte del registro de lo que pasó: lo que sobra es el ANUNCIO, no el hecho.
//
// Borrar se lleva también las respuestas. Está para lo que se publicó por
// error, no para lo que ya cumplió.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { camposDeNovedad } from "@/lib/novedades"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  if (!id) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const campos = camposDeNovedad(body)
  if ("error" in campos) {
    return NextResponse.json({ error: campos.error }, { status: 400 })
  }

  // Solo se escribe lo que llegó: editar el título no debe vaciar el aviso.
  const parche: Record<string, unknown> = {}
  if (body.titulo !== undefined) parche.title = campos.titulo
  if (body.cuerpo !== undefined) parche.body = campos.cuerpo
  if (body.eventoAt !== undefined) parche.evento_at = campos.eventoAt
  if (body.eventoZona !== undefined) parche.evento_zona = campos.eventoZona
  if (body.ctaTexto !== undefined) parche.cta_texto = campos.ctaTexto
  if (body.ctaUrl !== undefined) parche.cta_url = campos.ctaUrl
  if (body.caducaAt !== undefined) parche.caduca_at = campos.caducaAt

  if (Object.keys(parche).length === 0) {
    return NextResponse.json({ error: "No has cambiado nada." }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  let { error } = await admin.from("forum_posts").update(parche).eq("id", id)

  // Sin la migración de caducidad se guarda lo demás, y se avisa de que esa
  // parte no se pudo escribir. Guardar a medias en silencio es peor.
  if (error && /caduca_at/i.test(error.message)) {
    delete parche.caduca_at
    if (Object.keys(parche).length === 0) {
      return NextResponse.json(
        { error: "Falta correr docs/sql/novedades_02_caducidad.sql para poder retirarlas." },
        { status: 409 },
      )
    }
    const r = await admin.from("forum_posts").update(parche).eq("id", id)
    error = r.error
    if (!error) {
      return NextResponse.json({
        ok: true,
        aviso: "Se guardó, pero la caducidad no: falta correr docs/sql/novedades_02_caducidad.sql.",
      })
    }
  }

  if (error) {
    console.error("[admin/novedades PATCH]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  if (!id) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin.from("forum_posts").delete().eq("id", id)

  if (error) {
    console.error("[admin/novedades DELETE]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
