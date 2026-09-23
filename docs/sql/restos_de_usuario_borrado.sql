-- ============================================================================
-- QUÉ QUEDA DE UN USUARIO YA BORRADO
-- ============================================================================
--
-- Al borrar un usuario de auth.users, las tablas que tienen clave foránea
-- hacia él se limpian solas (cascade) o se quedan sin dueño (set null).
--
-- Pero hay tablas que guardan al usuario por CORREO y no por id, sin clave
-- foránea ninguna. Postgres no sabe que están relacionadas, así que no las
-- toca: sus filas se quedan ahí para siempre.
--
-- En esta plataforma el caso principal es member_subscriptions, que es justo
-- donde viven los identificadores de Stripe.
--
-- Todo este archivo es de SOLO LECTURA.
-- ============================================================================


-- ── PASO 1 · Tablas que guardan usuarios sin clave foránea ──────────────────
-- Son las que pueden dejar restos. Las que sí tienen clave foránea no salen
-- aquí porque se limpian solas.

select
  c.table_schema || '.' || c.table_name as tabla,
  c.column_name                         as columna
from information_schema.columns c
join pg_class cl     on cl.relname = c.table_name
join pg_namespace ns on ns.oid = cl.relnamespace and ns.nspname = c.table_schema
where c.table_schema = 'public'
  and c.column_name in ('email','user_id','author_id','created_by','actor_user_id','owner_id','member_email')
  and not exists (
    select 1
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
    where con.contype = 'f'
      and con.conrelid = cl.oid
      and con.confrelid = 'auth.users'::regclass
      and att.attname = c.column_name
  )
order by tabla, columna;


-- ── PASO 2 · Qué queda EN CONCRETO de un correo ya borrado ──────────────────
-- Cambia el correo. Solo salen las tablas que tienen filas suyas.

with objetivo as (
  select 'jos.bacigalupo@gmail.com'::text as correo   -- ← el usuario ya borrado
),
huerfanas as (
  select c.table_schema as esq, c.table_name as tabla, c.column_name as col
  from information_schema.columns c
  join pg_class cl     on cl.relname = c.table_name
  join pg_namespace ns on ns.oid = cl.relnamespace and ns.nspname = c.table_schema
  where c.table_schema = 'public'
    and c.column_name in ('email','member_email')
    and not exists (
      select 1
      from pg_constraint con
      join pg_attribute att
        on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
      where con.contype = 'f'
        and con.conrelid = cl.oid
        and con.confrelid = 'auth.users'::regclass
        and att.attname = c.column_name
    )
),
conteo as (
  select
    h.esq || '.' || h.tabla as tabla,
    h.col                   as columna,
    (xpath('/row/c/text()',
      query_to_xml(
        format('select count(*) as c from %I.%I where lower(%I) = lower(%L)',
               h.esq, h.tabla, h.col, o.correo),
        false, true, ''))
    )[1]::text::bigint      as filas,
    format('delete from %I.%I where lower(%I) = lower(%L);',
           h.esq, h.tabla, h.col, o.correo) as orden_para_copiar
  from huerfanas h, objetivo o
)
select * from conteo
where filas > 0
order by filas desc;


-- ── PASO 3 · Lo que quedó en Stripe ─────────────────────────────────────────
-- Estas filas NO borran nada en Stripe: son el vínculo hacia allá. Apunta el
-- customer y la suscripción antes de borrar la fila, porque después ya no
-- sabrás qué cancelar en el panel de Stripe.

select
  email,
  status,
  subscription_status,
  stripe_customer_id,
  stripe_subscription_id,
  current_period_end
from public.member_subscriptions
where lower(email) = lower('jos.bacigalupo@gmail.com')   -- ← el usuario ya borrado
order by updated_at desc;
