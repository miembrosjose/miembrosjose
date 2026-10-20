// API — enviar una prueba.
//
//   POST /api/admin/comunicaciones/<id>/prueba   { destinatarios: string[] }
//
// Si la comunicación sale por notificación, `destinatarios` se ignora: la
// prueba va a los dispositivos de quien la pide y a ninguno más. El porqué,
// en la bifurcación de abajo.
//
// ── LO QUE ESTO NO ES ──────────────────────────────────────────────────────
// No es una campaña pequeña. No toca la audiencia, no crea un Broadcast, no
// cuenta como envío, no aparece en las métricas de nada y NO PUEDE alcanzar a
// un miembro por accidente: va por el canal de correo suelto, exactamente a
// las direcciones que se escriban aquí —o, en una notificación, solo a los
// dispositivos de quien pulsa el botón.
//
// Esa es toda la idea. Antes de mandar algo a mil personas hay que poder verlo
// llegar a una bandeja de verdad —Gmail pinta distinto que Outlook, y el móvil
// distinto que el escritorio— sin que nadie más se entere.
//
// ── EL HTML ES EL MISMO ────────────────────────────────────────────────────
// Se dibuja con `renderCorreo`, igual que la vista previa e igual que el envío
// real. Si la prueba usara otro camino, no probaría nada.

import { NextRequest, NextResponse } from "next/server"
import { exigirAdmin, leerComunicacion, registrarEvento } from "@/lib/comunicaciones/servidor"
import { renderCorreo, renderTexto } from "@/lib/comunicaciones/plantilla"
import { datosDesdeComunicacion } from "@/lib/comunicaciones/plantilla"
import { enviarPrueba, hayProveedor, mensajeDeError, sitio } from "@/lib/comunicaciones/proveedor"
import { correoPlausible } from "@/lib/comunicaciones/audiencia"
import { avisarAPersona } from "@/lib/push/repartir"

export const dynamic = "force-dynamic"

/**
 * Cuántas direcciones caben en una prueba.
 *
 * Suficiente para Gmail, Outlook, el móvil y una cuenta de reserva. El límite
 * no es técnico: es que «enviar prueba» no pueda convertirse, poco a poco, en
 * una forma de mandar correo masivo saltándose las barreras.
 */
const MAX_DESTINATARIOS = 5

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  const { id } = await ctx.params
  const c = await leerComunicacion(id)
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 })

  // ── LA PRUEBA DE UNA NOTIFICACIÓN VA SOLO A QUIEN LA PIDE ───────────────
  // En el correo la prueba lleva direcciones: hay que verla en Gmail y en
  // Outlook, que pintan distinto. Una notificación no tiene de eso —la pinta
  // el sistema operativo— así que lo único que hay que comprobar es cómo se
  // lee el título y el texto en una pantalla de bloqueo.
  //
  // Por eso aquí NO se acepta destinatario. Va a los dispositivos de quien
  // pulsa el botón, y a ninguno más. Aceptar un identificador de otra persona
  // habría convertido «enviar prueba» en una forma de mandarle un aviso a
  // alguien saltándose la audiencia, la validación y el registro.
  if (c.canal === "push") {
    if (!(c.subject || "").trim()) {
      return NextResponse.json(
        { error: "Ponle título antes de probarla: es la línea que se lee primero." },
        { status: 400 },
      )
    }

    const r = await avisarAPersona(
      g.user.id,
      {
        title: c.subject,
        body: (c.body || "").replace(/\s+/g, " ").trim().slice(0, 300),
        url: c.cta_url || "/miembros",
        // Etiqueta propia: una prueba no debe reemplazar en el teléfono al
        // aviso de verdad si luego se manda la misma comunicación.
        tag: `prueba-${id}`,
      },
      "prueba",
    )

    await registrarEvento(id, g.user.id, "test_sent", {
      canal: "push",
      dispositivos: r.dispositivos,
      entregados: r.entregados,
      fallidos: r.fallidos,
    })

    if (r.dispositivos === 0) {
      return NextResponse.json(
        {
          error:
            "No tienes ningún dispositivo con los avisos activados. " +
            "Actívalos en la campana, desde el teléfono, y vuelve a probar.",
        },
        { status: 400 },
      )
    }
    if (r.entregados === 0) {
      return NextResponse.json(
        { error: r.error || "No se pudo entregar en ninguno de tus dispositivos." },
        { status: 502 },
      )
    }

    return NextResponse.json({
      ok: true,
      push: r,
      cuando: new Date().toISOString(),
    })
  }

  let body: { destinatarios?: unknown }
  try { body = await req.json() } catch { body = {} }

  const crudos = Array.isArray(body.destinatarios) ? body.destinatarios : []
  const para = Array.from(
    new Set(
      crudos
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    ),
  )

  if (para.length === 0) {
    return NextResponse.json(
      { error: "Escribe al menos una dirección a la que mandar la prueba." },
      { status: 400 },
    )
  }
  if (para.length > MAX_DESTINATARIOS) {
    return NextResponse.json(
      { error: `Una prueba va como mucho a ${MAX_DESTINATARIOS} direcciones.` },
      { status: 400 },
    )
  }

  const malas = para.filter((e) => !correoPlausible(e))
  if (malas.length > 0) {
    return NextResponse.json(
      { error: `Esto no parece una dirección de correo: ${malas.join(", ")}` },
      { status: 400 },
    )
  }

  if (!(c.subject || "").trim()) {
    return NextResponse.json(
      { error: "Ponle asunto antes de mandarla: es lo primero que hay que comprobar." },
      { status: 400 },
    )
  }

  if (!hayProveedor()) {
    return NextResponse.json(
      { error: "El proveedor de correo no está configurado en este entorno." },
      { status: 503 },
    )
  }

  const datos = datosDesdeComunicacion(c, {
    unsubscribeUrl: `${sitio()}/miembros/perfil#correo`,
    siteUrl: sitio(),
  })

  try {
    const idCorreo = await enviarPrueba({
      para,
      asunto: c.subject,
      html: renderCorreo(datos),
      texto: renderTexto(datos),
    })

    const cuando = new Date().toISOString()
    await registrarEvento(id, g.user.id, "test_sent", { destinatarios: para.length, provider_id: idCorreo })

    return NextResponse.json({ ok: true, enviadaA: para, cuando })
  } catch (e) {
    // Entero al registro del servidor; al navegador, una frase.
    console.error("[comunicaciones] prueba:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: mensajeDeError(e) }, { status: 502 })
  }
}
