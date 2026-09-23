-- ============================================================================
-- FASE E — FIJAR EL search_path DE LAS FUNCIONES security definer
--          [PENDIENTE DE EJECUTAR]
-- ============================================================================
--
-- QUÉ ES ESTO
--   El segundo aviso del Advisor de Supabase: `function_search_path_mutable`.
--   Quedó apuntado como pendiente cuando se cerró la auditoría de RLS.
--
-- QUÉ ES UNA FUNCIÓN security definer
--   Una que se ejecuta con los permisos de QUIEN LA CREÓ, no de quien la
--   llama. En esta base hay unas 29: los disparadores de XP, los contadores,
--   el reparto de avisos y `handle_new_user`, que corre en cada alta. Saltan
--   la RLS a propósito; por eso el sistema funciona.
--
-- POR QUÉ IMPORTA FIJARLES EL CAMINO DE BÚSQUEDA
--   Si una función así no fija su `search_path`, hereda el de quien la llama.
--   Quien pueda crear objetos en un schema que vaya antes en ese camino puede
--   poner ahí una tabla o una función con el mismo nombre que la que la
--   función esperaba usar. La función —que corre con permisos elevados—
--   ejecutaría la del atacante. Es la vía clásica de escalada de privilegios
--   en PostgreSQL.
--
--   Fijarlo elimina el vector entero: la función siempre mira donde debe.
--
-- QUÉ HACE, EXACTAMENTE
--   Un solo `alter function ... set search_path = public, extensions, pg_temp`
--   sobre las funciones de `public` que sean security definer y NO tengan ya
--   un search_path propio. No cambia el cuerpo de ninguna, no las recrea, no
--   toca disparadores ni permisos. Es idempotente.
--
--   Se incluye `extensions` porque ahí viven las funciones de pgcrypto y
--   similares en Supabase: dejar solo `public` podría romper una función que
--   llame a `gen_random_uuid()` sin calificar. `pg_temp` va al final por
--   recomendación de PostgreSQL, para que las tablas temporales no puedan
--   suplantar a las reales.
--
-- QUÉ PROBAR DESPUÉS
--   Lo que pasa por estas funciones: registrar una cuenta nueva (handle_new_user),
--   ver un capítulo (XP), escribir en el foro (contadores y avisos) y abrir La
--   Red. Si algo fallara, el rollback las devuelve a como estaban.
--
-- CÓMO APLICARLO
--   Supabase → SQL Editor. PASO 1 primero, mira la lista, y después el 2.
-- ============================================================================


-- ── PASO 1 · Cuáles están sin fijar ─────────────────────────────────────────
-- Estas son las que va a tocar el PASO 2, y ninguna más.
select
  p.proname                                as funcion,
  pg_get_function_identity_arguments(p.oid) as argumentos,
  p.prosecdef                              as es_security_definer,
  p.proconfig                              as ajustes_actuales
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) as cfg where cfg like 'search\_path=%'
      ))
order by p.proname;


-- ── PASO 2 · Fijarlo ────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as firma
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and (p.proconfig is null or not exists (
            select 1 from unnest(p.proconfig) as cfg where cfg like 'search\_path=%'
          ))
  loop
    execute format('alter function %s set search_path = public, extensions, pg_temp', r.firma);
  end loop;
end $$;


-- ── PASO 3 · Cómo quedó ─────────────────────────────────────────────────────
-- La primera consulta debe devolver CERO filas: ya no queda ninguna sin fijar.
select count(*) as sin_fijar
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) as cfg where cfg like 'search\_path=%'
      ));

-- Y esta enseña el resultado, función por función.
select
  p.proname                                 as funcion,
  pg_get_function_identity_arguments(p.oid) as argumentos,
  p.proconfig                               as ajustes
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by p.proname;
