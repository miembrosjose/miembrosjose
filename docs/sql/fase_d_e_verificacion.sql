-- ============================================================================
-- ¿CÓMO QUEDARON LAS FASES D Y E?  (solo lectura, no cambia nada)
-- ============================================================================
--
-- POR QUÉ HACE FALTA ESTE ARCHIVO
--   El editor de Supabase solo muestra el resultado de la ÚLTIMA consulta de
--   todo lo que pegues. Al correr las dos fases seguidas, los diagnósticos que
--   iban dentro de cada una pasaron sin verse. Esto es UNA sola consulta, así
--   que su resultado sí se ve.
--
-- CÓMO LEERLO
--   Cuatro filas. Las cuatro tienen que decir BIEN en la columna `veredicto`.
--   Si alguna dice REVISAR, el número de al lado dice cuántas cosas quedaron
--   sin arreglar, y abajo hay consultas para ver cuáles.
--
-- NO TOCA NADA. Se puede ejecutar las veces que haga falta.
-- ============================================================================

select * from (

  -- 1 · ¿Puede el rol público leer alguna tabla? (Fase D)
  select
    1 as orden,
    'Tablas que anon todavia puede leer' as comprobacion,
    count(*) filter (
      where has_table_privilege('anon', 'public.' || quote_ident(tablename), 'SELECT')
    ) as cuantas,
    count(*) as de_un_total_de,
    case when count(*) filter (
      where has_table_privilege('anon', 'public.' || quote_ident(tablename), 'SELECT')
    ) = 0 then 'BIEN' else 'REVISAR' end as veredicto
  from pg_tables where schemaname = 'public'

  union all

  -- 2 · ¿Y escribir? (esto lo cerró la fase A, se comprueba de paso)
  select
    2,
    'Tablas donde anon todavia puede escribir',
    count(*) filter (
      where has_table_privilege('anon', 'public.' || quote_ident(tablename), 'INSERT')
         or has_table_privilege('anon', 'public.' || quote_ident(tablename), 'UPDATE')
         or has_table_privilege('anon', 'public.' || quote_ident(tablename), 'DELETE')
    ),
    count(*),
    case when count(*) filter (
      where has_table_privilege('anon', 'public.' || quote_ident(tablename), 'INSERT')
         or has_table_privilege('anon', 'public.' || quote_ident(tablename), 'UPDATE')
         or has_table_privilege('anon', 'public.' || quote_ident(tablename), 'DELETE')
    ) = 0 then 'BIEN' else 'REVISAR' end
  from pg_tables where schemaname = 'public'

  union all

  -- 3 · ¿Queda alguna funcion con permisos elevados sin camino fijo? (Fase E)
  select
    3,
    'Funciones security definer sin search_path',
    count(*) filter (
      where p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) as cfg where cfg like 'search\_path=%'
      )
    ),
    count(*),
    case when count(*) filter (
      where p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) as cfg where cfg like 'search\_path=%'
      )
    ) = 0 then 'BIEN' else 'REVISAR' end
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef

  union all

  -- 4 · ¿Todas las tablas siguen con RLS encendida? (fase B, de control)
  select
    4,
    'Tablas de public sin RLS',
    count(*) filter (where not c.relrowsecurity),
    count(*),
    case when count(*) filter (where not c.relrowsecurity) = 0
         then 'BIEN' else 'REVISAR' end
  from pg_tables t
  join pg_class c on c.relname = t.tablename and c.relnamespace = 'public'::regnamespace
  where t.schemaname = 'public'

) r order by orden;


-- ── SI ALGUNA FILA DICE «REVISAR» ───────────────────────────────────────────
-- Descomenta la consulta que corresponda y ejecútala SOLA para ver el detalle.
--
-- Fila 1 o 2 — qué tablas quedaron abiertas a anon:
--
-- select tablename,
--        has_table_privilege('anon','public.'||quote_ident(tablename),'SELECT') as lee,
--        has_table_privilege('anon','public.'||quote_ident(tablename),'INSERT') as inserta,
--        has_table_privilege('anon','public.'||quote_ident(tablename),'UPDATE') as modifica,
--        has_table_privilege('anon','public.'||quote_ident(tablename),'DELETE') as borra
--   from pg_tables where schemaname='public'
--  order by lee desc, tablename;
--
-- Fila 3 — qué funciones quedaron sin camino fijo:
--
-- select p.proname, pg_get_function_identity_arguments(p.oid) as argumentos, p.proconfig
--   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--  where n.nspname='public' and p.prosecdef
--    and (p.proconfig is null or not exists (
--          select 1 from unnest(p.proconfig) as cfg where cfg like 'search\_path=%'))
--  order by p.proname;
