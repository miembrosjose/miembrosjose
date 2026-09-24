// API — enviar, o programar.
//
//   POST /api/admin/comunicaciones/<id>/enviar
//   { llave: "<uuid>", cuando?: "2026-09-26T19:00", zona?: "America/Mexico_City" }
//
// Esta es la ruta que manda correos de verdad a gente de verdad. Todo lo que
// hay aquí existe para que eso no pueda pasar por accidente.
//
// ── LAS BARRERAS, EN ORDEN ─────────────────────────────────────────────────
//   1. Es administración. Comprobado en el servidor, no en el botón.
//   2. La comunicación está en un estado desde el que se pueda enviar.
//   3. Pasa la validación. Los ERRORES bloquean aquí, no solo en pantalla.
//   4. La llave de idempotencia se RESERVA antes de tocar al proveedor.
//   5. Si se programa, la fecha tiene que ser futura de verdad.
//
// ── POR QUÉ LA LLAVE SE RESERVA ANTES ──────────────────────────────────────
// El momento peligroso es entre «he comprobado que está en borrador» y «he
// creado el Broadcast». Dos clics en ese hueco crean dos Broadcasts, y ya no
// hay vuelta atrás.
//
// La reserva es un UPDATE condicional: «pon esta llave y pasa a enviando, PERO
// solo si sigues en borrador y no tienes llave». La base resuelve quién gana.
// El segundo clic no cambia ninguna fila, y ahí se entera de que llegó tarde.
//
// Si ese segundo clic traía la MISMA llave —el mismo gesto, reintentado por la
// red— no es un error: se le responde con el estado actual, como si hubiera
// sido él quien lo consiguió. Eso es lo que hace que un reintento sea seguro.
//
// ── POR QUÉ CREAR Y ENVIAR SON DOS PASOS ───────────────────────────────────
// `crearBroadcast` no manda nada. Si esa llamada se reintenta, lo peor que
// queda es un borrador de más en el proveedor. Solo `enviarBroadcast` mueve
// correo, y para cuando se llega ahí la llave ya está reservada.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin, leerComunicacion, registrarEvento } from "@/lib/comunicaciones/servidor"
import {
  guardarContactosSincronizados, leerContactosSincronizados,
} from "@/lib/comunicaciones/servidor"
import { resolverAudiencia } from "@/lib/comunicaciones/audiencia"
import { validarComunicacion, instanteEnZona, zonaConocida } from "@/lib/comunicaciones/validacion"
import { renderCorreo, renderTexto, datosDesdeComunicacion } from "@/lib/comunicaciones/plantilla"
import {
  audienciaPrincipal, crearBroadcast, enviarBroadcast, hayProveedor,
  mensajeDeError, sincronizarContactos, sitio,
} from "@/lib/comunicaciones/proveedor"
import type { Comunicacion } from "@/lib/comunicaciones/tipos"

export const dynamic = "force-dynamic"

