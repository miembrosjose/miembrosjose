-- ════════════════════════════════════════════════════════════════════════════
--  QUIÉN HAY, Y QUÉ ARRASTRA CADA UNO
-- ════════════════════════════════════════════════════════════════════════════
--
-- Para decidir a quién se puede borrar. No borra nada: solo mira.
--
-- ── LO QUE HAY QUE MIRAR ANTES DE BORRAR A NADIE ───────────────────────────
--
--   suscripcion   Si pone algo distinto de «—», esa persona TIENE una
--                 suscripción en Stripe. Bórrala desde el panel de
--                 administración, nunca desde Supabase: solo el panel la
--                 cancela en Stripe. Borrándola aquí, la suscripción sigue
--                 viva y sigue cobrando.
--
--   telegram      Los grupos en los que está AHORA MISMO. Si hay alguno,
--                 sácalo del grupo ANTES de borrar la cuenta: al borrarla
--                 desaparece también su fila, y el barrido diario —que es
--                 quien expulsa a la gente— ya no sabrá que tiene que
--                 echarlo. Se queda en el grupo para siempre.
--
--   compras       Lo que compró. Si hay algo, no es una cuenta de prueba.
--
-- ── «ÚLTIMA SEÑAL» NO ES «ÚLTIMO ACCESO» ───────────────────────────────────
-- Es lo más reciente entre haber entrado y haber hecho algo: un comentario,
-- un capítulo, un corazón. Una cuenta de prueba suele tener la señal el mismo
-- día en que se creó y nada más.

select
  u.email,
  coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name', '—')      as nombre,

  -- Quién es administrador. Nunca se borra uno de estos por error.
  case when p.is_admin then 'SÍ' else '' end                            as admin,

  to_char(u.created_at, 'DD/MM/YYYY')                                   as creada,
  to_char(p.last_seen_at, 'DD/MM/YYYY')                                 as ultima_senal,

  -- Días sin aparecer. Nulo = nunca se ha sabido nada de esa cuenta.
  case
    when p.last_seen_at is null then null
    else (current_date - p.last_seen_at::date)
  end                                                                   as dias_sin_aparecer,

  -- ── LO QUE IMPIDE BORRARLA ALEGREMENTE ─────────────────────────────────
  coalesce(s.estado, '—')                                               as suscripcion,
  coalesce(t.grupos, '')                                                as telegram,
  coalesce(v.compras, 0)                                                as compras,

  -- Cuántos teléfonos tiene con los avisos activados. Solo informativo.
  coalesce(d.dispositivos, 0)                                           as dispositivos

from auth.users u
left join public.profiles p on p.id = u.id

-- La suscripción va por CORREO: la sincroniza el embudo, que solo conoce eso.
left join lateral (
  select
    ms.status || ' · hasta ' || to_char(ms.current_period_end, 'DD/MM/YYYY') as estado
  from public.member_subscriptions ms
  where lower(ms.email) = lower(u.email)
  order by ms.current_period_end desc nulls last
  limit 1
) s on true

-- En qué grupos de Telegram está AHORA. Solo los que siguen dentro.
left join lateral (
  select string_agg(gm.group_key, ' + ' order by gm.group_key) as grupos
  from public.telegram_group_memberships gm
  where gm.user_id = u.id and gm.is_member
) t on true

left join lateral (
  select count(*) as compras
  from public.stripe_sales ss
  where ss.user_id = u.id or lower(ss.customer_email) = lower(u.email)
) v on true

left join lateral (
  select count(*) as dispositivos
  from public.push_subscriptions ps
  where ps.user_id = u.id and ps.activa
) d on true

-- Las más recientes primero: una cuenta de prueba suele ser de esta semana.
order by u.created_at desc;


-- ════════════════════════════════════════════════════════════════════════════
--  LAS CANDIDATAS A BORRAR
-- ════════════════════════════════════════════════════════════════════════════
--
-- Lo mismo, pero solo las que NO tienen nada que perder: sin suscripción, sin
-- compras y sin ser administrador.
--
-- Esto es una SUGERENCIA, no una lista aprobada. Léela entera antes de tocar
-- nada: aquí puede salir perfectamente una persona de verdad que todavía no
-- ha comprado.

select
  u.email,
  coalesce(p.full_name, '—')                       as nombre,
  to_char(u.created_at, 'DD/MM/YYYY')              as creada,
  coalesce(t.grupos, '')                           as sacar_de_telegram_primero
from auth.users u
left join public.profiles p on p.id = u.id
left join lateral (
  select string_agg(gm.group_key, ' + ') as grupos
  from public.telegram_group_memberships gm
  where gm.user_id = u.id and gm.is_member
) t on true
where coalesce(p.is_admin, false) = false
  and not exists (
    select 1 from public.member_subscriptions ms
    where lower(ms.email) = lower(u.email)
  )
  and not exists (
    select 1 from public.stripe_sales ss
    where ss.user_id = u.id or lower(ss.customer_email) = lower(u.email)
  )
order by u.created_at desc;
