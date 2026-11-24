-- ═══════════════════════════════════════════════════════════════════════════
--  DOS COSAS · que el buscador vaya rápido, y ampliar el registro
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Correr DESPUÉS de `geo_ciudades_01_tabla.sql` y de haber importado los CSV.
-- Es aditivo: no borra ni una fila.

-- ═══════════════════════════════════════════════════════════════════════════
--  1 · POR QUÉ IBA LENTO, Y CÓMO SE ARREGLA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- José: «toma mucho tiempo el buscar una ciudad ahora». Cierto, y la culpa es
-- de cómo lo escribí.
--
-- La función hacía SIEMPRE todo el trabajo. Tres lecturas de la frase —entera,
-- separando la última palabra, separando las dos últimas— y dentro de cada
-- una, las tres pasadas: empieza-por, contiene, se-parece. Nueve consultas
-- sobre 1.305.742 filas, en cada búsqueda, aunque la primera ya hubiera
-- encontrado las ocho que caben en la lista.
--
-- Y las caras son justo las que casi nunca hacen falta:
--
--   · «contiene» es un `LIKE '%texto%'`, que no puede usar un índice de
--     prefijo y tiene que ir por trigramas.
--   · «se parece» calcula la semejanza contra cada candidato.
--
-- Escribiendo «bogota», la primera pasada de la primera lectura ya tiene lo
-- que hace falta. Las otras ocho consultas eran trabajo tirado.
--
-- ── EL ARREGLO ────────────────────────────────────────────────────────────
-- Se para en cuanto hay suficiente. Cada pasada mira cuántas van y, si la
-- lista está llena, no ejecuta la siguiente. Lo mismo entre lecturas: si la
-- frase entera encontró la ciudad, no se prueba a partirla.
--
-- No se pierde nada: las pasadas que se saltan son las que solo entran cuando
-- las de antes no bastaron.
--
-- ── Y UNA COSA QUE SE GANA DE PASO ────────────────────────────────────────
-- Las tres pasadas se excluyen entre sí por construcción —la 2 descarta lo
-- que empieza por el patrón y la 3 descarta lo que lo contiene—, así que no
-- hace falta volver a quitar repetidos al final. Los duplicados de GeoNames,
-- que sí existen, los quita el `distinct on` dentro de cada pasada.

drop function if exists public.buscar_ciudad(text, text, int);
drop function if exists public.buscar_ciudad_simple(text, text, int);

create or replace function public.buscar_ciudad_simple(
  q text,
  lugar text default null,
  limite int default 8
)
returns table (
  nombre text,
  provincia text,
  pais text,
  pais_codigo text,
  lat double precision,
  lon double precision,
  zona text,
  poblacion integer,
  tambien text,
  puntos real
)
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  patron text := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_');
  puestas int := 0;
  faltan int := limite;
