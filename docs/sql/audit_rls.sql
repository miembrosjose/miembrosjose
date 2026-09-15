-- ============================================================================
-- AUDITORIA DE RLS  ─ SOLO LECTURA. Una sola consulta, un solo resultado.
-- ============================================================================
-- El SQL Editor de Supabase solo muestra el resultado de la ULTIMA consulta.
-- Por eso esto es UNA consulta: devuelve todo el panorama de una vez.
--
-- Como leer la salida:
--   rls          → "*** NO ***" marca las tablas que disparan la alerta.
--   policies     → cuantas policies tiene. RLS si + 0 policies = solo service_role.
--   anon / auth  → permisos, en orden S=select I=insert U=update D=delete.
--                  "----" es sin ningun permiso. "SIUD" es acceso total.
--   filas        → estimacion del planner (no exacta, sirve para priorizar).
-- ============================================================================

select
  c.relname::text                                                    as tabla,
  case when c.relrowsecurity then 'si' else '*** NO ***' end          as rls,
  (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = c.relname)       as policies,
  concat(
    case when has_table_privilege('anon', c.oid, 'SELECT') then 'S' else '-' end,
    case when has_table_privilege('anon', c.oid, 'INSERT') then 'I' else '-' end,
    case when has_table_privilege('anon', c.oid, 'UPDATE') then 'U' else '-' end,
    case when has_table_privilege('anon', c.oid, 'DELETE') then 'D' else '-' end
  )                                                                   as anon,
  concat(
    case when has_table_privilege('authenticated', c.oid, 'SELECT') then 'S' else '-' end,
    case when has_table_privilege('authenticated', c.oid, 'INSERT') then 'I' else '-' end,
    case when has_table_privilege('authenticated', c.oid, 'UPDATE') then 'U' else '-' end,
    case when has_table_privilege('authenticated', c.oid, 'DELETE') then 'D' else '-' end
  )                                                                   as auth,
  -- columna que identifica al dueño de la fila, si existe
  coalesce((
    select string_agg(a.column_name, ',' order by a.column_name)
    from information_schema.columns a
    where a.table_schema = 'public' and a.table_name = c.relname
      and a.column_name in ('user_id','id','owner_id','author_id','profile_id',
                            'created_by_id','actor_user_id','follower_id',
                            'following_id','sender_id','recipient_id')
  ), '-')                                                             as cols_dueno,
  c.reltuples::bigint                                                 as filas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relrowsecurity asc, c.relname;
