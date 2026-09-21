-- ============================================================================
-- ROLLBACK de red_datos_prueba_ubicaciones.sql
-- ============================================================================
-- ⚠ ESTE SÍ BORRA FILAS. Solo para limpiar los datos de prueba.
--
-- No hay forma de distinguir después cuáles ubicaciones puso el script y
-- cuáles eligió una persona: la tabla no guarda esa marca (y no vale la pena
-- añadirle una columna a producción solo para esto). Por eso el rollback usa
-- el mismo criterio que el reparto: todo el mundo MENOS las cuentas
-- protegidas.
--
-- Si para cuando lo ejecutes ya hay miembros reales que eligieron su ciudad,
-- AÑÁDELOS a la lista de protegidos antes de correrlo, o perderán su elección.
-- ============================================================================

with protegidos as (
  -- Se protege a TODA cuenta con marca de administrador, en cualquiera de los
  -- dos sitios donde la plataforma la guarda. Así la lista no depende de que
  -- alguien recuerde escribir el correo correcto.
  --
  -- Para blindar además cuentas concretas, añade sus correos al array.
  select u.id
  from auth.users u
  left join public.profiles p on p.id = u.id
  where coalesce((u.raw_app_meta_data->>'is_admin')::boolean, false)
     or coalesce(p.is_admin, false)
     or u.email = any (array[]::text[])
)
delete from public.member_location ml
using auth.users u
where u.id = ml.user_id
  and not exists (select 1 from protegidos p where p.id = u.id);


-- Verificación: qué queda.
select
  ml.country_code as pais,
  c.name          as ciudad,
  count(*)        as miembros
from public.member_location ml
left join public.network_cities c on c.id = ml.city_id
group by ml.country_code, c.name
order by count(*) desc;