/** Margen mínimo entre ahora y una programación, en minutos. */
const MARGEN_MINUTOS = 5

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const admin = getSupabaseAdmin()

  let body: { llave?: string; cuando?: string; hora?: string; zona?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const llave = (body.llave || "").trim()
  if (!llave || llave.length < 8) {
    return NextResponse.json({ error: "Falta la llave de envío" }, { status: 400 })
  }

  const c = await leerComunicacion(id)
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 })

  // ── Reintento del mismo gesto ───────────────────────────────────────────
  // Antes que nada: si esta comunicación ya lleva ESTA llave, el trabajo ya se
  // hizo. Se responde que sí, sin volver a enviar nada.
  if (c.send_idempotency_key === llave && c.status !== "draft" && c.status !== "failed") {
    return NextResponse.json({ ok: true, repetida: true, comunicacion: c })
  }

  if (c.status !== "draft" && c.status !== "failed") {
    return NextResponse.json(
      { error: "Esta comunicación ya no está en borrador." },
      { status: 409 },
    )
  }

  // ── ¿Ahora o más tarde? ─────────────────────────────────────────────────
  let programadoPara: string | null = null
  const zona = (body.zona || "").trim()

  if (body.cuando) {
    if (!zona || !zonaConocida(zona)) {
      return NextResponse.json(
        { error: "Falta la zona horaria, o no es una que se reconozca." },
        { status: 400 },
      )
    }
    // La fecha y la hora llegan por separado y se convierten AQUÍ, con la zona
    // elegida. Convertirlo en el navegador usaría la zona de quien programa, y
    // programar «19:00 México» desde Madrid saldría siete horas antes.
    programadoPara = body.hora
      ? instanteEnZona(body.cuando, body.hora, zona)
      : new Date(body.cuando).toISOString()

    if (!programadoPara) {
      return NextResponse.json({ error: "Esa fecha y hora no son válidas." }, { status: 400 })
    }
  }

  // ── La validación, del lado del servidor ────────────────────────────────
  const veredicto = validarComunicacion(c, {
    programadoPara,
    margenMinutos: MARGEN_MINUTOS,
  })
  if (!veredicto.puedeEnviar) {
    return NextResponse.json(
      { error: "La comunicación todavía no se puede enviar.", veredicto },
      { status: 400 },
    )
  }

  if (!hayProveedor()) {
    return NextResponse.json(
      { error: "El proveedor de correo no está configurado en este entorno." },
      { status: 503 },
    )
  }

  // ── La reserva ──────────────────────────────────────────────────────────
  // El único momento en que esto puede fallar por una carrera, y lo resuelve
  // la base: solo una petición se lleva la fila.
  const { data: reservada, error: errReserva } = await admin
    .from("communications")
    .update({
      send_idempotency_key: llave,
      status: "sending",
      sent_by: g.user.id,
      provider_error: null,
    })
    .eq("id", id)
    .in("status", ["draft", "failed"])
    .is("send_idempotency_key", null)
    .select("*")
    .maybeSingle()

  if (errReserva) {
    console.error("[comunicaciones] reserva:", errReserva.message)
    return NextResponse.json({ error: "No se pudo iniciar el envío" }, { status: 500 })
  }
  if (!reservada) {
    // Alguien llegó antes. Puede ser el primer clic del mismo doble clic.
    const ahora = await leerComunicacion(id)
    if (ahora?.send_idempotency_key === llave) {
      return NextResponse.json({ ok: true, repetida: true, comunicacion: ahora })
    }
    return NextResponse.json(
      { error: "Esta comunicación ya se está enviando." },
      { status: 409 },
    )
  }

  // A partir de aquí, cualquier fallo tiene que dejar constancia: una fila en
  // `sending` para siempre sería una comunicación que nadie sabe si salió.
  const fallar = async (mensaje: string, detalle: string) => {
    await admin
      .from("communications")
      .update({ status: "failed", provider_error: mensaje })
      .eq("id", id)
    await registrarEvento(id, g.user.id, "failed", { error: detalle })
    return NextResponse.json({ error: mensaje }, { status: 502 })
  }

  try {
    // ── Quién lo recibe ───────────────────────────────────────────────────
    const { destinatarios, resumen } = await resolverAudiencia(c.audience, c.type)

    if (destinatarios.length === 0) {
      return await fallar(
        "No hay nadie a quien enviársela. Revisa la audiencia y las preferencias.",
        "audiencia vacía",
      )
    }

    // ── La lista del proveedor, al día ────────────────────────────────────
    // Se sincroniza justo antes de enviar y no en un proceso aparte: así lo
    // que sale coincide con lo que se acaba de contar, y nadie que se dio de
    // baja hace diez minutos recibe el correo.
    const audienceId = await audienciaPrincipal()
    const yaSincronizados = await leerContactosSincronizados()
    const aGuardar: Array<{ userId: string; contactId: string | null; email: string; unsubscribed: boolean; error?: string }> = []

    const sync = await sincronizarContactos(
      audienceId,
      destinatarios.map((d) => ({ ...d, dadoDeBaja: false })),
      yaSincronizados,
      (userId, datos) => aGuardar.push({ userId, ...datos }),
    )
    await guardarContactosSincronizados(audienceId, aGuardar)

    if (sync.fallidos > 0) {
      console.warn(`[comunicaciones] ${sync.fallidos} contactos no se pudieron sincronizar`)
    }

    // ── El correo ─────────────────────────────────────────────────────────
    // Sin nombre: en un Broadcast el saludo tendría que ser una etiqueta de
    // combinación del proveedor, y una etiqueta mal escrita sale impresa tal
    // cual en mil bandejas. Se prefiere un correo sin saludo personal antes que
    // un «Hola {{FIRST_NAME}}».
    const datos = datosDesdeComunicacion(c as Comunicacion, {
      nombre: null,
      // El proveedor sustituye la etiqueta por el nombre de cada persona al
      // repartir. Lo lee del contacto, que la sincronización de arriba acaba de
      // poner al día desde profiles.full_name. Quien no tenga nombre guardado
      // lee «Hola viajero» — nunca «Hola ,» ni la etiqueta en crudo.
      nombreModo: "variable" as const,
      unsubscribeUrl: null, // lo pone el proveedor, con su propia etiqueta
      siteUrl: sitio(),
    })

    const broadcastId = await crearBroadcast({
      audienceId,
      nombre: c.internal_title || c.subject,
      asunto: c.subject,
      preheader: c.preheader,
      html: renderCorreo(datos),
      texto: renderTexto(datos),
    })

    // ── Y sale ────────────────────────────────────────────────────────────
    await enviarBroadcast(broadcastId, programadoPara)

    const estadoFinal = programadoPara ? "scheduled" : "queued"
    const { data: final } = await admin
      .from("communications")
      .update({
        status: estadoFinal,
        provider_broadcast_id: broadcastId,
        provider_audience_id: audienceId,
        scheduled_at: programadoPara,
        scheduled_timezone: programadoPara ? zona : null,
        recipients_estimated: resumen.destinatarios,
        recipients_excluded: resumen.excluidos,
        sent_at: programadoPara ? null : new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single()

    await registrarEvento(id, g.user.id, programadoPara ? "scheduled" : "sent", {
      destinatarios: resumen.destinatarios,
      excluidos: resumen.excluidos,
      broadcast_id: broadcastId,
      programado_para: programadoPara,
      zona: programadoPara ? zona : null,
    })

    return NextResponse.json({ ok: true, comunicacion: final, resumen })
  } catch (e) {
    console.error("[comunicaciones] enviar:", e instanceof Error ? e.message : e)
    return await fallar(mensajeDeError(e), e instanceof Error ? e.message : String(e))
  }
}
