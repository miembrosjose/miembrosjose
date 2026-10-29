// API — la lista de comunicaciones y la creación de borradores.
//
//   GET  /api/admin/comunicaciones?estado=borradores|programadas|enviadas
//   POST /api/admin/comunicaciones     { type }
//
// Crear NO envía nada. Crear es abrir una hoja en blanco: una comunicación
// nace siempre como borrador y no hay forma de que nazca de otra manera,
// porque el estado no está entre los campos que se pueden escribir desde
// fuera. Ver `CAMPOS_EDITABLES` en lib/comunicaciones/servidor.ts.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { exigirAdmin, registrarEvento } from "@/lib/comunicaciones/servidor"
import { TIPOS, esTipoValido } from "@/lib/comunicaciones/tipos"
import { reconciliarPendientes } from "@/lib/comunicaciones/reconciliar"

export const dynamic = "force-dynamic"

/** Lo que se lista. El cuerpo entero no hace falta para una fila. */
const CAMPOS_LISTA =
  "id, canal, type, internal_title, subject, status, audience, scheduled_at, scheduled_timezone, " +
  "recipients_estimated, recipients_excluded, sent_at, metrics, created_at, updated_at, " +
  "provider_error"

/**
 * Las tres pestañas del panel.
 *
 * «Programadas» incluye lo que está en cola o saliendo: para quien mira, una
 * comunicación que el proveedor ya tiene pero aún no ha repartido está más
 * cerca de «programada» que de «enviada», y ponerla en enviadas antes de que
 * salga sería contar de más.
 */
const POR_PESTANA: Record<string, string[]> = {
  borradores: ["draft", "failed"],
  programadas: ["scheduled", "queued", "sending"],
  enviadas: ["sent", "cancelled"],
  archivadas: ["archived"],
}

export async function GET(req: NextRequest) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const estado = new URL(req.url).searchParams.get("estado") || "borradores"
  const estados = POR_PESTANA[estado]
  if (!estados) return NextResponse.json({ error: "Pestaña desconocida" }, { status: 400 })

  // ── ANTES DE ENSEÑAR NADA, PREGUNTAR ──────────────────────────────────
  // Una programada no cambia sola de estado: nadie la está mirando a las siete
  // de la tarde. Aquí es donde alguien vuelve a mirar, así que aquí es donde
  // hay que enterarse de que ya salió.
  //
  // Solo se consultan las que pueden haber cambiado —las que el proveedor
  // tiene y cuya hora ya pasó— y como mucho diez. Abrir la lista no puede
  // costar cincuenta viajes al proveedor.
  await reconciliarPendientes()

  const { data, error } = await getSupabaseAdmin()
    .from("communications")
    .select(CAMPOS_LISTA)
    .in("status", estados)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[comunicaciones] listar:", error.message)
    return NextResponse.json({ error: "No se pudo leer la lista" }, { status: 500 })
  }

  // Los contadores de las pestañas, para no tener que pedir las tres listas.
  const conteos: Record<string, number> = {}
  await Promise.all(
    Object.entries(POR_PESTANA).map(async ([nombre, ests]) => {
      const { count } = await getSupabaseAdmin()
        .from("communications")
        .select("id", { count: "exact", head: true })
        .in("status", ests)
      conteos[nombre] = count ?? 0
    }),
  )

  return NextResponse.json({ ok: true, comunicaciones: data || [], conteos })
}

