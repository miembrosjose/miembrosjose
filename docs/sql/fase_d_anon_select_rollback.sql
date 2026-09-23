-- ============================================================================
-- ROLLBACK DE LA FASE D — devolverle la lectura a anon
-- ============================================================================
-- Solo si algo dejó de verse después de aplicar fase_d_anon_select.sql.
-- Devuelve el estado anterior exacto: SELECT sobre todas las tablas de
-- `public` para el rol `anon`, y los privilegios por defecto.
-- ============================================================================

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('grant select on public.%I to anon', r.tablename);
  end loop;
end $$;

alter default privileges in schema public grant select on tables to anon;

-- Comprobación: debe volver a salir `true` en todas.
select
  t.tablename as tabla,
  has_table_privilege('anon', 'public.' || quote_ident(t.tablename), 'SELECT') as anon_puede_leer
from pg_tables t
where t.schemaname = 'public'
order by t.tablename;