begin
  if q is null or length(q) < 2 then
    return;
  end if;

  -- ── 1 · EMPIEZA POR ─────────────────────────────────────────────────────
  -- La barata: usa el índice de prefijo. Es la que resuelve casi todo.
  --
  -- La puntuación mezcla la pasada con la población, y el logaritmo es lo que
  -- la hace funcionar: entre mil y diez mil habitantes hay un punto, igual
  -- que entre cien mil y un millón. Sin él, Ciudad de México aplastaría
  -- cualquier coincidencia mejor que ella.
  return query
  select distinct on (c.nombre, c.pais_codigo, round(c.lat::numeric, 2), round(c.lon::numeric, 2))
         c.nombre, c.provincia, c.pais, c.pais_codigo, c.lat, c.lon, c.zona, c.poblacion,
         null::text, (6.0 + log(10, c.poblacion + 1))::real
  from public.geo_ciudades c
  where c.nombre_norm like patron || '%'
    and (lugar is null or lugar = ''
         or c.pais ilike '%' || lugar || '%'
         or c.provincia ilike '%' || lugar || '%'
         or c.pais_codigo ilike lugar)
  order by c.nombre, c.pais_codigo, round(c.lat::numeric, 2), round(c.lon::numeric, 2),
           c.poblacion desc
  limit faltan;

  get diagnostics puestas = row_count;
  faltan := faltan - puestas;
  if faltan <= 0 then return; end if;

  -- ── 2 · CONTIENE, en el nombre o en otro de sus nombres ─────────────────
  -- Aquí es donde se encuentra el Salcedo de Ecuador, que en GeoNames se
  -- llama «San Miguel» y lleva «salcedo» entre sus alias. `tambien` saca el
  -- trozo que coincidió: quien escribe «salcedo» y ve «San Miguel» necesita
  -- saber por qué se lo ofrecemos.
  if length(q) >= 3 then
    return query
    select distinct on (c.nombre, c.pais_codigo, round(c.lat::numeric, 2), round(c.lon::numeric, 2))
           c.nombre, c.provincia, c.pais, c.pais_codigo, c.lat, c.lon, c.zona, c.poblacion,
           (select a from unnest(string_to_array(c.alias_norm, ' ')) a
            where a like '%' || patron || '%' limit 1),
           (4.0 + log(10, c.poblacion + 1))::real
    from public.geo_ciudades c
    where (c.nombre_norm like '%' || patron || '%' or c.alias_norm like '%' || patron || '%')
      and c.nombre_norm not like patron || '%'
      and (lugar is null or lugar = ''
           or c.pais ilike '%' || lugar || '%'
           or c.provincia ilike '%' || lugar || '%'
           or c.pais_codigo ilike lugar)
    order by c.nombre, c.pais_codigo, round(c.lat::numeric, 2), round(c.lon::numeric, 2),
             c.poblacion desc
    limit faltan;

    get diagnostics puestas = row_count;
    faltan := faltan - puestas;
    if faltan <= 0 then return; end if;
  end if;

  -- ── 3 · SE PARECE ───────────────────────────────────────────────────────
  -- La red de seguridad: encuentra «Mompós» escribiendo «Mompox». La más cara
  -- y la que menos veces se ejecuta, que es exactamente como debe ser.
  --
  -- El 0,45 va escrito aquí y no como ajuste de sesión a propósito: un ajuste
  -- de sesión no viaja con la función, y quien la llamara desde otro sitio se
  -- encontraría el 0,3 por defecto de Postgres, que con nombres cortos
  -- devuelve media tabla.
  if length(q) >= 4 then
    return query
    select distinct on (c.nombre, c.pais_codigo, round(c.lat::numeric, 2), round(c.lon::numeric, 2))
           c.nombre, c.provincia, c.pais, c.pais_codigo, c.lat, c.lon, c.zona, c.poblacion,
           null::text,
           (2.0 + similarity(c.nombre_norm, q) * 2 + log(10, c.poblacion + 1))::real
    from public.geo_ciudades c
    where c.nombre_norm % q
      and similarity(c.nombre_norm, q) >= 0.45
      and c.nombre_norm not like '%' || patron || '%'
      and (lugar is null or lugar = ''
           or c.pais ilike '%' || lugar || '%'
           or c.provincia ilike '%' || lugar || '%'
           or c.pais_codigo ilike lugar)
    order by c.nombre, c.pais_codigo, round(c.lat::numeric, 2), round(c.lon::numeric, 2),
             similarity(c.nombre_norm, q) desc, c.poblacion desc
    limit faltan;
  end if;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
--  LA BÚSQUEDA · «Salcedo Ecuador» sin coma, y sin romper «Villa de Leyva»
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Se prueban hasta tres lecturas de lo mismo, EN ORDEN, y se para en cuanto
-- hay suficiente:
--
--   0. la frase entera como nombre de ciudad     «villa de leyva»
--   1. la última palabra como lugar              «salcedo» + «ecuador»
--   2. las dos últimas como lugar                «san jose» + «costa rica»
--
-- El orden no es un detalle. La mayoría de los nombres LLEVAN espacios, así
-- que partir por espacios antes de probar la frase entera convertiría «Villa
-- de Leyva» en una ciudad llamada «Villa de» dentro de un país llamado
-- «Leyva». Se rompería lo que funciona para arreglar lo que no.
--
-- Si quien escribe pone una coma, se respeta y no se intenta nada más: una
-- coma es una instrucción explícita.
create or replace function public.buscar_ciudad(
  q text,
  lugar text default null,
  limite int default 8
)
returns table (
  nombre text,
  provincia text,
  pais text,
  pais_codigo text,
  lat double precision,
  lon double precision,
  zona text,
  poblacion integer,
  tambien text
)
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  palabras text[] := string_to_array(btrim(q), ' ');
  n int := coalesce(array_length(palabras, 1), 0);
  puestas int := 0;
  faltan int := limite;
begin
  if q is null or length(btrim(q)) < 2 then
    return;
  end if;

  -- 0 · la frase entera
  return query
  select s.nombre, s.provincia, s.pais, s.pais_codigo, s.lat, s.lon, s.zona,
         s.poblacion, s.tambien
  from public.buscar_ciudad_simple(btrim(q), lugar, faltan) s;

  get diagnostics puestas = row_count;
  faltan := faltan - puestas;

  -- Si la frase entera es una ciudad, aquí se acaba. No se prueba a partirla,
  -- que es trabajo caro y además traería ruido.
  if faltan <= 0 or lugar is not null or n < 2 then return; end if;

  -- 1 · la última palabra, como país o provincia
  return query
  select s.nombre, s.provincia, s.pais, s.pais_codigo, s.lat, s.lon, s.zona,
         s.poblacion, s.tambien
  from public.buscar_ciudad_simple(
    array_to_string(palabras[1:n-1], ' '), palabras[n], faltan) s;

  get diagnostics puestas = row_count;
  faltan := faltan - puestas;
  if faltan <= 0 or n < 3 then return; end if;

  -- 2 · las dos últimas: «costa rica», «republica dominicana», «estados unidos»
  return query
  select s.nombre, s.provincia, s.pais, s.pais_codigo, s.lat, s.lon, s.zona,
         s.poblacion, s.tambien
  from public.buscar_ciudad_simple(
    array_to_string(palabras[1:n-2], ' '), array_to_string(palabras[n-1:n], ' '), faltan) s;
