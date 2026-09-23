-- ============================================================================
-- BORRAR UN USUARIO QUE EL PANEL SE NIEGA A BORRAR
-- ============================================================================
--
-- Caso: "Failed to delete selected users: Database error deleting user".
--
-- Si otros usuarios sí se borraron y este no, la causa no es el esquema en
-- general: es que ESTE usuario tiene filas en alguna tabla cuya clave foránea
-- no permite borrarlo. Las cuentas que se borraron bien no tenían contenido
-- en esa tabla.
--
-- ── CÓMO USARLO ────────────────────────────────────────────────────────────
-- Cada PASO es una consulta suelta. Selecciona el bloque que quieras, pégalo
-- en el SQL Editor y pulsa Run. Todos DEVUELVEN UNA TABLA de resultados.
--
-- Ninguno de estos pasos borra nada. Los que hacen falta para borrar te
-- ESCRIBEN las órdenes, y las ejecutas tú después de leerlas.
--
-- El correo a borrar aparece en cada paso. Si cambias de usuario, cámbialo
-- en el paso que estés usando.
-- ============================================================================


-- ── PASO 1 · Qué tablas pueden bloquear un borrado ──────────────────────────
-- Panorama general del esquema. Las que digan BLOQUEA son las candidatas.

select
  ns.nspname || '.' || cl.relname as tabla,
  att.attname                     as columna,
  case con.confdeltype
    when 'a' then 'BLOQUEA (no action)'
    when 'r' then 'BLOQUEA (restrict)'
    when 'c' then 'se borra solo (cascade)'
    when 'n' then 'queda sin dueño (set null)'
    when 'd' then 'set default'
  end                             as al_borrar_el_usuario,
  con.conname                     as restriccion
from pg_constraint con
join pg_class cl      on cl.oid = con.conrelid
join pg_namespace ns  on ns.oid = cl.relnamespace
join lateral unnest(con.conkey) as k(attnum) on true
join pg_attribute att on att.attrelid = cl.oid and att.attnum = k.attnum
where con.contype = 'f'
  and con.confrelid = 'auth.users'::regclass
order by (con.confdeltype in ('a','r')) desc, tabla;


-- ── PASO 2 · Qué tiene exactamente este usuario ─────────────────────────────
-- Cuenta las filas reales de esa cuenta en cada tabla. Solo salen las que
-- tienen algo. Lo que aparezca como BLOQUEA es lo que te frena.

with objetivo as (
  select id from auth.users
  where lower(email) = lower('jos.bacigalupo@gmail.com')   -- ← el que quieres borrar
),
referencias as (
  select
    ns.nspname       as esq,
    cl.relname       as tabla,
    att.attname      as col,
    con.confdeltype  as regla
  from pg_constraint con
  join pg_class cl      on cl.oid = con.conrelid
  join pg_namespace ns  on ns.oid = cl.relnamespace
  join lateral unnest(con.conkey) as k(attnum) on true
  join pg_attribute att on att.attrelid = cl.oid and att.attnum = k.attnum
  where con.contype = 'f'
    and con.confrelid = 'auth.users'::regclass
),
conteo as (
  -- query_to_xml permite contar sobre tablas que no se conocen de antemano
  -- dentro de un SELECT normal, sin necesidad de un bloque DO.
  select
    r.esq || '.' || r.tabla as tabla,
    r.col                   as columna,
    r.regla,
    (xpath(
      '/row/c/text()',
      query_to_xml(
        format('select count(*) as c from %I.%I where %I = %L', r.esq, r.tabla, r.col, o.id),
        false, true, ''
      )
    ))[1]::text::bigint     as filas
  from referencias r, objetivo o
)
select
  tabla,
  columna,
  filas,
  case regla
    when 'a' then 'BLOQUEA — hay que quitarlas'
    when 'r' then 'BLOQUEA — hay que quitarlas'
    when 'c' then 'se borran solas'
    when 'n' then 'quedan sin dueño'
    else 'otro'
  end as que_pasa_al_borrar
from conteo
where filas > 0
order by (regla in ('a','r')) desc, filas desc;


-- ── PASO 2b · Por si el PASO 2 sale vacío ───────────────────────────────────
-- Si no hay ninguna fila que bloquee y aun así falla, la causa es un trigger.

select
  tg.tgname                 as trigger,
  pg_get_triggerdef(tg.oid) as definicion
from pg_trigger tg
where tg.tgrelid = 'auth.users'::regclass
  and not tg.tgisinternal
order by tg.tgname;


-- ============================================================================
-- PASO 3 · ELIGE UNA DE LAS DOS
-- ============================================================================
--
-- Las dos te DEVUELVEN las órdenes escritas. No ejecutan nada. Copias lo que
-- salga en la columna de resultados, lo lees, y lo ejecutas tú.
-- ============================================================================


-- ── PASO 3A · Arreglarlo para siempre (recomendado) ─────────────────────────
-- Cambia esas claves foráneas a CASCADE: a partir de ahora, borrar un usuario
-- borra también su contenido y no vuelves a toparte con esto.
--
-- Es un cambio permanente del esquema. Al borrar a alguien se irán sus temas
-- del foro, sus respuestas y sus comentarios.

select format(
  'alter table %I.%I drop constraint %I, add constraint %I foreign key (%I) references auth.users(id) on delete cascade;',
  ns.nspname, cl.relname, con.conname, con.conname, att.attname
) as ordenes_para_copiar
from pg_constraint con
join pg_class cl      on cl.oid = con.conrelid
join pg_namespace ns  on ns.oid = cl.relnamespace
join lateral unnest(con.conkey) as k(attnum) on true
join pg_attribute att on att.attrelid = cl.oid and att.attnum = k.attnum
where con.contype = 'f'
  and con.confrelid = 'auth.users'::regclass
  and con.confdeltype in ('a','r')
order by ns.nspname, cl.relname;


-- ── PASO 3B · Borrar solo las filas de este usuario ─────────────────────────
-- No toca el esquema. Genera los DELETE de las filas que bloquean a ESA
-- cuenta. Habrá que repetirlo con cada usuario que dé problemas.
--
-- Cada orden lleva el id del usuario ya escrito, así que no puede borrar de
-- más por equivocación.

with objetivo as (
  select id from auth.users
  where lower(email) = lower('jos.bacigalupo@gmail.com')   -- ← el que quieres borrar
    -- Protección: nunca la cuenta de administración.
    and lower(email) <> lower('bacigalupojose@hotmail.com')
)
select format(
  'delete from %I.%I where %I = %L;',
  ns.nspname, cl.relname, att.attname, o.id
) as ordenes_para_copiar
from pg_constraint con
join pg_class cl      on cl.oid = con.conrelid
join pg_namespace ns  on ns.oid = cl.relnamespace
join lateral unnest(con.conkey) as k(attnum) on true
join pg_attribute att on att.attrelid = cl.oid and att.attnum = k.attnum
cross join objetivo o
where con.contype = 'f'
  and con.confrelid = 'auth.users'::regclass
  and con.confdeltype in ('a','r')
order by ns.nspname, cl.relname;


-- ── PASO 4 · Borrar el usuario ──────────────────────────────────────────────
-- Después del 3A o del 3B, vuelve a Authentication → Users y bórralo desde el
-- panel. Es lo más limpio y ya no dará error.


-- ── COMPROBACIÓN FINAL ──────────────────────────────────────────────────────
-- Deberías ver únicamente tu cuenta de administración.

select
  email,
  raw_app_meta_data->>'is_admin' as es_admin,
  created_at
from auth.users
order by created_at;
