// ═══════════════════════════════════════════════════════════════════════════
//  POST /api/admin/probar-activacion · recorrer el alta como un miembro nuevo
// ═══════════════════════════════════════════════════════════════════════════
//
//   Body: { email: string }
//   Solo administración.
//
// ── POR QUÉ EXISTE ────────────────────────────────────────────────────────
// En esta plataforma hay DOS caminos distintos para crear una cuenta:
//
//   A · El que recorre un miembro nuevo del embudo. Lo dispara `member-sync`
//       con `inviteUserByEmail`: lo manda el correo de Supabase y aterriza
//       en /activar-cuenta.
//
//   B · El de las herramientas de administración (grant-membership,
//       resend-invite, heal-missing-invites). Usa `account_invites`, lo
//       manda Resend y aterriza en /cuenta/crear.
//
// Ninguna herramienta disparaba el camino A. Resultado: el único alta que
// recorren los miembros de verdad era la única que no se podía probar sin
// cobrarle a alguien. Cuando falló, la forma de comprobar el arreglo fue
// entrar por la puerta de atrás —recuperar contraseña—, que recorre otro
// camino y por tanto no prueba nada. Palabras de José: «ahí sí pude
// ingresar, pero eso no me permite validar si al inicio ya puedo».
//
// Esto manda la invitación de verdad, la misma, al correo que se le diga.
//
// ── Y SIRVE DE DIAGNÓSTICO ────────────────────────────────────────────────
// Si Supabase se niega, aquí se dice POR QUÉ, con su mensaje. Ese es el
// sitio donde se vería, por ejemplo, el límite de dos correos por hora del
// servidor de fábrica de Supabase, que falla callado y es justo lo que
// tumbaría una tanda de altas en un encuentro presencial.

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { checkRateLimit } from "@/lib/rate-limit"
import { URL_ACTIVAR_CUENTA } from "@/lib/activacion"

export const dynamic = "force-dynamic"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const email = (body.email || "").trim().toLowerCase()
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Ese correo no tiene buena pinta." }, { status: 400 })
  }

  // Esto manda correo a una dirección cualquiera. Es solo para
  // administración, pero un freno por si acaso: ni para cansar un buzón ni
  // para quemar la cuota del servidor de correo probando.
  const limite = await checkRateLimit("probar-activacion", email, 3, 900)
  if (!limite.allowed) {
    return NextResponse.json(
      { error: "Ya se mandaron 3 invitaciones a ese correo hace poco. Espera 15 minutos." },
      { status: 429 },
    )
  }

  const admin = getSupabaseAdmin()
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: URL_ACTIVAR_CUENTA,
  })

  if (!error) {
    return NextResponse.json({
      ok: true,
      estado: "enviada",
      mensaje:
        "Invitación enviada. Es la misma que recibe un miembro nuevo: ábrela desde el correo y " +
        "recorre el alta entera.",
    })
  }

  // ── Ya tiene cuenta ─────────────────────────────────────────────────────
  // No es un fallo, y conviene decirlo con todas las letras: a quien ya
  // tiene cuenta, Supabase no le manda invitación, y quedarse esperando el
  // correo es exactamente lo que no queremos que vuelva a pasar.
  const status = (error as { status?: number }).status
  const code = (error as { code?: string }).code || ""
  const msg = (error.message || "").toLowerCase()
  const yaExiste =
    code === "email_exists" ||
    status === 422 ||
    msg.includes("already been registered") ||
    msg.includes("already registered") ||
    msg.includes("already exists")

  if (yaExiste) {
    return NextResponse.json({
      ok: false,
      estado: "ya_tiene_cuenta",
      mensaje:
        "Ese correo ya tiene cuenta, así que Supabase no manda invitación. Para probar el alta " +
        "desde cero usa una dirección nueva (con Gmail vale añadir +prueba1 antes de la arroba).",
    })
  }

  // ── Cualquier otro rechazo ──────────────────────────────────────────────
  // Aquí SÍ se enseña el mensaje técnico: lo lee administración, no un
  // miembro, y es justo el dato que faltaba para saber qué pasa.
  console.error("[probar-activacion] code=%s status=%s", code || "sin_codigo", status ?? "")
  return NextResponse.json({
    ok: false,
    estado: "rechazada",
    mensaje: "Supabase no la mandó.",
    detalle: error.message || code || "sin detalle",
  })
}
