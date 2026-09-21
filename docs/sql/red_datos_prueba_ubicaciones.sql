-- ============================================================================
-- LA RED · DATOS DE PRUEBA (PRUDENTE) — repartir solo a quien no tiene ciudad
-- ============================================================================
-- La variante conservadora. Úsala cuando ya haya miembros reales: solo toca a
-- quien HOY NO TIENE CIUDAD, así nadie pierde la que eligió.
--
-- Si aún son todas cuentas de prueba y quieres llenar el mapa de golpe, usa
-- red_datos_prueba_forzar.sql en su lugar.
--
-- GARANTÍAS
--   · No borra filas. No modifica auth.users, ni RLS, ni grants.
--   · Idempotente: correrlo dos veces no cambia nada la segunda vez.
--
-- QUIÉN QUEDA PROTEGIDO
--   Toda cuenta con marca de administrador, en cualquiera de los dos sitios
--   donde la plataforma la guarda. Más las que añadas al array.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════
-- 1 · REPARTO
-- ════════════════════════════════════════════════════════════════════════
-- Una ciudad por país, la más poblada del catálogo. El salto de 7 en 7 evita
-- que las primeras cuentas caigan todas en el mismo continente.

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
  left join public.member_location ml on ml.user_id = u.id
  where not exists (select 1 from protegidos p where p.id = u.id)
    -- La condición clave: solo quien todavía no aparece en el mapa.
    and (ml.user_id is null or ml.city_id is null)
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
-- 2 · VERIFICACIÓN (solo lectura)
-- ════════════════════════════════════════════════════════════════════════
-- El editor de Supabase muestra solo el ÚLTIMO resultado: este es el que verás.

select
  ml.country_code                      as pais,
  c.name                               as ciudad,
  count(*)                             as miembros,
  count(*) filter (where ml.show_city) as visibles
from public.member_location ml
left join public.network_cities c on c.id = ml.city_id
group by ml.country_code, c.name
order by count(*) desc, ml.country_code;
