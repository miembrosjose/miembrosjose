// API — mandar una comunicación como MENSAJE DIRECTO.
//
//   POST /api/admin/comunicaciones/<id>/enviar-dm   { simular?: true }
//
// ── LA EXCEPCIÓN DELIBERADA ───────────────────────────────────────────────
// Todo lo demás en este módulo evita crear una fila por persona. Esto la
// crea, a propósito, porque un mensaje directo no es una copia de un
// anuncio: es una conversación con cada uno, que sigue existiendo después y
// en la que cada persona responde lo suyo.
//
// Un comunicado se lee; a un mensaje se le contesta, y esa respuesta vuelve a
// la bandeja de quien lo mandó. Eso no se puede hacer con una fila
// compartida.
//
// Por eso lleva tope, por eso se puede simular antes, y por eso deja contado
// lo que hizo: es la operación más cara y más difícil de deshacer de las
// cuatro.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin, registrarEvento } from "@/lib/comunicaciones/servidor"
import { resolverAudiencia } from "@/lib/comunicaciones/audiencia"

export const dynamic = "force-dynamic"

/**
 * Cuántas conversaciones se pueden abrir de una vez.
 *
 * No es un límite técnico: las inserciones van por lotes y aguantarían más.
 * Es que escribirle a mil personas a la vez por mensaje privado es una
 * decisión que merece pensarse dos veces, y un tope obliga a pensarla.
 */
const TOPE = 1000

/** Cuántas filas por inserción. */
const LOTE = 200

