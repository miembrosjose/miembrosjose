-- ============================================================================
-- AUDITORIA 2 · Policies existentes + vistas expuestas. SOLO LECTURA.
-- Correr APARTE de audit_rls.sql (el editor solo muestra el ultimo resultado).
-- ============================================================================

select
  p.tablename::text  as tabla,
  p.policyname::text as policy,
  p.cmd::text        as operacion,
  array_to_string(p.roles, ',') as roles,
  coalesce(p.qual::text, '-')       as using_expr,
  coalesce(p.with_check::text, '-') as check_expr
from pg_policies p
where p.schemaname = 'public'

union all

-- Las vistas no tienen RLS propia: heredan la de sus tablas SALVO que sean
-- security definer. Si alguna expone datos a anon, aparece aqui.
select
  v.table_name::text,
  '(VISTA)',
  'select',
  coalesce((
    select string_agg(distinct g.grantee, ',')
    from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.table_name = v.table_name
      and g.grantee in ('anon','authenticated')
  ), 'sin grants'),
  '-', '-'
from information_schema.views v
where v.table_schema = 'public'

order by 1, 3, 2;
