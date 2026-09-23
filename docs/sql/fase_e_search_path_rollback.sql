-- ============================================================================
-- ROLLBACK DE LA FASE E — quitar el search_path que puso la migración
-- ============================================================================
-- Solo si algo dejó de funcionar. Devuelve exactamente el estado anterior:
-- las funciones afectadas no tenían NINGÚN search_path, y `reset` las deja
-- así otra vez.
--
-- Solo toca las que quedaron con el valor EXACTO que puso la FASE E. Una
-- función que ya venía con su propio search_path —las de red_v1..v4— no se
-- tocó entonces y tampoco se toca aquí.
-- ============================================================================

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as firma
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      -- Se busca por contenido y no por igualdad exacta: PostgreSQL puede
      -- guardar el valor con otro espaciado o entrecomillado, y una
      -- comparación literal se quedaría sin encontrar nada.
      and exists (
        select 1 from unnest(p.proconfig) as cfg
        where cfg like 'search\_path=%'
          and cfg like '%extensions%'
          and cfg like '%pg\_temp%'
      )
  loop
    execute format('alter function %s reset search_path', r.firma);
  end loop;
end $$;

-- Comprobación: las que se revirtieron vuelven a salir con `ajustes` nulo.
select
  p.proname                                 as funcion,
  pg_get_function_identity_arguments(p.oid) as argumentos,
  p.proconfig                               as ajustes
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by p.proname;
