-- ═══════════════════════════════════════════════════════════════════════════
--  TODAS LAS CIUDADES DEL MUNDO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Correr ESTE archivo PRIMERO. Después se importan los CSV (ver abajo).
--
-- ── POR QUÉ HACE FALTA ────────────────────────────────────────────────────
-- El buscador de ciudades usaba `city-timezones`, que trae 7.329 ciudades en
-- todo el mundo. Para la Cartografía servía. Para una carta astral no: el
-- Ascendente depende de la latitud y de la longitud del sitio exacto, y
-- pedirle a alguien «usa la ciudad grande más cercana» es pedirle que
-- aproxime justo donde la herramienta presume de precisión.
--
-- Esta tabla trae 237.393 localidades de 500 habitantes para arriba, con su
-- zona horaria. Cubre prácticamente cualquier pueblo donde alguien pueda
-- haber nacido.
--
-- ── DE DÓNDE SALEN LOS DATOS, Y QUÉ OBLIGA ────────────────────────────────
-- GeoNames (geonames.org), archivo `cities500`. Licencia CREATIVE COMMONS
-- BY 4.0: se puede usar para cualquier cosa, incluso comercialmente, pero
-- EXIGE atribución visible.
--
-- No es como las librerías de código que se descartaron —aquí no hay que
-- publicar nada ni pagar nada—, pero el crédito hay que ponerlo. Está en la
-- pantalla del formulario, bajo el buscador. Si se quita de ahí, se incumple
-- la licencia.
--
-- ── Y UNA COSA QUE CAMBIA ─────────────────────────────────────────────────
-- Buscar aquí significa que el NOMBRE DE LA CIUDAD viaja al servidor. La
-- fecha y la hora de nacimiento NO: siguen sin salir del navegador, y el
-- cálculo sigue ocurriendo allí. El aviso de privacidad del formulario está
-- reescrito para decir exactamente eso, porque antes decía «nada sale de
-- este dispositivo» y habría dejado de ser verdad.

create table if not exists public.geo_ciudades (
  id bigserial primary key,

  -- Como se escribe de verdad, con tildes: «Bogotá», «San Miguel de Tucumán».
  -- GeoNames las trae bien, al revés que la base que había antes.
  nombre text not null,

  -- El mismo nombre sin tildes y en minúsculas. Se guarda ya calculado en vez
  -- de normalizar al vuelo porque así se puede indexar, y una búsqueda sobre
  -- 237.000 filas sin índice tarda lo que tarda un café.
  --
  -- OJO: lo calcula el mismo criterio que `normalizar()` en el cliente. Si uno
  -- cambia y el otro no, la búsqueda local y la del servidor encontrarán cosas
  -- distintas y nadie entenderá por qué.
  nombre_norm text not null,

  provincia text,
  pais text not null,
  pais_codigo text not null,

  lat double precision not null,
  lon double precision not null,

  -- Identificador IANA. Sin esto no se puede pasar la hora local a universal.
  zona text not null,

  -- Para ordenar: entre tres «Santiago», primero el que más gente tiene.
  poblacion integer not null default 0
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────
-- `text_pattern_ops` es lo que hace que `LIKE 'bogot%'` use el índice. Con el
-- operador por defecto no lo usaría y haría un recorrido completo.
create index if not exists geo_ciudades_prefijo
  on public.geo_ciudades (nombre_norm text_pattern_ops);

-- Para buscar por el medio de la palabra («angeles» → «Los Angeles») hace
-- falta trigramas: un índice de prefijo no sirve para eso.
create extension if not exists pg_trgm;
create index if not exists geo_ciudades_trigramas
  on public.geo_ciudades using gin (nombre_norm gin_trgm_ops);

-- Filtrar por país es lo que resuelve «Santiago, Chile».
create index if not exists geo_ciudades_pais
  on public.geo_ciudades (pais_codigo);

-- ── QUIÉN PUEDE LEER ──────────────────────────────────────────────────────
alter table public.geo_ciudades enable row level security;

-- Leer: cualquiera con sesión. Es un callejero público, no hay nada que
-- proteger en el dato en sí; lo que se protege es que no lo use un robot
-- ajeno como si fuera una API gratis.
drop policy if exists "geo_ciudades_leer" on public.geo_ciudades;
create policy "geo_ciudades_leer"
  on public.geo_ciudades for select
  to authenticated
  using (true);

-- Nadie escribe desde la aplicación. La tabla se rellena importando el CSV y
-- se actualiza volviendo a importarlo.

-- ═══════════════════════════════════════════════════════════════════════════
--  CÓMO IMPORTAR LOS DATOS
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Los archivos están en el Escritorio, carpeta `ciudades-geonames`:
--
--   geo_ciudades.csv        19 MB · las 237.393 de una vez
--   geo_ciudades_00.csv     5 MB  ┐
--   geo_ciudades_01.csv     5 MB  │ los mismos datos, en cuatro trozos,
--   geo_ciudades_02.csv     5 MB  │ por si el grande se atraganta
--   geo_ciudades_03.csv     4 MB  ┘
--
-- En Supabase: Table Editor → geo_ciudades → Insert → Import data from CSV.
--
-- Empieza por el archivo grande. Si se queda colgado o da error por tamaño,
-- vacía la tabla con la línea de abajo y sube los cuatro trozos en orden.
-- Los cuatro llevan cabecera, así que da igual el orden en realidad.
--
--   truncate table public.geo_ciudades restart identity;
--
-- ── COMPROBACIÓN ──────────────────────────────────────────────────────────
-- Al terminar deben salir 237.393 filas y las cuatro búsquedas de abajo
-- tienen que devolver algo.

select count(*) as filas from public.geo_ciudades;

select nombre, provincia, pais, zona, poblacion
from public.geo_ciudades
where nombre_norm like 'bogota%'
order by poblacion desc
limit 3;

-- Un pueblo pequeño, que es justo lo que antes no se encontraba.
select nombre, provincia, pais, poblacion
from public.geo_ciudades
where nombre_norm like 'villa de leyva%'
limit 3;
