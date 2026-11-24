-- ═══════════════════════════════════════════════════════════════════════════
--  TODAS LAS CIUDADES DEL MUNDO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Correr ESTE archivo PRIMERO. Después se importan los CSV (ver al final).
--
-- ── POR QUÉ HACE FALTA ────────────────────────────────────────────────────
-- El buscador usaba `city-timezones`: 7.329 ciudades. Para la Cartografía
-- servía. Para una carta astral no, porque el Ascendente depende del sitio
-- exacto y pedirle a alguien «usa la ciudad grande más cercana» es pedirle
-- que aproxime justo donde la herramienta presume de precisar.
--
-- ── TRES FORMAS DISTINTAS DE NO ENCONTRAR UN SITIO ────────────────────────
-- Al probarlo con pueblos de verdad aparecieron tres fallos que parecían el
-- mismo y no lo eran. Los tres están resueltos aquí, y conviene saber cuál es
-- cuál antes de tocar nada:
--
--   1. QUE NO ESTÉ. `cities500` solo trae localidades de más de 500
--      habitantes. Purmamarca y Pisco Elqui daban cero. Por eso ahora los
--      datos salen del volcado COMPLETO de GeoNames filtrado a lugares
--      habitados, y no del recortado.
--
--   2. QUE SE LLAME DE OTRA FORMA. Bogotá también es «Santa Fe de Bogotá».
--      GeoNames trae una columna de nombres alternativos que en la primera
--      versión se descartó. Ahora se guardan en `alias_norm` y se buscan.
--
--   3. QUE SE ESCRIBA PARECIDO PERO NO IGUAL. Mompox está como «Mompós»,
--      con ese. Ni el prefijo ni los alias lo encuentran: hace falta
--      búsqueda DIFUSA, que es la tercera pasada de la función de abajo.
--
-- ── DE DÓNDE SALEN LOS DATOS, Y QUÉ OBLIGA ────────────────────────────────
-- GeoNames (geonames.org). Licencia CREATIVE COMMONS BY 4.0: vale para
-- cualquier uso, también comercial, pero EXIGE atribución visible.
--
-- No es como las librerías AGPL que se descartaron —aquí no hay que publicar
-- nada ni pagar nada— pero el crédito hay que ponerlo. Está bajo el buscador
-- del formulario. Si se quita de ahí, se incumple la licencia.
--
-- ── Y UNA COSA QUE CAMBIA ─────────────────────────────────────────────────
-- Buscar aquí significa que el NOMBRE DE LA CIUDAD viaja al servidor. La
-- fecha y la hora de nacimiento NO: siguen sin salir del navegador y el
-- cálculo sigue ocurriendo allí. El aviso del formulario está reescrito para
-- decir exactamente eso.

create table if not exists public.geo_ciudades (
  id bigserial primary key,

  -- Como se escribe de verdad, con tildes: «Bogotá», «Mompós».
  nombre text not null,

  -- El mismo, sin tildes y en minúsculas. Se guarda ya calculado porque así
  -- se puede indexar: normalizar al vuelo obligaría a recorrer la tabla
  -- entera en cada tecla.
  --
  -- OJO: lo calcula el mismo criterio que `normalizar()` en el cliente y en
  -- la ruta de la API. Si uno cambia y los otros no, la búsqueda local y la
  -- del servidor encontrarán cosas distintas y nadie sabrá por qué.
  nombre_norm text not null,

  -- Los otros nombres del mismo sitio, normalizados y separados por espacio:
  -- «santa fe de bogota bogota bog». Aquí es donde se encuentra un lugar que
  -- la gente llama de una forma y el callejero de otra.
  alias_norm text not null default '',

  provincia text,
  pais text not null,
  pais_codigo text not null,

  lat double precision not null,
  lon double precision not null,

  -- Identificador IANA. Sin esto no se puede pasar la hora local a universal.
  zona text not null,

  -- Para ordenar: entre varios «Santiago», primero el que más gente tiene.
  -- Muchos pueblos pequeños vienen con 0 porque GeoNames no lo sabe; eso NO
  -- los descarta, solo los pone después.
  poblacion integer not null default 0
);

