// ═══════════════════════════════════════════════════════════════════════════
//  EL CORREO DE «HE OLVIDADO MI CONTRASEÑA» · lo manda la plataforma
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ DEJAMOS DE USAR EL DE SUPABASE ────────────────────────────────
// Lo mandaba Supabase con su plantilla de fábrica, y eso traía tres cosas:
//
//   1. El enlace de la plantilla de fábrica pasa por /auth/v1/verify, que
//      GASTA el token nada más abrirlo. Los antivirus de correo y los
//      previsualizadores abren los enlaces antes que la persona, para ver si
//      son peligrosos. Cuando ella pulsa, ya está usado — y Supabase da el
//      mismo mensaje para «usado» que para «caducado». De ahí el «solo me
//      llegó una vez y me dice que caducó».
//
//   2. El servidor de correo que trae Supabase de fábrica manda DOS correos
//      por hora para todo el proyecto, y no avisa cuando no envía. Nadie se
//      entera de nada: la persona pide otro, no llega, y escribe enfadada.
//
//   3. Era el único correo de la plataforma que no se parecía a los demás ni
//      quedaba registrado en `email_send_log`.
//
// Ahora el enlace lo genera la plataforma con la clave de servicio, y el
// correo sale por Resend como todos los demás. El enlace apunta a
// /recuperar-acceso/confirmar, que NO consume el token al abrirse: solo
// enseña un botón, y los escáneres no pulsan botones.

import { getResend, getEmailFrom } from "./resend"
import { logEmailSend } from "./log"

export async function enviarEnlaceDeContrasena(params: {
  email: string
  enlace: string
}): Promise<{ ok: boolean; error?: string }> {
  const { email, enlace } = params

  const subject = "Tu enlace para crear una contraseña nueva"
  const html = renderHtml(enlace)
  const text = renderTexto(enlace)

  try {
    const { data, error } = await getResend().emails.send({
      from: getEmailFrom(),
      to: [email],
      subject,
      html,
      text,
    })

    if (error) {
      const msg = typeof error === "object" && "message" in error ? String(error.message) : "Resend error"
      await registrar(email, "failed", msg, null)
      return { ok: false, error: msg }
    }

    await registrar(email, "success", null, data?.id ?? null)
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fallo desconocido al enviar"
    await registrar(email, "error", msg, null)
    return { ok: false, error: msg }
  }
}

/**
 * Al registro, SIN el enlace.
 *
 * ── POR QUÉ NO SE GUARDA EL ENLACE ────────────────────────────────────────
 * El de las invitaciones sí se guarda, y ahí tiene sentido: sirve para
 * reenviárselo a alguien que no lo recibió. Este lleva dentro el token que
 * cambia una contraseña. Quien pudiera leer `email_send_log` —hoy solo la
 * administración, pero eso es una política, no una ley de la física— podría
 * entrar en la cuenta de cualquiera sin saber su contraseña.
 */
async function registrar(
  email: string,
  status: "success" | "failed" | "error",
  error_message: string | null,
  resend_id: string | null,
) {
  await logEmailSend({
    email,
    email_type: "recovery",
    source: "password_reset",
    status,
    error_message,
    resend_id,
    payload: { subject: "Tu enlace para crear una contraseña nueva" },
  })
}

// ───────────────────────────────────────────────────────────────────────────
//  La plantilla
// ───────────────────────────────────────────────────────────────────────────
//
// En violeta, que es el color de la plataforma hoy. Los correos de compra
// siguen en el rojo y dorado de antes; cuando se unifiquen, este ya está.

function renderHtml(enlace: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu enlace para crear una contraseña nueva</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e8e3d8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#000000;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;width:100%;background:#10101a;border:1px solid #1f1925;border-top:3px solid #6D4A9B;">
          <tr>
            <td style="padding:48px 40px 32px;">
              <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#a78bca;font-weight:600;">
                Acceso · Miembros
              </p>
              <h1 style="margin:0 0 20px;font-family:'Cinzel',Georgia,serif;font-size:32px;font-weight:700;line-height:1.1;letter-spacing:-0.01em;color:#f4eedd;">
                Crea tu contraseña<br>
                <span style="color:#6D4A9B;">nueva.</span>
              </h1>
              <div style="width:48px;height:2px;background:#6D4A9B;margin:0 0 24px;"></div>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.65;color:#bdb39d;">
                Pediste recuperar el acceso a Los 144000. Pulsa el botón y te llevará a elegir una contraseña nueva.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#f4eedd;border:1px solid #f4eedd;">
                    <a href="${enlace}" target="_blank" rel="noopener" style="display:inline-block;padding:18px 36px;font-size:14px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:#000000;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                      Crear mi contraseña →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#6a6249;">
                ¿El botón no funciona? Copia y pega esta dirección en tu navegador:
              </p>
              <p style="margin:0 0 32px;word-break:break-all;font-size:12px;line-height:1.5;color:#a78bca;font-family:'Courier New',monospace;">
                ${escaparHtml(enlace)}
              </p>

              <div style="height:1px;background:#1f1925;margin:0 0 24px;"></div>

              <p style="margin:0 0 8px;font-size:11px;line-height:1.6;color:#6a6249;letter-spacing:0.05em;">
                <strong style="color:#a78bca;">Es de un solo uso.</strong> Si ya lo abriste una vez, o si pasó demasiado tiempo, pide otro desde la pantalla de acceso — no se gasta nada por pedirlo de nuevo.
              </p>
              <p style="margin:0 0 24px;font-size:11px;line-height:1.6;color:#6a6249;letter-spacing:0.05em;">
                Si no fuiste tú quien lo pidió, no tienes que hacer nada: sin pulsar ese botón, tu contraseña sigue siendo la de siempre.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#08080d;padding:20px 40px;border-top:1px solid #1f1925;">
              <p style="margin:0;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#5a523d;font-weight:600;">
                Los 144000
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:11px;color:#3a3328;text-align:center;">
          Recibiste este correo porque alguien pidió recuperar el acceso a esta dirección.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function renderTexto(enlace: string): string {
  return `Crea tu contraseña nueva.

Pediste recuperar el acceso a Los 144000. Abre esta dirección para elegir una contraseña nueva:

${enlace}

Es de un solo uso. Si ya lo abriste una vez, o si pasó demasiado tiempo, pide
otro desde la pantalla de acceso.

Si no fuiste tú quien lo pidió, no tienes que hacer nada: sin abrir ese enlace,
tu contraseña sigue siendo la de siempre.

Los 144000`
}

function escaparHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
