// PATCH  /api/admin/grabaciones/<id>  → editar
// DELETE /api/admin/grabaciones/<id>  → borrar
//
// ── EDICIÓN PARCIAL ───────────────────────────────────────────────────────
// Solo se escribe lo que llega. Cambiar el título no debería poder vaciar la
// descripción, y con un cuerpo completo en cada guardado eso pasa en cuanto
// una pantalla se olvida de reenviar un campo.
//
// ── SI CAMBIA EL CÓDIGO, SE VUELVE A MIRAR TODO ───────────────────────────
// El código de VTurb es la fuente de la cuenta, del reproductor y de la
// miniatura. Si se sustituye, los tres se recalculan y la miniatura se vuelve
// a comprobar. Guardar el código nuevo dejando la miniatura del vídeo viejo
// es justo el error que no se nota: la tarjeta sigue enseñando una imagen
// plausible de otro vídeo.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseServer } from "@/lib/supabase/server"
import { leerVturb, miniaturaExiste } from "@/lib/red/vturb"
import { normalizarFecha, problemaConLosCampos } from "@/lib/red/grabaciones"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  const numero = Number(id)
  if (!Number.isInteger(numero)) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const problema = problemaConLosCampos(body)
  if (problema) return NextResponse.json({ error: problema }, { status: 400 })

  const parche: Record<string, unknown> = {}
  let previsualizacion: {
    encontrada: boolean
    url: string | null
    origen: "codigo" | "deducida"
  } | null = null

  if (typeof body.titulo === "string") parche.titulo = body.titulo.trim()
  if (typeof body.descripcion === "string") {
    parche.descripcion = body.descripcion.trim()
  }
  if (body.estado === "borrador" || body.estado === "publicado") {
    parche.estado = body.estado
  }
  if (body.sort_order !== undefined) {
    const n = Number(body.sort_order)
    if (!Number.isInteger(n)) {
      return NextResponse.json({ error: "El orden tiene que ser un número entero." }, { status: 400 })
    }
    parche.sort_order = n
  }
  if (body.fecha !== undefined) {
    const f = normalizarFecha(body.fecha)
    // `null` aquí significa «me mandaste vacío»: la fecha no se borra, porque
    // la columna no la admite nula y el archivo se ordena por ella.
    if (f && f !== "invalida") parche.fecha = f
  }

  if (typeof body.embed === "string" && body.embed.trim()) {
    const lectura = leerVturb(body.embed)
    if (!lectura.ok) {
      return NextResponse.json({ error: lectura.motivo }, { status: 400 })
    }
    const g = lectura.grabacion
    const hay = await miniaturaExiste(g.miniatura)
    parche.embed = g.embed
    parche.cuenta_id = g.cuentaId
    parche.player_id = g.playerId
    parche.miniatura = hay ? g.miniatura : null
    previsualizacion = {
      encontrada: hay,
      url: hay ? g.miniatura : null,
      origen: g.miniaturaDelCodigo ? "codigo" : "deducida",
    }
  }

  if (Object.keys(parche).length === 0) {
    return NextResponse.json({ error: "No has cambiado nada." }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("network_recordings")
    .update(parche)
    .eq("id", numero)
    .select()
    .single()

  if (error) {
    console.error("[admin/grabaciones PATCH]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Esa grabación no existe." }, { status: 404 })
  }

  return NextResponse.json({ grabacion: data, previsualizacion })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  const numero = Number(id)
  if (!Number.isInteger(numero)) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { error } = await supabase
    .from("network_recordings")
    .delete()
    .eq("id", numero)

  if (error) {
    console.error("[admin/grabaciones DELETE]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Borrar aquí NO borra el vídeo de VTurb: solo deja de enseñarse en la Red.
  // El original sigue en la cuenta de VTurb, que es lo que se quiere —un clic
  // de más no debería poder destruir una grabación irrepetible.
  return NextResponse.json({ ok: true })
}