export async function POST(req: NextRequest) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  let body: { type?: string; canal?: string; canales?: unknown }
  try { body = await req.json() } catch { body = {} }

  const tipo = body.type
  if (!esTipoValido(tipo)) {
    return NextResponse.json({ error: "Tipo de comunicación desconocido" }, { status: 400 })
  }

  const def = TIPOS[tipo]

  // Por dónde va a salir se elige al crearla, y se puede cambiar mientras
  // sea borrador. Cualquier cosa que no sea "push" es correo: es lo que
  // eran todas las que ya existen.
  const CANALES_VALIDOS = ["email", "push", "interno", "dm"] as const
  type CanalValido = (typeof CANALES_VALIDOS)[number]

  // ── POR QUÉ SE RECHAZA EN VEZ DE CAER A CORREO ───────────────────────
  // Antes era una cadena de ternarios que terminaba en «cualquier otra cosa
  // es correo». Al añadir el cuarto canal nadie tocó esa línea, y crear
  // desde mensajes directos creaba un correo: se abría el editor
  // equivocado y el borrador aparecía en la lista de otro.
  //
  // Un valor desconocido no es un correo. Es un error, y decirlo cuesta lo
  // mismo que inventarse una respuesta.
  const pedido = typeof body.canal === "string" ? body.canal : "email"
  if (!CANALES_VALIDOS.includes(pedido as CanalValido)) {
    return NextResponse.json(
      { error: `«${pedido}» no es una forma de comunicar que exista.` },
      { status: 400 },
    )
  }
  const canal = pedido as CanalValido

  // ── LOS CANALES ─────────────────────────────────────────────────────────
  // Se nace con uno. Añadir el segundo —que una misma comunicación salga por
  // correo Y quede dentro de la plataforma— se hace después, desde la
  // pantalla, porque hasta que no está escrita no se sabe si tiene sentido.
  const canales = [canal]

  // Se nace con lo que el tipo ya sabe de sí mismo: el eyebrow y el texto del
  // botón. No es relleno, es no empezar delante de seis campos vacíos.
  const { data, error } = await getSupabaseAdmin()
    .from("communications")
    .insert({
      type: tipo,
      canal,
      canales,
      // El eyebrow y el texto del botón son del correo: en una
      // notificación no se ven. Nacer con ellos no rompe nada, pero deja
      // dos campos rellenos que luego avisan de que no se usan.
      // El eyebrow y el botón son del correo. Dentro de la plataforma el
      // titular ya tiene la atención de quien lo lee, así que tampoco hacen
      // falta: nacer con ellos dejaría dos campos rellenos que no se ven.
      eyebrow: canal === "email" ? def.eyebrowPorDefecto : "",
      cta_text: canal === "email" ? def.ctaPorDefecto : null,
      // El nombre interno dice de qué pantalla salió. Sin esto, cuatro
      // borradores recién creados se llaman los cuatro igual.
      internal_title: `${
        canal === "push" ? "Notificación"
          : canal === "interno" ? "Comunicado"
          : canal === "dm" ? "Mensaje directo"
          : def.nombre
      } · sin título`,
      audience: { kind: "todos" },
      status: "draft",
      created_by: g.user.id,
    })
    .select("id")
    .single()

  if (error || !data) {
    console.error("[comunicaciones] crear:", error?.message)

    // ── POR QUÉ ESTE ERROR DICE DE QUÉ VA ────────────────────────────────
    // Decía «No se pudo crear la comunicación», que es verdad y no sirve de
    // nada: costó tres rondas averiguar que la columna `canal` tenía su
    // propia restricción sin actualizar, mientras el motivo exacto estaba
    // en un `console.error` que nadie puede leer desde el navegador.
    //
    // Un fallo de restricción no es un accidente del servidor: es una regla
    // de la base que el código no está cumpliendo, y casi siempre significa
    // que falta correr un SQL. Eso se puede decir.
    const m = error?.message || ""
    if (/violates check constraint/i.test(m)) {
      const cual = m.match(/"([a-z0-9_]+)"/i)?.[1] || "una restricción"
      return NextResponse.json({
        error: `La base rechazó la fila por «${cual}». `
          + "Suele significar que falta correr un SQL de docs/sql/. "
          + "Si acabas de añadir una forma de comunicar, revisa que la "
          + "restricción la acepte.",
      }, { status: 500 })
    }
    if (/does not exist|schema cache/i.test(m)) {
      return NextResponse.json({
        error: "Falta una columna o una tabla. Revisa qué SQL de docs/sql/ "
          + "queda por correr. Detalle: " + m,
      }, { status: 503 })
    }

    return NextResponse.json({ error: "No se pudo crear la comunicación" }, { status: 500 })
  }

  await registrarEvento(data.id, g.user.id, "created", { type: tipo, canal })
  return NextResponse.json({ ok: true, id: data.id })
}