end;
$$;

grant execute on function public.buscar_ciudad(text, text, int) to authenticated;
grant execute on function public.buscar_ciudad_simple(text, text, int) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
--  2 · AMPLIAR EL REGISTRO · de 235 ciudades a unas 4.000
-- ═══════════════════════════════════════════════════════════════════════════
--
-- `network_cities` es OTRA tabla, y es la que se usa al registrarse y en el
-- mapa de La Red. Tenía 235 ciudades escritas a mano: un ecuatoriano tenía
-- quince opciones para todo su país.
--
-- ── POR QUÉ NO SE METEN LAS 1.305.742 ─────────────────────────────────────
-- Porque esa lista corta NO era un descuido. En el mapa de La Red, todos los
-- miembros de una ciudad comparten EXACTAMENTE el mismo punto —el centro de
-- la ciudad, nunca el de nadie— y por eso el mapa no puede revelar dónde vive
-- una persona.
--
-- Con un millón de aldeas, eso se rompe: quien sea el único miembro de un
-- pueblo de cuatrocientos habitantes queda señalado él solo en el mapa. Más
-- ciudades sería MENOS privacidad.
--
-- Son dos necesidades opuestas y por eso las dos tablas siguen separadas:
--
--   · La carta astral necesita el sitio exacto. Cuanto más fino, mejor.
--   · La Red necesita agrupar gente. Cuanto más fino, peor.
--
-- 50.000 habitantes es el corte: 4.088 ciudades, y en cualquiera de ellas hay
-- sitio de sobra para que nadie quede solo en un punto.
--
-- ── CÓMO NO ROMPER NADA ───────────────────────────────────────────────────
-- Esto es lo delicado. La restricción única de `network_cities` es
-- (country_code, name, admin1), y los `admin1` NO coinciden entre las dos
-- tablas: la semilla los escribió en español —«Ciudad Autónoma»— y GeoNames
-- los trae en inglés —«Bogota D.C.», «Coquimbo Region»—. Confiar en la
-- restricción única habría metido Buenos Aires dos veces, con dos `id`
-- distintos, y los miembros ya registrados apuntando a uno de ellos.
--
-- Así que se compara por (país + nombre normalizado), calculado con el MISMO
-- `translate` que usa el trigger de la tabla. Lo que ya existe no se toca:
-- conserva su `id`, su `admin1` en español y sus coordenadas, y ningún
-- `city_id` de ningún miembro cambia.
insert into public.network_cities (country_code, name, admin1, lat, lon, population)
select g.pais_codigo, g.nombre, nullif(g.provincia, ''), g.lat, g.lon, g.poblacion
from (
  -- Una sola fila por país y nombre: la más poblada. GeoNames trae varias
  -- entradas para el mismo sitio y aquí no se quieren repetidas.
  select distinct on (c.pais_codigo, lower(translate(c.nombre,
           'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
           'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC')))
         c.pais_codigo, c.nombre, c.provincia, c.lat, c.lon, c.poblacion
  from public.geo_ciudades c
  where c.poblacion >= 50000
  order by c.pais_codigo, lower(translate(c.nombre,
             'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
             'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC')),
           c.poblacion desc
) g
-- Y lo que ya está, se queda como está.
where not exists (
  select 1 from public.network_cities nc
  where nc.country_code = g.pais_codigo
    and nc.name_norm = lower(translate(g.nombre,
          'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
          'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'))
)
on conflict do nothing;

-- ── COMPROBACIÓN ──────────────────────────────────────────────────────────

-- Debe pasar de 235 a unas 4.000.
select count(*) as ciudades_del_registro from public.network_cities;

-- NINGÚN miembro puede haberse quedado apuntando a una ciudad que no existe.
-- Tiene que dar 0.
select count(*) as miembros_sin_ciudad
from public.member_location ml
where ml.city_id is not null
  and not exists (select 1 from public.network_cities c where c.id = ml.city_id);

-- Y ninguna ciudad puede haberse duplicado. Tiene que dar 0 filas.
select country_code, name_norm, count(*)
from public.network_cities
group by country_code, name_norm
having count(*) > 1
order by count(*) desc
limit 20;

-- Ecuador pasa de 15 a unas cuantas decenas.
select count(*) as ciudades_de_ecuador
from public.network_cities where country_code = 'EC';