-- ── SI LA TABLA YA EXISTÍA ────────────────────────────────────────────────
-- `create table if not exists` no añade columnas: si la tabla ya estaba de
-- una versión anterior, se la salta entera y `alias_norm` nunca aparece. El
-- resultado es un «column alias_norm does not exist» doscientas líneas más
-- abajo, al crear la función, que no se parece en nada a la causa.
--
-- Pasó. Estas líneas lo arreglan y no molestan si la tabla es nueva.
alter table public.geo_ciudades
  add column if not exists alias_norm text not null default '';

-- Por si acaso también faltara alguna de las otras.
alter table public.geo_ciudades add column if not exists provincia text;
alter table public.geo_ciudades add column if not exists poblacion integer not null default 0;

-- ── ÍNDICES ───────────────────────────────────────────────────────────────
-- `text_pattern_ops` es lo que hace que `LIKE 'bogot%'` use el índice. Con el
-- operador por defecto no lo usaría y recorrería la tabla entera.
create index if not exists geo_ciudades_prefijo
  on public.geo_ciudades (nombre_norm text_pattern_ops);

-- Trigramas: para buscar por el medio («angeles» → «Los Angeles») y, sobre
-- todo, para la búsqueda difusa que encuentra «Mompós» escribiendo «Mompox».
create extension if not exists pg_trgm;

create index if not exists geo_ciudades_trigramas
  on public.geo_ciudades using gin (nombre_norm gin_trgm_ops);

create index if not exists geo_ciudades_alias_trigramas
  on public.geo_ciudades using gin (alias_norm gin_trgm_ops);

create index if not exists geo_ciudades_pais
  on public.geo_ciudades (pais_codigo);

-- ── QUIÉN PUEDE LEER ──────────────────────────────────────────────────────
alter table public.geo_ciudades enable row level security;

-- Es un callejero público: no hay nada que proteger en el dato. Lo que se
-- protege es que no lo use un robot ajeno como API gratis a costa de esta
-- cuenta, y para eso basta con exigir sesión.
drop policy if exists "geo_ciudades_leer" on public.geo_ciudades;
create policy "geo_ciudades_leer"
  on public.geo_ciudades for select
  to authenticated
  using (true);

-- Nadie escribe desde la aplicación. La tabla se rellena importando el CSV.

