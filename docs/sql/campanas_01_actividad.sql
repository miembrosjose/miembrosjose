-- ════════════════════════════════════════════════════════════════════════════
--  CAMPAÑAS · 1 de 3 · SABER CUÁNDO FUE LA ÚLTIMA VEZ
-- ════════════════════════════════════════════════════════════════════════════
--
-- Para poder escribirle a quien lleva un mes sin aparecer, primero hay que
-- saber cuándo apareció por última vez. Hoy eso no se puede consultar.
--
-- ── QUÉ HABÍA, Y POR QUÉ NO SERVÍA ─────────────────────────────────────────
-- Dos señales, y ninguna utilizable tal cual:
--
--   `user_metadata.last_login_date`  Una fecha sin hora, escrita una vez al
--                                    día al abrir el área de miembros. Vive en
--                                    los metadatos de la cuenta, que NO se
--                                    pueden consultar en masa: para contar a
--                                    los inactivos habría que recorrer todas
--                                    las cuentas de cien en cien.
--
--   `xp_events.created_at`           Este sí es un registro real, con hora, y
--                                    sí se consulta. Pero una fila por evento:
--                                    para saber la última de cada persona hay
--                                    que agrupar, y eso no lo sabe hacer la
--                                    API de tablas.
--
-- ── QUÉ SE AÑADE ───────────────────────────────────────────────────────────
--   1. `profiles.last_seen_at` — una columna, indexada, que se escribe cuando
--      alguien abre la plataforma. Una vez al día, igual que el contador que
--      ya existe: para ventanas de 7, 14, 30 o 60 días la hora no importa.
--
--   2. `actividad_de_miembros()` — la última señal de vida de cada persona,
--      agrupada de una vez. Sin esto, cada recuento de audiencia serían miles
--      de filas viajando para calcular un máximo.
--
-- ── POR QUÉ UNA SOLA SEÑAL Y NO DOS ────────────────────────────────────────
-- Entrar y participar no son lo mismo, y confundirlos sería decir que alguien
-- está activo porque abrió la aplicación y la cerró. Pero tampoco hacen falta
-- dos filtros: participar implica haber entrado, así que lo que de verdad hace
-- falta saber para reactivar a alguien es cuándo fue la ÚLTIMA VEZ que se supo
-- algo de esa persona, por cualquiera de las dos vías.
--
-- Eso es lo que devuelve la función: el máximo de las dos. Se llama «última
-- señal» a propósito, y no «último acceso», para que nadie la lea como lo que
-- no es.
--
-- NO DESTRUCTIVO. Solo añade una columna, un índice y una función.

begin;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  1 · LA COLUMNA                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

comment on column public.profiles.last_seen_at is
  'Ultima vez que abrio el area de miembros. Se escribe una vez al dia.';

-- El índice es la razón de ser de la columna: «quién no aparece desde hace 30
-- días» tiene que ser una consulta, no un recorrido.
--
-- `nulls last` porque un nulo no significa «hace mucho», significa «no lo
-- sabemos»: cuentas creadas antes de esto que no han vuelto a entrar.
create index if not exists profiles_last_seen_idx
  on public.profiles (last_seen_at desc nulls last);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  2 · EL RELLENO INICIAL                                              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Sin esto, el día que se despliegue todo el mundo aparecería como «nunca
-- visto» y el primer mes los filtros de inactividad dirían lo contrario de la
-- verdad: la gente que entra cada día saldría como inactiva, y una campaña de
-- reactivación iría a quien no hace falta reactivar.
--
-- `xp_events` ya tiene la historia. Se usa la de verdad en vez de empezar de
-- cero.
update public.profiles p
set last_seen_at = v.ultima
from (
  select user_id, max(created_at) as ultima
  from public.xp_events
  group by user_id
) v
where v.user_id = p.id
  and p.last_seen_at is null;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  3 · LA ÚLTIMA SEÑAL DE CADA PERSONA                                 ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Una fila por miembro con tres datos, porque los tres responden preguntas
-- distintas y el panel tiene que poder decir cuál está usando:
--
--   ultima_senal         lo más reciente de todo. Es lo que gobierna los
--                        filtros de inactividad.
--   ultima_participacion la última vez que HIZO algo: un comentario, un
--                        capítulo, un «me gusta».
--   ultimo_acceso        la última vez que simplemente entró.
--
-- `security definer` porque lee `xp_events`, que tiene RLS. Y el search_path
-- va fijado: es la corrección que se aplicó a todas las funciones en
-- fase_e_search_path.sql, y una función nueva sin él volvería a abrir lo que
-- allí se cerró.
create or replace function public.actividad_de_miembros()
returns table (
  user_id              uuid,
  ultima_senal         timestamptz,
  ultima_participacion timestamptz,
  ultimo_acceso        timestamptz
)
language sql
stable
security definer
set search_path = public
as $fn$
  select
    p.id as user_id,
    -- `greatest` en Postgres ignora los nulos: devuelve nulo solo si lo son
    -- todos. Justo lo que hace falta aquí, donde un nulo es «no lo sabemos».
    greatest(p.last_seen_at, e.ultima_cualquiera) as ultima_senal,
    -- Participar es cualquier evento que NO sea el del acceso diario. Contar
    -- el acceso como participación haría que abrir la aplicación y cerrarla
    -- pareciera actividad.
    e.ultima_real          as ultima_participacion,
    greatest(p.last_seen_at, e.ultimo_login) as ultimo_acceso
  from public.profiles p
  left join (
    select
      user_id,
      max(created_at)                                          as ultima_cualquiera,
      max(created_at) filter (where event_type <> 'login_day')  as ultima_real,
      max(created_at) filter (where event_type =  'login_day')  as ultimo_login
    from public.xp_events
    group by user_id
  ) e on e.user_id = p.id
$fn$;

comment on function public.actividad_de_miembros() is
  'Ultima senal de vida por miembro. Solo la usa administracion.';

-- Solo administración, que entra con la clave de servicio. Un miembro no tiene
-- ninguna razón para poder preguntar cuándo entró cada uno de los demás.
revoke all on function public.actividad_de_miembros() from public;
revoke all on function public.actividad_de_miembros() from anon;
revoke all on function public.actividad_de_miembros() from authenticated;

commit;

-- ── COMPROBACIÓN ───────────────────────────────────────────────────────────
-- Lo primero que hay que mirar es si el relleno funcionó: si «con_senal» sale
-- 0, algo falló y los filtros de inactividad dirán tonterías.
select
  (select count(*) from public.profiles)                              as miembros,
  (select count(*) from public.profiles where last_seen_at is not null) as con_senal,
  (select count(*) from public.actividad_de_miembros()
     where ultima_senal < now() - interval '30 days')                 as sin_aparecer_30_dias,
  (select count(*) from public.actividad_de_miembros()
     where ultima_senal is null)                                      as nunca_vistos;

-- ── CÓMO DESHACERLO ────────────────────────────────────────────────────────
--   drop function if exists public.actividad_de_miembros();
--   drop index  if exists public.profiles_last_seen_idx;
--   alter table public.profiles drop column if exists last_seen_at;
