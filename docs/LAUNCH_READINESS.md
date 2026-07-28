# Launch Readiness — Los 144.000

Estado de preparación para el lanzamiento público. Actualizar a medida que se cierren pendientes.

Leyenda: ✅ listo · 🟡 parcial · ⛔ bloqueado · 🧪 requiere prueba manual

## Bloques

| Bloque | Estado | Notas |
|---|---|---|
| Config legal centralizada (`lib/site/legal-config.ts`) | ✅ | Faltan datos de identidad jurídica (ver `LEGAL_INFORMATION_REQUIRED.md`) |
| Páginas legales (`/terminos`, `/privacidad`, `/cancelaciones-y-reembolsos`) | ✅ | Borradores; **requieren revisión legal** |
| Página de soporte (`/soporte`) | 🟡 | Publica contacto solo cuando `supportEmail`/`supportWhatsApp` estén definidos |
| Enlaces legales (login/activación/recuperación/suspendido/perfil) | ✅ | Componente `LegalLinks` reutilizado |
| Consentimiento recurrente (embudo) | ✅ | Implementado por el programador (checkboxes + registro en `embudo_registros`) |
| Migración consentimiento embudo | 🟡 🧪 | SQL creado; **pendiente de aplicar** en el Supabase del embudo |
| Recuperación past_due (portal sin gate active) | ✅ 🧪 | Probar flujo real con una cuenta past_due |
| Panel admin de suscripciones + CSV | ✅ 🧪 | `/api/admin/subscriptions` + pestaña *Suscripciones* |
| Estado del sistema (member_sync_events) + badge | ✅ | Badge rojo en sidebar si hay fallos |
| Métricas de lanzamiento | 🟡 | MRR estimado + conteos por estado; registros/conversión viven en el embudo |
| 404 / error boundaries | ✅ | `not-found.tsx`, `error.tsx`, `global-error.tsx` |
| SEO (robots/sitemap/manifest) | ✅ | Legales indexables; miembros/flujos noindex |
| Accesibilidad / responsive | 🟡 🧪 | Ver `ACCESSIBILITY_REVIEW.md` (pendientes con lector de pantalla) |
| Backup y recuperación | 🟡 🧪 | Documentado; **verificar backups Supabase y probar restauración** |
| Runbook de operación | ✅ | `OPERATIONS_RUNBOOK.md` |

## Migraciones pendientes de aplicar (NO ejecutadas)

- **Embudo**: `supabase/migrations/20260727120000_embudo_consent_columns.sql` (columnas de consentimiento en `embudo_registros`). Creada por el programador; aplicar con autorización.

> La plataforma no requiere migraciones nuevas en esta tanda: `member_subscriptions` y
> `member_sync_events` ya están aplicadas en tandas anteriores.

## Configuración externa pendiente

- Supabase (plataforma): plantillas de correo Invite/Reset ya definidas; verificar Redirect URLs
  (`/activar-cuenta`, `/miembros/cuenta/recuperar`) y Site URL `https://los144000.com`.
- Completar datos legales/contacto en `lib/site/legal-config.ts` (y espejo en el embudo).
- Verificar backups/PITR en ambos proyectos Supabase.

## Responsable

- Titular / propietario: datos legales, decisiones de política de reembolso, verificación de backups.
- Técnico: aplicar migración del embudo, completar contacto, pruebas manuales.

## Estado global

🟡 **Parcial** — código, páginas, navegación, panel y documentación listos. Bloqueantes para el
lanzamiento: (1) datos legales + revisión jurídica, (2) aplicar migración de consentimiento del
embudo, (3) pruebas manuales de pago/recuperación/accesibilidad.
