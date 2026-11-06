// ═══════════════════════════════════════════════════════════════════════════
//  POST /api/profile/recover-password · «he olvidado mi contraseña»
// ═══════════════════════════════════════════════════════════════════════════
//
//   Body: { email: string }
//   Devuelve 200 SIEMPRE, exista o no esa cuenta.
//
// ── QUÉ HACÍA ANTES, Y POR QUÉ SE CAMBIÓ ──────────────────────────────────
// Llamaba a `resetPasswordForEmail`, que deja el envío en manos de Supabase:
// su plantilla, su servidor de correo, su enlace. Eso rompía por dos sitios
// a la vez, y los dos daban el mismo síntoma — «me llegó el correo, pulsé, y
// dice que el enlace caducó»:
//
//   · El enlace de la plantilla de fábrica pasa por /auth/v1/verify, que gasta
//     el token NADA MÁS ABRIRLO. Los antivirus de correo y los
//     previsualizadores abren los enlaces antes que la persona, para
//     comprobar si son peligrosos. Cuando ella pulsa, ya está usado. Y el
//     mensaje de «usado» es idéntico al de «caducado», así que ni ella ni
//     nosotros podíamos distinguirlo.
//
//   · El servidor de correo de fábrica de Supabase manda DOS correos por hora
//     para todo el proyecto. Cuando se pasa, no envía y no avisa. Nadie se
//     entera: ni quien lo pide, ni nosotros.
//
// ── QUÉ HACE AHORA ────────────────────────────────────────────────────────
//   1. Genera el token con la clave de servicio (`generateLink`), que NO
//      manda ningún correo: solo devuelve el token.
//   2. Construye el enlace hacia /recuperar-acceso/confirmar, la pantalla que
//      no consume el token al abrirse — solo al pulsar su botón. Los
//      escáneres no pulsan botones.
//   3. Manda el correo por Resend, como todos los demás de la plataforma, y
//      lo deja registrado en `email_send_log`. Si no sale, se ve.
//
// ── LO QUE NO CAMBIA ──────────────────────────────────────────────────────
// Sigue sin autenticar —cualquiera puede pedir el enlace de cualquier
// correo— y sigue devolviendo 200 siempre. Si contestara distinto cuando la
// cuenta existe, esto sería una lista de quién está registrado.

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { checkRateLimit } from "@/lib/rate-limit"
import { enviarEnlaceDeContrasena } from "@/lib/email/recuperar-contrasena"

export const dynamic = "force-dynamic"

/** Dónde se crea la contraseña nueva, al final del camino. */
const DESTINO = "/miembros/cuenta/recuperar"

/** La pantalla intermedia, la que no gasta el token al abrirse. */
const CONFIRMACION = "/recuperar-acceso/confirmar"

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_MIEMBROS_URL || "https://los144000.com"
}

function ipDe(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  )
}

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = (body.email || "").trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 })
  }

  // ── DOS LÍMITES, Y NINGUNO DICE QUE NO ────────────────────────────────
  // Uno por dirección, para que nadie use esto como ametralladora contra el
  // buzón de otra persona. Otro por IP, para que nadie recorra una lista de
  // correos desde el mismo sitio.
  //
  // Los dos contestan 200 igual que todo lo demás. Un 429 aquí diría «esta
  // cuenta existe y alguien la está pidiendo mucho», que es justo lo que no
  // queremos contar. Simplemente no se manda nada más.
  const porCorreo = await checkRateLimit("recuperar-correo", email, 3, 900)
  const porIp = await checkRateLimit("recuperar-ip", ipDe(req), 10, 900)
  if (!porCorreo.allowed || !porIp.allowed) {
    console.warn("[recover-password] límite alcanzado")
    return NextResponse.json({ ok: true })
  }

  try {
    const admin = getSupabaseAdmin()

    // `generateLink` NO manda correo: devuelve el token y ya. Es la única
    // forma de quedarnos con el envío sin reimplementar la verificación.
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    })

    // Lo más habitual aquí es que esa cuenta no exista. No es un fallo del
    // que haya que enterarse, y desde luego no es algo que contestar.
    if (error || !data?.properties?.hashed_token) {
      return NextResponse.json({ ok: true })
    }

    const enlace =
      `${baseUrl()}${CONFIRMACION}` +
      `?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
      `&type=recovery` +
      `&next=${encodeURIComponent(DESTINO)}`

    const enviado = await enviarEnlaceDeContrasena({ email, enlace })

    // Si Resend falla, queda en `email_send_log` con el motivo y se ve en el
    // panel de salud de correo. A quien lo pidió no se le dice: contestar
    // distinto delataría que la cuenta existe.
    if (!enviado.ok) {
      console.error("[recover-password] no se pudo enviar:", enviado.error)
    }
  } catch (e) {
    // Ni un fallo de la clave de servicio ni uno de Resend pueden convertir
    // esto en un 500: sería la misma filtración por otra puerta.
    console.error("[recover-password] fallo inesperado:", e instanceof Error ? e.message : e)
  }

  return NextResponse.json({ ok: true })
}
