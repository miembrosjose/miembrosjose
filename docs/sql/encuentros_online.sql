-- ============================================================================
-- ENCUENTROS EN LÍNEA — meditaciones globales y transmisiones en vivo
--                                                    [PENDIENTE DE EJECUTAR]
-- ============================================================================
--
-- EL PROBLEMA
--   `network_meetings.city_id` es NOT NULL: todo encuentro tiene que colgar de
--   una ciudad del catálogo. Eso tiene sentido para un encuentro presencial,
--   pero una meditación global por Zoom no ocurre en ninguna ciudad — ocurre
--   en todas a la vez. Hoy, sencillamente, no se puede crear.
--
-- QUÉ HACE ESTA MIGRACIÓN
--   1. Añade `modalidad`: 'presencial' o 'online'.
--   2. Añade `enlace`: la URL de Zoom o de la transmisión.
--   3. Quita el NOT NULL de `city_id`, para que un encuentro en línea no
--      necesite ciudad.
--   4. Añade una regla: si es presencial, tiene que tener ciudad; si es en
--      línea, tiene que tener enlace. Así la base impide encuentros a medias.
--
-- QUÉ NO HACE
--   No toca ninguna fila existente. Todos los encuentros que ya haya quedan
--   como 'presencial', que es lo que son.
--
-- POR QUÉ IMPORTA EL ORDEN
--   El valor por defecto se aplica ANTES de crear la restricción. Si se
--   invirtiera, las filas existentes tendrían modalidad nula y la restricción
--   fallaría al crearse.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor → Run. Idempotente.
--
-- CÓMO DESHACERLO
--   alter table public.network_meetings drop constraint if exists network_meetings_modalidad_coherente;
--   alter table public.network_meetings drop column if exists modalidad;
--   alter table public.network_meetings drop column if exists enlace;
--   -- OJO: volver a poner el NOT NULL solo es posible si no quedan encuentros
--   -- en línea. Habría que borrarlos antes.
-- ============================================================================


-- ── 1. Modalidad ────────────────────────────────────────────────────────────
alter table public.network_meetings
  add column if not exists modalidad text not null default 'presencial';

comment on column public.network_meetings.modalidad is
  'presencial (ocurre en una ciudad) u online (ocurre en un enlace).';


-- ── 2. El enlace de la transmisión ──────────────────────────────────────────
alter table public.network_meetings
  add column if not exists enlace text;

comment on column public.network_meetings.enlace is
  'URL de Zoom o de la transmisión en vivo. Solo para modalidad online.';


-- ── 3. La ciudad deja de ser obligatoria ────────────────────────────────────
alter table public.network_meetings
  alter column city_id drop not null;

-- El país tampoco: una meditación global no es de ningún país.
alter table public.network_meetings
  alter column country_code drop not null;


-- ── 4. Que no se puedan crear encuentros a medias ───────────────────────────
-- Un presencial sin ciudad no se puede encontrar; un online sin enlace no se
-- puede atender. La base lo impide en vez de confiar en el formulario.
alter table public.network_meetings
  drop constraint if exists network_meetings_modalidad_coherente;

alter table public.network_meetings
  add constraint network_meetings_modalidad_coherente check (
    (modalidad = 'presencial' and city_id is not null)
    or
    (modalidad = 'online' and enlace is not null and length(trim(enlace)) > 0)
  );


-- ── 5. Buscar los próximos es la consulta más frecuente ─────────────────────
create index if not exists network_meetings_proximos_idx
  on public.network_meetings (starts_at)
  where estado = 'publicado';


-- ── Comprobación ────────────────────────────────────────────────────────────
-- Las columnas nuevas, y que city_id ya admite nulos.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'network_meetings'
  and column_name in ('city_id', 'country_code', 'modalidad', 'enlace')
order by column_name;

-- Y que todo lo existente sigue siendo válido.
select modalidad, count(*) as encuentros
from public.network_meetings
group by modalidad;
