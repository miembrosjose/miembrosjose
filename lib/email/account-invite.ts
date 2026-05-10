// Email de boas-vindas + link único pra criação de conta.
// Disparado do webhook Stripe após sale_type=front bem-sucedido.

import { getResend, getEmailFrom } from "./resend"
import { setInviteEmailStatus, type InviteRecord } from "@/lib/account-invites"
import { logEmailSend, type EmailSource } from "./log"

// Link pra criação de conta vai pro subdomínio dedicado de membros.
// Padroniza pra um lugar que o cliente associa com "área exclusiva".
const MIEMBROS_URL = process.env.NEXT_PUBLIC_MIEMBROS_URL || "https://miembros.SEU_DOMINIO.com"

export async function sendAccountInviteEmail(
  invite: InviteRecord,
  context?: { source?: EmailSource; sourceRef?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  const link = `${MIEMBROS_URL}/cuenta/crear?token=${encodeURIComponent(invite.token)}`
  const firstName = (invite.customer_name?.split(" ")[0] ?? "").trim() || "viajero"

  const subject = "Tu acceso a [BRAND_NAME] está listo"
  const html = renderInviteHtml({ firstName, link })
  const text = renderInviteText({ firstName, link })

  const source = context?.source || "stripe_front"
  const sourceRef = context?.sourceRef ?? invite.stripe_payment_intent_id ?? null

  try {
    const { data, error } = await getResend().emails.send({
      from: getEmailFrom(),
      to: [invite.email],
      subject,
      html,
      text,
      headers: {
        "X-Entity-Ref-ID": invite.id, // tracking opcional
      },
    })

    if (error) {
      const msg = typeof error === "object" && "message" in error ? String(error.message) : "Resend error"
      await setInviteEmailStatus(invite.id, { sent: false, error: msg })
      await logEmailSend({
        email: invite.email,
        email_type: "invite",
        source,
        source_ref: sourceRef,
        status: "failed",
        error_message: msg,
        attempt: (invite.resend_count ?? 0) + 1,
        payload: { invite_id: invite.id, link, subject },
      })
      return { ok: false, error: msg }
    }

    await setInviteEmailStatus(invite.id, { sent: true })
    await logEmailSend({
      email: invite.email,
      email_type: "invite",
      source,
      source_ref: sourceRef,
      status: "success",
      resend_id: data?.id ?? null,
      attempt: (invite.resend_count ?? 0) + 1,
      payload: { invite_id: invite.id, subject },
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown email send error"
    await setInviteEmailStatus(invite.id, { sent: false, error: msg })
    await logEmailSend({
      email: invite.email,
      email_type: "invite",
      source,
      source_ref: sourceRef,
      status: "error",
      error_message: msg,
      attempt: (invite.resend_count ?? 0) + 1,
      payload: { invite_id: invite.id },
    })
    return { ok: false, error: msg }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Templates — em ES, cinematográfico, dark theme, mobile-first
// ───────────────────────────────────────────────────────────────────────────

function renderInviteHtml(p: { firstName: string; link: string }): string {
  const { firstName, link } = p
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu acceso a [BRAND_NAME]</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e8e3d8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0f;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;width:100%;background:#10101a;border:1px solid #1f1925;border-top:3px solid #7f1d1d;">
          <tr>
            <td style="padding:48px 40px 32px;">
              <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#8a7a55;font-weight:600;">
                Acceso · Miembros
              </p>
              <h1 style="margin:0 0 20px;font-family:'Cinzel',Georgia,serif;font-size:36px;font-weight:700;line-height:1.05;letter-spacing:-0.01em;color:#f4eedd;">
                Bienvenido,<br>
                <span style="color:#7f1d1d;">${escapeHtml(firstName)}.</span>
              </h1>
              <div style="width:48px;height:2px;background:#7f1d1d;margin:0 0 24px;"></div>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#bdb39d;">
                Tu compra fue confirmada. El próximo capítulo te espera dentro del área de miembros — pero antes, necesitas crear tu cuenta.
              </p>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.65;color:#bdb39d;">
                Haz clic en el botón abajo para definir tu contraseña y entrar:
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#f4eedd;border:1px solid #f4eedd;">
                    <a href="${link}" target="_blank" rel="noopener" style="display:inline-block;padding:18px 36px;font-size:14px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:#0a0a0f;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                      Crear mi cuenta →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#6a6249;">
                ¿El botón no funciona? Copia y pega este link en tu navegador:
              </p>
              <p style="margin:0 0 32px;word-break:break-all;font-size:12px;line-height:1.5;color:#8a7a55;font-family:'Courier New',monospace;">
                ${escapeHtml(link)}
              </p>

              <div style="height:1px;background:#1f1925;margin:0 0 24px;"></div>

              <p style="margin:0 0 8px;font-size:11px;line-height:1.6;color:#6a6249;letter-spacing:0.05em;">
                <strong style="color:#8a7a55;">Importante:</strong> este enlace es único y solo puede usarse una vez. Tienes 7 días para crear tu cuenta antes de que expire.
              </p>
              <p style="margin:0 0 24px;font-size:11px;line-height:1.6;color:#6a6249;letter-spacing:0.05em;">
                Si tienes alguna duda, responde directamente a este email — el equipo de [BRAND_NAME] te responderá lo antes posible.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#08080d;padding:20px 40px;border-top:1px solid #1f1925;">
              <p style="margin:0;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#5a523d;font-weight:600;">
                [BRAND_NAME] · Embudo Gamificado
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:11px;color:#3a3328;text-align:center;">
          Recibiste este email porque adquiriste un producto de [BRAND_NAME].
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function renderInviteText(p: { firstName: string; link: string }): string {
  return `Bienvenido, ${p.firstName}.

Tu compra fue confirmada. Para acceder al área de miembros, necesitas crear tu cuenta.

Crea tu cuenta aquí:
${p.link}

Importante:
- Este enlace es único y solo puede usarse una vez.
- Tienes 7 días para crear tu cuenta antes de que expire.

Si tienes dudas, responde directamente a este email.

[BRAND_NAME] · Embudo Gamificado`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// ───────────────────────────────────────────────────────────────────────────
// Email pra cliente que JÁ TEM CONTA — compra de novo (upsell, recovery,
// produto adicional). Em vez de mandar link de criação, manda link de login.
// ───────────────────────────────────────────────────────────────────────────

export async function sendAccountExistsEmail(params: {
  email: string
  customerName: string | null
  source?: EmailSource
  sourceRef?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const firstName = (params.customerName?.split(" ")[0] ?? "").trim() || "viajero"
  const loginLink = `${MIEMBROS_URL}/login`

  const subject = "Tu compra fue aprobada — accede a tu cuenta"
  const html = renderAccountExistsHtml({ firstName, loginLink })
  const text = renderAccountExistsText({ firstName, loginLink })

  const source = params.source || "stripe_front"
  const sourceRef = params.sourceRef ?? null

  try {
    const { data, error } = await getResend().emails.send({
      from: getEmailFrom(),
      to: [params.email],
      subject,
      html,
      text,
    })

    if (error) {
      const msg = typeof error === "object" && "message" in error ? String(error.message) : "Resend error"
      await logEmailSend({
        email: params.email,
        email_type: "account_exists",
        source,
        source_ref: sourceRef,
        status: "failed",
        error_message: msg,
        payload: { subject },
      })
      return { ok: false, error: msg }
    }

    await logEmailSend({
      email: params.email,
      email_type: "account_exists",
      source,
      source_ref: sourceRef,
      status: "success",
      resend_id: data?.id ?? null,
      payload: { subject },
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown email send error"
    await logEmailSend({
      email: params.email,
      email_type: "account_exists",
      source,
      source_ref: sourceRef,
      status: "error",
      error_message: msg,
    })
    return { ok: false, error: msg }
  }
}

function renderAccountExistsHtml(p: { firstName: string; loginLink: string }): string {
  const { firstName, loginLink } = p
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu compra fue aprobada</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e8e3d8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0f;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;width:100%;background:#10101a;border:1px solid #1f1925;border-top:3px solid #7f1d1d;">
          <tr>
            <td style="padding:48px 40px 32px;">
              <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#8a7a55;font-weight:600;">
                Compra · Confirmada
              </p>
              <h1 style="margin:0 0 20px;font-family:'Cinzel',Georgia,serif;font-size:36px;font-weight:700;line-height:1.05;letter-spacing:-0.01em;color:#f4eedd;">
                ¡Hola,<br>
                <span style="color:#7f1d1d;">${escapeHtml(firstName)}!</span>
              </h1>
              <div style="width:48px;height:2px;background:#7f1d1d;margin:0 0 24px;"></div>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#bdb39d;">
                Tu compra fue aprobada exitosamente. El nuevo contenido ya está disponible en tu cuenta existente.
              </p>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.65;color:#bdb39d;">
                Accede con la contraseña que ya tienes:
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#f4eedd;border:1px solid #f4eedd;">
                    <a href="${loginLink}" target="_blank" rel="noopener" style="display:inline-block;padding:18px 36px;font-size:14px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:#0a0a0f;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                      Acceder a mi cuenta →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#6a6249;">
                ¿Olvidaste tu contraseña? Puedes recuperarla desde la página de login.
              </p>

              <div style="height:1px;background:#1f1925;margin:24px 0;"></div>

              <p style="margin:0 0 24px;font-size:11px;line-height:1.6;color:#6a6249;letter-spacing:0.05em;">
                Si tienes alguna duda, responde directamente a este email — el equipo de [BRAND_NAME] te responderá lo antes posible.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#08080d;padding:20px 40px;border-top:1px solid #1f1925;">
              <p style="margin:0;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#5a523d;font-weight:600;">
                [BRAND_NAME] · Embudo Gamificado
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

function renderAccountExistsText(p: { firstName: string; loginLink: string }): string {
  return `¡Hola, ${p.firstName}!

Tu compra fue aprobada exitosamente. El nuevo contenido ya está disponible en tu cuenta existente.

Accede con la contraseña que ya tienes:
${p.loginLink}

¿Olvidaste tu contraseña? Puedes recuperarla desde la página de login.

Si tienes dudas, responde directamente a este email.

[BRAND_NAME] · Embudo Gamificado`
}
