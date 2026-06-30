// Email de recovery quando pagamento Stripe falha.
// Disparado por /api/checkout/payment-failed em paralelo com WhatsApp.

import { getResend, getEmailFrom } from "./resend"

export async function sendPaymentFailedRecoveryEmail(params: {
  email: string
  firstName: string
  hotmartUrl: string
}): Promise<{ ok: boolean; error?: string }> {
  const subject = "Tu pago no fue aprobado — probá esta opción"
  const html = renderRecoveryHtml({ firstName: params.firstName, link: params.hotmartUrl })
  const text = renderRecoveryText({ firstName: params.firstName, link: params.hotmartUrl })

  try {
    const { error } = await getResend().emails.send({
      from: getEmailFrom(),
      to: [params.email],
      subject,
      html,
      text,
    })
    if (error) {
      const msg = typeof error === "object" && "message" in error ? String(error.message) : "Resend error"
      return { ok: false, error: msg }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send error" }
  }
}

function renderRecoveryHtml(p: { firstName: string; link: string }): string {
  const { firstName, link } = p
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu pago no fue aprobado</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e8e3d8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#000000;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;width:100%;background:#10101a;border:1px solid #1f1925;border-top:3px solid #7f1d1d;">
          <tr>
            <td style="padding:48px 40px 32px;">
              <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#8a7a55;font-weight:600;">
                Pago no aprobado
              </p>
              <h1 style="margin:0 0 20px;font-family:'Cinzel',Georgia,serif;font-size:32px;font-weight:700;line-height:1.05;letter-spacing:-0.01em;color:#f4eedd;">
                Hola,<br>
                <span style="color:#7f1d1d;">${escapeHtml(firstName)}.</span>
              </h1>
              <div style="width:48px;height:2px;background:#7f1d1d;margin:0 0 24px;"></div>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#bdb39d;">
                Vimos que tu pago en Los 144000 no fue aprobado.
              </p>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.65;color:#bdb39d;">
                👉 Probá esta opción alternativa — procesa estos casos sin problema:
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#f4eedd;border:1px solid #f4eedd;">
                    <a href="${link}" target="_blank" rel="noopener" style="display:inline-block;padding:18px 36px;font-size:14px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:#000000;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                      Probar otra opción →
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
                Si necesitás ayuda, respondé directamente a este email.
              </p>
              <p style="margin:0 0 24px;font-size:11px;line-height:1.6;color:#6a6249;letter-spacing:0.05em;">
                <strong style="color:#8a7a55;">— Equipo Los 144000</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#08080d;padding:20px 40px;border-top:1px solid #1f1925;">
              <p style="margin:0;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#5a523d;font-weight:600;">
                Los 144000 · Embudo Gamificado
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

function renderRecoveryText(p: { firstName: string; link: string }): string {
  return `Hola, ${p.firstName}.

Vimos que tu pago en Los 144000 no fue aprobado.
👉 Probá esta opción alternativa — procesa estos casos sin problema:
${p.link}

Si necesitás ayuda, respondé este email.

— Equipo Los 144000`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
