-- ════════════════════════════════════════════════════════════════════════════
--  PROTOCOLOS DE CONTACTO · PASO 0 — COMPROBACIONES (no modifica nada)
-- ════════════════════════════════════════════════════════════════════════════
--
-- Correr ESTO ANTES que nada y enseñar los resultados. Tres preguntas:
--
--   A. ¿Hay cuentas de Telegram vinculadas a más de un usuario? De la
--      respuesta depende si se puede poner el índice único del paso 02.
--   B. ¿Cuántas filas hay que traspasar al nuevo esquema?
--   C. ¿Cuánta gente cumple hoy la condición de Protocolos? Sirve para saber
--      si el primer barrido va a mover a alguien.
--
-- Nada de esto escribe. Se puede correr las veces que haga falta.

-- ── A + B · EN UNA SOLA CONSULTA ───────────────────────────────────────────
-- Van juntas a propósito: el editor de Supabase solo enseña el resultado de
-- la ÚLTIMA consulta cuando se corren varias de golpe, así que tres bloques
-- seguidos dejan dos resultados invisibles.
--
-- `telegram_duplicados` tiene que ser 0. Si no lo es, hay dos cuentas de la
-- plataforma apuntando al mismo Telegram: el `maybeSingle()` del webhook
-- devuelve error con filas repetidas, y esa persona queda rechazada para
-- siempre sin que nadie sepa por qué. Hay que resolverlo a mano antes del
-- paso 03.
select
  (select count(*) from (
     select telegram_user_id
       from public.telegram_memberships
      where telegram_user_id is not null
      group by telegram_user_id
     having count(*) > 1
   ) d)                                                          as telegram_duplicados,
  (select count(*) from public.telegram_memberships)             as filas_totales,
  (select count(*) from public.telegram_memberships
    where telegram_user_id is not null)                          as vinculadas,
  (select count(*) from public.telegram_memberships
    where is_in_telegram)                                        as dentro_del_general;

-- Si el número de arriba NO es 0, esta enseña quiénes son:
--   select telegram_user_id, count(*), array_agg(user_id)
--     from public.telegram_memberships
--    where telegram_user_id is not null
--    group by telegram_user_id having count(*) > 1;

-- ── C · QUIÉN CUMPLIRÍA HOY LA CONDICIÓN DE PROTOCOLOS ─────────────────────
-- Solo la mitad del progreso: la membresía se comprueba contra la Supabase
-- del embudo, que desde aquí no se ve. Esto cuenta cuánta gente tiene la
-- Temporada 4 completa, que es la parte que sí vive en esta base.
with t as (
  select id, num, episodes, external from public.seasons where num = 4 limit 1
),
total as (
  select coalesce(nullif((select count(*) from public.episodes e where e.season_id = t.id), 0),
                  t.episodes, 0)::int as n,
         coalesce(t.external, false)  as externa,
         t.num                        as num
    from t
)
select (select n from total)                  as capitulos_de_t4,
       (select externa from total)            as t4_es_externa,
       count(*)                               as personas_con_t4_completa
  from (
    select p.user_id
      from public.user_episode_progress p, total
     where p.season_num = total.num
     group by p.user_id
    having count(distinct p.episode_num) >= (select n from total)
       and (select n from total) > 0
       and not (select externa from total)
  ) q;
