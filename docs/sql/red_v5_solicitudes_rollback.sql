-- ============================================================================
-- ROLLBACK de red_v5_solicitudes.sql
-- ============================================================================
-- ⚠ BORRA LA TABLA Y TODAS LAS SOLICITUDES, pendientes incluidas.
--   Las funciones ya concedidas NO se tocan: viven en
--   network_role_assignments, que es otra tabla.
-- ============================================================================

-- Comprueba antes qué se va a perder:
-- select estado, count(*) from public.network_role_requests group by estado;

drop table if exists public.network_role_requests;

select count(*) as tablas_restantes
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'network_role_requests';
