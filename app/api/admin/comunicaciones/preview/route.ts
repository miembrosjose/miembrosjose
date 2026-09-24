// API — la vista previa.
//
//   POST /api/admin/comunicaciones/preview   { …campos del borrador }
//
// ── POR QUÉ RECIBE LOS CAMPOS Y NO UN IDENTIFICADOR ────────────────────────
// La vista previa tiene que enseñar lo que hay ESCRITO AHORA, no lo último que
// se guardó. Si dependiera del identificador, habría que guardar antes de
// poder mirar, y entonces nadie miraría: se guarda, se olvida, se envía.
//
// ── POR QUÉ NO SE DIBUJA EN EL NAVEGADOR ───────────────────────────────────
// Porque el correo lo dibuja `renderCorreo`, y esa función es la que también
// produce el HTML que sale de verdad. Un preview construido aparte con los
// mismos datos se parecería al correo hasta el día en que dejara de parecerse,
// y ese día nadie se enteraría.
//
// ── LOS DATOS DE EJEMPLO ───────────────────────────────────────────────────
// Donde el correo real pone el nombre de quien lo recibe, aquí va uno de
// muestra. La vista previa no depende de que exista ningún miembro concreto ni
// toca la base para buscar uno.

import { NextRequest, NextResponse } from "next/server"
import { exigirAdmin } from "@/lib/comunicaciones/servidor"
import { esTipoValido } from "@/lib/comunicaciones/tipos"
import { renderCorreo, renderTexto, type DatosCorreo } from "@/lib/comunicaciones/plantilla"
import { remitente, sitio } from "@/lib/comunicaciones/proveedor"

export const dynamic = "force-dynamic"

/** Quien mira la vista previa se ve a sí mismo, no a «[NOMBRE]». */
const NOMBRE_DE_MUESTRA = "José"

export async function POST(req: NextRequest) {
  const g = await exigirAdmin()
  if ("respuesta" in g) return g.respuesta

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const tipo = body.type
  if (!esTipoValido(tipo)) {
    return NextResponse.json({ error: "Tipo de comunicación desconocido" }, { status: 400 })
  }

  const t = (k: string) => (typeof body[k] === "string" ? (body[k] as string) : "")
  const o = (k: string) => (typeof body[k] === "string" && body[k] ? (body[k] as string) : null)

  const datos: DatosCorreo = {
    tipo,
    preheader: t("preheader"),
    eyebrow: t("eyebrow"),
    heading: t("heading"),
    body: t("body"),
    imageUrl: o("image_url"),
    ctaText: o("cta_text"),
    ctaUrl: o("cta_url"),
    eventTitle: o("event_title"),
    eventAt: o("event_at"),
    eventTimezone: o("event_timezone"),
    eventLocation: o("event_location"),
    nombre: NOMBRE_DE_MUESTRA,
    // Un enlace de mentira, para que se vea el pie entero. En el envío real lo
    // pone Resend con su propia etiqueta; una vista previa a la que le falta el
    // pie no sirve para comprobar el pie.
    unsubscribeUrl: `${sitio()}/miembros/perfil#correo`,
    siteUrl: sitio(),
  }

  return NextResponse.json({
    ok: true,
    html: renderCorreo(datos),
    texto: renderTexto(datos),
    // Lo que se ve encima del correo en la bandeja de entrada, para poder
    // comprobarlo sin abrir el correo: es la mitad de la decisión de abrirlo.
    sobre: {
      de: remitente(),
      asunto: t("subject"),
      preheader: t("preheader"),
    },
  })
}
