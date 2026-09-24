// API — una comunicación: leerla, editarla, borrarla.
//
//   GET    /api/admin/comunicaciones/<id>
//   PATCH  /api/admin/comunicaciones/<id>   { campos editables }
//   DELETE /api/admin/comunicaciones/<id>
//
// ── LO QUE YA SALIÓ NO SE EDITA ────────────────────────────────────────────
// Cambiar el texto de una comunicación enviada no cambia nada en las bandejas
// de entrada donde está: solo hace que el registro deje de coincidir con lo
// que la gente leyó. Y editar una programada por detrás sería peor todavía,
// porque el proveedor ya tiene su copia y seguiría enviando la vieja.
//
// Se puede editar un borrador, y una que falló. Nada más. La comprobación está
// en el servidor, no en el botón.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import {
  exigirAdmin, leerComunicacion, registrarEvento, soloEditable,
} from "@/lib/comunicaciones/servidor"
import { esEditable, esTipoValido } from "@/lib/comunicaciones/tipos"
import { validarComunicacion } from "@/lib/comunicaciones/validacion"
import { isNetworkRole } from "@/lib/red/roles"
import { ACHIEVEMENTS } from "@/lib/achievements"

export const dynamic = "force-dynamic"

/**
 * La audiencia, comprobada aquí y no solo en la pantalla.
 *
 * Una audiencia llega del navegador, y del navegador puede llegar cualquier
 * cosa. Un rol inventado no ampliaría el envío —nadie lo tiene, así que la
 * audiencia saldría vacía— pero una temporada disparatada sí dejaría una
 * comunicación imposible de enviar sin decir por qué.
 */
function revisarAudiencia(v: unknown): string | null {
  const a = v as { kind?: string; temporadaMin?: unknown; roles?: unknown; insignias?: unknown } | null
  if (!a || a.kind !== "todos") return "Esa audiencia no está disponible"

  if (a.temporadaMin != null) {
    const n = Number(a.temporadaMin)
    if (!Number.isInteger(n) || n < 1 || n > 4) return "Esa temporada no existe"
  }

  if (a.roles != null) {
    if (!Array.isArray(a.roles)) return "Los roles tienen que ser una lista"
    const malos = a.roles.filter((r) => !isNetworkRole(r))
    if (malos.length > 0) return "Hay un rol que no existe"
  }

  if (a.insignias != null) {
    if (!Array.isArray(a.insignias)) return "Las insignias tienen que ser una lista"
    const conocidas = new Set(ACHIEVEMENTS.map((x) => x.id))
    if (a.insignias.some((i) => typeof i !== "string" || !conocidas.has(i))) {
      return "Hay una insignia que no existe"
    }
  }

  return null
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const c = await leerComunicacion(id)
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 })

  // La validación viaja con la comunicación: el panel enseña los avisos sin
  // tener que pedirlos aparte, y siempre coinciden con los que aplicará el
  // envío porque salen de la misma función.
  return NextResponse.json({ ok: true, comunicacion: c, veredicto: validarComunicacion(c) })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const actual = await leerComunicacion(id)
  if (!actual) return NextResponse.json({ error: "No existe" }, { status: 404 })

  if (!esEditable(actual.status)) {
    return NextResponse.json(
      { error: "Esta comunicación ya no se puede editar. Duplícala si quieres partir de ella." },
      { status: 409 },
    )
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const cambios = soloEditable(body)

  if ("type" in cambios && !esTipoValido(cambios.type)) {
    return NextResponse.json({ error: "Tipo de comunicación desconocido" }, { status: 400 })
  }
  if ("audience" in cambios) {
    const problema = revisarAudiencia(cambios.audience)
    if (problema) return NextResponse.json({ error: problema }, { status: 400 })
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "Nada que cambiar" }, { status: 400 })
  }

  // Un intento de enviar que falló deja la comunicación en `failed`. Al volver
  // a tocarla, vuelve a ser un borrador: si no, se quedaría marcada como
  // fallida para siempre aunque el problema estuviera resuelto.
  //
  // La llave de envío se suelta aquí y SOLO aquí. Mientras la comunicación
  // está fallida la conserva, para que el mismo doble clic que la hizo fallar
  // no la reintente solo; corregir algo es lo que declara que hay un intento
  // nuevo, y entonces la llave vieja deja de valer.
  if (actual.status === "failed") {
    cambios.status = "draft"
    cambios.provider_error = null
    cambios.send_idempotency_key = null
  }

  const { data, error } = await getSupabaseAdmin()
    .from("communications")
    .update(cambios)
    .eq("id", id)
    .select("*")
    .single()

  if (error || !data) {
    console.error("[comunicaciones] actualizar:", error?.message)
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }

  // La auditoría guarda QUÉ campos se tocaron, no su contenido: el contenido
  // ya está en la fila, y copiarlo en cada guardado haría crecer el historial
  // con el cuerpo entero del correo cada vez que se corrige una coma.
  await registrarEvento(id, g.user.id, "updated", { campos: Object.keys(cambios) })

  return NextResponse.json({ ok: true, comunicacion: data, veredicto: validarComunicacion(data) })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const actual = await leerComunicacion(id)
  if (!actual) return NextResponse.json({ error: "No existe" }, { status: 404 })

  // Solo se borra lo que nunca salió. Lo enviado es historial: borrarlo dejaría
  // la plataforma sin memoria de un correo que sí recibió mucha gente.
  if (actual.status !== "draft" && actual.status !== "failed") {
    return NextResponse.json(
      { error: "Solo se pueden borrar borradores. Lo enviado queda como historial." },
      { status: 409 },
    )
  }

  const { error } = await getSupabaseAdmin().from("communications").delete().eq("id", id)
  if (error) {
    console.error("[comunicaciones] borrar:", error.message)
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
