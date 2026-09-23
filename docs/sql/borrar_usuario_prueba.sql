-- ============================================================================
-- BORRAR UN USUARIO QUE EL PANEL SE NIEGA A BORRAR
-- ============================================================================
--
-- Caso: "Failed to delete selected users: Database error deleting user".
--
-- Si otros usuarios sí se borraron y este no, la causa no es el esquema en
-- general: es que ESTE usuario tiene filas en alguna tabla cuya clave foránea
-- no permite borrarlo. Las cuentas que se borraron bien simplemente no tenían
-- contenido en esa tabla.
--
-- Ve paso a paso. Los pasos 1 y 2 son de SOLO LECTURA.
--
-- ── PROTECCIÓN ─────────────────────────────────────────────────────────────
-- Todos los bloques que borran algo comprueban antes que no estés tocando la
-- cuenta de administración, y se niegan a seguir si lo fueran.
-- ============================================================================


-- ── PASO 1 · Qué tablas pueden bloquear un borrado ──────────────────────────
-- Solo lectura. Las que digan BLOQUEA son las candidatas.

select
  ns.nspname || '.' || cl.relname as tabla,
  att.attname                     as columna,
  con.conname                     as restriccion,
  case con.confdeltype
    when 'a' then 'NO ACTION  ← BLOQUEA'
    when 'r' then 'RESTRICT   ← BLOQUEA'
    when 'c' then 'CASCADE    (se borra solo)'
    when 'n' then 'SET NULL   (queda sin dueño)'
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


-- ── PASO 2 · Qué tiene exactamente este usuario ─────────────────────────────
-- Solo lectura. Te dice en qué tablas tiene filas y cuáles te están frenando.

do $$
declare
  correo text := 'jos.bacigalupo@gmail.com';   -- ← el que quieres borrar
  uid    uuid;
  r      record;
  n      bigint;
  bloqueantes int := 0;
begin
  select id into uid from auth.users where lower(email) = lower(correo);
  if uid is null then
    raise notice 'No existe ningún usuario con el correo %', correo;
    return;
  end if;
  raise notice '── % (id %) ──', correo, uid;

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
      if r.regla in ('a','r') then
        bloqueantes := bloqueantes + 1;
        raise notice '  BLOQUEA →  % filas en %.% (%)', n, r.esq, r.tabla, r.col;
      else
        raise notice '             % filas en %.% (%)  se resuelven solas', n, r.esq, r.tabla, r.col;
      end if;
    end if;
  end loop;

  if bloqueantes = 0 then
    raise notice 'Ninguna tabla lo bloquea. Si aun así falla, mira los triggers:';
    raise notice '  select tgname, pg_get_triggerdef(oid) from pg_trigger';
    raise notice '  where tgrelid = ''auth.users''::regclass and not tgisinternal;';
  else
    raise notice '%   tabla(s) lo bloquean. Elige el PASO 3A o el 3B.', bloqueantes;
  end if;
end $$;


-- ============================================================================
-- PASO 3 · ELIGE UNA DE LAS DOS
-- ============================================================================


-- ── PASO 3A · Arreglarlo de una vez (recomendado) ───────────────────────────
--
-- Cambia esas claves foráneas a CASCADE, de modo que a partir de ahora borrar
-- un usuario borre también su contenido. Se hace una sola vez y nunca vuelves
-- a tener este problema.
--
-- OJO: es un cambio permanente del esquema. Al borrar a alguien se irán sus
-- temas del foro, sus respuestas y sus comentarios. Es lo que casi todo el
-- mundo quiere, pero conviene saberlo.
--
-- Esto NO ejecuta nada: te escribe las órdenes. Cópialas, léelas, y ejecuta
-- las que quieras.

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
  and con.confdeltype in ('a','r')
order by tabla;


-- ── PASO 3B · Borrar solo las filas de este usuario ─────────────────────────
--
-- No toca el esquema. Vacía únicamente lo que bloquea a esta cuenta concreta.
-- Habrá que repetirlo con cada usuario que dé problemas.
--
-- Está en un bloque que se puede deshacer: primero lo corre en seco y te
-- enseña lo que haría. Cuando estés conforme, cambia `en_seco` a false.

do $$
declare
  correo  text    := 'jos.bacigalupo@gmail.com';    -- ← el que quieres borrar
  admin   text    := 'bacigalupojose@hotmail.com';  -- ← el que NO hay que tocar
  en_seco boolean := true;                          -- ← ponlo en false para borrar de verdad
  uid     uuid;
  r       record;
  n       bigint;
  total   bigint  := 0;
begin
  -- Protección: nunca la cuenta de administración.
  if lower(correo) = lower(admin) then
    raise exception 'Ese es el correo de administración. No se toca.';
  end if;

  select id into uid from auth.users where lower(email) = lower(correo);
  if uid is null then
    raise notice 'No existe ningún usuario con el correo %', correo;
    return;
  end if;

  for r in
    select ns.nspname as esq, cl.relname as tabla, att.attname as col
    from pg_constraint con
    join pg_class cl      on cl.oid = con.conrelid
    join pg_namespace ns  on ns.oid = cl.relnamespace
    join lateral unnest(con.conkey) as k(attnum) on true
    join pg_attribute att on att.attrelid = cl.oid and att.attnum = k.attnum
    where con.contype = 'f'
      and con.confrelid = 'auth.users'::regclass
      and con.confdeltype in ('a','r')     -- solo las que bloquean
    order by ns.nspname, cl.relname
  loop
    execute format('select count(*) from %I.%I where %I = $1', r.esq, r.tabla, r.col)
      into n using uid;
    if n > 0 then
      total := total + n;
      if en_seco then
        raise notice 'BORRARÍA % filas de %.%', n, r.esq, r.tabla;
      else
        execute format('delete from %I.%I where %I = $1', r.esq, r.tabla, r.col) using uid;
        raise notice 'borradas % filas de %.%', n, r.esq, r.tabla;
      end if;
    end if;
  end loop;

  if total = 0 then
    raise notice 'No hay filas que bloqueen. El borrado debería funcionar ya.';
  elsif en_seco then
    raise notice '── Fue una simulación. Nada se ha borrado. ──';
    raise notice 'Si estás conforme, cambia en_seco a false y vuelve a ejecutar.';
  else
    raise notice '── Listo: % filas borradas. Ya puedes borrar el usuario. ──', total;
  end if;
end $$;


-- ── PASO 4 · Borrar el usuario ──────────────────────────────────────────────
--
-- Después del 3A o del 3B, vuelve a Authentication → Users y bórralo desde el
-- panel. Es lo más limpio.
--
-- Si prefieres hacerlo aquí, este bloque también protege la cuenta de
-- administración. Descoméntalo para usarlo.

-- do $$
-- declare
--   correo text := 'jos.bacigalupo@gmail.com';
--   admin  text := 'bacigalupojose@hotmail.com';
--   uid    uuid;
-- begin
--   if lower(correo) = lower(admin) then
--     raise exception 'Ese es el correo de administración. No se toca.';
--   end if;
--   select id into uid from auth.users where lower(email) = lower(correo);
--   if uid is null then
--     raise notice 'Ya no existe.';
--     return;
--   end if;
--   delete from auth.users where id = uid;
--   raise notice 'Usuario % borrado.', correo;
-- end $$;


-- ── COMPROBACIÓN FINAL ──────────────────────────────────────────────────────
-- Solo lectura. Deberías ver únicamente tu cuenta de administración.

select id, email, raw_app_meta_data->>'is_admin' as es_admin, created_at
from auth.users
order by created_at;