-- ═══════════════════════════════════════════════════════════════════════════
--  LA BÚSQUEDA · tres pasadas, en este orden
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Va en una función de la base y no en la aplicación por dos razones: son
-- tres consultas que se cortan en cuanto hay suficiente —hacerlas desde
-- fuera serían tres viajes— y el criterio de ordenación queda en UN sitio.
--
-- Las tres pasadas:
--
--   1. EMPIEZA POR. Lo que casi siempre se busca, y lo más barato: usa el
--      índice de prefijo.
--   2. CONTIENE, en el nombre o en los alias. Más caro y con más ruido.
--   3. SE PARECE. La red de seguridad. Es la que encuentra «Mompós»
--      escribiendo «Mompox», y también la que traería basura si pesara
--      demasiado.
--
-- ── POR QUÉ NO BASTA CON PONERLAS EN ORDEN ────────────────────────────────
-- La primera versión devolvía primero TODAS las de la pasada 1, luego las de
-- la 2, etc. Parecía razonable y daba un resultado malo:
--
-- Escribiendo «salcedo» hay quince lugares que se llaman exactamente así
-- —en Asturias, en Galicia, en Cantabria, en Catamarca—, casi todos aldeas
-- con población 0. Las quince ocupaban la lista entera. Y el Salcedo de
-- Ecuador, que es un cantón de once mil habitantes, NO salía: en GeoNames
-- está como «San Miguel» y «salcedo» es uno de sus nombres alternativos, o
-- sea pasada 2, o sea nunca.
--
-- Lo detectó José preguntando por qué no le salía el suyo.
--
-- Así que la pasada y la población se combinan en UNA puntuación:
--
--     puntos = peso de la pasada + log10(población + 1)
--
-- El logaritmo es lo que hace que funcione: entre 1.000 y 10.000 habitantes
-- hay un punto de diferencia, igual que entre 100.000 y un millón. Sin él,
-- Ciudad de México aplastaría cualquier coincidencia mejor.
--
-- Con eso, un cantón de once mil que se llama Salcedo de segundo nombre
-- (4 + 4,03 = 8,03) adelanta a una aldea de cero habitantes que se llama
-- Salcedo de primero (6 + 0 = 6). Que es lo que cualquiera esperaría.
--
-- ── Y UN SEGUNDO FALLO, MÁS TONTO ─────────────────────────────────────────
-- El `distinct on` obliga a ordenar por sus propias columnas, así que la
-- función devolvía los resultados POR ORDEN ALFABÉTICO y no por relevancia.
-- Toda la puntuación cuidadosa se tiraba en la última línea. Por eso ahora
-- hay una consulta exterior que vuelve a ordenar.
-- ── SE BORRA ANTES DE CREARLA, Y NO ES POR GUSTO ──────────────────────────
-- `create or replace function` NO puede cambiar las columnas que devuelve
-- una función que ya existe: «cannot change return type of existing
-- function». Y aquí se le añadió `tambien` sobre la marcha.
--
-- Es el mismo tropiezo que con `create table if not exists`, que tampoco
-- añade columnas: las dos órdenes PARECEN idempotentes y en realidad se
-- rinden en silencio cuando el objeto ya está. Las dos han dado un error que
-- no se parecía a su causa.
--
-- Borrarla no pierde nada: es una función, no datos. Si no existía, el
-- `if exists` se encarga.
drop function if exists public.buscar_ciudad(text, text, int);

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
  -- Con qué otro nombre coincidió, cuando no coincidió por el suyo. Sin
  -- esto, quien escribe «salcedo» ve «San Miguel» en la lista y no entiende
  -- por qué se lo ofrecemos.
  tambien text
)
language plpgsql
stable
-- `search_path` fijado: sin esto, quien pudiera crear objetos en otro esquema
-- podría colar una función que se ejecutara en lugar de las de aquí.
set search_path = public, pg_temp
as $$
declare
  patron text := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_');
begin
  if q is null or length(q) < 2 then
    return;
  end if;

  return query
  with candidatas as (
    -- 1 · empieza por su propio nombre. Peso 6.
    (
      select c.*, (6.0 + log(10, c.poblacion + 1))::real as puntos, null::text as alias_visto
      from public.geo_ciudades c
      where c.nombre_norm like patron || '%'
        and (lugar is null or lugar = '' or c.pais ilike '%' || lugar || '%' or c.provincia ilike '%' || lugar || '%')
      order by c.poblacion desc
      -- Un tope por pasada. Sin él, escribir «san» pondría a la base a
      -- ordenar decenas de miles de filas para enseñar ocho.
      limit 150
    )

    union all

    -- 2 · lo contiene, en su nombre o en otro de sus nombres. Peso 4.
    --
    -- `alias_visto` saca el trozo que coincidió para poder enseñarlo: quien
    -- escribe «salcedo» y ve «San Miguel» necesita saber por qué.
    (
      select c.*, (4.0 + log(10, c.poblacion + 1))::real as puntos,
        (
          select a from unnest(string_to_array(c.alias_norm, ' ')) a
          where a like '%' || patron || '%' limit 1
        ) as alias_visto
      from public.geo_ciudades c
      where length(q) >= 3
        and (c.nombre_norm like '%' || patron || '%' or c.alias_norm like '%' || patron || '%')
        and c.nombre_norm not like patron || '%'
        and (lugar is null or lugar = '' or c.pais ilike '%' || lugar || '%' or c.provincia ilike '%' || lugar || '%')
      order by c.poblacion desc
      limit 150
    )

    union all

    -- 3 · se parece. Peso 2 más lo parecido que sea.
    --
    -- `%` es el operador de pg_trgm y es el que usa el índice GIN; sin él,
    -- `similarity()` a secas recorrería el millón trescientas mil filas.
    --
    -- El 0,45 va escrito aquí y no como ajuste de sesión a propósito: un
    -- ajuste de sesión no viaja con la función, y quien la llamara desde
    -- otro sitio se encontraría el 0,3 por defecto de Postgres, que con
    -- nombres cortos devuelve media tabla.
    (
      select c.*, (2.0 + similarity(c.nombre_norm, q) * 2 + log(10, c.poblacion + 1))::real as puntos,
             null::text as alias_visto
      from public.geo_ciudades c
      where length(q) >= 4
        and c.nombre_norm % q
        and similarity(c.nombre_norm, q) >= 0.45
        and c.nombre_norm not like '%' || patron || '%'
        and (lugar is null or lugar = '' or c.pais ilike '%' || lugar || '%' or c.provincia ilike '%' || lugar || '%')
      order by similarity(c.nombre_norm, q) desc, c.poblacion desc
      limit 100
    )
  ),
  -- El mismo sitio puede salir en dos pasadas, o repetido en GeoNames con
  -- coordenadas casi iguales. Se queda la mejor versión de cada uno.
  mejores as (
    select distinct on (x.nombre, x.pais_codigo, round(x.lat::numeric, 2), round(x.lon::numeric, 2))
      x.nombre, x.provincia, x.pais, x.pais_codigo, x.lat, x.lon, x.zona, x.poblacion,
      x.alias_visto, x.puntos
    from candidatas x
    order by x.nombre, x.pais_codigo, round(x.lat::numeric, 2), round(x.lon::numeric, 2), x.puntos desc
  )
  -- Y AQUÍ se ordena por relevancia. El `distinct on` de arriba obliga a
  -- ordenar por sus columnas, así que sin esta consulta exterior la lista
  -- saldría alfabética y toda la puntuación no habría servido de nada.
  select m.nombre, m.provincia, m.pais, m.pais_codigo, m.lat, m.lon, m.zona, m.poblacion,
         m.alias_visto
  from mejores m
  order by m.puntos desc, m.nombre
  limit limite;
