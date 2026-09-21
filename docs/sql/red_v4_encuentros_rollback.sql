-- ============================================================================
-- ROLLBACK de red_v4_encuentros.sql
-- ============================================================================
-- ⚠ BORRA LAS DOS TABLAS Y TODO SU CONTENIDO: encuentros y asistencias.
-- Solo tiene sentido si la Vertical 4 se descarta entera y nadie ha convocado
-- nada todavía. Si ya hay encuentros reales, NO lo ejecutes.
--
-- No toca nada de las Verticales 1, 2 y 3.
-- ============================================================================

-- Antes de nada: comprobar que no hay nada que perder.
-- select count(*) as encuentros from public.network_meetings;
-- select count(*) as asistencias from public.network_meeting_participants;

drop table if exists public.network_meeting_participants;

drop trigger if exists trg_network_meetings_touch on public.network_meetings;
drop table if exists public.network_meetings;
drop function if exists public.network_meetings_touch();

-- is_admin() se deja en pie a propósito: es una utilidad general y puede que
-- para entonces ya la use otra cosa. Para quitarla también:
-- drop function if exists public.is_admin();


-- Verificación: las dos tablas deben haber desaparecido.
select count(*) as tablas_restantes
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('network_meetings', 'network_meeting_participants');
