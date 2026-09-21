-- ============================================================================
-- LA RED · INSTRUCTOR DE LOS 144.000    PREPARADA, NO EJECUTADA
-- ============================================================================
-- Da de alta la función nueva en el catálogo. Sin esta fila, la policy de
-- solicitudes rechaza cualquier petición del rol: exige que exista y esté
-- activo en public.network_roles.
--
-- Correr DESPUÉS de red_v1_identidad.sql.
--
-- GARANTÍAS
--   · Solo INSERTA una fila. No toca tablas, policies ni grants.
--   · Idempotente: si ya existe, no hace nada.
-- ============================================================================

insert into public.network_roles (code, name, description, sort_order) values
  ('instructor',
   'Instructor de Los 144.000',
   'Conduce la formación de un grupo de contacto durante los dieciséis encuentros del Umbral.',
   5)
on conflict (code) do nothing;


-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN (solo lectura)
-- ════════════════════════════════════════════════════════════════════════
-- Se esperan las funciones activas, con el Instructor entre ellas.

select code, name, sort_order, is_active
from public.network_roles
order by sort_order;