end;
$$;

-- Quien llame a esto desde fuera necesita permiso. Es una función de solo
-- lectura sobre datos públicos.
grant execute on function public.buscar_ciudad(text, text, int) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
--  CÓMO IMPORTAR LOS DATOS
-- ═══════════════════════════════════════════════════════════════════════════
--
-- En el Escritorio, carpeta `ciudades-geonames`, hay ONCE archivos de unos
-- 11 MB: `geo_ciudades_00.csv` … `geo_ciudades_10.csv`. Son 1.305.742
-- lugares de América y Europa occidental, hasta la última aldea.
--
-- Están troceados porque el importador del panel no traga un archivo de
-- ciento trece megas de una vez.
--
-- En Supabase: Table Editor → geo_ciudades → Insert → Import data from CSV.
-- Se suben UNO POR UNO, los once. Todos llevan cabecera, así que el orden da
-- igual y no pasa nada si se repite alguno por error: se duplicarían filas,
-- y para eso está el `truncate` de abajo.
--
-- Son once subidas seguidas. No es rápido, pero es una sola vez.
--
-- Para empezar de cero si algo sale mal:
--
--   truncate table public.geo_ciudades restart identity;
--
-- ── COMPROBACIÓN ──────────────────────────────────────────────────────────
-- Las tres consultas de abajo son los tres fallos que había. Las tres tienen
-- que devolver algo.

select count(*) as filas from public.geo_ciudades;

-- 1 · un pueblo pequeño que antes no estaba
select * from public.buscar_ciudad('purmamarca');

-- 2 · un nombre que se escribe distinto: «Mompox» debe encontrar «Mompós»
select * from public.buscar_ciudad('mompox');

-- 3 · lo de siempre, que no se haya roto
select * from public.buscar_ciudad('bogota');

-- 4 · el caso que destapó el fallo del orden: hay quince lugares llamados
--     exactamente «Salcedo», casi todos aldeas de cero habitantes. El de
--     Ecuador es un cantón de once mil que en GeoNames se llama «San
--     Miguel», con «salcedo» entre sus otros nombres.
--
--     Tiene que salir en la lista, y la columna `tambien` debe decir por qué.
select nombre, provincia, pais, poblacion, tambien
from public.buscar_ciudad('salcedo');