function trocear<T>(xs: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n))
  return out
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const admin = getSupabaseAdmin()

  let body: { simular?: boolean }
  try { body = await req.json() } catch { body = {} }
  const soloMirar = body.simular === true

  const { data: c, error: errLeer } = await admin
    .from("communications")
    .select("id, canales, audience, dm_texto, body, subject, dm_enviado_at")
    .eq("id", id)
    .maybeSingle()

  if (errLeer) {
    if (/dm_texto|canales|does not exist|schema cache/i.test(errLeer.message)) {
      return NextResponse.json({
        error: "Falta correr docs/sql/comunicaciones_04_mensaje_directo.sql en Supabase.",
      }, { status: 503 })
    }
    console.error("[comunicaciones] dm · leer:", errLeer.message)
    return NextResponse.json({ error: "No se pudo leer" }, { status: 500 })
  }
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 })

  const canales = (c.canales as string[] | null) ?? []
  if (!canales.includes("dm")) {
    return NextResponse.json(
      { error: "Esta comunicación no va por mensaje directo. Marca ese canal primero." },
      { status: 409 },
    )
  }

  // ── MANDAR DOS VECES NO ES REINTENTAR ──────────────────────────────────
  // Es escribirle otra vez a todo el mundo. Y como cada mensaje es una fila
  // propia, no hay forma de distinguir el duplicado del original: las dos
  // son conversaciones de verdad, con su hora y su burbuja.
  if (c.dm_enviado_at && !soloMirar) {
    return NextResponse.json({
      error: "Esta comunicación ya se mandó como mensaje directo el "
        + new Date(c.dm_enviado_at).toLocaleString("es-ES")
        + ". Duplícala si quieres mandar otra.",
    }, { status: 409 })
  }

  // El texto solo hace falta para MANDAR. Para contar a cuántos va, no:
  // esa pregunta es sobre la audiencia, y se hace antes de escribir.
  const texto = ((c.dm_texto as string | null) || (c.body as string | null) || "").trim()
  if (!texto && !soloMirar) {
    return NextResponse.json({ error: "No hay texto que mandar." }, { status: 400 })
  }

  // ── A QUIÉN ────────────────────────────────────────────────────────────
  // El mismo motor de audiencias que el correo y el push. No se duplica:
  // «todos los miembros activos» tiene que querer decir lo mismo en los
  // cuatro canales, o el día que alguien ajuste un filtro se quedará
  // ajustado en tres sitios y mal en el cuarto.
  // El canal "dm" le dice al motor que NO aplique la baja de los correos:
  // darse de baja de las novedades no es decir «no me escribáis».
  let audiencia
  try {
    audiencia = await resolverAudiencia(c.audience, "especial", "dm")
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo resolver la audiencia" },
      { status: 400 },
    )
  }

  // Escribirse a uno mismo no tiene sentido: quedaría una conversación
  // consigo mismo, y el aviso tampoco saldría.
  const destinos = [...new Set(audiencia.destinatarios.map((d) => d.userId))]
    .filter((uid) => uid !== g.user.id)

  if (destinos.length === 0) {
    return NextResponse.json({ error: "Esa audiencia no tiene a nadie." }, { status: 400 })
  }
  if (destinos.length > TOPE) {
    return NextResponse.json({
      error: `Serían ${destinos.length} conversaciones, y el tope está en ${TOPE}. `
        + "Estrecha la audiencia.",
    }, { status: 400 })
  }

  // ── SOLO MIRAR ─────────────────────────────────────────────────────────
  // Antes de abrir setenta conversaciones conviene saber que son setenta.
  if (soloMirar) {
    return NextResponse.json({ ok: true, simulado: true, personas: destinos.length })
  }

  // ── LAS FILAS ──────────────────────────────────────────────────────────
  const filas = destinos.map((uid) => ({
    sender_id: g.user.id,
    recipient_id: uid,
    body: texto,
    media_url: null,
    media_type: null,
  }))

  let creados = 0
  for (const lote of trocear(filas, LOTE)) {
    const { data, error } = await admin.from("direct_messages").insert(lote).select("id")
    if (error) {
      console.error("[comunicaciones] dm · insertar:", error.message)
      // ── POR QUÉ NO SE DESHACE LO YA MANDADO ──────────────────────────
      // Porque ya está en la bandeja de esas personas. Borrarlo dejaría
      // conversaciones que aparecieron y desaparecieron, que es peor que
      // un envío a medias. Se dice cuántos salieron y se para.
      await registrarEvento(id, g.user.id, "updated", {
        accion: "dm_a_medias", enviados: creados, error: error.message,
      })
      return NextResponse.json({
        error: `Se mandaron ${creados} de ${destinos.length} y falló. `
          + "Los que salieron ya están en su bandeja: no se pueden retirar.",
      }, { status: 500 })
    }
    creados += (data || []).length
  }

  // ── EL AVISO ───────────────────────────────────────────────────────────
  //
  // Una fila de `notifications` por persona, en UNA inserción por lote. La
  // alternativa —llamar a `avisarMensajeNuevo` setenta veces— haría setenta
  // idas y vueltas a la base más las del push, y agotaría el presupuesto de
  // peticiones del Worker antes de llegar al final.
  //
  // Si falla, el mensaje YA está entregado: aparece en la bandeja con su
  // marca de no leído. Lo que se pierde es la campanita, no el mensaje.
  const meta = (g.user.user_metadata || {}) as { full_name?: string; avatar_url?: string }
  const nombre = meta.full_name?.trim() || g.user.email?.split("@")[0] || "Administración"

  const avisos = destinos.map((uid) => ({
    user_id: uid,
    type: "dm_message",
    source_user_id: g.user.id,
    source_user_name: nombre,
    source_user_avatar_url: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
    title: `${nombre} te escribió`,
    preview: texto.slice(0, 140),
  }))

  for (const lote of trocear(avisos, LOTE)) {
    const { error } = await admin.from("notifications").insert(lote)
    if (error) console.error("[comunicaciones] dm · avisos:", error.message)
  }

  const cuando = new Date().toISOString()
  await admin
    .from("communications")
    .update({ dm_enviado_at: cuando, dm_enviados: creados })
    .eq("id", id)

  await registrarEvento(id, g.user.id, "updated", { accion: "dm_enviado", enviados: creados })

  return NextResponse.json({ ok: true, enviados: creados, personas: destinos.length })
}
