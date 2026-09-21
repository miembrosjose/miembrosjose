-- ============================================================================
-- LA RED · DATOS DE PRUEBA (FORZADO) — todos los usuarios al mapa
-- ============================================================================
-- ⚠ SOBRESCRIBE la ciudad de TODAS las cuentas menos las protegidas, y activa
--   «Mostrar mi ciudad» en ellas. Si alguien ya había elegido dónde aparecer,
--   pierde esa elección.
--
--   Es lo correcto mientras la plataforma sean cuentas de prueba. En cuanto
--   haya miembros reales, añade sus correos al array de protegidos o deja de
--   usar este script.
--
-- QUIÉN QUEDA PROTEGIDO
--   Toda cuenta con marca de administrador, en cualquiera de los dos sitios
--   donde la plataforma la guarda (auth.users.raw_app_meta_data y
--   profiles.is_admin). Antes había un correo escrito a mano aquí, y NO era el
--   de la cuenta real: el administrador se estaba repartiendo como una cuenta
--   de prueba más. Construyéndola así, la lista no depende de que nadie
--   recuerde el correo correcto.
--
-- No borra filas. No toca auth.users, ni RLS, ni grants.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════
-- 1 · REPARTO POR EL MUNDO
-- ════════════════════════════════════════════════════════════════════════
-- Una ciudad por país, la más poblada del catálogo. El salto de 7 en 7 evita
-- que las primeras cuentas caigan todas en el mismo continente. Si hay más
-- cuentas que países, varias comparten ciudad: eso es deseable, es lo que
-- prueba el número dentro de la burbuja.

with protegidos as (
  select u.id
  from auth.users u
  left join public.profiles p on p.id = u.id
  where coalesce((u.raw_app_meta_data->>'is_admin')::boolean, false)
     or coalesce(p.is_admin, false)
     -- Cuentas concretas que también quieras blindar:
     or u.email = any (array[]::text[])
),
objetivo as (
  select id, country_code, row_number() over (order by country_code) - 1 as n
  from (
    select distinct on (country_code) id, country_code
    from public.network_cities
    where is_active
    order by country_code, population desc nulls last, name
  ) c
),
total as (select count(*)::int as k from objetivo),
candidatos as (
  select u.id, row_number() over (order by u.created_at) - 1 as n
  from auth.users u
  where not exists (select 1 from protegidos p where p.id = u.id)
)
insert into public.member_location (user_id, country_code, city_id, show_city)
select c.id, o.country_code, o.id, true
from candidatos c
cross join total t
join objetivo o on o.n = (c.n * 7) % t.k
on conflict (user_id) do update
  set country_code = excluded.country_code,
      city_id      = excluded.city_id,
      show_city    = true,
      updated_at   = now();


-- ════════════════════════════════════════════════════════════════════════
-- 2 · UN GRUPO EN UNA MISMA CIUDAD
-- ════════════════════════════════════════════════════════════════════════
-- Para ver el número desde lejos y las caras repartiéndose en anillo al
-- acercarse hace falta que varias cuentas coincidan. Esto manda un tercio de
-- ellas a la ciudad más poblada del catálogo.
--
-- Si no lo quieres, comenta este bloque entero antes de ejecutar.

with protegidos as (
  select u.id
  from auth.users u
  left join public.profiles p on p.id = u.id
  where coalesce((u.raw_app_meta_data->>'is_admin')::boolean, false)
     or coalesce(p.is_admin, false)
     or u.email = any (array[]::text[])
),
hub as (
  select id, country_code
  from public.network_cities
  where is_active
  order by population desc nulls last, name
  limit 1
),
elegidos as (
  select u.id, row_number() over (order by u.created_at) - 1 as n
  from auth.users u
  where not exists (select 1 from protegidos p where p.id = u.id)
)
update public.member_location ml
   set city_id      = h.id,
       country_code = h.country_code,
       show_city    = true,
       updated_at   = now()
  from elegidos e, hub h
 where ml.user_id = e.id
   and e.n % 3 = 0;


-- ════════════════════════════════════════════════════════════════════════
-- 3 · VERIFICACIÓN (solo lectura)
-- ════════════════════════════════════════════════════════════════════════
-- El editor de Supabase muestra solo el ÚLTIMO resultado: este es el que verás.
-- Deberías ver varias filas, y una con un número claramente mayor (el grupo).

select
  ml.country_code                      as pais,
  c.name                               as ciudad,
  count(*)                             as miembros,
  count(*) filter (where ml.show_city) as visibles
from public.member_location ml
left join public.network_cities c on c.id = ml.city_id
group by ml.country_code, c.name
order by count(*) desc, ml.country_code;
