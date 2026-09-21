-- ============================================================================
-- DIAGNÓSTICO — ¿por qué no aparecen los otros usuarios en La Red?
-- ============================================================================
-- Solo LEE. No modifica nada.
--
-- Una única consulta, porque el editor de Supabase muestra solo el último
-- resultado.
-- ============================================================================

with protegidos as (
  select unnest(array['jos.bacigalupo@gmail.com']::text[]) as email
)
select * from (

  select 1 as n, 'Usuarios en auth.users' as dato,
         count(*)::text as valor,
         'Si es 1, no hay usuarios de prueba que repartir.' as lectura
  from auth.users

  union all
  select 2, 'De ellos, SIN email',
         count(*)::text,
         'Estos eran los que el script saltaba antes de la corrección.'
  from auth.users where email is null

  union all
  select 3, 'Filas en member_location',
         count(*)::text,
         'Una por cada miembro que tiene ubicación guardada.'
  from public.member_location

  union all
  select 4, 'Con ciudad asignada',
         count(*)::text,
         'Sin ciudad no pueden dibujarse en el mapa.'
  from public.member_location where city_id is not null

  union all
  select 5, 'Visibles (show_city = true)',
         count(*)::text,
         'ESTE es el número que el mapa y la lista muestran.'
  from public.member_location where show_city

  union all
  select 6, 'Ciudades activas en el catálogo',
         count(*)::text,
         'Si es 0, falta correr red_v1_ciudades_seed.sql.'
  from public.network_cities where is_active

  union all
  select 7, 'Países distintos en el catálogo',
         count(distinct country_code)::text,
         'Entre cuántos países reparte el script.'
  from public.network_cities where is_active

  union all
  select 8, 'Candidatos que el script tomaría AHORA',
         count(*)::text,
         'Si es 0 y hay usuarios, es que ya tienen ciudad o están protegidos.'
  from auth.users u
  left join public.member_location ml on ml.user_id = u.id
  where not exists (select 1 from protegidos p where p.email = u.email)
    and (ml.user_id is null or ml.city_id is null)

  union all
  select 9, 'Miembros con display_name relleno',
         count(*)::text,
         'Lo rellena el trigger. Si es menor que la fila 3, el trigger no corrió.'
  from public.member_location where display_name is not null

  union all
  select 10, 'Ciudades distintas ocupadas',
         count(distinct city_id)::text,
         'Cuántas burbujas deberías ver repartidas por el mapa.'
  from public.member_location where show_city and city_id is not null

) d
order by n;
