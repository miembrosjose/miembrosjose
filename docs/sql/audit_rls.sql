-- ============================================================================
-- AUDITORIA DE RLS  ─ SOLO LECTURA. No modifica nada.
-- Pegar entero en el SQL Editor de Supabase y pasar los resultados.
-- ============================================================================

-- 1) TABLAS DEL SCHEMA public CON RLS DESACTIVADO  ← las que disparan la alerta
select
  c.relname                                   as tabla,
  c.relrowsecurity                            as rls_activo,
  (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = c.relname) as n_policies,
  has_table_privilege('anon',          'public.'||quote_ident(c.relname), 'SELECT') as anon_select,
  has_table_privilege('anon',          'public.'||quote_ident(c.relname), 'INSERT') as anon_insert,
  has_table_privilege('anon',          'public.'||quote_ident(c.relname), 'UPDATE') as anon_update,
  has_table_privilege('anon',          'public.'||quote_ident(c.relname), 'DELETE') as anon_delete,
  has_table_privilege('authenticated', 'public.'||quote_ident(c.relname), 'SELECT') as auth_select,
  has_table_privilege('authenticated', 'public.'||quote_ident(c.relname), 'INSERT') as auth_insert,
  has_table_privilege('authenticated', 'public.'||quote_ident(c.relname), 'UPDATE') as auth_update,
  has_table_privilege('authenticated', 'public.'||quote_ident(c.relname), 'DELETE') as auth_delete,
  c.reltuples::bigint                         as filas_aprox
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false
order by c.reltuples desc, c.relname;

-- 2) INVENTARIO COMPLETO  ─ todas las tablas, con o sin RLS
select
  c.relname as tabla,
  c.relrowsecurity as rls_activo,
  c.relforcerowsecurity as rls_forzado,
  (select count(*) from pg_policies p
     where p.schemaname='public' and p.tablename=c.relname) as n_policies,
  c.reltuples::bigint as filas_aprox
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public' and c.relkind='r'
order by c.relrowsecurity, c.relname;

-- 3) VISTAS EN public  ─ pueden filtrar datos aunque las tablas tengan RLS
select table_name as vista,
       (select count(*) from information_schema.role_table_grants g
          where g.table_schema='public' and g.table_name=v.table_name
            and g.grantee in ('anon','authenticated')) as grants_expuestos
from information_schema.views v
where table_schema='public'
order by table_name;

-- 4) POLICIES ACTUALES  ─ para no duplicar ni pisar nada
select tablename as tabla, policyname as policy, cmd as operacion, roles,
       qual as using_expr, with_check as check_expr
from pg_policies
where schemaname='public'
order by tablename, cmd, policyname;

-- 5) FUNCIONES SECURITY DEFINER en public ─ saltan RLS por diseño
select p.proname as funcion, pg_get_userbyid(p.proowner) as owner
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public' and p.prosecdef = true
order by p.proname;
