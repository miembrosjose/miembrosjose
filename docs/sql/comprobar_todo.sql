-- ════════════════════════════════════════════════════════════════════════════
--  ¿ESTÁ TODO PUESTO? · la comprobación de una sola vez
-- ════════════════════════════════════════════════════════════════════════════
--
-- No cambia nada. Solo mira.
--
-- ── PARA QUÉ SIRVE ─────────────────────────────────────────────────────────
-- Ocho archivos de SQL corridos a mano, en semanas distintas, algunos antes
-- de desplegar el código que los usa y otros después. Acordarse de cuál se
-- corrió es imposible, y comprobarlo abriendo tabla por tabla es media hora.
--
-- Esto responde en una fila: cada columna es una cosa que tiene que estar.
--
-- ── CÓMO SE LEE ────────────────────────────────────────────────────────────
-- Todo lo que empieza por `ok_` tiene que dar **true**. Si alguna da false,
-- el nombre dice qué archivo falta por correr.
--
-- Las tres últimas son recuentos, no comprobaciones: están para que veas de
-- un vistazo si los números cuadran con lo que esperas.

select
  -- ── docs/sql/push_01_suscripciones.sql ──────────────────────────────────
  (to_regclass('public.push_subscriptions') is not null
   and to_regclass('public.push_envios') is not null)                as ok_push_01,

  -- ── docs/sql/push_02_comunicaciones.sql ─────────────────────────────────
  exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='communications'
      and column_name='canal')                                       as ok_push_02,

  -- ── docs/sql/campanas_01_actividad.sql ──────────────────────────────────
  (exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='profiles'
       and column_name='last_seen_at')
   and exists (select 1 from information_schema.routines
     where routine_schema='public'
       and routine_name='actividad_de_miembros'))                    as ok_campanas_01,

  -- ── docs/sql/campanas_02_categorias.sql ─────────────────────────────────
  (exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='email_preferences'
       and column_name='recordatorios')
   and exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='push_envios'
       and column_name='communication_id')
   and exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='push_envios'
       and column_name='clic_at'))                                   as ok_campanas_02,

  -- ── docs/sql/marketing_01_actividades.sql ───────────────────────────────
  (to_regclass('public.mkt_actividades') is not null
   and exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='profiles'
       and column_name='es_propietario'))                            as ok_marketing_01,

  -- ── docs/sql/marketing_02_guiones.sql ───────────────────────────────────
  (to_regclass('public.mkt_guiones') is not null)                    as ok_marketing_02,

  -- ── docs/sql/marketing_03_resultados.sql ────────────────────────────────
  (to_regclass('public.mkt_metricas') is not null
   and to_regclass('public.mkt_plan') is not null)                   as ok_marketing_03,

  -- ── docs/sql/admin_nueva_administradora.sql ─────────────────────────────
  -- Las DOS banderas de la segunda administradora. Con una sola, entra al
  -- panel y ve el contenido bloqueado — o ni pasa de la puerta.
  (exists (select 1 from auth.users u
     where lower(u.email) = lower('regisaccagno21@gmail.com')
       and coalesce((u.raw_app_meta_data ->> 'is_admin')::boolean, false))
   and exists (select 1 from public.profiles p join auth.users u on u.id = p.id
     where lower(u.email) = lower('regisaccagno21@gmail.com')
       and coalesce(p.is_admin, false)))                             as ok_segunda_admin,

  -- ── RECUENTOS · no son comprobaciones, son para mirar ───────────────────
  (select count(*) from public.profiles where is_admin)              as administradores,
  (select count(*) from public.profiles where es_propietario)        as propietarios,
  (select jsonb_array_length(frecuencias) from public.mkt_plan
    where mes = date_trunc('month', current_date)::date)             as frecuencias_del_mes;

-- ── LO QUE TIENE QUE SALIR ─────────────────────────────────────────────────
--   ok_*                 todas true
--   administradores      2   (tú y Regi)
--   propietarios         1   (solo tú)
--   frecuencias_del_mes  11
--
-- Si `frecuencias_del_mes` sale nulo, es que el mes en curso no tiene plan:
-- se crea solo al guardar desde la pantalla, o lo cargó el SQL de la fase 3
-- para el mes en que se corrió. No es un fallo si ya cambiaste de mes.
