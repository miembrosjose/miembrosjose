# Backup y recuperación — Los 144.000

Procedimiento de respaldo y restauración. **No incluye valores reales de claves.** Usa placeholders.
No ejecutar exportaciones reales sin credenciales y autorización del titular.

## Proyectos y servicios implicados

| Servicio | Proyecto | Contenido crítico |
|---|---|---|
| Supabase (plataforma) | `los144000` (ref `kjozrcugsywykpuvuqzu`) | Auth + datos de miembros |
| Supabase (embudo) | proyecto distinto del embudo | `embudo_registros`, `funnel_events` |
| Cloudflare Workers | `los144000` (plataforma) + Pages (embudo) | despliegue, vars/secrets |
| Stripe | cuenta única | producto, precio, suscripciones, webhook |
| Resend | dominio `auth.los144000.com` | SMTP transaccional |
| GitHub | `miembrosjose`, `los-144000-embudo` | código fuente |

## Tablas críticas

**Plataforma (`kjozrcugsywykpuvuqzu`):**
- `auth.users` (Supabase Auth — cuentas y contraseñas)
- `public.member_subscriptions` (fuente de verdad del acceso)
- `public.member_sync_events` (idempotencia de sincronización)
- `public.profiles`, contenido: `seasons`, `episodes`, `episode_blocks`, progreso, foro, etc.
- `public.account_invites`, `public.stripe_sales`

**Embudo (proyecto aparte):**
- `public.embudo_registros` (registros + consentimiento legal)
- `public.stripe_webhook_events` (idempotencia webhook)
- `public.funnel_events` (analítica del embudo)

## Respaldos automáticos (Supabase)

Supabase ofrece backups automáticos y/o Point-in-Time Recovery (PITR) según el plan del proyecto.
**Acción requerida:** verificar en cada proyecto → *Database → Backups* que estén habilitados y
anotar la retención. PITR se recomienda para producción.

## Backup manual (bajo demanda) — placeholders

```bash
# Volcado lógico de una base (requiere connection string del pooler; NO commitear)
pg_dump "postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@<POOLER_HOST>:6543/postgres" \
  --no-owner --format=custom --file "backup_<PROJECT>_$(date +%F).dump"

# Solo tablas críticas
pg_dump "<CONNECTION_STRING>" -t public.member_subscriptions -t public.member_sync_events \
  --format=custom --file "backup_subs_$(date +%F).dump"
```

Guarda los volcados **cifrados** y fuera del repositorio. Nunca subir `.dump` ni credenciales a git.

## Restauración — placeholders

```bash
# Restaurar un volcado a una base (¡destructivo si apunta a producción!)
pg_restore --no-owner --clean --if-exists \
  -d "postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@<POOLER_HOST>:6543/postgres" \
  "backup_<PROJECT>_<FECHA>.dump"
```

Para PITR: usar el panel de Supabase (*Database → Backups → Restore*) y seguir el asistente.
**Restaurar SIEMPRE primero en un proyecto de staging**, verificar, y solo entonces producción.

## Variables, secretos y configuración

- Cloudflare (plataforma): secretos vía `wrangler secret put <NOMBRE>` — `SUPABASE_SERVICE_ROLE_KEY`,
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EMBUDO_SYNC_SECRET`, `R2_SECRET_ACCESS_KEY`.
- Cloudflare (embudo): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`,
  `SUPABASE_SECRET_KEY`, `PLATFORM_SYNC_URL`, `PLATFORM_SYNC_SECRET`.
- Mantén una copia **cifrada y offline** del inventario de nombres de variables (no de sus valores).
- Stripe: exportar/anotar `price_id`, `product_id`, Payment Link y el endpoint del webhook.
- Resend: anotar dominio verificado y remitente.

## Frecuencia y responsable

- Revisión de backups automáticos: **semanal**.
- Backup manual completo: **antes de cada migración importante** y **mensual**.
- Prueba de restauración en staging: **trimestral**.
- Responsable: _(pendiente de asignar por el titular)_.

## Checklist de emergencia

1. No borrar ni sobrescribir datos en pánico.
2. Identificar alcance (¿qué tabla/proyecto?).
3. Aislar: pausar despliegues nuevos.
4. Restaurar en staging desde el backup/PITR más reciente sano.
5. Verificar integridad (conteos, filas críticas de `member_subscriptions`).
6. Promover a producción solo tras validar.
7. Registrar el incidente y la causa raíz.
