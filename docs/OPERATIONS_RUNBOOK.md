# Runbook de operación — Los 144.000

Guía rápida para resolver incidencias comunes. No borrar datos manualmente salvo indicación expresa.

## Un pago no activa la membresía

1. **Stripe → Payments**: confirmar que el pago está `succeeded` y es una suscripción.
2. **Stripe → Webhooks**: revisar que el evento (`checkout.session.completed` / `invoice.paid`) se
   entregó al webhook del embudo con `200`.
3. **Embudo → `embudo_registros`**: la fila del email debe tener `estado='activo'`.
4. **Plataforma → panel admin → Suscripciones**: buscar el email; debe existir en
   `member_subscriptions` con `status='active'`.
5. Si el registro del embudo está activo pero NO aparece en la plataforma → revisar
   **`member_sync_events`** (sección *Estado del sistema* del panel): ¿hay una fila `failed` para ese
   `source_event_id`?
6. Reenviar el evento desde Stripe (ver abajo) para reintentar la sincronización.

## Resend no entrega el correo

1. **Resend → Logs**: buscar el envío por destinatario; ver estado (delivered / bounced / dropped).
2. Verificar el dominio `auth.los144000.com` (DKIM/SPF) verificado.
3. En Supabase → *Authentication → Emails*: confirmar SMTP personalizado (Resend) configurado y
   plantillas Invite/Reset correctas.
4. Rate limit: el proveedor integrado de Supabase limita fuertemente; con SMTP propio (Resend) el
   límite es mayor. Reintentar con un enlace nuevo.

## El webhook devuelve error

1. **Stripe → Webhooks → (endpoint) → intentos recientes**: ver código y cuerpo (genérico).
2. La firma inválida da `400` (no toca datos). Config faltante da `500`.
3. Revisar logs del Worker/Pages (Cloudflare → Workers/Pages → Logs).
4. Corregir la causa y **reenviar** el evento.

## Reenviar un evento desde Stripe

Stripe → *Developers → Events* → seleccionar el evento → **Resend**. También desde
*Webhooks → endpoint → Send test webhook* para pruebas. La idempotencia (`stripe_webhook_events` en
el embudo, `member_sync_events` en la plataforma, por `source_event_id`) evita duplicar acciones.

## Revisar member_sync_events (plataforma)

Panel admin → **Suscripciones → Estado del sistema**. Estados: `processing` (en curso),
`completed` (ok), `failed` (reintentar). Un `failed` se puede reintentar reenviando el evento de
Stripe: el endpoint `/api/internal/member-sync` re-reclama el `source_event_id` y reintenta.

## Revisar stripe_webhook_events (embudo)

En la base del embudo, tabla `stripe_webhook_events` (PK = `id` del evento). Si un evento no está,
no se procesó por completo → Stripe lo reintenta.

## Identificar una cuenta past_due

Panel admin → Suscripciones → filtro **Pago pendiente**. El miembro ve la pantalla *"Tu pago necesita
atención"* y puede pulsar **Actualizar método de pago** (abre Stripe Customer Portal).

## Cancelar una suscripción

Preferente: el propio miembro desde **Mi membresía** (portal). Manual: Stripe → *Customers →
(cliente) → Subscriptions → Cancel* (al final del periodo o inmediata). El webhook actualizará el
estado y la sincronización lo reflejará en la plataforma.

## Reembolsar

Stripe → *Payments → (pago) → Refund*. Consultar la política en `/cancelaciones-y-reembolsos`.
`charge.refunded` puede afectar el acceso según la lógica del webhook.

## Recuperar acceso de un miembro

- past_due → que actualice el pago (portal). Al llegar `invoice.paid`, el acceso vuelve solo.
- Olvidó contraseña → `/recuperar-contrasena`.
- No recibió invitación → reenviar invitación desde Supabase (Authentication → Users → Invite) o
  reenviar el evento de Stripe que la origina.

## Verificar un despliegue

1. GitHub Actions del repo → workflow en `success`.
2. Producción responde: `https://los144000.com/miembros` (redirige a login si no hay sesión),
   páginas legales `200`.
3. Revisar Cloudflare → deployment activo correcto.

## Contacto técnico de soporte

Definir en `lib/site/legal-config.ts` (`supportEmail`, `supportWhatsApp`). La página `/soporte`
los muestra automáticamente cuando estén configurados.

## Qué NO borrar manualmente

- Filas de `member_subscriptions` (romperían el acceso; usar Stripe para cambios de estado).
- `member_sync_events` / `stripe_webhook_events` (romperían la idempotencia → duplicaciones).
- Usuarios de `auth.users` sin respaldo previo.
