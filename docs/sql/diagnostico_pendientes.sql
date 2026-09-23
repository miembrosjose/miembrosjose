-- ============================================================================
-- ¿QUÉ SQL FALTA POR CORRER?
-- ============================================================================
-- Solo LEE. No modifica nada.
--
-- Una única consulta, porque el editor de Supabase muestra solo el último
-- resultado. Cada fila dice si algo está puesto y, si falta, qué archivo lo
-- pone.
-- ============================================================================

with comprobaciones as (

  -- ── La Red ──────────────────────────────────────────────────────────────
  select 1 as n, 'Encuentros presenciales' as que,
         to_regclass('public.network_meetings') is not null as ok,
         'red_v4_encuentros.sql' as archivo
  union all
  select 2, 'Solicitudes de función',
         to_regclass('public.network_role_requests') is not null,
         'red_v5_solicitudes.sql'
  union all
  select 3, 'Rol Instructor en el catálogo',
         exists (select 1 from public.network_roles where code = 'instructor'),
         'red_v6_instructor.sql'
  union all
  select 4, 'Emblema destacado en el directorio',
         exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'member_location'
                   and column_name = 'featured_badge_id'),
         'red_v3_mapa.sql'

  -- ── Meditaciones ────────────────────────────────────────────────────────
  union all
  select 10, 'Las 14 meditaciones nuevas',
         (select count(*) from public.meditations) >= 16,
         'meditaciones_nuevas.sql'
  union all
  select 11, 'Meditación incluida del Ep. 5',
         exists (select 1 from public.meditations where id = 's1e5-nombre-included'),
         'meditacion_nombre_incluida.sql'

  -- ── Otros pendientes que arrastramos ────────────────────────────────────
  union all
  select 20, 'Lugares del Mapa Cósmico',
         to_regclass('public.contact_places') is not null,
         'contact_places.sql'
  union all
  select 21, 'Transmisiones',
         to_regclass('public.transmissions') is not null,
         'transmissions.sql'
  union all
  select 22, 'Idempotencia del webhook de Stripe',
         to_regclass('public.stripe_processed_events') is not null,
         'stripe_safety_minimal.sql'
  union all
  select 23, 'Producto Numerología Profunda',
         exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = 'products')
         and exists (select 1 from public.products where name ilike '%numerolog%'),
         'numerologia_profunda_producto.sql'
)

select
  case when ok then '✓' else '✗ FALTA' end as estado,
  que,
  case when ok then '' else archivo end as correr
from comprobaciones
order by n;
