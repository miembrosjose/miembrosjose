-- FASE A — Revocar escritura de anon.  Copiar ESTE ARCHIVO ENTERO.
-- Ctrl+A dentro del archivo, Ctrl+C, pegar en el SQL Editor y Run.
-- No modifica datos. Solo retira permisos de escritura al rol publico.

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke insert, update, delete, truncate on public.%I from anon', r.tablename);
  end loop;
end $$;

alter default privileges in schema public revoke insert, update, delete on tables from anon;

-- Comprobacion inmediata. Esperado: 0
select count(*) as tablas_donde_anon_aun_escribe
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
  and (has_table_privilege('anon', c.oid, 'INSERT')
    or has_table_privilege('anon', c.oid, 'UPDATE')
    or has_table_privilege('anon', c.oid, 'DELETE'));
