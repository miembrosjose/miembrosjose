// API — enviar una prueba.
//
//   POST /api/admin/comunicaciones/<id>/prueba   { destinatarios: string[] }
//
// ── LO QUE ESTO NO ES ──────────────────────────────────────────────────────
// No es una campaña pequeña. No toca la audiencia, no crea un Broadcast, no
// cuenta como envío, no aparece en las métricas de nada y NO PUEDE alcanzar a
// un miembro por accidente: va por el canal de correo suelto, exactamente a
// las direcciones que se escriban aquí.
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

  // El nombre de quien pide la prueba, para que el saludo se vea como se verá.
  const meta = (g.user.user_metadata || {}) as { full_name?: string; name?: string }
  const nombre = (meta.full_name || meta.name || "").trim() || null

  const datos = datosDesdeComunicacion(c, {
    nombre,
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
