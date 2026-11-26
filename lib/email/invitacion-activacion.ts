// ═══════════════════════════════════════════════════════════════════════════
//  EL CORREO DE BIENVENIDA · la invitación para entrar por primera vez
// ═══════════════════════════════════════════════════════════════════════════
//
// Hermano de `recuperar-contrasena.ts`, y por las mismas razones: lo manda
// Resend, queda en `email_send_log` y el enlace apunta a una pantalla que no
// gasta el token al abrirse. El porqué entero está en `lib/activacion.ts`.
//
// La diferencia es el tono. Este es el primer correo que recibe alguien de
// Los 144000, y no se parece a un aviso de contraseña: es la puerta.

import { getResend, getEmailFrom } from "./resend"
import { logEmailSend } from "./log"

const ASUNTO = "Tu acceso a Los 144000 está listo"

export async function enviarInvitacionDeActivacion(params: {
  email: string
  enlace: string
}): Promise<{ ok: boolean; error?: string }> {
  const { email, enlace } = params

  try {
    const { data, error } = await getResend().emails.send({
      from: getEmailFrom(),
      to: [email],
      subject: ASUNTO,
      html: renderHtml(enlace),
      text: renderTexto(enlace),
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
 * Igual que el de contraseña: ese enlace deja entrar en la cuenta. Quien
 * pudiera leer `email_send_log` entraría sin saber ninguna contraseña.
 */
async function registrar(
  email: string,
  status: "success" | "failed" | "error",
  error_message: string | null,
  resend_id: string | null,
) {
  await logEmailSend({
    email,
    email_type: "invite",
    source: "activacion_miembro",
    status,
    error_message,
    resend_id,
    payload: { subject: ASUNTO },
  })
}

// ───────────────────────────────────────────────────────────────────────────
//  La plantilla
// ───────────────────────────────────────────────────────────────────────────

function renderHtml(enlace: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${ASUNTO}</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e8e3d8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#000000;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;width:100%;background:#10101a;border:1px solid #1f1925;border-top:3px solid #6D4A9B;">
          <tr>
            <td style="padding:48px 40px 32px;">
              <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#a78bca;font-weight:600;">
                Activación de cuenta
              </p>
              <h1 style="margin:0 0 20px;font-family:'Cinzel',Georgia,serif;font-size:32px;font-weight:700;line-height:1.1;letter-spacing:-0.01em;color:#f4eedd;">
                Activa tu<br>
                <span style="color:#6D4A9B;">acceso.</span>
              </h1>
              <div style="width:48px;height:2px;background:#6D4A9B;margin:0 0 24px;"></div>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.65;color:#bdb39d;">
                Tu lugar en Los 144000 ya está reservado. Pulsa el botón, elige una contraseña y entras.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#f4eedd;border:1px solid #f4eedd;">
                    <a href="${enlace}" target="_blank" rel="noopener" style="display:inline-block;padding:18px 36px;font-size:14px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:#000000;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                      Activar mi acceso →
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

              <p style="margin:0 0 24px;font-size:11px;line-height:1.6;color:#6a6249;letter-spacing:0.05em;">
                <strong style="color:#a78bca;">Es de un solo uso.</strong> Si ya lo abriste una vez, o si pasó demasiado tiempo, pide otro desde la pantalla de acceso — no se gasta nada por pedirlo de nuevo.
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
      </td>
    </tr>
  </table>
</body>
</html>`
}

function renderTexto(enlace: string): string {
  return `Activa tu acceso.

Tu lugar en Los 144000 ya está reservado. Abre esta dirección, elige una
contraseña y entras:

${enlace}

Es de un solo uso. Si ya lo abriste una vez, o si pasó demasiado tiempo, pide
otro desde la pantalla de acceso.

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
