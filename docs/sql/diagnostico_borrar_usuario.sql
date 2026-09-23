-- ============================================================================
-- POR QUÉ NO SE PUEDE BORRAR UN USUARIO
-- ============================================================================
--
-- Síntoma: al borrar desde Authentication → Users sale
--   "Failed to delete selected users: Database error deleting user"
--
-- Ese mensaje es genérico y esconde la causa real. Casi siempre es una de dos:
--
--   1. Alguna tabla tuya apunta a auth.users con una clave foránea que NO dice
--      qué hacer al borrar. Postgres no borra un usuario mientras queden filas
--      colgando de él, y se niega sin explicar cuál.
--
--   2. Un trigger sobre auth.users falla durante el borrado.
--
-- Este archivo AVERIGUA cuál es. Los bloques 1 a 4 son de SOLO LECTURA: no
-- cambian nada. El bloque 5 genera el arreglo, pero no lo ejecuta.
--
-- Cómo usarlo: pega cada bloque por separado en el SQL Editor de Supabase.
-- ============================================================================


-- ── BLOQUE 1 · Quién bloquea el borrado ─────────────────────────────────────
-- Mira la columna "al_borrar_el_usuario". Las que digan BLOQUEA son la causa.

select
  ns.nspname || '.' || cl.relname as tabla,
  att.attname                     as columna,
  con.conname                     as restriccion,
  case con.confdeltype
    when 'a' then 'NO ACTION  ← BLOQUEA'
    when 'r' then 'RESTRICT   ← BLOQUEA'
    when 'c' then 'CASCADE    (borra la fila con el usuario)'
    when 'n' then 'SET NULL   (deja la fila sin dueño)'
    when 'd' then 'SET DEFAULT'
  end                             as al_borrar_el_usuario
from pg_constraint con
join pg_class cl      on cl.oid = con.conrelid
join pg_namespace ns  on ns.oid = cl.relnamespace
join lateral unnest(con.conkey) as k(attnum) on true
join pg_attribute att on att.attrelid = cl.oid and att.attnum = k.attnum
where con.contype = 'f'
  and con.confrelid = 'auth.users'::regclass
order by (con.confdeltype in ('a','r')) desc, tabla;


-- ── BLOQUE 2 · Triggers sobre auth.users ────────────────────────────────────
-- Si el bloque 1 sale limpio, el problema suele estar aquí: un trigger que
-- falla al borrar. Fíjate en los que se disparen con DELETE.

select
  tg.tgname                       as trigger,
  pg_get_triggerdef(tg.oid)       as definicion
from pg_trigger tg
where tg.tgrelid = 'auth.users'::regclass
  and not tg.tgisinternal
order by tg.tgname;


-- ── BLOQUE 3 · Cuántas filas cuelgan de ESE usuario ─────────────────────────
-- Cambia el correo por el del usuario que quieres borrar.
-- Recorre todas las tablas que apuntan a auth.users y cuenta sus filas.

do $$
declare
  correo   text := 'CORREO@EJEMPLO.COM';   -- ← cámbialo
  uid      uuid;
  r        record;
  n        bigint;
begin
  select id into uid from auth.users where lower(email) = lower(correo);
  if uid is null then
    raise notice 'No existe ningún usuario con el correo %', correo;
    return;
  end if;
  raise notice 'Usuario: %  (id %)', correo, uid;

  for r in
    select ns.nspname as esq, cl.relname as tabla, att.attname as col,
           con.confdeltype as regla
    from pg_constraint con
    join pg_class cl      on cl.oid = con.conrelid
    join pg_namespace ns  on ns.oid = cl.relnamespace
    join lateral unnest(con.conkey) as k(attnum) on true
    join pg_attribute att on att.attrelid = cl.oid and att.attnum = k.attnum
    where con.contype = 'f' and con.confrelid = 'auth.users'::regclass
    order by ns.nspname, cl.relname
  loop
    execute format('select count(*) from %I.%I where %I = $1', r.esq, r.tabla, r.col)
      into n using uid;
    if n > 0 then
      raise notice '  % filas en %.% (%)  — %',
        n, r.esq, r.tabla, r.col,
        case r.regla when 'c' then 'se borran solas'
                     when 'n' then 'quedan sin dueño'
                     else 'BLOQUEAN el borrado' end;
    end if;
  end loop;
end $$;


-- ── BLOQUE 4 · Comprobar que no es un problema de permisos ──────────────────
-- Raro, pero pasa: si alguna tabla referenciada tiene RLS y el borrado se hace
-- con un rol sin privilegios, el fallo también sale como "Database error".

select
  ns.nspname || '.' || cl.relname as tabla,
  cl.relrowsecurity               as rls_activa,
  cl.relforcerowsecurity          as rls_forzada
from pg_constraint con
join pg_class cl     on cl.oid = con.conrelid
join pg_namespace ns on ns.oid = cl.relnamespace
where con.contype = 'f'
  and con.confrelid = 'auth.users'::regclass
  and cl.relrowsecurity
order by tabla;


-- ============================================================================
-- BLOQUE 5 · EL ARREGLO
-- ============================================================================
--
-- Esto NO ejecuta nada: GENERA las órdenes que harían falta. Míralas, decide
-- cuáles quieres, y ejecútalas tú.
--
-- ── ANTES DE DECIDIR ───────────────────────────────────────────────────────
-- Poner CASCADE significa que al borrar un usuario se borra TAMBIÉN todo lo
-- que escribió: sus temas del foro, sus respuestas, sus encuentros, sus likes.
-- Es lo normal y lo que casi todo el mundo quiere, pero es irreversible.
--
-- Si prefieres conservar el contenido y que quede sin autor, cambia
-- 'on delete cascade' por 'on delete set null' en la salida — pero solo
-- funciona si esa columna admite nulos.
-- ============================================================================

select format(
  'alter table %I.%I drop constraint %I, add constraint %I foreign key (%I) references auth.users(id) on delete cascade;',
  ns.nspname, cl.relname, con.conname, con.conname, att.attname
) as orden_a_ejecutar
from pg_constraint con
join pg_class cl      on cl.oid = con.conrelid
join pg_namespace ns  on ns.oid = cl.relnamespace
join lateral unnest(con.conkey) as k(attnum) on true
join pg_attribute att on att.attrelid = cl.oid and att.attnum = k.attnum
where con.contype = 'f'
  and con.confrelid = 'auth.users'::regclass
  and con.confdeltype in ('a','r')     -- solo las que bloquean
order by tabla;


-- ── ALTERNATIVA SIN TOCAR EL ESQUEMA ────────────────────────────────────────
-- Si solo quieres borrar un usuario suelto y no cambiar cómo funciona la base,
-- borra a mano sus filas en las tablas que salgan en el BLOQUE 3 y después
-- borra el usuario desde el panel. Es más trabajo y hay que repetirlo cada
-- vez, pero no cambia nada de forma permanente.
